export type Priority = "urgent" | "normal" | "low";

export interface EmployeeDTO {
  id: string;
  name: string;
  title: string;
  rank: string;
  specialties: string;
  style: string;
  systemPrompt: string;
  order: number;
  departmentId: string;
}

export interface DepartmentDTO {
  id: string;
  name: string;
  slug: string;
  icon: string;
  order: number;
  employees: EmployeeDTO[];
}

export interface ResponseDTO {
  id: string;
  content: string;
  status: string;
  round: number;
  commandId: string;
  employeeId: string;
  parentId: string | null;
  createdAt: string;
  updatedAt: string;
  employee?: EmployeeDTO & { department?: DepartmentDTO };
}

export interface ArtifactDTO {
  id: string;
  filename: string;
  language: string;
  content: string;
  commandId: string;
  responseId: string | null;
  createdAt: string;
}

export type CommandType = "task" | "meeting";

export interface CommandDTO {
  id: string;
  content: string;
  type: CommandType;
  priority: Priority;
  deadline: string | null;
  pinned: boolean;
  summary: string | null;
  createdAt: string;
  responses?: ResponseDTO[];
  artifacts?: ArtifactDTO[];
}

export type StreamEvent =
  | { type: "start"; commandId: string; mode: CommandType }
  | { type: "phase"; phase: "round1" | "round2" | "ceo" | "artifacts" | "task" }
  | {
      type: "response:start";
      responseId: string;
      employeeId: string;
      employeeName: string;
      rank: string;
      departmentSlug: string;
      parentId: string | null;
      round: number;
    }
  | { type: "response:delta"; responseId: string; delta: string }
  | { type: "response:end"; responseId: string }
  | { type: "summary:start" }
  | { type: "summary:delta"; delta: string }
  | { type: "summary:end"; text: string }
  | {
      type: "artifact";
      artifactId: string;
      filename: string;
      language: string;
      departmentSlug: string;
      employeeName: string;
    }
  | { type: "error"; message: string }
  | { type: "done" };
