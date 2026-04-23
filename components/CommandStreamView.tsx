"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { DeptCard, type DeptResponseNode } from "./DeptCard";
import { MeetingView, type MeetingPhase } from "./MeetingView";
import type { ArtifactEntry } from "./ArtifactsPanel";
import type { CommandDTO, DepartmentDTO, StreamEvent } from "@/types";

interface Props {
  command: CommandDTO;
  departments: DepartmentDTO[];
  initialResponses: NonNullable<CommandDTO["responses"]>;
  initialArtifacts?: ArtifactEntry[];
  autostartDepartmentSlugs?: string[] | null;
}

type NodeMap = Record<string, DeptResponseNode>;

function buildInitialNodes(
  departments: DepartmentDTO[],
  responses: NonNullable<CommandDTO["responses"]>
) {
  const byDept: Record<string, DeptResponseNode[]> = {};
  const nodeMap: NodeMap = {};
  for (const d of departments) byDept[d.slug] = [];

  const roots = responses.filter((r) => r.parentId === null);
  for (const head of roots) {
    const dept = head.employee?.department;
    if (!dept) continue;
    const node: DeptResponseNode = {
      id: head.id,
      employeeId: head.employeeId,
      employeeName: head.employee?.name ?? "",
      title: head.employee?.title,
      rank: head.employee?.rank ?? "부장",
      content: head.content,
      streaming: head.status === "streaming",
      round: head.round ?? 0,
      children: [],
    };
    nodeMap[head.id] = node;
    if (!byDept[dept.slug]) byDept[dept.slug] = [];
    byDept[dept.slug].push(node);
  }

  for (const r of responses.filter((x) => x.parentId !== null)) {
    const node: DeptResponseNode = {
      id: r.id,
      employeeId: r.employeeId,
      employeeName: r.employee?.name ?? "",
      title: r.employee?.title,
      rank: r.employee?.rank ?? "사원",
      content: r.content,
      streaming: r.status === "streaming",
      round: r.round ?? 0,
      children: [],
    };
    nodeMap[r.id] = node;
    const parent = nodeMap[r.parentId!];
    if (parent) {
      parent.children.push(node);
    } else {
      // Round-2 head whose round-1 parent isn't yet indexed — push to dept
      const dept = r.employee?.department;
      if (dept) {
        if (!byDept[dept.slug]) byDept[dept.slug] = [];
        byDept[dept.slug].push(node);
      }
    }
  }

  return { byDept, nodeMap };
}

