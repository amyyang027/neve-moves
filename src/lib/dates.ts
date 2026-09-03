// Date helpers.
//
// The app stores dates as real DateTime values but only ever cares about the
// calendar day (no times). We keep everything at UTC midnight and also format
// in UTC, so a date is the same calendar day everywhere — no timezone drift.

const DISPLAY_TZ = "UTC";

/** Parse a yyyy-mm-dd string (from <input type="date">) to a UTC-midnight Date. */
export function parseDateInput(value: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value.trim());
  if (!match) return null;
  const [, y, m, d] = match;
  const date = new Date(Date.UTC(Number(y), Number(m) - 1, Number(d)));
  return Number.isNaN(date.getTime()) ? null : date;
}

/** Format a Date back to yyyy-mm-dd for pre-filling <input type="date">. */
export function toDateInputValue(date: Date | null | undefined): string {
  if (!date) return "";
  return date.toISOString().slice(0, 10);
}

/** Human-friendly date, e.g. "Sat, Sep 27, 2026". */
export function formatDate(date: Date | null | undefined): string {
  if (!date) return "—";
  return new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: DISPLAY_TZ,
  }).format(date);
}

/** Shorter form, e.g. "Sep 27". */
export function formatDateShort(date: Date | null | undefined): string {
  if (!date) return "—";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    timeZone: DISPLAY_TZ,
  }).format(date);
}

/** Whole days from today (UTC midnight) to the given date. Negative = past. */
export function daysFromToday(date: Date): number {
  const now = new Date();
  const todayUtc = Date.UTC(
    now.getUTCFullYear(),
    now.getUTCMonth(),
    now.getUTCDate(),
  );
  const target = Date.UTC(
    date.getUTCFullYear(),
    date.getUTCMonth(),
    date.getUTCDate(),
  );
  return Math.round((target - todayUtc) / 86_400_000);
}

export function subtractDays(date: Date, days: number): Date {
  return new Date(date.getTime() - days * 86_400_000);
}

/** "in 3 days" / "today" / "5 days ago". */
export function relativeDay(date: Date): string {
  const diff = daysFromToday(date);
  if (diff === 0) return "today";
  if (diff === 1) return "tomorrow";
  if (diff === -1) return "yesterday";
  if (diff > 0) return `in ${diff} days`;
  return `${Math.abs(diff)} days ago`;
}

/** Inclusive check: does `day` fall within [start, end]? */
export function isWithinRange(day: Date, start: Date, end: Date): boolean {
  const d = day.getTime();
  return d >= start.getTime() && d <= end.getTime();
}

export type MemberAvailability = {
  memberId: string;
  memberName: string;
  /** null = free; otherwise the reason from the blocking range. */
  blockedReason: string | null;
};

export type DateConflictRow = {
  date: Date;
  members: MemberAvailability[];
  freeCount: number;
  blockedCount: number;
};

/**
 * Core of the "who's free on which candidate dates" view. Given the candidate
 * dates and each rostered member's blocked ranges, work out availability. The
 * app never books anything from this — it just helps you decide what to put in
 * the Crabfit poll.
 */
export function buildConflictGrid(
  candidateDates: Date[],
  members: {
    id: string;
    name: string;
    blockedDates: { startDate: Date; endDate: Date; reason: string | null }[];
  }[],
): DateConflictRow[] {
  return candidateDates
    .slice()
    .sort((a, b) => a.getTime() - b.getTime())
    .map((date) => {
      const memberAvailability: MemberAvailability[] = members.map((m) => {
        const hit = m.blockedDates.find((b) =>
          isWithinRange(date, b.startDate, b.endDate),
        );
        return {
          memberId: m.id,
          memberName: m.name,
          blockedReason: hit ? hit.reason ?? "Blocked" : null,
        };
      });
      return {
        date,
        members: memberAvailability,
        freeCount: memberAvailability.filter((m) => !m.blockedReason).length,
        blockedCount: memberAvailability.filter((m) => m.blockedReason).length,
      };
    });
}
