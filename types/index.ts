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
  commandId: string;
  employeeId: string;
  parentId: string | null;
  createdAt: string;
  updatedAt: string;
  employee?: EmployeeDTO & { department?: DepartmentDTO };
}

export interface CommandDTO {
  id: string;
  content: string;
  priority: Priority;
  deadline: string | null;
  pinned: boolean;
  createdAt: string;
  responses?: ResponseDTO[];
}

export type StreamEvent =
  | { type: "start"; commandId: string }
  | {
      type: "response:start";
      responseId: string;
      employeeId: string;
      employeeName: string;
      rank: string;
      departmentSlug: string;
      parentId: string | null;
    }
  | { type: "response:delta"; responseId: string; delta: string }
  | { type: "response:end"; responseId: string }
  | { type: "error"; message: string }
  | { type: "done" };
