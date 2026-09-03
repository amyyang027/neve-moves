import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { formatDate } from "@/lib/dates";
import { cleanName, instagramUrl } from "@/lib/format";
import { Section, EmptyState, Badge, MockAiNote } from "@/components/ui";
import { SubmitButton } from "@/components/SubmitButton";
import { CopyButton } from "@/components/CopyButton";
import { generateCopy } from "./actions";

export default async function CopyPage({ params }: PageProps<"/projects/[id]/copy">) {
  const { id } = await params;
  const project = await db.project.findUnique({
    where: { id },
    include: {
      copy: { orderBy: { createdAt: "desc" } },
      videographer: true,
      roster: {
        where: { isDancer: true },
        include: { member: true },
        orderBy: { createdAt: "asc" },
      },
    },
  });
  if (!project) notFound();

  const ig = project.copy.find((c) => c.kind === "ig_caption");
  const yt = project.copy.find((c) => c.kind === "yt_description");
  const dancersMissingHandles = project.roster.filter((r) => !r.member.instagramHandle);

  return (
    <>
      <Section
        title="Credits used in the copy"
        description="Pulled from the roster (dancers only) and the videographer tab."
      >
        <div className="flex flex-wrap gap-1.5">
          {project.roster.map((r) => (
            <span key={r.id} className="rounded-full border border-border px-2 py-0.5 text-xs">
              {cleanName(r.member.name)}
              {r.member.instagramHandle ? (
                <a
                  href={instagramUrl(r.member.instagramHandle)!}
                  target="_blank"
                  rel="noreferrer"
                  className="ml-1 text-accent"
                >
                  @{r.member.instagramHandle}
                </a>
              ) : (
                <span className="ml-1 text-[var(--bad)]">no @</span>
              )}
            </span>
          ))}
          {project.roster.length === 0 ? (
            <span className="text-sm text-muted">No dancers on the roster yet.</span>
          ) : null}
        </div>
        {dancersMissingHandles.length > 0 ? (
          <p className="mt-2 text-xs text-[var(--warn)]">
            {dancersMissingHandles.map((r) => cleanName(r.member.name)).join(", ")} —
            add an Instagram handle on their member page so they get credited.
          </p>
        ) : null}
        <p className="mt-2 text-sm">
          Videographer:{" "}
          {project.videographer?.name || project.videographer?.contactHandle ? (
            <Badge tone={project.videographer?.status === "confirmed" ? "good" : "warn"}>
              {project.videographer?.name ?? project.videographer?.contactHandle} ·{" "}
              {project.videographer?.status.replace("_", " ")}
            </Badge>
          ) : (
            <span className="text-muted">none set</span>
          )}
        </p>
      </Section>

      <Section
        title="Instagram Reel caption"
        actions={
          <form action={generateCopy.bind(null, project.id, "ig_caption")}>
            <SubmitButton pendingText="Writing…">{ig ? "Regenerate" : "Generate"}</SubmitButton>
          </form>
        }
      >
        {ig ? (
          <>
            <pre className="whitespace-pre-wrap rounded-lg border border-border bg-[var(--background)] p-3 text-sm">
              {ig.text}
            </pre>
            <div className="mt-2 flex items-center gap-2">
              <CopyButton text={ig.text} label="Copy caption" />
              <span className="text-xs text-muted">Generated {formatDate(ig.createdAt)}</span>
            </div>
          </>
        ) : (
          <EmptyState>Not generated yet.</EmptyState>
        )}
        <MockAiNote what="The Instagram caption" />
      </Section>

      <Section
        title="YouTube description"
        actions={
          <form action={generateCopy.bind(null, project.id, "yt_description")}>
            <SubmitButton pendingText="Writing…">{yt ? "Regenerate" : "Generate"}</SubmitButton>
          </form>
        }
      >
        {yt ? (
          <>
            <pre className="whitespace-pre-wrap rounded-lg border border-border bg-[var(--background)] p-3 text-sm">
              {yt.text}
            </pre>
            <div className="mt-2 flex items-center gap-2">
              <CopyButton text={yt.text} label="Copy description" />
              <span className="text-xs text-muted">Generated {formatDate(yt.createdAt)}</span>
            </div>
          </>
        ) : (
          <EmptyState>Not generated yet.</EmptyState>
        )}
        <MockAiNote what="The YouTube description" />
      </Section>
    </>
  );
}
