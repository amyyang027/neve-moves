import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { formatDate } from "@/lib/dates";
import { Section, Badge, EmptyState, Field, MockAiNote } from "@/components/ui";
import { SubmitButton } from "@/components/SubmitButton";
import { CopyButton } from "@/components/CopyButton";
import {
  generateOutfit,
  addOutfit,
  selectOutfit,
  deleteOutfit,
  setOutfitReferenceImage,
} from "./actions";

/** A URL that points at the MV/reference source, if the description carries one. */
function refLink(description: string): string | null {
  return description.match(/https?:\/\/\S+/)?.[0] ?? null;
}

export default async function OutfitsPage({ params }: PageProps<"/projects/[id]/outfits">) {
  const { id } = await params;
  const project = await db.project.findUnique({
    where: { id },
    include: { outfitSuggestions: { orderBy: { createdAt: "desc" } } },
  });
  if (!project) notFound();

  return (
    <>
      <Section
        title="Outfits"
        description="A shoppable description based on the original MV / stage look, next to a real reference photo. Real-time image search isn't feasible for a free prototype — for new projects you paste a reference image URL yourself (see note)."
        actions={
          <form action={generateOutfit.bind(null, project.id)}>
            <SubmitButton pendingText="Thinking…">Suggest an outfit</SubmitButton>
          </form>
        }
      >
        {project.outfitSuggestions.length === 0 ? (
          <EmptyState>No outfit ideas yet.</EmptyState>
        ) : (
          <ul className="space-y-3">
            {project.outfitSuggestions.map((o) => (
              <li
                key={o.id}
                className={`rounded-xl border p-4 ${
                  o.selected ? "border-accent bg-accent-soft" : "border-border"
                }`}
              >
                <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Badge tone={o.source === "ai" ? "neutral" : "accent"}>{o.source}</Badge>
                    {o.selected ? <Badge tone="good">chosen</Badge> : null}
                    <span className="text-xs text-muted">{formatDate(o.createdAt)}</span>
                  </div>
                  <div className="flex gap-2">
                    <CopyButton text={o.description} label="Copy" />
                    {!o.selected ? (
                      <form action={selectOutfit.bind(null, o.id, project.id)}>
                        <SubmitButton variant="secondary">Choose this</SubmitButton>
                      </form>
                    ) : null}
                    <form action={deleteOutfit.bind(null, o.id, project.id)}>
                      <SubmitButton variant="danger">Delete</SubmitButton>
                    </form>
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-[220px_1fr]">
                  <div>
                    {o.referenceImageUrl ? (
                      <a
                        href={refLink(o.description) ?? o.referenceImageUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="block overflow-hidden rounded-lg border border-border"
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={o.referenceImageUrl}
                          alt="Outfit reference"
                          className="aspect-[4/3] w-full object-cover"
                        />
                        <span className="block bg-ice-tint px-2 py-1 text-[11px] text-muted">
                          Reference photo ↗
                        </span>
                      </a>
                    ) : (
                      <form
                        action={setOutfitReferenceImage.bind(null, o.id, project.id)}
                        className="rounded-lg border border-dashed border-border p-2"
                      >
                        <label className="mb-1 block text-[11px]">Reference image URL</label>
                        <input name="referenceImageUrl" type="url" placeholder="https://…" className="text-xs" />
                        <div className="mt-1.5">
                          <SubmitButton variant="secondary">Attach</SubmitButton>
                        </div>
                      </form>
                    )}
                  </div>
                  <p className="whitespace-pre-wrap text-sm">{o.description}</p>
                </div>
              </li>
            ))}
          </ul>
        )}
        <MockAiNote what="The outfit description" />
        <p className="mt-1 text-xs text-muted">
          The example project&rsquo;s reference photo is the official aespa
          &ldquo;Whiplash&rdquo; MV thumbnail (SMTOWN). For your own projects, a
          live web image search would need a paid API — instead, paste a
          reference image URL on each outfit idea.
        </p>
      </Section>

      <Section title="Add your own">
        <form action={addOutfit.bind(null, project.id)} className="grid gap-3">
          <Field label="Outfit description">
            <textarea name="description" rows={4} placeholder="All black, silver accents, matching boots…" />
          </Field>
          <Field label="Reference image URL" hint="Optional — a real photo of the look to shop toward.">
            <input name="referenceImageUrl" type="url" placeholder="https://…" />
          </Field>
          <div>
            <SubmitButton variant="secondary">Add outfit idea</SubmitButton>
          </div>
        </form>
      </Section>
    </>
  );
}
