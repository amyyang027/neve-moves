"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import {
  DEFAULT_EVENT_TEMPLATE,
  PREFERRED_PRACTICE_CITIES,
} from "@/lib/constants";

function str(v: FormDataEntryValue | null): string | null {
  const s = (v ?? "").toString().trim();
  return s === "" ? null : s;
}

export async function createProject(formData: FormData) {
  const songTitle = str(formData.get("songTitle"));
  const kpopGroup = str(formData.get("kpopGroup"));
  if (!songTitle || !kpopGroup) throw new Error("Song title and group are required");

  const refLabel = str(formData.get("refLabel"));
  const refUrl = str(formData.get("refUrl"));

  const project = await db.project.create({
    data: {
      songTitle,
      kpopGroup,
      themeVibe: str(formData.get("themeVibe")),
      dateWindowLabel: str(formData.get("dateWindowLabel")),
      phase: "planning",
      references:
        refUrl != null
          ? { create: [{ label: refLabel ?? "Reference", url: refUrl }] }
          : undefined,
      // Every project starts with the default event set (editable afterward)…
      events: {
        create: DEFAULT_EVENT_TEMPLATE.map((e, i) => ({
          kind: e.kind,
          label: e.label,
          orderIndex: i,
        })),
      },
      // …and the preferred Bay Area practice cities as unselected options.
      locations: {
        create: PREFERRED_PRACTICE_CITIES.map((city) => ({
          kind: "practice",
          city,
          source: "preferred",
        })),
      },
      videographer: { create: {} },
    },
  });

  redirect(`/projects/${project.id}`);
}

export async function updateProjectBasics(projectId: string, formData: FormData) {
  const songTitle = str(formData.get("songTitle"));
  const kpopGroup = str(formData.get("kpopGroup"));
  if (!songTitle || !kpopGroup) throw new Error("Song title and group are required");

  await db.project.update({
    where: { id: projectId },
    data: {
      songTitle,
      kpopGroup,
      themeVibe: str(formData.get("themeVibe")),
      dateWindowLabel: str(formData.get("dateWindowLabel")),
      crabfitUrl: str(formData.get("crabfitUrl")),
      youtubeUrl: str(formData.get("youtubeUrl")),
      coverImageUrl: str(formData.get("coverImageUrl")),
    },
  });

  revalidatePath(`/projects/${projectId}`, "layout");
}

export async function setPhase(projectId: string, formData: FormData) {
  const phase = str(formData.get("phase"));
  if (!phase) return;
  await db.project.update({ where: { id: projectId }, data: { phase } });
  revalidatePath(`/projects/${projectId}`, "layout");
}

export async function deleteProject(projectId: string) {
  await db.project.delete({ where: { id: projectId } });
  revalidatePath("/projects");
  redirect("/projects");
}

export async function addReference(projectId: string, formData: FormData) {
  const url = str(formData.get("url"));
  if (!url) throw new Error("URL required");
  await db.referenceLink.create({
    data: {
      projectId,
      label: str(formData.get("label")) ?? "Reference",
      url,
    },
  });
  revalidatePath(`/projects/${projectId}`);
}

export async function deleteReference(id: string, projectId: string) {
  await db.referenceLink.delete({ where: { id } });
  revalidatePath(`/projects/${projectId}`);
}
