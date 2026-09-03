// Always read fresh data — this is a live, mutable app, not a static site.
export const dynamic = "force-dynamic";

import Link from "next/link";
import { db } from "@/lib/db";
import { getUpcomingReminders, getCalendarItems } from "@/lib/reminders";
import type { CalendarItem } from "@/lib/reminders";
import { formatDate, relativeDay, toDateInputValue } from "@/lib/dates";
import { cleanName } from "@/lib/format";
import { BRAND } from "@/lib/brand";
import { MonthCalendar, parseMonthParam } from "@/components/MonthCalendar";
import { ProjectCard } from "@/components/ProjectCard";
import type { ProjectCardData } from "@/components/ProjectCard";
import { Hero, Section, Badge, EmptyState, LinkButton } from "@/components/ui";

const KIND_STYLE: Record<CalendarItem["kind"], string> = {
  practice: "bg-accent-soft text-[var(--periwinkle-strong)]",
  film: "bg-accent text-white",
  reminder: "bg-[var(--warn-soft)] text-[var(--warn)]",
  videographer: "bg-[var(--warn-soft)] text-[var(--warn)]",
};

export default async function DashboardPage({
  searchParams,
}: PageProps<"/">) {
  const sp = await searchParams;
  const view = sp.view === "calendar" ? "calendar" : "list";
  const { year, month } = parseMonthParam(
    typeof sp.m === "string" ? sp.m : undefined,
  );
  const selectedIso = typeof sp.d === "string" ? sp.d : undefined;

  const [projectRows, reminders, calItems] = await Promise.all([
    db.project.findMany({
      orderBy: { updatedAt: "desc" },
      include: {
        _count: { select: { roster: true } },
        events: { where: { kind: "film" }, select: { confirmedDate: true, targetDate: true } },
      },
    }),
    getUpcomingReminders(),
    getCalendarItems(),
  ]);

  const projects: ProjectCardData[] = projectRows.map((p) => ({
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

  const byDay = new Map<string, CalendarItem[]>();
  for (const it of calItems) {
    const key = toDateInputValue(it.date);
    const list = byDay.get(key);
    if (list) list.push(it);
    else byDay.set(key, [it]);
  }
  const selectedItems = selectedIso ? byDay.get(selectedIso) ?? [] : [];

  return (
    <>
      <Hero title="Dashboard">
        Everything in flight for Neve Moves right now. {BRAND.tagline}
      </Hero>

      <Section
        title="What's coming up"
        description="Practices, film days and reminders. Phase 1 shows them here — it does not send notifications yet."
        actions={
          <div className="flex gap-1 rounded-lg border border-border p-0.5 text-sm">
            <Link
              href="/"
              className={`rounded-md px-2.5 py-1 ${view === "list" ? "bg-accent text-white" : "text-muted"}`}
            >
              List
            </Link>
            <Link
              href="/?view=calendar"
              className={`rounded-md px-2.5 py-1 ${view === "calendar" ? "bg-accent text-white" : "text-muted"}`}
            >
              Calendar
            </Link>
          </div>
        }
      >
        {view === "list" ? (
          reminders.length === 0 ? (
            <EmptyState>Nothing due in the next 45 days.</EmptyState>
          ) : (
            <ul className="divide-y divide-border">
              {reminders.map((r) => (
                <li
                  key={`${r.kind}-${r.id}`}
                  className="flex flex-wrap items-center justify-between gap-2 py-2.5 text-sm"
                >
                  <div>
                    <Link href={`/projects/${r.projectId}`} className="font-medium hover:text-accent">
                      {cleanName(r.projectTitle)}
                    </Link>
                    <span className="text-muted"> — {r.label}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-muted">{formatDate(r.date)}</span>
                    <Badge tone={r.daysAway < 0 ? "bad" : r.daysAway <= 3 ? "warn" : "neutral"}>
                      {r.daysAway < 0 ? "overdue" : relativeDay(r.date)}
                    </Badge>
                  </div>
                </li>
              ))}
            </ul>
          )
        ) : (
          <>
            <MonthCalendar
              year={year}
              month={month}
              basePath="/"
              monthParam="m"
              selectParam="d"
              selectedIso={selectedIso}
              renderDay={(iso) => {
                const items = byDay.get(iso);
                if (!items) return null;
                return items.slice(0, 3).map((it) => (
                  <div
                    key={it.id}
                    className={`truncate rounded px-1 py-0.5 text-[10px] leading-tight ${KIND_STYLE[it.kind]}`}
                    title={`${cleanName(it.projectTitle)} — ${it.label}`}
                  >
                    {it.kind === "reminder" || it.kind === "videographer" ? "🔔 " : ""}
                    {it.label}
                  </div>
                ));
              }}
            />
            <p className="mt-2 text-xs text-muted">
              Query string carries the month (<code>?m=</code>) and selected day
              (<code>?d=</code>). Click a day for details.
            </p>
            {selectedIso ? (
              <div className="mt-4 rounded-xl border border-border bg-ice-tint p-4">
                <div className="mb-2 font-medium">
                  {formatDate(new Date(selectedIso + "T00:00:00Z"))}
                </div>
                {selectedItems.length === 0 ? (
                  <p className="text-sm text-muted">Nothing scheduled.</p>
                ) : (
                  <ul className="space-y-1.5 text-sm">
                    {selectedItems.map((it) => (
                      <li key={it.id} className="flex items-center gap-2">
                        <span className={`rounded px-1.5 py-0.5 text-xs ${KIND_STYLE[it.kind]}`}>
                          {it.kind}
                        </span>
                        <Link href={`/projects/${it.projectId}`} className="hover:text-accent">
                          {cleanName(it.projectTitle)} — {it.label}
                          {it.tentative ? <span className="text-muted"> (proposed)</span> : null}
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ) : null}
          </>
        )}
      </Section>

      <Section
        title="Active projects"
        actions={<LinkButton href="/projects/new">New project</LinkButton>}
      >
        {active.length === 0 ? (
          <EmptyState>
            No active projects.{" "}
            <Link href="/projects/new" className="text-accent underline">
              Start one
            </Link>
            .
          </EmptyState>
        ) : (
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {active.map((p) => (
              <li key={p.id}>
                <ProjectCard p={p} />
              </li>
            ))}
          </ul>
        )}
      </Section>
    </>
  );
}
