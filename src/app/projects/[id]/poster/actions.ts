"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { generatePosterSvg } from "@/lib/ai";
import { POSTER_VARIANT_COUNT } from "@/lib/ai/poster";
import { ROSTER_MIN, ROSTER_MAX } from "@/lib/constants";
import { cleanName } from "@/lib/format";

export async function generatePoster(projectId: string) {
  const project = await db.project.findUniqueOrThrow({ where: { id: projectId } });

  // First generation keeps variant 0; each "Regenerate" advances to the next
  // layout so the button is repeatable, not random.
  const variant = project.posterSvg
    ? (project.posterVariant + 1) % POSTER_VARIANT_COUNT
    : 0;

  const svg = await generatePosterSvg({
    songTitle: cleanName(project.songTitle),
    kpopGroup: project.kpopGroup,
    themeVibe: project.themeVibe,
    dateWindowLabel: project.dateWindowLabel,
    rosterMin: ROSTER_MIN,
    rosterMax: ROSTER_MAX,
    variant,
  });

  await db.project.update({
    where: { id: projectId },
    data: { posterSvg: svg, posterUpdatedAt: new Date(), posterVariant: variant },
  });

  revalidatePath(`/projects/${projectId}/poster`);
  revalidatePath(`/projects/${projectId}`);
  revalidatePath("/");
  revalidatePath("/projects");
}
