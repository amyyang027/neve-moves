import Link from "next/link";
import type { ReactNode } from "react";
import { toDateInputValue } from "@/lib/dates";

// A plain month grid. No dependencies. Server component: the caller pre-computes
// what goes in each day cell and passes `renderDay`. Month navigation and the
// selected day are carried in the URL (?m=YYYY-MM, and a caller-chosen param)
// so it works without client JS.

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function ymKey(y: number, m: number) {
  return `${y}-${String(m + 1).padStart(2, "0")}`;
}

export function parseMonthParam(
  value: string | undefined,
  fallback = new Date(),
): { year: number; month: number } {
  const m = value && /^(\d{4})-(\d{2})$/.exec(value);
  if (m) return { year: Number(m[1]), month: Number(m[2]) - 1 };
  return { year: fallback.getUTCFullYear(), month: fallback.getUTCMonth() };
}

export function MonthCalendar({
  year,
  month,
  basePath,
  monthParam = "m",
  renderDay,
  selectedIso,
  selectParam,
}: {
  year: number;
  month: number; // 0-11
  basePath: string; // e.g. "/" or "/projects/abc/schedule"
  monthParam?: string;
  /** Content for a given day, keyed by yyyy-mm-dd. Return null for empty days. */
  renderDay: (iso: string) => ReactNode;
  selectedIso?: string;
  /** If set, each day links to `?<selectParam>=<iso>` (keeping the month). */
  selectParam?: string;
}) {
  const first = new Date(Date.UTC(year, month, 1));
  const startWeekday = first.getUTCDay();
  const daysInMonth = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
  const todayIso = toDateInputValue(new Date());

  const prev = month === 0 ? { y: year - 1, m: 11 } : { y: year, m: month - 1 };
  const next = month === 11 ? { y: year + 1, m: 0 } : { y: year, m: month + 1 };
  const monthLabel = new Intl.DateTimeFormat("en-US", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(first);

  const cells: (number | null)[] = [
    ...Array(startWeekday).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  while (cells.length % 7 !== 0) cells.push(null);

  const navLink = (y: number, m: number) =>
    `${basePath}?${monthParam}=${ymKey(y, m)}`;

  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <Link
          href={navLink(prev.y, prev.m)}
          className="rounded-md px-2 py-1 text-sm text-muted hover:bg-accent-soft"
        >
          ← {new Intl.DateTimeFormat("en-US", { month: "short", timeZone: "UTC" }).format(new Date(Date.UTC(prev.y, prev.m, 1)))}
        </Link>
        <h3 className="text-base text-ink">{monthLabel}</h3>
        <Link
          href={navLink(next.y, next.m)}
          className="rounded-md px-2 py-1 text-sm text-muted hover:bg-accent-soft"
        >
          {new Intl.DateTimeFormat("en-US", { month: "short", timeZone: "UTC" }).format(new Date(Date.UTC(next.y, next.m, 1)))} →
        </Link>
      </div>

      <div className="grid grid-cols-7 overflow-hidden rounded-xl border border-border">
        {WEEKDAYS.map((d) => (
          <div
            key={d}
            className="border-b border-border bg-ice-tint py-1.5 text-center text-xs font-semibold uppercase tracking-wide text-muted"
          >
            {d}
          </div>
        ))}
        {cells.map((day, i) => {
          if (day === null) {
            return <div key={i} className="min-h-20 border-b border-r border-border bg-ice-tint/40 last:border-r-0" />;
          }
          const iso = ymKey(year, month) + "-" + String(day).padStart(2, "0");
          const content = renderDay(iso);
          const isToday = iso === todayIso;
          const isSelected = iso === selectedIso;
          const inner = (
            <>
              <span
                className={`inline-flex h-5 w-5 items-center justify-center rounded-full text-xs ${
                  isToday ? "bg-accent font-semibold text-white" : "text-muted"
                }`}
              >
                {day}
              </span>
              <div className="mt-1 space-y-0.5">{content}</div>
            </>
          );
          const cls = `min-h-20 border-b border-r border-border p-1.5 text-left align-top last:border-r-0 ${
            isSelected ? "bg-accent-soft" : "bg-surface"
          } ${selectParam ? "hover:bg-accent-soft" : ""}`;
          return selectParam ? (
            <Link
              key={i}
              href={`${basePath}?${monthParam}=${ymKey(year, month)}&${selectParam}=${iso}`}
              className={`block ${cls}`}
            >
              {inner}
            </Link>
          ) : (
            <div key={i} className={cls}>
              {inner}
            </div>
          );
        })}
      </div>
    </div>
  );
}
