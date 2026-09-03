import Link from "next/link";
import { createProject } from "../actions";
import { SubmitButton } from "@/components/SubmitButton";
import { ROSTER_MIN, ROSTER_MAX } from "@/lib/constants";
import { PageHeader, Section, Field } from "@/components/ui";

export default function NewProjectPage() {
  return (
    <>
      <PageHeader
        breadcrumb={<Link href="/projects">← Projects</Link>}
        title="New project"
        description="Step 1: pick a song. The project starts with 3 practices + 1 film day and the preferred practice cities — all editable afterward."
      />

      <Section>
        <form action={createProject} className="grid gap-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Song title *">
              <input name="songTitle" type="text" required placeholder="Whiplash" />
            </Field>
            <Field label="K-pop group *">
              <input name="kpopGroup" type="text" required placeholder="aespa" />
            </Field>
          </div>

          <Field
            label="Theme / vibe"
            hint="Free text — describe the original MV/stage. This feeds the poster and film-spot suggestions."
          >
            <input
              name="themeVibe"
              type="text"
              placeholder="sleek monochrome high-fashion, sharp and confident"
            />
          </Field>

          <Field
            label="Date window (for the recruitment poster)"
            hint="Vague on purpose, e.g. “Late September”."
          >
            <input name="dateWindowLabel" type="text" placeholder="Late September" />
          </Field>

          <div className="grid gap-4 sm:grid-cols-[160px_1fr]">
            <Field label="First reference link">
              <input name="refLabel" type="text" placeholder="YouTube" />
            </Field>
            <Field label="URL" hint="YouTube or Bilibili. Add more later.">
              <input name="refUrl" type="url" placeholder="https://youtube.com/watch?v=…" />
            </Field>
          </div>

          <p className="text-xs text-muted">
            Recruitment target: {ROSTER_MIN}–{ROSTER_MAX} dancers.
          </p>

          <div>
            <SubmitButton pendingText="Creating…">Create project</SubmitButton>
          </div>
        </form>
      </Section>
    </>
  );
}
