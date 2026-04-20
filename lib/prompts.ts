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
