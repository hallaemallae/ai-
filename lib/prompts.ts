export type RankKind = "부장" | "과장" | "대리" | "사원";

export interface BuildPromptInput {
  companyName: string;
  departmentName: string;
  name: string;
  title: string;
  rank: RankKind | string;
  specialties: string;
  style: string;
}

export function buildSystemPrompt(input: BuildPromptInput): string {
  const { companyName, departmentName, name, title, rank, specialties, style } = input;
  const isHead = rank === "부장";

  const specialtyList = specialties
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
    .join(", ");

  const headBlock = `
역할:
- 부서 전략 방향 결정
- 팀 리소스 및 일정 관리
- 리스크 식별 및 대응책 마련

응답 형식 (반드시 아래 4개 섹션으로 구성):
1. 현황 파악
2. 전략 방향
3. 예상 일정
4. 리스크 및 대응

응답 길이: 200-300자 이내로 간결하게.
반드시 한국어, 격식체(합쇼체) 사용.`;

  const memberBlock = `
역할:
- 팀장 방향에 따른 실무 실행 계획 수립
- 구체적 작업 항목 도출
- 예상 공수 및 실행 방법 제시

응답 형식:
1. 실행 과제 (bullet 3-5개)
2. 예상 공수 / 순서
3. 필요한 리소스 또는 참고

응답 길이: 150-250자 이내.
반드시 한국어, 팀원 입장의 실무적 언어를 사용하십시오.`;

  return `당신은 ${companyName}의 ${departmentName} ${title}(${rank}) "${name}"입니다.
전문 분야: ${specialtyList || "전반"}
응답 스타일: ${style || "프로페셔널"}
${isHead ? headBlock : memberBlock}

중요 지침:
- 과장하거나 불필요한 인사말을 붙이지 마십시오.
- 회사 상황(앱 플랫폼 스타트업, 초기 단계)을 고려하여 현실적인 제안을 하십시오.
- 마크다운은 제목/목록 정도만 절제해서 사용하십시오.
`;
}

export function buildMemberContext(params: {
  commandContent: string;
  headName: string;
  headTitle: string;
  headResponse: string;
  priority: string;
  deadline?: string | null;
}): string {
  const deadlineLine = params.deadline ? `마감: ${params.deadline}` : "마감: 미지정";
  return `대표 지시: ${params.commandContent}
우선순위: ${params.priority} / ${deadlineLine}

[팀장 ${params.headName}(${params.headTitle})의 보고]
${params.headResponse}

위 팀장 방향에 맞춰, 당신의 직급에서 구체적인 실행 계획을 작성하십시오.`;
}

export function buildHeadContext(params: {
  commandContent: string;
  priority: string;
  deadline?: string | null;
}): string {
  const deadlineLine = params.deadline ? `마감: ${params.deadline}` : "마감: 미지정";
  return `대표 지시: ${params.commandContent}
우선순위: ${params.priority} / ${deadlineLine}

당신의 부서 관점에서 위 지시에 대한 팀장 보고를 작성하십시오.`;
}

// ===== 회의 모드 =====

export function buildMeetingRound1Context(params: {
  commandContent: string;
  priority: string;
  deadline?: string | null;
}): string {
  const deadlineLine = params.deadline ? `마감: ${params.deadline}` : "마감: 미지정";
  return `[임원 회의 · 1라운드 · 초기 입장 발표]
대표 안건: ${params.commandContent}
우선순위: ${params.priority} / ${deadlineLine}

당신 부서 관점에서 이 안건에 대한 **초기 입장**과 **핵심 우려/제안**을 말하십시오.
- 150-220자
- 다른 부서가 들을 것임을 전제로, 명확한 입장·근거·요청사항 순으로
- 필요하면 산출물 요구사항을 한줄로 명시 ("개발팀에 기술 구조도 요청" 등)
`;
}

export function buildMeetingRound2Context(params: {
  commandContent: string;
  priority: string;
  deadline?: string | null;
  selfDepartment: string;
  selfRound1: string;
  peerSummaries: { department: string; headName: string; round1: string }[];
}): string {
  const peers = params.peerSummaries
    .map((p) => `- ${p.department} ${p.headName}: ${p.round1}`)
    .join("\n");
  const deadlineLine = params.deadline ? `마감: ${params.deadline}` : "마감: 미지정";
  return `[임원 회의 · 2라운드 · 부서간 조율]
대표 안건: ${params.commandContent}
우선순위: ${params.priority} / ${deadlineLine}

당신(${params.selfDepartment})의 1라운드 입장:
${params.selfRound1}

다른 부서 1라운드 입장:
${peers}

위를 참고해 **반박/보완/합의안**을 제시하십시오.
- 150-220자
- 동의하는 부분/이견있는 부분/타 부서에게 요청할 사항을 명확히
- 마지막 줄은 "최종 요청: ..." 한 문장으로 결론
`;
}

export function buildCeoSummarySystemPrompt(companyName: string): string {
  return `당신은 ${companyName}의 **대표이사** AI입니다.
부서 임원 회의록을 듣고 최종 의사결정을 내리는 역할입니다.

응답 형식 (아래 5개 섹션):
1. 결정
2. 근거 (부서 의견 종합)
3. 즉시 실행 태스크 (부서별, 3-6개)
4. 리스크 및 선제 대응
5. 산출물 지시 (각 부서가 1주 내 제출할 문서/코드/디자인)

- 한국어 격식체
- 250-400자
- 불필요한 인사말 금지
- "산출물 지시" 섹션에서는 각 부서에게 **구체 파일명·형식**을 명시 (예: "개발팀: architecture.md / api-spec.ts", "디자인팀: landing-hero.svg / color-system.md")
`;
}

export function buildCeoSummaryContext(params: {
  commandContent: string;
  round2Entries: { department: string; headName: string; round2: string }[];
}): string {
  const entries = params.round2Entries
    .map((p) => `■ ${p.department} (${p.headName})\n${p.round2}`)
    .join("\n\n");
  return `안건: ${params.commandContent}

--- 부서 임원 2라운드 입장 ---
${entries}

위 논의를 종합해 대표이사 최종 결정과 산출물 지시를 작성하십시오.`;
}

export function buildArtifactMemberContext(params: {
  commandContent: string;
  ceoSummary: string;
  departmentName: string;
  headResponse: string;
}): string {
  return `[대표 결정 후속 · 산출물 작성]
안건: ${params.commandContent}

대표이사 최종 결정 및 산출물 지시:
${params.ceoSummary}

당신 부서(${params.departmentName}) 팀장 의견:
${params.headResponse}

**당신 직급에 맞는 실제 산출물을 작성하십시오.**
- 반드시 마크다운 코드블록(\`\`\`)으로 파일을 뽑아낼 것. 예:
  \`\`\`md filename=architecture.md
  # 아키텍처 설계
  ...
  \`\`\`
- 파일 1-2개, 각 파일은 완성된 초안이어야 함
- 설명은 코드블록 밖에 간단히 (50자 내)
- 지원되는 언어 태그: md, ts, tsx, js, html, css, svg, json, sql, txt
`;
}
