"use client";

import { useState } from "react";

export function ProjectSettingsForm({
  companyId,
  companyName,
  repoUrl: initialRepoUrl,
  hasToken: initialHasToken,
}: {
  companyId: string;
  companyName: string;
  repoUrl: string;
  hasToken: boolean;
}) {
  const [repoUrl, setRepoUrl] = useState(initialRepoUrl);
  const [githubToken, setGithubToken] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasToken, setHasToken] = useState(initialHasToken);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      const body: Record<string, string> = { id: companyId, repoUrl };
      if (githubToken) body.githubToken = githubToken;
      const res = await fetch("/api/project", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "저장 실패");
      setHasToken(data.hasGithub);
      setGithubToken("");
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "알 수 없는 오류");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSave} className="space-y-6">
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-base font-bold text-slate-800">
          GitHub 리포지토리 연동
        </h2>
        <p className="mb-4 text-sm text-slate-500 leading-relaxed">
          임원 회의 산출물을 GitHub PR로 자동 푸시합니다.
          리포지토리 Write 권한이 있는 PAT(Personal Access Token)이 필요합니다.
        </p>

        <div className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-slate-700">
              리포지토리 URL
            </label>
            <input
              type="url"
              value={repoUrl}
              onChange={(e) => setRepoUrl(e.target.value)}
              placeholder="https://github.com/owner/repo"
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none transition focus:border-brand-400 focus:bg-white"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-semibold text-slate-700">
              GitHub PAT (Personal Access Token)
            </label>
            <input
              type="password"
              value={githubToken}
              onChange={(e) => setGithubToken(e.target.value)}
              placeholder={hasToken ? "••••••••••••• (저장된 토큰 있음 — 변경 시 입력)" : "ghp_xxxxxxxxxxxx"}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none transition focus:border-brand-400 focus:bg-white"
            />
            {hasToken && (
              <p className="mt-1 text-[11px] text-green-600">
                ✓ 토큰이 저장되어 있습니다. 변경하려면 새 토큰을 입력하세요.
              </p>
            )}
          </div>
        </div>

        {error && <p className="mt-3 text-xs text-red-600">{error}</p>}
        {saved && (
          <p className="mt-3 text-xs text-green-600">✓ 설정이 저장되었습니다.</p>
        )}

        <div className="mt-5 flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="rounded-xl bg-brand-600 px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-700 disabled:opacity-60"
          >
            {saving ? "저장 중..." : "저장"}
          </button>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-100 bg-slate-50 p-5 text-xs leading-relaxed text-slate-500">
        <p className="mb-2 font-semibold text-slate-700">PAT 권한 설정 안내</p>
        <ol className="list-decimal space-y-1 pl-4">
          <li>GitHub → Settings → Developer settings → Personal access tokens → Fine-grained tokens</li>
          <li>연결할 리포지토리 선택</li>
          <li>Repository permissions → <b>Contents: Read and write</b>, <b>Pull requests: Read and write</b> 체크</li>
          <li>토큰 복사 후 위 입력란에 붙여넣기</li>
        </ol>
      </div>
    </form>
  );
}
