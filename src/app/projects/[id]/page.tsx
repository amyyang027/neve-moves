import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { ROSTER_MIN, ROSTER_MAX } from "@/lib/constants";
import { formatDate } from "@/lib/dates";
import { Section, Field, Badge, EmptyState } from "@/components/ui";
import { SubmitButton } from "@/components/SubmitButton";
import {
  updateProjectBasics,
  deleteProject,
  addReference,
  deleteReference,
} from "../actions";

type StepState = "done" | "todo" | "attention";

export default async function ProjectOverviewPage({
  params,
}: PageProps<"/projects/[id]">) {
  const { id } = await params;
  const project = await db.project.findUnique({
    where: { id },
    include: {
      references: true,
      roster: true,
      candidateDates: true,
      events: true,
      locations: true,
      outfitSuggestions: true,
      filmSpotSuggestions: true,
      videographer: true,
      polls: { include: { _count: { select: { votes: true } } } },
      copy: true,
    },
  });
  if (!project) notFound();

  const base = `/projects/${project.id}`;
  const dancerCount = project.roster.filter((r) => r.isDancer).length;
  const practiceSelected = project.locations.some((l) => l.kind === "practice" && l.selected);
  const filmSelected = project.locations.some((l) => l.kind === "film" && l.selected);
  const confirmedEvents = project.events.filter((e) => e.confirmedDate).length;
  const remindersSet = project.events.filter((e) => e.reminderDate).length;
  const takePoll = project.polls.find((p) => p.kind === "video_take");
  const photoPoll = project.polls.find((p) => p.kind === "cover_photo");

  const steps: { label: string; href: string; state: StepState; note: string }[] = [
    {
      label: "Recruitment poster",
      href: `${base}/poster`,
      state: project.posterSvg ? "done" : "todo",
      note: project.posterSvg ? "Generated" : "Not generated yet",
    },
    {
      label: "Roster",
      href: `${base}/roster`,
      state:
        project.roster.length === 0
          ? "todo"
          : dancerCount >= ROSTER_MIN && dancerCount <= ROSTER_MAX
            ? "done"
            : "attention",
      note:
        project.roster.length === 0
          ? "No members added"
          : `${dancerCount} dancing (target ${ROSTER_MIN}–${ROSTER_MAX})`,
    },
    {
      label: "Schedule & conflicts",
      href: `${base}/schedule`,
      state:
        confirmedEvents === project.events.length && project.events.length > 0
          ? "done"
          : project.candidateDates.length > 0 || project.crabfitUrl
            ? "attention"
            : "todo",
      note: `${confirmedEvents}/${project.events.length} dates confirmed${
        project.crabfitUrl ? " · Crabfit linked" : ""
      }`,
    },
    {
      label: "Reminders",
      href: `${base}/schedule`,
      state: remindersSet === project.events.length && project.events.length > 0 ? "done" : "attention",
      note: `${remindersSet}/${project.events.length} events have a reminder date`,
    },
    {
      label: "Practice locations",
      href: `${base}/locations`,
      state: practiceSelected ? "done" : "todo",
      note: practiceSelected ? "At least one city chosen" : "None chosen",
    },
    {
      label: "Film location",
      href: `${base}/locations`,
      state: filmSelected ? "done" : project.filmSpotSuggestions.length > 0 ? "attention" : "todo",
      note: filmSelected
        ? "Spot chosen"
        : project.filmSpotSuggestions.length > 0
          ? "Suggestions ready, none chosen"
          : "No suggestions yet",
    },
    {
      label: "Outfit",
      href: `${base}/outfits`,
      state: project.outfitSuggestions.some((o) => o.selected)
        ? "done"
        : project.outfitSuggestions.length > 0
          ? "attention"
          : "todo",
      note: project.outfitSuggestions.some((o) => o.selected)
        ? "Chosen"
        : `${project.outfitSuggestions.length} suggestion(s)`,
    },
    {
      label: "Videographer",
      href: `${base}/videographer`,
      state:
        project.videographer?.status === "confirmed"
          ? "done"
          : project.videographer?.status === "contacted"
            ? "attention"
            : "todo",
      note: project.videographer?.status.replace("_", " ") ?? "not contacted",
    },
    {
      label: "Video take vote",
      href: `${base}/votes`,
      state: !takePoll
        ? "todo"
        : takePoll.status === "closed"
          ? "done"
          : takePoll._count.votes > 0
            ? "attention"
            : "todo",
      note: takePoll ? `${takePoll._count.votes} votes · ${takePoll.status}` : "No poll yet",
    },
    {
      label: "Cover photo vote",
      href: `${base}/votes`,
      state: !photoPoll
        ? "todo"
        : photoPoll.status === "closed"
          ? "done"
          : photoPoll._count.votes > 0
            ? "attention"
            : "todo",
      note: photoPoll ? `${photoPoll._count.votes} votes · ${photoPoll.status}` : "No poll yet",
    },
    {
      label: "Instagram & YouTube copy",
      href: `${base}/copy`,
      state:
        project.copy.some((c) => c.kind === "ig_caption") &&
        project.copy.some((c) => c.kind === "yt_description")
          ? "done"
          : project.copy.length > 0
            ? "attention"
            : "todo",
      note: `${project.copy.length}/2 generated`,
    },
  ];

  return (
    <>
      <Section title="Lifecycle checklist" description="Derived from the project's data. Click any step to jump to it.">
        <ul className="divide-y divide-border">
          {steps.map((s, i) => (
            <li key={i} className="flex items-center justify-between gap-3 py-2.5">
              <Link href={s.href} className="flex items-center gap-2.5 text-sm hover:text-accent">
                <StepDot state={s.state} />
                <span className="font-medium">{s.label}</span>
              </Link>
              <span className="text-xs text-muted">{s.note}</span>
            </li>
          ))}
        </ul>
      </Section>

      <Section title="Song details">
        <form action={updateProjectBasics.bind(null, project.id)} className="grid gap-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Song title *">
              <input name="songTitle" type="text" defaultValue={project.songTitle} required />
            </Field>
            <Field label="K-pop group *">
              <input name="kpopGroup" type="text" defaultValue={project.kpopGroup} required />
            </Field>
          </div>
          <Field label="Theme / vibe" hint="Free text — feeds the poster and film-spot suggestions.">
            <input name="themeVibe" type="text" defaultValue={project.themeVibe ?? ""} />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Date window (poster)">
              <input name="dateWindowLabel" type="text" defaultValue={project.dateWindowLabel ?? ""} />
            </Field>
            <Field label="Crabfit poll URL" hint="Paste it here once you create the poll.">
              <input name="crabfitUrl" type="url" defaultValue={project.crabfitUrl ?? ""} />
            </Field>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Published YouTube URL" hint="Drives the About page gallery.">
              <input name="youtubeUrl" type="url" defaultValue={project.youtubeUrl ?? ""} />
            </Field>
            <Field label="Cover image URL">
              <input name="coverImageUrl" type="url" defaultValue={project.coverImageUrl ?? ""} />
            </Field>
          </div>
          <div>
            <SubmitButton pendingText="Saving…">Save details</SubmitButton>
          </div>
        </form>
      </Section>

      <Section title="Reference links" description="YouTube, Bilibili, dance practice videos — as many as you need.">
        {project.references.length === 0 ? (
          <EmptyState>No links yet.</EmptyState>
        ) : (
          <ul className="mb-4 divide-y divide-border">
            {project.references.map((r) => (
              <li key={r.id} className="flex items-center justify-between gap-2 py-2 text-sm">
                <a href={r.url} target="_blank" rel="noreferrer" className="min-w-0 truncate text-accent underline">
                  <Badge>{r.label}</Badge> {r.url}
                </a>
                <form action={deleteReference.bind(null, r.id, project.id)}>
                  <SubmitButton variant="danger">Remove</SubmitButton>
                </form>
              </li>
            ))}
          </ul>
        )}
        <form action={addReference.bind(null, project.id)} className="grid gap-3 sm:grid-cols-[160px_1fr_auto] sm:items-end">
          <Field label="Label">
            <input name="label" type="text" placeholder="Bilibili" />
          </Field>
          <Field label="URL">
            <input name="url" type="url" placeholder="https://…" required />
          </Field>
          <SubmitButton variant="secondary">Add link</SubmitButton>
        </form>
      </Section>

      <Section title="Danger zone">
        <form action={deleteProject.bind(null, project.id)}>
          <SubmitButton variant="danger" confirm="Delete this entire project and all its data?">
            Delete project
          </SubmitButton>
        </form>
      </Section>
    </>
  );
}

function StepDot({ state }: { state: StepState }) {
  const map: Record<StepState, string> = {
    done: "bg-[var(--good)]",
    attention: "bg-[var(--warn)]",
    todo: "bg-border",
  };
  return <span className={`inline-block h-2.5 w-2.5 rounded-full ${map[state]}`} />;
}
