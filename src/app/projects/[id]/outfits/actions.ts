"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { suggestOutfit } from "@/lib/ai";
import { cleanName } from "@/lib/format";

function revalidate(projectId: string) {
  revalidatePath(`/projects/${projectId}/outfits`);
  revalidatePath(`/projects/${projectId}`);
}

export async function generateOutfit(projectId: string) {
  const project = await db.project.findUniqueOrThrow({ where: { id: projectId } });
  const description = await suggestOutfit({
    songTitle: cleanName(project.songTitle),
    kpopGroup: project.kpopGroup,
    themeVibe: project.themeVibe,
  });
  await db.outfitSuggestion.create({
    data: { projectId, description, source: "ai" },
  });
  revalidate(projectId);
}

export async function addOutfit(projectId: string, formData: FormData) {
  const description = (formData.get("description") ?? "").toString().trim();
  if (!description) throw new Error("Description required");
  const ref = (formData.get("referenceImageUrl") ?? "").toString().trim();
  await db.outfitSuggestion.create({
    data: {
      projectId,
      description,
      referenceImageUrl: ref === "" ? null : ref,
      source: "manual",
    },
  });
  revalidate(projectId);
}

export async function setOutfitReferenceImage(
  id: string,
  projectId: string,
  formData: FormData,
) {
  const ref = (formData.get("referenceImageUrl") ?? "").toString().trim();
  await db.outfitSuggestion.update({
    where: { id },
    data: { referenceImageUrl: ref === "" ? null : ref },
  });
  revalidate(projectId);
}

export async function selectOutfit(id: string, projectId: string) {
  await db.$transaction([
    db.outfitSuggestion.updateMany({ where: { projectId }, data: { selected: false } }),
    db.outfitSuggestion.update({ where: { id }, data: { selected: true } }),
  ]);
  revalidate(projectId);
}

export async function deleteOutfit(id: string, projectId: string) {
  await db.outfitSuggestion.delete({ where: { id } });
  revalidate(projectId);
}
