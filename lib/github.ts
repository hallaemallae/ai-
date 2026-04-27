export interface GitHubArtifact {
  filename: string;
  content: string;
}

function parseRepo(repoUrl: string): { owner: string; repo: string } | null {
  try {
    const url = new URL(repoUrl);
    const parts = url.pathname.replace(/^\//, "").replace(/\.git$/, "").split("/");
    if (parts.length < 2) return null;
    return { owner: parts[0], repo: parts[1] };
  } catch {
    return null;
  }
}

async function ghFetch(
  path: string,
  token: string,
  options: RequestInit = {}
): Promise<Response> {
  return fetch(`https://api.github.com${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
      "Content-Type": "application/json",
      ...(options.headers ?? {}),
    },
  });
}

export async function pushArtifactsAsPR(params: {
  repoUrl: string;
  token: string;
  branchName: string;
  prTitle: string;
  prBody: string;
  artifacts: GitHubArtifact[];
}): Promise<{ prUrl: string }> {
  const { repoUrl, token, branchName, prTitle, prBody, artifacts } = params;

  const parsed = parseRepo(repoUrl);
  if (!parsed) throw new Error("리포지토리 URL 형식이 올바르지 않습니다.");
  const { owner, repo } = parsed;

  // 1. Get default branch SHA
  const repoRes = await ghFetch(`/repos/${owner}/${repo}`, token);
  if (!repoRes.ok) {
    const err = await repoRes.json().catch(() => ({}));
    throw new Error(`리포지토리 접근 실패: ${(err as { message?: string }).message ?? repoRes.status}`);
  }
  const repoData = await repoRes.json() as { default_branch: string };
  const defaultBranch = repoData.default_branch;

  const refRes = await ghFetch(`/repos/${owner}/${repo}/git/ref/heads/${defaultBranch}`, token);
  if (!refRes.ok) throw new Error("기본 브랜치 SHA 조회 실패");
  const refData = await refRes.json() as { object: { sha: string } };
  const baseSha = refData.object.sha;

  // 2. Create new branch
  const createBranchRes = await ghFetch(`/repos/${owner}/${repo}/git/refs`, token, {
    method: "POST",
    body: JSON.stringify({ ref: `refs/heads/${branchName}`, sha: baseSha }),
  });
  if (!createBranchRes.ok) {
    const errData = await createBranchRes.json().catch(() => ({})) as { message?: string };
    if (!errData.message?.includes("already exists")) {
      throw new Error(`브랜치 생성 실패: ${errData.message ?? createBranchRes.status}`);
    }
  }

  // 3. Push each artifact as a file
  for (const artifact of artifacts) {
    const contentB64 = Buffer.from(artifact.content, "utf-8").toString("base64");
    const filePath = `ai-outputs/${artifact.filename}`;

    // Check if file exists to get SHA for update
    let existingSha: string | undefined;
    const existsRes = await ghFetch(
      `/repos/${owner}/${repo}/contents/${filePath}?ref=${branchName}`,
      token
    );
    if (existsRes.ok) {
      const existsData = await existsRes.json() as { sha?: string };
      existingSha = existsData.sha;
    }

    const putRes = await ghFetch(`/repos/${owner}/${repo}/contents/${filePath}`, token, {
      method: "PUT",
      body: JSON.stringify({
        message: `feat: add ${artifact.filename} (AI generated)`,
        content: contentB64,
        branch: branchName,
        ...(existingSha ? { sha: existingSha } : {}),
      }),
    });
    if (!putRes.ok) {
      const errData = await putRes.json().catch(() => ({})) as { message?: string };
      throw new Error(`파일 업로드 실패 (${artifact.filename}): ${errData.message ?? putRes.status}`);
    }
  }

  // 4. Create PR
  const prRes = await ghFetch(`/repos/${owner}/${repo}/pulls`, token, {
    method: "POST",
    body: JSON.stringify({
      title: prTitle,
      body: prBody,
      head: branchName,
      base: defaultBranch,
    }),
  });

  if (!prRes.ok) {
    const errData = await prRes.json().catch(() => ({})) as { message?: string };
    throw new Error(`PR 생성 실패: ${errData.message ?? prRes.status}`);
  }
  const prData = await prRes.json() as { html_url: string };
  return { prUrl: prData.html_url };
}
