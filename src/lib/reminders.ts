import { db } from "@/lib/db";
import { daysFromToday } from "@/lib/dates";

// Phase 1 "reminders" are just a computed list — the app shows you what's due.
// There is no email/push delivery yet (that needs a scheduled job + a mail or
// push service). See README → "Phase 2: making it a real shared app".

export type Reminder = {
  id: string;
  projectId: string;
  projectTitle: string;
  label: string;
  date: Date;
  daysAway: number;
  kind: "event" | "videographer";
};

/** Gather every reminder date across projects, soonest first. */
export async function getUpcomingReminders(
  withinDays = 45,
): Promise<Reminder[]> {
  const [events, videographers] = await Promise.all([
    db.projectEvent.findMany({
      where: { reminderDate: { not: null } },
      include: { project: { select: { id: true, songTitle: true } } },
    }),
    db.videographer.findMany({
      where: { reminderDate: { not: null }, status: { not: "confirmed" } },
      include: { project: { select: { id: true, songTitle: true } } },
    }),
  ]);

  const reminders: Reminder[] = [
    ...events.map((e) => ({
      id: e.id,
      projectId: e.project.id,
      projectTitle: e.project.songTitle,
      label: `${e.label} reminder`,
      date: e.reminderDate as Date,
      daysAway: daysFromToday(e.reminderDate as Date),
      kind: "event" as const,
    })),
    ...videographers.map((v) => ({
      id: v.id,
      projectId: v.project.id,
      projectTitle: v.project.songTitle,
      label: `Follow up with videographer${v.name ? ` (${v.name})` : ""}`,
      date: v.reminderDate as Date,
      daysAway: daysFromToday(v.reminderDate as Date),
      kind: "videographer" as const,
    })),
  ];

  return reminders
    .filter((r) => r.daysAway <= withinDays)
    .sort((a, b) => a.date.getTime() - b.date.getTime());
}

export type CalendarItem = {
  id: string;
  projectId: string;
  projectTitle: string;
  label: string;
  date: Date;
  kind: "practice" | "film" | "reminder" | "videographer";
  tentative: boolean;
};

/** Every time-bound thing across all projects, for the dashboard calendar. */
export async function getCalendarItems(): Promise<CalendarItem[]> {
  const [events, videographers] = await Promise.all([
    db.projectEvent.findMany({
      include: { project: { select: { id: true, songTitle: true } } },
    }),
    db.videographer.findMany({
      where: { reminderDate: { not: null }, status: { not: "confirmed" } },
      include: { project: { select: { id: true, songTitle: true } } },
    }),
  ]);

  const items: CalendarItem[] = [];

  for (const e of events) {
    const day = e.confirmedDate ?? e.targetDate;
    if (day) {
      items.push({
        id: `${e.id}-day`,
        projectId: e.project.id,
        projectTitle: e.project.songTitle,
        label: e.label,
        date: day,
        kind: e.kind === "film" ? "film" : "practice",
        tentative: !e.confirmedDate,
      });
    }
    if (e.reminderDate) {
      items.push({
        id: `${e.id}-rem`,
        projectId: e.project.id,
        projectTitle: e.project.songTitle,
        label: `${e.label} reminder`,
        date: e.reminderDate,
        kind: "reminder",
        tentative: false,
      });
    }
  }

  for (const v of videographers) {
    items.push({
      id: `${v.id}-vid`,
      projectId: v.project.id,
      projectTitle: v.project.songTitle,
      label: `Videographer follow-up${v.name ? ` (${v.name})` : ""}`,
      date: v.reminderDate as Date,
      kind: "videographer",
      tentative: false,
    });
  }

  return items.sort((a, b) => a.date.getTime() - b.date.getTime());
}
