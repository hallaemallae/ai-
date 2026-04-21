const DICEBEAR = "https://api.dicebear.com/9.x";

const RANK_BG: Record<string, string> = {
  대표: "fde68a",
  부장: "fcd34d",
  과장: "bfdbfe",
  대리: "bbf7d0",
  사원: "e2e8f0",
};

export function avatarUrl(seed: string, rank: string, size = 96) {
  const bg = RANK_BG[rank] ?? "e2e8f0";
  const style = rank === "부장" || rank === "대표" ? "notionists" : "notionists-neutral";
  const params = new URLSearchParams({
    seed,
    backgroundColor: bg,
    size: String(size),
    radius: "50",
  });
  return `${DICEBEAR}/${style}/svg?${params.toString()}`;
}
