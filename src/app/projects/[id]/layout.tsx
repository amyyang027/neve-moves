import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { PROJECT_PHASES } from "@/lib/constants";
import { cleanName } from "@/lib/format";
import { SampleDataBadge } from "@/components/ui";
import { SubmitButton } from "@/components/SubmitButton";
import { setPhase } from "../actions";
import { ProjectNav } from "./ProjectNav";

export default async function ProjectLayout({
  children,
  params,
}: LayoutProps<"/projects/[id]">) {
  const { id } = await params;
  const project = await db.project.findUnique({
    where: { id },
    select: { id: true, songTitle: true, kpopGroup: true, phase: true, isSample: true },
  });
  if (!project) notFound();

  return (
    <>
      <div className="mb-4">
        <div className="mb-1 text-sm text-muted">
          <Link href="/projects">← Projects</Link>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight">
              {cleanName(project.songTitle)}
            </h1>
            <span className="text-muted">· {project.kpopGroup}</span>
            {project.isSample ? <SampleDataBadge /> : null}
          </div>

          <form action={setPhase.bind(null, project.id)} className="flex items-end gap-2">
            <div>
              <label htmlFor="phase">Phase</label>
              <select id="phase" name="phase" defaultValue={project.phase}>
                {PROJECT_PHASES.map((p) => (
                  <option key={p.value} value={p.value}>
                    {p.label}
                  </option>
                ))}
              </select>
            </div>
            <SubmitButton variant="secondary">Set</SubmitButton>
          </form>
        </div>
      </div>

      <ProjectNav projectId={project.id} />

      {children}
    </>
  );
}
