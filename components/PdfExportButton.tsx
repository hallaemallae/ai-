"use client";

import { useState } from "react";

export function PdfExportButton({ commandId }: { commandId: string }) {
  const [loading, setLoading] = useState(false);

  async function handleClick() {
    setLoading(true);
    try {
      const res = await fetch("/api/export/pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ commandId }),
      });
      const { command } = await res.json();
      if (!command) return;
      const { jsPDF } = await import("jspdf");
      const doc = new jsPDF({ unit: "pt", format: "a4" });
      const margin = 40;
      let y = margin;
      doc.setFont("helvetica", "bold");
      doc.setFontSize(16);
      doc.text("AI Company Report", margin, y);
      y += 24;
      doc.setFontSize(11);
      doc.setFont("helvetica", "normal");
      doc.text(`Command: ${command.content}`, margin, y, { maxWidth: 515 });
      y += 24;
      doc.text(
        `Priority: ${command.priority} | Deadline: ${command.deadline ?? "-"}`,
        margin,
        y
      );
      y += 20;
      doc.setDrawColor(200);
      doc.line(margin, y, 555, y);
      y += 16;

      for (const r of command.responses) {
        if (y > 780) {
          doc.addPage();
          y = margin;
        }
        const dept = r.employee?.department?.name ?? "";
        const name = r.employee?.name ?? "";
        const rank = r.employee?.rank ?? "";
        doc.setFont("helvetica", "bold");
        doc.text(`[${dept}] ${name} (${rank})`, margin, y);
        y += 16;
        doc.setFont("helvetica", "normal");
        const lines = doc.splitTextToSize(r.content || "-", 515);
        doc.text(lines, margin, y);
        y += lines.length * 14 + 10;
      }

      doc.save(`ai-company-${command.id}.pdf`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-sm hover:border-brand-300 hover:text-brand-700 disabled:opacity-50"
    >
      {loading ? "내보내는 중..." : "PDF 내보내기"}
    </button>
  );
}
