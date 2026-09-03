"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";

export async function addToRoster(projectId: string, formData: FormData) {
  const memberId = (formData.get("memberId") ?? "").toString();
  if (!memberId) return;
  await db.rosterEntry.upsert({
    where: { projectId_memberId: { projectId, memberId } },
    create: { projectId, memberId, isDancer: true },
    update: {},
  });
  revalidatePath(`/projects/${projectId}/roster`);
}

export async function toggleDancer(entryId: string, projectId: string) {
  const entry = await db.rosterEntry.findUniqueOrThrow({ where: { id: entryId } });
  await db.rosterEntry.update({
    where: { id: entryId },
    data: { isDancer: !entry.isDancer },
  });
  revalidatePath(`/projects/${projectId}/roster`);
}

export async function setProjectRole(entryId: string, projectId: string, formData: FormData) {
  const role = (formData.get("projectRole") ?? "").toString().trim();
  await db.rosterEntry.update({
    where: { id: entryId },
    data: { projectRole: role === "" ? null : role },
  });
  revalidatePath(`/projects/${projectId}/roster`);
}

export async function removeFromRoster(entryId: string, projectId: string) {
  await db.rosterEntry.delete({ where: { id: entryId } });
  revalidatePath(`/projects/${projectId}/roster`);
}
