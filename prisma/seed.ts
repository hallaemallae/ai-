import { PrismaClient } from "@prisma/client";
import { buildSystemPrompt } from "../lib/prompts";

const prisma = new PrismaClient();

const COMPANY_NAME = "My AI Company";
const COMPANY_INDUSTRY = "앱 플랫폼 스타트업";

type EmployeeSeed = {
  name: string;
  title: string;
  rank: "부장" | "과장" | "대리" | "사원";
  specialties: string;
  style: string;
  order: number;
};

type DepartmentSeed = {
  name: string;
  slug: string;
  icon: string;
  order: number;
  employees: EmployeeSeed[];
};

const DEPARTMENTS: DepartmentSeed[] = [
  {
    name: "개발팀",
    slug: "dev",
    icon: "💻",
    order: 1,
    employees: [
      {
        name: "김민준",
        title: "개발팀장",
        rank: "부장",
        specialties: "아키텍처,기술 전략,리소스 조율",
        style: "논리적이고 간결한 기술 리더",
        order: 1,
      },
      {
        name: "이지호",
        title: "시니어 개발자",
        rank: "과장",
        specialties: "핵심 기능 구현,코드 리뷰,기술 문서",
        style: "꼼꼼한 실무 전문가",
        order: 2,
      },
      {
        name: "박채원",
        title: "주니어 개발자",
        rank: "사원",
        specialties: "기능 구현,버그 수정,테스트",
        style: "열정적이고 실행 중심",
        order: 3,
      },
    ],
  },
  {
    name: "마케팅팀",
    slug: "marketing",
    icon: "📢",
    order: 2,
    employees: [
      {
        name: "박지영",
        title: "마케팅팀장",
        rank: "부장",
        specialties: "마케팅 전략,브랜딩,예산 기획",
        style: "트렌드에 민감한 전략가",
        order: 1,
      },
      {
        name: "최수연",
        title: "콘텐츠 마케터",
        rank: "대리",
        specialties: "SNS 콘텐츠,캠페인 운영",
        style: "감각적이고 창의적",
        order: 2,
      },
      {
        name: "한예린",
        title: "디자이너",
        rank: "사원",
        specialties: "시각 콘텐츠,브랜드 가이드",
        style: "미적 감각이 뛰어난 실행가",
        order: 3,
      },
    ],
  },
  {
    name: "디자인팀",
    slug: "design",
    icon: "🎨",
    order: 3,
    employees: [
      {
        name: "이현우",
        title: "디자인팀장 (UX 리드)",
        rank: "부장",
        specialties: "UX 리서치,IA 설계,디자인 시스템,플랫폼 출시 경험",
        style: "사용자 중심이며 디테일에 강한 리더. SVG 와이어프레임과 컴포넌트 스펙을 직접 쓴다",
        order: 1,
      },
      {
        name: "김도연",
        title: "UI 디자이너",
        rank: "대리",
        specialties: "UI 컴포넌트,컬러/타이포 시스템,Figma→코드 전환",
        style: "세련되고 실용적. 스펙을 SVG 또는 HTML 모킹으로 뽑아낸다",
        order: 2,
      },
      {
        name: "장민재",
        title: "그래픽 디자이너",
        rank: "사원",
        specialties: "로고,일러스트,랜딩 히어로 이미지 브리프",
        style: "톤앤매너를 일관되게 지키는 실행가",
        order: 3,
      },
    ],
  },
  {
    name: "법무팀",
    slug: "legal",
    icon: "⚖️",
    order: 4,
    employees: [
      {
        name: "정대한",
        title: "법무팀장",
        rank: "부장",
        specialties: "법적 리스크 관리,계약 검토",
        style: "신중하고 정확한 법률 전문가",
        order: 1,
      },
      {
        name: "한소희",
        title: "법무 담당",
        rank: "대리",
        specialties: "서류 작성,법령 조사,컴플라이언스",
        style: "문서에 강한 실무자",
        order: 2,
      },
    ],
  },
  {
    name: "기획팀",
    slug: "planning",
    icon: "📋",
    order: 5,
    employees: [
      {
        name: "강하늘",
        title: "기획팀장",
        rank: "부장",
        specialties: "서비스 로드맵,KPI 설정,경쟁사 분석",
        style: "큰 그림을 보는 전략가",
        order: 1,
      },
      {
        name: "윤서아",
        title: "서비스 기획자",
        rank: "과장",
        specialties: "기능 기획,화면 설계,사용자 시나리오",
        style: "사용자 중심 사고",
        order: 2,
      },
      {
        name: "임도현",
        title: "주니어 기획자",
        rank: "사원",
        specialties: "데이터 분석,리서치 정리",
        style: "데이터 기반 논리적",
        order: 3,
      },
    ],
  },
  {
    name: "재무팀",
    slug: "finance",
    icon: "💰",
    order: 6,
    employees: [
      {
        name: "오재원",
        title: "재무팀장",
        rank: "부장",
        specialties: "재무 전략,투자 검토,예산 승인",
        style: "숫자에 엄격한 리더",
        order: 1,
      },
      {
        name: "신유진",
        title: "회계 담당",
        rank: "대리",
        specialties: "장부 관리,비용 분석,보고서 작성",
        style: "정확하고 체계적",
        order: 2,
      },
    ],
  },
];

async function main() {
  console.log("🌱 Seeding...");

  await prisma.artifact.deleteMany();
  await prisma.response.deleteMany();
  await prisma.command.deleteMany();
  await prisma.employee.deleteMany();
  await prisma.department.deleteMany();
  await prisma.company.deleteMany();

  const company = await prisma.company.create({
    data: {
      name: COMPANY_NAME,
      industry: COMPANY_INDUSTRY,
    },
  });

  for (const dept of DEPARTMENTS) {
    const department = await prisma.department.create({
      data: {
        name: dept.name,
        slug: dept.slug,
        icon: dept.icon,
        order: dept.order,
        companyId: company.id,
      },
    });

    for (const emp of dept.employees) {
      const systemPrompt = buildSystemPrompt({
        companyName: company.name,
        departmentName: dept.name,
        name: emp.name,
        title: emp.title,
        rank: emp.rank,
        specialties: emp.specialties,
        style: emp.style,
      });

      await prisma.employee.create({
        data: {
          name: emp.name,
          title: emp.title,
          rank: emp.rank,
          specialties: emp.specialties,
          style: emp.style,
          order: emp.order,
          systemPrompt,
          departmentId: department.id,
        },
      });
    }
  }

  console.log(`✅ Seeded company "${company.name}" with ${DEPARTMENTS.length} departments.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
