import type { Metadata } from "next";
import Link from "next/link";
import { cookies } from "next/headers";
import { prisma } from "@/lib/db";
import { ProjectSwitcher } from "@/components/ProjectSwitcher";
import type { CompanyDTO } from "@/types";
import "./globals.css";

export const metadata: Metadata = {
  title: "AI 가상 회사 운영 시스템",
  description:
    "조직도 기반 계층적 AI 협업 시스템. 대표가 지시하면 팀장·팀원 AI가 단계적으로 응답합니다.",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const companies = await prisma.company.findMany({ orderBy: { createdAt: "asc" } });
  const cookieStore = cookies();
  const savedId = cookieStore.get("activeProjectId")?.value;
  const activeProject =
    companies.find((c) => c.id === savedId) ?? companies[0];

  const projects: CompanyDTO[] = companies.map((c) => ({
    id: c.id,
    name: c.name,
    industry: c.industry,
    repoUrl: c.repoUrl,
    hasGithub: Boolean(c.repoUrl && c.githubToken),
  }));

  return (
    <html lang="ko">
      <body>
        <div className="min-h-screen">
          <header className="border-b border-slate-200 bg-white">
            <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
              <Link href="/" className="flex items-center gap-2">
                <span className="text-xl">🏢</span>
                <div>
                  <div className="text-sm font-bold text-slate-800">
                    {activeProject?.name ?? "AI Company"}
                  </div>
                  <div className="text-[11px] text-slate-500">
                    {activeProject?.industry ?? "AI 가상 회사 운영 시스템"}
                  </div>
                </div>
              </Link>

              <div className="flex items-center gap-4">
                {projects.length > 0 && activeProject && (
                  <ProjectSwitcher projects={projects} activeId={activeProject.id} />
                )}
                <nav className="flex items-center gap-1 text-sm">
                  <Link
                    href="/"
                    className="rounded-lg px-3 py-1.5 text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                  >
                    대시보드
                  </Link>
                  <Link
                    href="/org"
                    className="rounded-lg px-3 py-1.5 text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                  >
                    조직도
                  </Link>
                  <Link
                    href="/settings"
                    className="rounded-lg px-3 py-1.5 text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                  >
                    설정
                  </Link>
                </nav>
              </div>
            </div>
          </header>
          <main className="mx-auto max-w-6xl px-6 py-8">{children}</main>
          <footer className="border-t border-slate-200 py-6 text-center text-xs text-slate-400">
            Powered by Claude · Built with Next.js, Tailwind, Prisma
          </footer>
        </div>
      </body>
    </html>
  );
}
