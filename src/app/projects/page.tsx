// Always read fresh data — this is a live, mutable app, not a static site.
export const dynamic = "force-dynamic";

import { db } from "@/lib/db";
import { ProjectCard } from "@/components/ProjectCard";
import type { ProjectCardData } from "@/components/ProjectCard";
import { PageHeader, Section, EmptyState, LinkButton } from "@/components/ui";

export default async function ProjectsPage() {
  const rows = await db.project.findMany({
    orderBy: { updatedAt: "desc" },
    include: {
      _count: { select: { roster: true } },
      events: { where: { kind: "film" }, select: { confirmedDate: true, targetDate: true } },
    },
  });

  const projects: ProjectCardData[] = rows.map((p) => ({
    id: p.id,
    songTitle: p.songTitle,
    kpopGroup: p.kpopGroup,
    themeVibe: p.themeVibe,
    phase: p.phase,
    dateWindowLabel: p.dateWindowLabel,
    isSample: p.isSample,
    posterSvg: p.posterSvg,
    rosterCount: p._count.roster,
    filmDate: p.events[0]?.confirmedDate ?? p.events[0]?.targetDate ?? null,
  }));

  const active = projects.filter((p) => p.phase !== "published");
  const published = projects.filter((p) => p.phase === "published");

  return (
    <>
      <PageHeader
        title="Projects"
        description="One project per dance cover, from song pick to published video."
        actions={<LinkButton href="/projects/new">New project</LinkButton>}
      />

      <Section title={`Active (${active.length})`}>
        <Grid projects={active} />
      </Section>

      {published.length > 0 ? (
        <Section title={`Published (${published.length})`}>
          <Grid projects={published} />
        </Section>
      ) : null}
    </>
  );
}

function Grid({ projects }: { projects: ProjectCardData[] }) {
  if (projects.length === 0) return <EmptyState>Nothing here yet.</EmptyState>;
  return (
    <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {projects.map((p) => (
        <li key={p.id}>
          <ProjectCard p={p} />
        </li>
      ))}
    </ul>
  );
}
