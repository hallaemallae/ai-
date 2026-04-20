# My AI Company

조직도 기반 계층적 AI 협업 시스템. 대표가 지시하면 각 팀장(부장) AI가 전략을 세우고, 팀원 AI(과장·대리·사원)가 실행 계획을 이어서 작성합니다.

## 기술 스택

- Next.js 14 (App Router) + TypeScript
- Tailwind CSS
- Prisma + PostgreSQL (Neon / Supabase / Railway)
- Anthropic SDK (`claude-sonnet-4-6`)
- Server-Sent Events 로 실시간 스트리밍

## 빠른 시작

```bash
# 1. 의존성 설치
npm install

# 2. 환경 변수 설정
cp .env.example .env.local
# ANTHROPIC_API_KEY, DATABASE_URL(postgres) 입력

# 3. DB 스키마 적용 및 시드
npm run db:push
npm run db:seed

# 4. 개발 서버
npm run dev
```

## 배포 (Vercel + Neon)

1. **Neon** — https://neon.tech 에서 무료 Postgres 프로젝트 생성 → connection string 복사
2. **GitHub** — 이 레포 그대로 Vercel 에 import
3. **Vercel Environment Variables** 설정:
   - `ANTHROPIC_API_KEY` — Claude API 키
   - `DATABASE_URL` — Neon connection string (`?sslmode=require` 포함)
4. Vercel 배포 완료 후, 로컬에서 Neon URL 로 한 번 스키마/시드 주입:
   ```bash
   DATABASE_URL="<neon-url>" npm run db:push
   DATABASE_URL="<neon-url>" npm run db:seed
   ```
5. 배포 URL 확인 → 본인만 북마크하여 사용 (검색엔진은 `app/robots.ts` 로 차단됨)

브라우저에서 `http://localhost:3000` 접속 → 대표 지시 입력 → 부서별 팀장/팀원 응답이 실시간으로 스트리밍됩니다.

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
