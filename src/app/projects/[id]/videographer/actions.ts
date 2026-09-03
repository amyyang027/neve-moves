"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { parseDateInput } from "@/lib/dates";

function str(v: FormDataEntryValue | null): string | null {
  const s = (v ?? "").toString().trim();
  return s === "" ? null : s;
}

export async function updateVideographer(projectId: string, formData: FormData) {
  const data = {
    name: str(formData.get("name")),
    contactVia: str(formData.get("contactVia")),
    contactHandle: str(formData.get("contactHandle")),
    status: str(formData.get("status")) ?? "not_contacted",
    reminderDate: parseDateInput((formData.get("reminderDate") ?? "").toString()),
    notes: str(formData.get("notes")),
  };

  await db.videographer.upsert({
    where: { projectId },
    create: { projectId, ...data },
    update: data,
  });

  revalidatePath(`/projects/${projectId}/videographer`);
  revalidatePath(`/projects/${projectId}`);
  revalidatePath("/");
}
