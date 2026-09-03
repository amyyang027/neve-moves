"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { generateInstagramCaption, generateYoutubeDescription } from "@/lib/ai";
import { cleanName } from "@/lib/format";

export async function generateCopy(projectId: string, kind: "ig_caption" | "yt_description") {
  const project = await db.project.findUniqueOrThrow({
    where: { id: projectId },
    include: {
      references: true,
      videographer: true,
      roster: {
        where: { isDancer: true },
        include: { member: true },
        orderBy: { createdAt: "asc" },
      },
    },
  });

  const input = {
    songTitle: cleanName(project.songTitle),
    kpopGroup: project.kpopGroup,
    themeVibe: project.themeVibe,
    dancerHandles: project.roster.map((r) => r.member.instagramHandle ?? ""),
    dancerNames: project.roster.map((r) => cleanName(r.member.name)),
    videographerCredit:
      project.videographer?.status === "confirmed" || project.videographer?.name
        ? project.videographer?.contactHandle
          ? `@${project.videographer.contactHandle}`
          : project.videographer?.name ?? null
        : null,
    referenceUrl: project.references[0]?.url ?? null,
  };

  const text =
    kind === "ig_caption"
      ? await generateInstagramCaption(input)
      : await generateYoutubeDescription(input);

  await db.$transaction([
    db.projectCopy.deleteMany({ where: { projectId, kind } }),
    db.projectCopy.create({ data: { projectId, kind, text } }),
  ]);

  revalidatePath(`/projects/${projectId}/copy`);
  revalidatePath(`/projects/${projectId}`);
}
