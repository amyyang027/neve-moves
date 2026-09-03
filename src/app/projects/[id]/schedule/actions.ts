"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { parseDateInput, subtractDays } from "@/lib/dates";

function str(v: FormDataEntryValue | null): string | null {
  const s = (v ?? "").toString().trim();
  return s === "" ? null : s;
}

function revalidate(projectId: string) {
  revalidatePath(`/projects/${projectId}/schedule`);
  revalidatePath(`/projects/${projectId}`);
  revalidatePath("/"); // dashboard reminders
}

export async function addEvent(projectId: string, formData: FormData) {
  const kind = str(formData.get("kind")) === "film" ? "film" : "practice";
  const label = str(formData.get("label")) ?? (kind === "film" ? "Film Day" : "Practice");
  const count = await db.projectEvent.count({ where: { projectId } });
  await db.projectEvent.create({
    data: { projectId, kind, label, orderIndex: count },
  });
  revalidate(projectId);
}

export async function updateEvent(eventId: string, projectId: string, formData: FormData) {
  const existing = await db.projectEvent.findUniqueOrThrow({ where: { id: eventId } });

  const targetDate = parseDateInput((formData.get("targetDate") ?? "").toString());
  const confirmedDate = parseDateInput((formData.get("confirmedDate") ?? "").toString());
  let reminderDate = parseDateInput((formData.get("reminderDate") ?? "").toString());

  // Convenience: if there's a date but no reminder, default it to a few days
  // before (2 for practices, 3 for the film day).
  if (!reminderDate) {
    const anchor = confirmedDate ?? targetDate;
    if (anchor) reminderDate = subtractDays(anchor, existing.kind === "film" ? 3 : 2);
  }

  await db.projectEvent.update({
    where: { id: eventId },
    data: {
      label: str(formData.get("label")) ?? existing.label,
      targetDate,
      confirmedDate,
      reminderDate,
      locationCity: str(formData.get("locationCity")),
      locationNote: str(formData.get("locationNote")),
    },
  });
  revalidate(projectId);
}

export async function deleteEvent(eventId: string, projectId: string) {
  await db.projectEvent.delete({ where: { id: eventId } });
  revalidate(projectId);
}

export async function setCrabfitUrl(projectId: string, formData: FormData) {
  await db.project.update({
    where: { id: projectId },
    data: { crabfitUrl: str(formData.get("crabfitUrl")) },
  });
  revalidate(projectId);
}

export async function addCandidateDate(projectId: string, formData: FormData) {
  const date = parseDateInput((formData.get("date") ?? "").toString());
  if (!date) throw new Error("Valid date required");
  await db.candidateDate.create({
    data: { projectId, date, note: str(formData.get("note")) },
  });
  revalidatePath(`/projects/${projectId}/schedule`);
}

export async function deleteCandidateDate(id: string, projectId: string) {
  await db.candidateDate.delete({ where: { id } });
  revalidatePath(`/projects/${projectId}/schedule`);
}
