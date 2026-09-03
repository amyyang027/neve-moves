"use server";

import { writeFile, mkdir, unlink } from "node:fs/promises";
import path from "node:path";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { parseDateInput } from "@/lib/dates";
import { generateMemberBio } from "@/lib/ai";
import { cleanName } from "@/lib/format";

const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads");
const MAX_PHOTO_BYTES = 5 * 1024 * 1024;
const PHOTO_EXT: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
};

function str(v: FormDataEntryValue | null): string | null {
  const s = (v ?? "").toString().trim();
  return s === "" ? null : s;
}

export async function createMember(formData: FormData) {
  const name = str(formData.get("name"));
  if (!name) throw new Error("Name is required");

  const member = await db.member.create({
    data: {
      name,
      stageName: str(formData.get("stageName")),
      teamRole: str(formData.get("teamRole")) ?? "Dancer",
      pronouns: str(formData.get("pronouns")),
      instagramHandle: str(formData.get("instagramHandle"))?.replace(/^@/, "") ?? null,
      wechatId: str(formData.get("wechatId")),
      photoUrl: str(formData.get("photoUrl")),
      joinDate: parseDateInput((formData.get("joinDate") ?? "").toString()),
    },
  });

  revalidatePath("/members");
  redirect(`/members/${member.id}`);
}

export async function updateMember(memberId: string, formData: FormData) {
  const name = str(formData.get("name"));
  if (!name) throw new Error("Name is required");

  await db.member.update({
    where: { id: memberId },
    data: {
      name,
      stageName: str(formData.get("stageName")),
      teamRole: str(formData.get("teamRole")) ?? "Dancer",
      pronouns: str(formData.get("pronouns")),
      instagramHandle: str(formData.get("instagramHandle"))?.replace(/^@/, "") ?? null,
      wechatId: str(formData.get("wechatId")),
      photoUrl: str(formData.get("photoUrl")),
      joinDate: parseDateInput((formData.get("joinDate") ?? "").toString()),
      active: formData.get("active") === "on",
      bio: str(formData.get("bio")),
    },
  });

  revalidatePath("/members");
  revalidatePath(`/members/${memberId}`);
}

/**
 * Upload a member photo. Phase 1: the file is written to /public/uploads on the
 * local disk and referenced by path. Phase 2 (a hosted app) needs real blob
 * storage — the filesystem on Vercel is read-only/ephemeral. See README.
 */
export async function uploadMemberPhoto(memberId: string, formData: FormData) {
  const file = formData.get("photo");
  if (!(file instanceof File) || file.size === 0) {
    throw new Error("No file selected");
  }
  if (file.size > MAX_PHOTO_BYTES) {
    throw new Error("Photo must be 5 MB or smaller");
  }
  const ext = PHOTO_EXT[file.type];
  if (!ext) throw new Error("Photo must be a JPEG, PNG, WebP or GIF");

  await mkdir(UPLOAD_DIR, { recursive: true });
  const filename = `${memberId}.${ext}`;
  await writeFile(
    path.join(UPLOAD_DIR, filename),
    Buffer.from(await file.arrayBuffer()),
  );

  // Remove any previous file with a different extension.
  for (const other of Object.values(PHOTO_EXT)) {
    if (other !== ext) {
      await unlink(path.join(UPLOAD_DIR, `${memberId}.${other}`)).catch(() => {});
    }
  }

  // ?v= busts the browser cache when the photo is replaced.
  await db.member.update({
    where: { id: memberId },
    data: { photoUrl: `/uploads/${filename}?v=${Date.now()}` },
  });

  revalidatePath("/members");
  revalidatePath(`/members/${memberId}`);
}

export async function deleteMember(memberId: string) {
  await db.member.delete({ where: { id: memberId } });
  revalidatePath("/members");
  redirect("/members");
}

/** Generate (mock) a bio and save it on the member for reuse across projects. */
export async function regenerateBio(memberId: string) {
  const member = await db.member.findUniqueOrThrow({
    where: { id: memberId },
    include: {
      rosterEntries: {
        include: { project: { select: { songTitle: true } } },
      },
    },
  });

  const bio = await generateMemberBio({
    name: cleanName(member.name),
    stageName: member.stageName,
    teamRole: member.teamRole,
    pronouns: member.pronouns,
    pastCovers: member.rosterEntries.map((r) => cleanName(r.project.songTitle)),
  });

  await db.member.update({
    where: { id: memberId },
    data: { bio, bioUpdatedAt: new Date() },
  });

  revalidatePath(`/members/${memberId}`);
}

export async function addBlockedDate(memberId: string, formData: FormData) {
  const start = parseDateInput((formData.get("startDate") ?? "").toString());
  const endRaw = (formData.get("endDate") ?? "").toString();
  const end = endRaw ? parseDateInput(endRaw) : start;
  if (!start || !end) throw new Error("Valid start date required");

  await db.blockedDate.create({
    data: {
      memberId,
      startDate: start,
      endDate: end < start ? start : end,
      reason: str(formData.get("reason")),
    },
  });

  revalidatePath(`/members/${memberId}`);
}

export async function deleteBlockedDate(id: string, memberId: string) {
  await db.blockedDate.delete({ where: { id } });
  revalidatePath(`/members/${memberId}`);
}
