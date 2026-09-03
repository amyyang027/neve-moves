"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";

function str(v: FormDataEntryValue | null): string | null {
  const s = (v ?? "").toString().trim();
  return s === "" ? null : s;
}
function revalidate(projectId: string) {
  revalidatePath(`/projects/${projectId}/votes`);
  revalidatePath(`/projects/${projectId}`);
}

export async function createPoll(projectId: string, kind: string, formData: FormData) {
  const title =
    str(formData.get("title")) ??
    (kind === "video_take" ? "Which take should we use?" : "Pick the cover photo");
  await db.poll.create({ data: { projectId, kind, title } });
  revalidate(projectId);
}

export async function addOption(pollId: string, projectId: string, formData: FormData) {
  const label = str(formData.get("label"));
  if (!label) throw new Error("Label required");
  await db.pollOption.create({
    data: {
      pollId,
      label,
      url: str(formData.get("url")),
      thumbnailUrl: str(formData.get("thumbnailUrl")),
    },
  });
  revalidate(projectId);
}

export async function deleteOption(optionId: string, projectId: string) {
  await db.pollOption.delete({ where: { id: optionId } });
  revalidate(projectId);
}

export async function castVote(pollId: string, projectId: string, formData: FormData) {
  const optionId = str(formData.get("optionId"));
  const voterMemberId = str(formData.get("voterMemberId"));
  if (!optionId || !voterMemberId) throw new Error("Pick a voter and an option");

  const poll = await db.poll.findUniqueOrThrow({ where: { id: pollId } });
  if (poll.status === "closed") throw new Error("Poll is closed");

  // One vote per member per poll — update it if they change their mind.
  await db.vote.upsert({
    where: { pollId_voterMemberId: { pollId, voterMemberId } },
    create: { pollId, optionId, voterMemberId },
    update: { optionId },
  });
  revalidate(projectId);
}

export async function removeVote(pollId: string, voterMemberId: string, projectId: string) {
  await db.vote.deleteMany({ where: { pollId, voterMemberId } });
  revalidate(projectId);
}

export async function setPollStatus(pollId: string, projectId: string, status: string) {
  await db.poll.update({ where: { id: pollId }, data: { status } });
  revalidate(projectId);
}

export async function deletePoll(pollId: string, projectId: string) {
  await db.poll.delete({ where: { id: pollId } });
  revalidate(projectId);
}