export function CommandStreamView({
  command,
  departments,
  initialResponses,
  initialArtifacts = [],
  autostartDepartmentSlugs,
}: Props) {
  const isMeeting = command.type === "meeting";
  const initial = useMemo(
    () => buildInitialNodes(departments, initialResponses),
    [departments, initialResponses]
  );
  const [byDept, setByDept] = useState(initial.byDept);
  const nodeMapRef = useRef<NodeMap>(initial.nodeMap);
  const [streaming, setStreaming] = useState(false);
  const [activeTab, setActiveTab] = useState<string>(departments[0]?.slug ?? "");
  const startedRef = useRef(false);

  const [summary, setSummary] = useState<string>(command.summary ?? "");
  const [summaryStreaming, setSummaryStreaming] = useState(false);
  const [artifacts, setArtifacts] = useState<ArtifactEntry[]>(initialArtifacts);
  const [phase, setPhase] = useState<MeetingPhase["phase"]>(
    initialResponses.length > 0 && isMeeting
      ? command.summary
        ? initialArtifacts.length > 0
          ? "done"
          : "artifacts"
        : "round2"
      : "idle"
  );

  function updateNode(responseId: string, updater: (n: DeptResponseNode) => void) {
    const node = nodeMapRef.current[responseId];
    if (!node) return;
    updater(node);
    setByDept((prev) => ({ ...prev }));
  }

  async function start() {
    if (startedRef.current) return;
    startedRef.current = true;
    setStreaming(true);
    if (isMeeting) setPhase("round1");

    try {
      const res = await fetch("/api/ai/stream", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          commandId: command.id,
          departmentSlugs: autostartDepartmentSlugs ?? [],
        }),
      });

      if (!res.body) throw new Error("스트림 응답을 받을 수 없습니다.");

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const frames = buffer.split("\n\n");
        buffer = frames.pop() ?? "";
        for (const frame of frames) {
          const line = frame.split("\n").find((l) => l.startsWith("data: "));
          if (!line) continue;
          try {
            const event = JSON.parse(line.slice(6)) as StreamEvent;
            handleEvent(event);
          } catch {
            // ignore bad frame
          }
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setStreaming(false);
      if (isMeeting) setPhase("done");
    }
  }

  function handleEvent(event: StreamEvent) {
    if (event.type === "response:start") {
      const node: DeptResponseNode = {
        id: event.responseId,
        employeeId: event.employeeId,
        employeeName: event.employeeName,
        rank: event.rank,
        content: "",
        streaming: true,
        round: event.round ?? 0,
        children: [],
      };
      nodeMapRef.current[event.responseId] = node;

      if (event.parentId === null) {
        setByDept((prev) => ({
          ...prev,
          [event.departmentSlug]: [...(prev[event.departmentSlug] ?? []), node],
        }));
      } else {
        const parent = nodeMapRef.current[event.parentId];
        if (parent) {
          // In meeting mode, round-2 head with round-1 parent is still a peer of round-1,
          // not a nested child. Promote to dept root.
          if (isMeeting && event.round === 2) {
            setByDept((prev) => ({
              ...prev,
              [event.departmentSlug]: [
                ...(prev[event.departmentSlug] ?? []),
                node,
              ],
            }));
          } else {
            parent.children.push(node);
            setByDept((prev) => ({ ...prev }));
          }
        }
      }
    } else if (event.type === "response:delta") {
      updateNode(event.responseId, (n) => {
        n.content += event.delta;
      });
    } else if (event.type === "response:end") {
      updateNode(event.responseId, (n) => {
        n.streaming = false;
      });
    } else if (event.type === "phase") {
      if (event.phase === "round1" || event.phase === "round2" || event.phase === "ceo" || event.phase === "artifacts") {
        setPhase(event.phase);
      }
    } else if (event.type === "summary:start") {
      setSummary("");
      setSummaryStreaming(true);
    } else if (event.type === "summary:delta") {
      setSummary((s) => s + event.delta);
    } else if (event.type === "summary:end") {
      setSummary(event.text);
      setSummaryStreaming(false);
    } else if (event.type === "artifact") {
      setArtifacts((prev) => [
        ...prev,
        {
          artifactId: event.artifactId,
          filename: event.filename,
          language: event.language,
          departmentSlug: event.departmentSlug,
          employeeName: event.employeeName,
        },
      ]);
    }
  }

  useEffect(() => {
    if (autostartDepartmentSlugs === null) return;
    if (initialResponses.length > 0) return;
    void start();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (isMeeting) {
    return (
      <MeetingView
        departments={departments}
        byDept={byDept}
        summary={summary}
        summaryStreaming={summaryStreaming}
        artifacts={artifacts}
        phase={phase}
        streaming={streaming}
        onStart={() => void start()}
        alreadyHasData={initialResponses.length > 0}
      />
    );
  }

  const activeDepartments = departments.filter(
    (d) =>
      (byDept[d.slug] ?? []).length > 0 ||
      !autostartDepartmentSlugs ||
      autostartDepartmentSlugs.includes(d.slug) ||
      autostartDepartmentSlugs.length === 0
  );

  return (
    <div>
      <div className="mb-4 flex flex-wrap gap-2 border-b border-slate-200 pb-2">
        {departments.map((d) => {
          const count = (byDept[d.slug] ?? []).length;
          return (
            <button
              key={d.slug}
              onClick={() => setActiveTab(d.slug)}
              className={`rounded-t-lg px-3 py-1.5 text-xs font-semibold transition ${
                activeTab === d.slug
                  ? "bg-brand-50 text-brand-700"
                  : "text-slate-500 hover:bg-slate-100"
              }`}
            >
              <span className="mr-1">{d.icon}</span>
              {d.name}
              {count > 0 && (
                <span className="ml-1 rounded-full bg-brand-500 px-1.5 text-[10px] text-white">
                  {count}
                </span>
              )}
            </button>
          );
        })}
        <button
          onClick={() => setActiveTab("__all__")}
          className={`ml-auto rounded-t-lg px-3 py-1.5 text-xs font-semibold transition ${
            activeTab === "__all__"
              ? "bg-brand-50 text-brand-700"
              : "text-slate-500 hover:bg-slate-100"
          }`}
        >
          전체 보기
        </button>
      </div>

      {!startedRef.current && initialResponses.length === 0 && (
        <div className="mb-4 flex items-center justify-between rounded-xl border border-dashed border-slate-300 bg-white p-4">
          <span className="text-sm text-slate-600">
            아직 AI 응답이 시작되지 않았습니다.
          </span>
          <button
            onClick={() => void start()}
            disabled={streaming}
            className="rounded-lg bg-brand-600 px-4 py-1.5 text-sm font-semibold text-white hover:bg-brand-700 disabled:bg-slate-300"
          >
            {streaming ? "진행 중..." : "응답 시작"}
          </button>
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        {(activeTab === "__all__"
          ? activeDepartments
          : activeDepartments.filter((d) => d.slug === activeTab)
        ).map((d) => (
          <DeptCard key={d.id} department={d} headNodes={byDept[d.slug] ?? []} />
        ))}
      </div>
    </div>
  );
}
