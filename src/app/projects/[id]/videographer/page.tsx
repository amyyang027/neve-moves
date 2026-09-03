import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { VIDEOGRAPHER_STATUSES, CONTACT_CHANNELS } from "@/lib/constants";
import { formatDate, toDateInputValue, relativeDay, daysFromToday } from "@/lib/dates";
import { Section, Badge, Field } from "@/components/ui";
import { SubmitButton } from "@/components/SubmitButton";
import { updateVideographer } from "./actions";

export default async function VideographerPage({ params }: PageProps<"/projects/[id]/videographer">) {
  const { id } = await params;
  const project = await db.project.findUnique({
    where: { id },
    include: { videographer: true },
  });
  if (!project) notFound();
  const v = project.videographer;

  const statusTone =
    v?.status === "confirmed" ? "good" : v?.status === "contacted" ? "warn" : "neutral";

  return (
    <Section
      title="Videographer"
      description="Contact happens off-app (Instagram / WeChat). This just tracks where things stand and reminds you to follow up. No messaging integration."
      actions={
        <Badge tone={statusTone}>
          {VIDEOGRAPHER_STATUSES.find((s) => s.value === v?.status)?.label ?? "Not contacted"}
        </Badge>
      }
    >
      {v?.reminderDate ? (
        <p className="mb-4 rounded-lg border border-[var(--warn-soft)] bg-[var(--warn-soft)] px-3 py-2 text-sm text-[var(--warn)]">
          Follow-up reminder: {formatDate(v.reminderDate)} ({relativeDay(v.reminderDate)})
          {daysFromToday(v.reminderDate) < 0 && v.status !== "confirmed" ? " — overdue" : ""}
        </p>
      ) : null}

      <form action={updateVideographer.bind(null, project.id)} className="grid gap-4 sm:grid-cols-2">
        <Field label="Name">
          <input name="name" type="text" defaultValue={v?.name ?? ""} placeholder="Who are we asking?" />
        </Field>
        <Field label="Status">
          <select name="status" defaultValue={v?.status ?? "not_contacted"}>
            {VIDEOGRAPHER_STATUSES.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Contact via">
          <select name="contactVia" defaultValue={v?.contactVia ?? ""}>
            <option value="">—</option>
            {CONTACT_CHANNELS.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Handle / ID">
          <input name="contactHandle" type="text" defaultValue={v?.contactHandle ?? ""} />
        </Field>
        <Field label="Follow-up reminder date">
          <input name="reminderDate" type="date" defaultValue={toDateInputValue(v?.reminderDate)} />
        </Field>
        <div className="sm:col-span-2">
          <Field label="Notes">
            <textarea name="notes" rows={3} defaultValue={v?.notes ?? ""} placeholder="Rate, gear, tentative yes, needs final date…" />
          </Field>
        </div>
        <div className="sm:col-span-2">
          <SubmitButton pendingText="Saving…">Save</SubmitButton>
        </div>
      </form>
    </Section>
  );
}
