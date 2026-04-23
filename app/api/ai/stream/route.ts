import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { CLAUDE_MODEL, getAnthropic } from "@/lib/anthropic";
import {
  buildArtifactMemberContext,
  buildCeoSummaryContext,
  buildCeoSummarySystemPrompt,
  buildHeadContext,
  buildMeetingRound1Context,
  buildMeetingRound2Context,
  buildMemberContext,
} from "@/lib/prompts";
import { extractArtifacts, safeFilename } from "@/lib/artifacts";
import type { StreamEvent } from "@/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function encodeSSE(event: StreamEvent): Uint8Array {
  const payload = `data: ${JSON.stringify(event)}\n\n`;
  return new TextEncoder().encode(payload);
}

type EmpRow = {
  id: string;
  name: string;
  title: string;
  rank: string;
  systemPrompt: string;
};

async function streamEmployeeResponse(params: {
  controller: ReadableStreamDefaultController<Uint8Array>;
  commandId: string;
  employee: EmpRow & { department: { slug: string } };
  userContext: string;
  parentId: string | null;
  round: number;
  maxTokens?: number;
}): Promise<{ id: string; text: string }> {
  const { controller, commandId, employee, userContext, parentId, round } = params;

  const response = await prisma.response.create({
    data: {
      commandId,
      employeeId: employee.id,
      parentId,
      round,
      content: "",
      status: "streaming",
    },
  });

  controller.enqueue(
    encodeSSE({
      type: "response:start",
      responseId: response.id,
      employeeId: employee.id,
      employeeName: employee.name,
      rank: employee.rank,
      departmentSlug: employee.department.slug,
      parentId,
      round,
    })
  );

  let fullText = "";
  try {
    const anthropic = getAnthropic();
    const stream = anthropic.messages.stream({
      model: CLAUDE_MODEL,
      max_tokens: params.maxTokens ?? 1024,
      system: employee.systemPrompt,
      messages: [{ role: "user", content: userContext }],
    });

    for await (const event of stream) {
      if (
        event.type === "content_block_delta" &&
        event.delta.type === "text_delta"
      ) {
        const delta = event.delta.text;
        fullText += delta;
        controller.enqueue(
          encodeSSE({ type: "response:delta", responseId: response.id, delta })
        );
      }
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : "AI 응답 실패";
    fullText = fullText || `⚠️ AI 응답 생성 중 오류가 발생했습니다: ${message}`;
    controller.enqueue(encodeSSE({ type: "error", message }));
  }

  await prisma.response.update({
    where: { id: response.id },
    data: { content: fullText, status: "done" },
  });

  controller.enqueue(encodeSSE({ type: "response:end", responseId: response.id }));
  return { id: response.id, text: fullText };
}

async function streamCeoSummary(params: {
  controller: ReadableStreamDefaultController<Uint8Array>;
  companyName: string;
  commandContent: string;
  round2Entries: { department: string; headName: string; round2: string }[];
}): Promise<string> {
  const { controller, companyName, commandContent, round2Entries } = params;

  controller.enqueue(encodeSSE({ type: "summary:start" }));
  let fullText = "";
  try {
    const anthropic = getAnthropic();
    const stream = anthropic.messages.stream({
      model: CLAUDE_MODEL,
      max_tokens: 1600,
      system: buildCeoSummarySystemPrompt(companyName),
      messages: [
        {
          role: "user",
          content: buildCeoSummaryContext({ commandContent, round2Entries }),
        },
      ],
    });
    for await (const event of stream) {
      if (
        event.type === "content_block_delta" &&
        event.delta.type === "text_delta"
      ) {
        const delta = event.delta.text;
        fullText += delta;
        controller.enqueue(encodeSSE({ type: "summary:delta", delta }));
      }
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : "대표 요약 실패";
    fullText = fullText || `⚠️ 대표 요약 중 오류: ${message}`;
    controller.enqueue(encodeSSE({ type: "error", message }));
  }
  controller.enqueue(encodeSSE({ type: "summary:end", text: fullText }));
  return fullText;
}

async function persistArtifacts(params: {
  controller: ReadableStreamDefaultController<Uint8Array>;
  commandId: string;
  responseId: string;
  departmentSlug: string;
  employeeName: string;
  text: string;
}) {
  const prefix = `${params.departmentSlug}-${params.employeeName}`;
  const items = extractArtifacts(params.text, prefix);
  for (const item of items) {
    const row = await prisma.artifact.create({
      data: {
        commandId: params.commandId,
        responseId: params.responseId,
        filename: safeFilename(item.filename),
        language: item.language,
        content: item.content,
      },
    });
    params.controller.enqueue(
      encodeSSE({
        type: "artifact",
        artifactId: row.id,
        filename: row.filename,
        language: row.language,
        departmentSlug: params.departmentSlug,
        employeeName: params.employeeName,
      })
    );
  }
}

export async function POST(req: NextRequest) {
  const { commandId, departmentSlugs } = (await req.json()) as {
    commandId: string;
    departmentSlugs?: string[];
  };

  const command = await prisma.command.findUnique({
    where: { id: commandId },
    include: { company: true },
  });
  if (!command) {
    return new Response(JSON.stringify({ error: "지시를 찾을 수 없습니다." }), {
      status: 404,
    });
  }
  const mode = (command.type as "task" | "meeting") ?? "task";

  const departments = await prisma.department.findMany({
    where:
      departmentSlugs && departmentSlugs.length > 0
        ? { slug: { in: departmentSlugs } }
        : undefined,
    orderBy: { order: "asc" },
    include: { employees: { orderBy: { order: "asc" } } },
  });

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      controller.enqueue(encodeSSE({ type: "start", commandId, mode }));

      if (mode === "task") {
        controller.enqueue(encodeSSE({ type: "phase", phase: "task" }));
        const headCtx = buildHeadContext({
          commandContent: command.content,
          priority: command.priority,
          deadline: command.deadline ? command.deadline.toISOString() : null,
        });
        const headResults = await Promise.all(
          departments.map(async (dept) => {
            const head = dept.employees.find((e) => e.rank === "부장");
            if (!head) return null;
            const { id: headResponseId, text: headText } =
              await streamEmployeeResponse({
                controller,
                commandId,
                employee: { ...head, department: { slug: dept.slug } },
                userContext: headCtx,
                parentId: null,
                round: 0,
              });
            return { dept, head, headResponseId, headText };
          })
        );

        for (const result of headResults) {
          if (!result) continue;
          const members = result.dept.employees.filter((e) => e.rank !== "부장");
          for (const member of members) {
            const ctx = buildMemberContext({
              commandContent: command.content,
              headName: result.head.name,
              headTitle: result.head.title,
              headResponse: result.headText,
              priority: command.priority,
              deadline: command.deadline ? command.deadline.toISOString() : null,
            });
            await streamEmployeeResponse({
              controller,
              commandId,
              employee: { ...member, department: { slug: result.dept.slug } },
              userContext: ctx,
              parentId: result.headResponseId,
              round: 0,
            });
          }
        }

        controller.enqueue(encodeSSE({ type: "done" }));
        controller.close();
        return;
      }

      // ===== 회의 모드 =====
      controller.enqueue(encodeSSE({ type: "phase", phase: "round1" }));
      const round1Ctx = buildMeetingRound1Context({
        commandContent: command.content,
        priority: command.priority,
        deadline: command.deadline ? command.deadline.toISOString() : null,
      });

      type DeptWithHead = {
        dept: (typeof departments)[number];
        head: (typeof departments)[number]["employees"][number];
      };
      const heads: DeptWithHead[] = departments.flatMap((d) => {
        const head = d.employees.find((e) => e.rank === "부장");
        return head ? [{ dept: d, head }] : [];
      });

      const round1 = await Promise.all(
        heads.map(async ({ dept, head }) => {
          const { id, text } = await streamEmployeeResponse({
            controller,
            commandId,
            employee: { ...head, department: { slug: dept.slug } },
            userContext: round1Ctx,
            parentId: null,
            round: 1,
            maxTokens: 700,
          });
          return { dept, head, r1Id: id, r1Text: text };
        })
      );

      controller.enqueue(encodeSSE({ type: "phase", phase: "round2" }));
      const round2 = await Promise.all(
        round1.map(async (self) => {
          const peers = round1
            .filter((x) => x.dept.id !== self.dept.id)
            .map((x) => ({
              department: x.dept.name,
              headName: x.head.name,
              round1: x.r1Text,
            }));
          const ctx = buildMeetingRound2Context({
            commandContent: command.content,
            priority: command.priority,
            deadline: command.deadline ? command.deadline.toISOString() : null,
            selfDepartment: self.dept.name,
            selfRound1: self.r1Text,
            peerSummaries: peers,
          });
          const { id, text } = await streamEmployeeResponse({
            controller,
            commandId,
            employee: { ...self.head, department: { slug: self.dept.slug } },
            userContext: ctx,
            parentId: self.r1Id,
            round: 2,
            maxTokens: 700,
          });
          return { ...self, r2Id: id, r2Text: text };
        })
      );

      controller.enqueue(encodeSSE({ type: "phase", phase: "ceo" }));
      const ceoText = await streamCeoSummary({
        controller,
        companyName: command.company.name,
        commandContent: command.content,
        round2Entries: round2.map((r) => ({
          department: r.dept.name,
          headName: r.head.name,
          round2: r.r2Text,
        })),
      });
      await prisma.command.update({
        where: { id: commandId },
        data: { summary: ceoText },
      });

      controller.enqueue(encodeSSE({ type: "phase", phase: "artifacts" }));
      // 각 부서 팀원(부장 제외) 이 대표 결정 기반 산출물 생성
      for (const r of round2) {
        const members = r.dept.employees.filter((e) => e.rank !== "부장");
        for (const member of members) {
          const ctx = buildArtifactMemberContext({
            commandContent: command.content,
            ceoSummary: ceoText,
            departmentName: r.dept.name,
            headResponse: r.r2Text,
          });
          const { id: respId, text } = await streamEmployeeResponse({
            controller,
            commandId,
            employee: { ...member, department: { slug: r.dept.slug } },
            userContext: ctx,
            parentId: r.r2Id,
            round: 3,
            maxTokens: 2000,
          });
          await persistArtifacts({
            controller,
            commandId,
            responseId: respId,
            departmentSlug: r.dept.slug,
            employeeName: member.name,
            text,
          });
        }
      }

      controller.enqueue(encodeSSE({ type: "done" }));
      controller.close();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
