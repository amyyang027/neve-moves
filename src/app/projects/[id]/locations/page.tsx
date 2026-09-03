import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { Section, Badge, EmptyState, Field, MockAiNote } from "@/components/ui";
import { SubmitButton } from "@/components/SubmitButton";
import {
  toggleLocation,
  addLocation,
  deleteLocation,
  generateFilmSpots,
  useFilmSpot,
} from "./actions";

export default async function LocationsPage({ params }: PageProps<"/projects/[id]/locations">) {
  const { id } = await params;
  const project = await db.project.findUnique({
    where: { id },
    include: {
      locations: { orderBy: [{ source: "asc" }, { city: "asc" }] },
      filmSpotSuggestions: { orderBy: { createdAt: "asc" } },
    },
  });
  if (!project) notFound();

  const practice = project.locations.filter((l) => l.kind === "practice");
  const film = project.locations.filter((l) => l.kind === "film");

  return (
    <>
      <Section
        title="Practice locations"
        description="Bay Area cities you'd practice in. Tap to select the ones in play for this project. Edit the list freely."
      >
        <ul className="mb-4 flex flex-wrap gap-2">
          {practice.map((l) => (
            <li key={l.id} className="flex items-center gap-1">
              <form action={toggleLocation.bind(null, l.id, project.id)}>
                <button
                  className={`rounded-full border px-3 py-1 text-sm font-medium transition-colors ${
                    l.selected
                      ? "border-accent bg-accent-soft text-accent"
                      : "border-border bg-surface text-muted hover:border-accent"
                  }`}
                  title={l.note ?? undefined}
                >
                  {l.selected ? "✓ " : ""}
                  {l.city}
                </button>
              </form>
              {l.source === "manual" ? (
                <form action={deleteLocation.bind(null, l.id, project.id)}>
                  <button className="text-xs text-muted hover:text-[var(--bad)]" title="Delete">
                    ✕
                  </button>
                </form>
              ) : null}
            </li>
          ))}
          {practice.length === 0 ? <EmptyState>No cities.</EmptyState> : null}
        </ul>

        <form action={addLocation.bind(null, project.id)} className="flex flex-wrap items-end gap-2">
          <input type="hidden" name="kind" value="practice" />
          <div className="w-48">
            <Field label="Add a city">
              <input name="city" type="text" placeholder="Hayward" required />
            </Field>
          </div>
          <div className="w-56">
            <Field label="Note">
              <input name="note" type="text" placeholder="free, covered, near BART" />
            </Field>
          </div>
          <SubmitButton variant="secondary">Add</SubmitButton>
        </form>
      </Section>

      <Section
        title="Film location suggestions"
        description="Based on the song's theme plus well-known Bay Area filming spots. Pick one, or add your own below."
        actions={
          <form action={generateFilmSpots.bind(null, project.id)}>
            <SubmitButton pendingText="Thinking…">
              {project.filmSpotSuggestions.length ? "Regenerate" : "Suggest"} spots
            </SubmitButton>
          </form>
        }
      >
        {project.filmSpotSuggestions.length === 0 ? (
          <EmptyState>No suggestions yet.</EmptyState>
        ) : (
          <ul className="space-y-2">
            {project.filmSpotSuggestions.map((s) => (
              <li key={s.id} className="rounded-xl border border-border p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="font-semibold">{s.name}</span>
                  {s.selected ? (
                    <Badge tone="good">picked</Badge>
                  ) : (
                    <form action={useFilmSpot.bind(null, s.id, project.id)}>
                      <SubmitButton variant="secondary">Use this spot</SubmitButton>
                    </form>
                  )}
                </div>
                <p className="mt-1 text-sm text-muted">{s.description}</p>
                {s.whyItFits ? (
                  <p className="mt-1 text-xs text-accent">Why it fits: {s.whyItFits}</p>
                ) : null}
              </li>
            ))}
          </ul>
        )}
        <MockAiNote what="The film-spot list" />
      </Section>

      <Section title="Chosen film locations">
        {film.length === 0 ? (
          <EmptyState>None yet — pick a suggestion above or add one.</EmptyState>
        ) : (
          <ul className="mb-4 divide-y divide-border">
            {film.map((l) => (
              <li key={l.id} className="flex items-center justify-between gap-2 py-2 text-sm">
                <div>
                  <span className="font-medium">{l.name ?? l.city}</span>
                  <span className="text-muted"> — {l.city}</span>
                  {l.note ? <div className="text-xs text-muted">{l.note}</div> : null}
                </div>
                <div className="flex items-center gap-2">
                  <form action={toggleLocation.bind(null, l.id, project.id)}>
                    <SubmitButton variant={l.selected ? "secondary" : "primary"}>
                      {l.selected ? "Selected ✓" : "Select"}
                    </SubmitButton>
                  </form>
                  <form action={deleteLocation.bind(null, l.id, project.id)}>
                    <SubmitButton variant="danger">Remove</SubmitButton>
                  </form>
                </div>
              </li>
            ))}
          </ul>
        )}

        <form action={addLocation.bind(null, project.id)} className="grid gap-3 sm:grid-cols-4 sm:items-end">
          <input type="hidden" name="kind" value="film" />
          <Field label="Spot name">
            <input name="name" type="text" placeholder="Baker Beach" />
          </Field>
          <Field label="City">
            <input name="city" type="text" placeholder="San Francisco" required />
          </Field>
          <Field label="Note">
            <input name="note" type="text" placeholder="permit? parking?" />
          </Field>
          <SubmitButton variant="secondary">Add film spot</SubmitButton>
        </form>
      </Section>
    </>
  );
}
