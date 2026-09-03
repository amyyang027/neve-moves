"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { suggestFilmSpots } from "@/lib/ai";
import { cleanName } from "@/lib/format";

function str(v: FormDataEntryValue | null): string | null {
  const s = (v ?? "").toString().trim();
  return s === "" ? null : s;
}

function revalidate(projectId: string) {
  revalidatePath(`/projects/${projectId}/locations`);
  revalidatePath(`/projects/${projectId}`);
}

export async function toggleLocation(locationId: string, projectId: string) {
  const loc = await db.locationOption.findUniqueOrThrow({ where: { id: locationId } });
  await db.locationOption.update({
    where: { id: locationId },
    data: { selected: !loc.selected },
  });
  revalidate(projectId);
}

export async function addLocation(projectId: string, formData: FormData) {
  const kind = str(formData.get("kind")) === "film" ? "film" : "practice";
  const city = str(formData.get("city"));
  if (!city) throw new Error("City required");
  await db.locationOption.create({
    data: {
      projectId,
      kind,
      city,
      name: str(formData.get("name")),
      note: str(formData.get("note")),
      source: "manual",
      selected: true,
    },
  });
  revalidate(projectId);
}

export async function deleteLocation(locationId: string, projectId: string) {
  await db.locationOption.delete({ where: { id: locationId } });
  revalidate(projectId);
}

export async function generateFilmSpots(projectId: string) {
  const project = await db.project.findUniqueOrThrow({ where: { id: projectId } });
  const ideas = await suggestFilmSpots({
    songTitle: cleanName(project.songTitle),
    kpopGroup: project.kpopGroup,
    themeVibe: project.themeVibe,
  });

  // Replace the previous AI batch; keep any the user manually added.
  await db.filmSpotSuggestion.deleteMany({ where: { projectId, source: "ai" } });
  await db.filmSpotSuggestion.createMany({
    data: ideas.map((i) => ({
      projectId,
      name: i.name,
      description: i.description,
      whyItFits: i.whyItFits,
      source: "ai",
    })),
  });
  revalidate(projectId);
}

export async function useFilmSpot(suggestionId: string, projectId: string) {
  const s = await db.filmSpotSuggestion.findUniqueOrThrow({ where: { id: suggestionId } });
  await db.$transaction([
    db.filmSpotSuggestion.update({ where: { id: suggestionId }, data: { selected: true } }),
    db.locationOption.create({
      data: {
        projectId,
        kind: "film",
        city: s.name.match(/\(([^)]+)\)\s*$/)?.[1] ?? "Bay Area",
        name: s.name.replace(/\s*\([^)]+\)\s*$/, ""),
        note: s.whyItFits,
        source: "ai_suggested",
        selected: true,
      },
    }),
  ]);
  revalidate(projectId);
}
