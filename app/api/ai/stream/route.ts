import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { CLAUDE_MODEL, getAnthropic } from "@/lib/anthropic";
import { buildHeadContext, buildMemberContext } from "@/lib/prompts";
import type { StreamEvent } from "@/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function encodeSSE(event: StreamEvent): Uint8Array {
  const payload = `data: ${JSON.stringify(event)}\n\n`;
  return new TextEncoder().encode(payload);
}

async function streamEmployeeResponse(params: {
  controller: ReadableStreamDefaultController<Uint8Array>;
  commandId: string;
  employee: {
    id: string;
    name: string;
    rank: string;
    systemPrompt: string;
    department: { slug: string };
  };
  userContext: string;
  parentId: string | null;
}): Promise<string> {
  const { controller, commandId, employee, userContext, parentId } = params;

  const response = await prisma.response.create({
    data: {
      commandId,
      employeeId: employee.id,
      parentId,
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
    })
  );

  let fullText = "";

  try {
    const anthropic = getAnthropic();
    const stream = anthropic.messages.stream({
      model: CLAUDE_MODEL,
      max_tokens: 1024,
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
  return fullText;
}

export async function POST(req: NextRequest) {
  const { commandId, departmentSlugs } = (await req.json()) as {
    commandId: string;
    departmentSlugs?: string[];
  };

  const command = await prisma.command.findUnique({ where: { id: commandId } });
  if (!command) {
    return new Response(JSON.stringify({ error: "지시를 찾을 수 없습니다." }), {
      status: 404,
    });
  }

  const departments = await prisma.department.findMany({
    where:
      departmentSlugs && departmentSlugs.length > 0
        ? { slug: { in: departmentSlugs } }
        : undefined,
    orderBy: { order: "asc" },
    include: {
      employees: { orderBy: { order: "asc" } },
    },
  });

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      controller.enqueue(encodeSSE({ type: "start", commandId }));

      const headContext = buildHeadContext({
        commandContent: command.content,
        priority: command.priority,
        deadline: command.deadline ? command.deadline.toISOString() : null,
      });

      const headPromises = departments.map(async (dept) => {
        const head = dept.employees.find((e) => e.rank === "부장");
        if (!head) return { dept, headText: "", headResponseId: null as string | null };

        const headText = await streamEmployeeResponse({
          controller,
          commandId,
          employee: { ...head, department: { slug: dept.slug } },
          userContext: headContext,
          parentId: null,
        });

        const headRow = await prisma.response.findFirst({
          where: { commandId, employeeId: head.id, parentId: null },
          orderBy: { createdAt: "desc" },
        });

        return {
          dept,
          head,
          headText,
          headResponseId: headRow?.id ?? null,
        };
      });

      const headResults = await Promise.all(headPromises);

      for (const result of headResults) {
        if (!result.head || !result.headResponseId) continue;
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
