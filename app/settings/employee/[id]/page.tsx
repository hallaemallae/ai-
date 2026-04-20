import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { EmployeeForm } from "./EmployeeForm";

export const dynamic = "force-dynamic";

export default async function EmployeeSettingsPage({
  params,
}: {
  params: { id: string };
}) {
  const employee = await prisma.employee.findUnique({
    where: { id: params.id },
    include: { department: true },
  });

  if (!employee) return notFound();

  return (
    <div className="space-y-6">
      <Link href="/org" className="text-xs text-slate-500 hover:text-slate-900">
        ← 조직도
      </Link>

      <div>
        <h1 className="text-2xl font-bold text-slate-900">
          {employee.department.icon} {employee.department.name} · {employee.name}
        </h1>
        <p className="text-sm text-slate-500">
          {employee.title} ({employee.rank})
        </p>
      </div>

      <EmployeeForm
        employee={{
          id: employee.id,
          name: employee.name,
          title: employee.title,
          rank: employee.rank,
          specialties: employee.specialties,
          style: employee.style,
          systemPrompt: employee.systemPrompt,
        }}
      />
    </div>
  );
}
