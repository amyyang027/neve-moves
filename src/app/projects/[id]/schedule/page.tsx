import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { PREFERRED_PRACTICE_CITIES } from "@/lib/constants";
import { cleanName } from "@/lib/format";
import {
  formatDate,
  toDateInputValue,
  buildConflictGrid,
} from "@/lib/dates";
import { MonthCalendar, parseMonthParam } from "@/components/MonthCalendar";
import { Section, Badge, EmptyState, Field } from "@/components/ui";
import { SubmitButton } from "@/components/SubmitButton";
import {
  addEvent,
  updateEvent,
  deleteEvent,
  setCrabfitUrl,
  addCandidateDate,
  deleteCandidateDate,
} from "./actions";

export default async function SchedulePage({
  params,
  searchParams,
}: PageProps<"/projects/[id]/schedule">) {
  const { id } = await params;
  const sp = await searchParams;
  const project = await db.project.findUnique({
    where: { id },
    include: {
      events: { orderBy: { orderIndex: "asc" } },
      candidateDates: { orderBy: { date: "asc" } },
      roster: {
        where: { isDancer: true },
        include: {
          member: { include: { blockedDates: true } },
        },
      },
    },
  });
  if (!project) notFound();

  const grid = buildConflictGrid(
    project.candidateDates.map((c) => c.date),
    project.roster.map((r) => ({
      id: r.member.id,
      name: cleanName(r.member.name),
      blockedDates: r.member.blockedDates,
    })),
  );

  const candByIso = new Map(
    project.candidateDates.map((c) => [toDateInputValue(c.date), c]),
  );
  const gridByIso = new Map(grid.map((row) => [toDateInputValue(row.date), row]));
  const maxFree = grid.length ? Math.max(...grid.map((g) => g.freeCount)) : 0;
  const bestDates = grid.filter((g) => g.freeCount === maxFree).map((g) => g.date);

  // Calendar defaults to the month of the first candidate date.
  const anchor = project.candidateDates[0]?.date ?? new Date();
  const { year: calYear, month: calMonth } = parseMonthParam(
    typeof sp.cm === "string" ? sp.cm : undefined,
    anchor,
  );

  return (
    <>
      <Section
        title="Practices & film day"
        description="Starts as 3 practices + 1 film day — add, remove or rename freely. A reminder date auto-fills a few days before (2 for practices, 3 for film) if you leave it blank."
      >
        <div className="space-y-4">
          {project.events.map((e) => (
            <form
              key={e.id}
              action={updateEvent.bind(null, e.id, project.id)}
              className="rounded-xl border border-border p-4"
            >
              <div className="mb-3 flex items-center gap-2">
                <Badge tone={e.kind === "film" ? "accent" : "neutral"}>{e.kind}</Badge>
                <input name="label" type="text" defaultValue={e.label} className="flex-1 font-semibold" />
              </div>
              <div className="grid gap-3 sm:grid-cols-3">
                <Field label="Target date" hint="what you're leaning toward">
                  <input name="targetDate" type="date" defaultValue={toDateInputValue(e.targetDate)} />
                </Field>
                <Field label="Confirmed date" hint="after Crabfit">
                  <input name="confirmedDate" type="date" defaultValue={toDateInputValue(e.confirmedDate)} />
                </Field>
                <Field label="Reminder date" hint="blank = auto">
                  <input name="reminderDate" type="date" defaultValue={toDateInputValue(e.reminderDate)} />
                </Field>
                <Field label="Location city">
                  <input name="locationCity" type="text" defaultValue={e.locationCity ?? ""} list="preferred-cities" />
                </Field>
                <div className="sm:col-span-2">
                  <Field label="Location note">
                    <input name="locationNote" type="text" defaultValue={e.locationNote ?? ""} placeholder="call time, address, parking…" />
                  </Field>
                </div>
              </div>
              <div className="mt-3 flex gap-2">
                <SubmitButton variant="secondary" pendingText="Saving…">Save</SubmitButton>
                <button
                  formAction={deleteEvent.bind(null, e.id, project.id)}
                  className="text-sm font-semibold text-[var(--bad)] hover:underline"
                >
                  Delete
                </button>
              </div>
            </form>
          ))}
          {project.events.length === 0 ? <EmptyState>No events.</EmptyState> : null}
        </div>

        <datalist id="preferred-cities">
          {PREFERRED_PRACTICE_CITIES.map((c) => (
            <option key={c} value={c} />
          ))}
        </datalist>

        <form action={addEvent.bind(null, project.id)} className="mt-4 flex flex-wrap items-end gap-2 border-t border-border pt-4">
          <div className="w-32">
            <Field label="Add event">
              <select name="kind" defaultValue="practice">
                <option value="practice">Practice</option>
                <option value="film">Film day</option>
              </select>
            </Field>
          </div>
          <div className="w-48">
            <Field label="Label">
              <input name="label" type="text" placeholder="Practice 4" />
            </Field>
          </div>
          <SubmitButton variant="secondary">Add</SubmitButton>
        </form>
      </Section>

      <Section
        title="Crabfit poll"
        description="Scheduling stays on Crabfit. Use the conflict grid below to decide what dates to put in the poll, then paste the link and log the chosen dates on the events above."
      >
        <form action={setCrabfitUrl.bind(null, project.id)} className="flex flex-wrap items-end gap-2">
          <div className="min-w-64 flex-1">
            <Field label="Crabfit URL">
              <input name="crabfitUrl" type="url" defaultValue={project.crabfitUrl ?? ""} placeholder="https://crabfit.app/…" />
            </Field>
          </div>
          <SubmitButton variant="secondary">Save</SubmitButton>
          {project.crabfitUrl ? (
            <a href={project.crabfitUrl} target="_blank" rel="noreferrer" className="text-sm text-accent underline">
              Open poll ↗
            </a>
          ) : null}
        </form>
      </Section>

      <Section
        title="Candidate dates & conflicts"
        description="Dates you're considering, shaded against each dancer's blocked ranges. The best date(s) — where the most dancers are free — are highlighted. The app never books anything; it just helps you decide what to put in the Crabfit poll."
      >
        <form action={addCandidateDate.bind(null, project.id)} className="mb-4 flex flex-wrap items-end gap-2">
          <Field label="Add candidate date">
            <input name="date" type="date" required />
          </Field>
          <div className="w-48">
            <Field label="Note">
              <input name="note" type="text" placeholder="Sat / film option" />
            </Field>
          </div>
          <SubmitButton variant="secondary">Add</SubmitButton>
        </form>

        {project.roster.length === 0 ? (
          <EmptyState>Add dancers to the roster to see conflicts.</EmptyState>
        ) : grid.length === 0 ? (
          <EmptyState>No candidate dates yet — add one above.</EmptyState>
        ) : (
          <>
            {bestDates.length > 0 ? (
              <p className="mb-3 text-sm">
                <span className="font-medium text-[var(--good)]">Best so far:</span>{" "}
                {bestDates.map((d) => formatDate(d)).join(", ")} —{" "}
                {maxFree}/{project.roster.length} dancers free.
              </p>
            ) : null}

            <MonthCalendar
              year={calYear}
              month={calMonth}
              basePath={`/projects/${project.id}/schedule`}
              monthParam="cm"
              renderDay={(iso) => {
                const row = gridByIso.get(iso);
                if (!row) return null;
                const cand = candByIso.get(iso)!;
                const isBest = row.freeCount === maxFree;
                return (
                  <div
                    className={`rounded-md border p-1 ${
                      isBest
                        ? "border-[var(--good)] bg-[var(--good-soft)]"
                        : "border-border bg-ice-tint"
                    }`}
                  >
                    <div className="flex flex-wrap gap-0.5">
                      {row.members.map((m) => (
                        <span
                          key={m.memberId}
                          title={`${m.memberName}${m.blockedReason ? ` — ${m.blockedReason}` : " — free"}`}
                          className={`inline-block h-2 w-2 rounded-full ${
                            m.blockedReason ? "bg-[var(--bad)]" : "bg-[var(--good)]"
                          }`}
                        />
                      ))}
                    </div>
                    <div className="mt-0.5 text-[10px] leading-tight text-muted">
                      {row.freeCount}/{row.members.length} free
                    </div>
                  </div>
                );
              }}
            />

            <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted">
              <span><span className="mr-1 inline-block h-2 w-2 rounded-full bg-[var(--good)] align-middle" />free</span>
              <span><span className="mr-1 inline-block h-2 w-2 rounded-full bg-[var(--bad)] align-middle" />blocked (hover a dot for who / why)</span>
              <span><span className="mr-1 inline-block h-3 w-3 rounded border border-[var(--good)] bg-[var(--good-soft)] align-middle" />best date</span>
            </div>

            <ul className="mt-4 divide-y divide-border text-sm">
              {grid.map((row) => {
                const cand = candByIso.get(toDateInputValue(row.date))!;
                return (
                  <li key={cand.id} className="flex items-center justify-between gap-2 py-2">
                    <span>
                      <span className="font-medium">{formatDate(row.date)}</span>
                      {cand.note ? <span className="text-muted"> · {cand.note}</span> : null}
                      {row.freeCount === maxFree ? <Badge tone="good">best</Badge> : null}
                    </span>
                    <span className="flex items-center gap-2">
                      <Badge tone={row.blockedCount === 0 ? "good" : row.blockedCount <= 1 ? "warn" : "bad"}>
                        {row.freeCount}/{row.members.length}
                      </Badge>
                      <form action={deleteCandidateDate.bind(null, cand.id, project.id)}>
                        <button className="text-xs text-muted hover:text-[var(--bad)]" title="Remove date">
                          ✕
                        </button>
                      </form>
                    </span>
                  </li>
                );
              })}
            </ul>
          </>
        )}
      </Section>
    </>
  );
}
