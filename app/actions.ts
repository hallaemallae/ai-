"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export async function switchProject(projectId: string) {
  cookies().set("activeProjectId", projectId, { path: "/", maxAge: 60 * 60 * 24 * 365 });
  redirect("/");
}
