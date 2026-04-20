# My AI Company

조직도 기반 계층적 AI 협업 시스템. 대표가 지시하면 각 팀장(부장) AI가 전략을 세우고, 팀원 AI(과장·대리·사원)가 실행 계획을 이어서 작성합니다.

## 기술 스택

- Next.js 14 (App Router) + TypeScript
- Tailwind CSS
- Prisma + SQLite (로컬 파일 DB)
- Anthropic SDK (`claude-sonnet-4-6`)
- Server-Sent Events 로 실시간 스트리밍

## 빠른 시작 — GitHub Codespaces (원클릭, 추천)

1. 이 저장소 페이지에서 초록색 **Code** 버튼 → **Codespaces** 탭 → **Create codespace on main**
2. 첫 부팅 시 `.devcontainer/setup.sh` 가 자동으로 `npm install` / DB 초기화 / 시드까지 수행
3. 시크릿 등록: Codespace 좌측 하단 톱니 → **Command Palette** → `Codespaces: Manage User Secrets` → `ANTHROPIC_API_KEY` 추가 (또는 터미널에서 `.env.local` 직접 수정)
4. 준비 완료되면 자동으로 `npm run dev` 가 실행되고 **포트 3000** 이 포워딩되어 브라우저에 미리보기가 열립니다. 하단 **PORTS** 탭에서 언제든 URL 확인 가능

## 빠른 시작 — 로컬

```bash
npm install
cp .env.example .env.local   # ANTHROPIC_API_KEY 입력
npm run db:push && npm run db:seed
npm run dev
```

브라우저에서 `http://localhost:3000` 접속 → 대표 지시 입력 → 부서별 팀장/팀원 응답이 실시간으로 스트리밍됩니다. DB 는 `dev.db` 파일로 저장되며 gitignore 되어 있습니다.

## 주요 페이지

- `/` — 대시보드 (지시 입력 + 최근 이력)
- `/command/[id]` — 지시 상세 (부서별 응답 탭, PDF 내보내기)
- `/org` — 조직도 (트리 뷰)
- `/settings/employee/[id]` — 직원 역할 프롬프트 편집

## 조직

- 💻 개발팀: 김민준(부장) / 이지호(과장) / 박채원(사원)
- 📢 마케팅팀: 박지영(부장) / 최수연(대리) / 한예린(사원)
- ⚖️ 법무팀: 정대한(부장) / 한소희(대리)
- 📋 기획팀: 강하늘(부장) / 윤서아(과장) / 임도현(사원)
- 💰 재무팀: 오재원(부장) / 신유진(대리)

## 디렉토리

```
app/
  api/                # command, ai/stream, department, employee, export
  command/[id]/       # 지시 상세
  org/                # 조직도
  settings/employee/  # 직원 설정
components/
lib/
prisma/
types/
```

## 개발 단계

현 프로젝트는 기획서의 **Phase 1-3** 범위를 구현합니다:

- ✅ 기본 골격 (Next.js, Prisma, 시드, 지시/응답)
- ✅ 계층 구조 (팀장 → 팀원 순차 처리, SSE 스트리밍, 이력)
- ✅ 조직도·직원 프롬프트 편집·PDF 내보내기
- ⬜ Phase 4 (검색/필터·모바일 반응형 고도화·인증)
