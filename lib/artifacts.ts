export interface ExtractedArtifact {
  filename: string;
  language: string;
  content: string;
}

const LANG_EXT: Record<string, string> = {
  md: "md",
  markdown: "md",
  ts: "ts",
  tsx: "tsx",
  js: "js",
  jsx: "jsx",
  html: "html",
  css: "css",
  svg: "svg",
  json: "json",
  sql: "sql",
  txt: "txt",
  yaml: "yaml",
  yml: "yml",
  sh: "sh",
  bash: "sh",
};

const FENCE_RE =
  /```([a-zA-Z0-9+-]+)?\s*(?:filename=([^\s`]+))?\s*\n([\s\S]*?)\n```/g;

export function extractArtifacts(
  source: string,
  fallbackPrefix: string
): ExtractedArtifact[] {
  const out: ExtractedArtifact[] = [];
  let idx = 1;
  let m: RegExpExecArray | null;
  FENCE_RE.lastIndex = 0;
  while ((m = FENCE_RE.exec(source)) !== null) {
    const langRaw = (m[1] ?? "txt").toLowerCase();
    const lang = LANG_EXT[langRaw] ? langRaw : "txt";
    const ext = LANG_EXT[lang] ?? "txt";
    const filename = (m[2] ?? `${fallbackPrefix}-${idx}.${ext}`).trim();
    const content = m[3];
    if (content.trim().length === 0) continue;
    out.push({ filename, language: lang, content });
    idx += 1;
  }
  return out;
}

export function safeFilename(raw: string): string {
  return raw
    .replace(/[^\w.\-가-힣]/g, "_")
    .replace(/_+/g, "_")
    .slice(0, 120);
}
