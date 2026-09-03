import Link from "next/link";
import { phaseLabel } from "@/lib/constants";
import { cleanName, pluralize } from "@/lib/format";
import { formatDate } from "@/lib/dates";
import { Badge, SampleDataBadge } from "./ui";

export type ProjectCardData = {
  id: string;
  songTitle: string;
  kpopGroup: string;
  themeVibe: string | null;
  phase: string;
  dateWindowLabel: string | null;
  isSample: boolean;
  posterSvg: string | null;
  rosterCount: number;
  filmDate: Date | null;
};

function posterDataUri(svg: string): string {
  return `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`;
}

export function ProjectCard({ p }: { p: ProjectCardData }) {
  return (
    <Link
      href={`/projects/${p.id}`}
      className="group block overflow-hidden rounded-2xl border border-border bg-surface shadow-[0_1px_2px_rgba(44,53,71,0.04),0_10px_28px_-14px_rgba(44,53,71,0.12)] transition-colors hover:border-accent"
    >
      <div className="relative aspect-[16/10] overflow-hidden bg-ice-tint">
        {p.posterSvg ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={posterDataUri(p.posterSvg)}
            alt=""
            className="h-full w-full object-cover object-top transition-transform duration-500 group-hover:scale-[1.03]"
          />
        ) : (
          <div className="frost-wash flex h-full w-full items-center justify-center p-4">
            <span className="text-center font-display text-xl text-ink-soft">
              {cleanName(p.songTitle)}
            </span>
          </div>
        )}
        <div className="absolute left-2 top-2 flex gap-1.5">
          <Badge tone="accent">{phaseLabel(p.phase)}</Badge>
          {p.isSample ? <SampleDataBadge /> : null}
        </div>
      </div>
      <div className="p-4">
        <div className="font-display text-lg text-ink">{cleanName(p.songTitle)}</div>
        <div className="text-sm text-muted">{p.kpopGroup}</div>
        <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted">
          <span>{pluralize(p.rosterCount, "member")}</span>
          {p.filmDate ? (
            <span>· film {formatDate(p.filmDate)}</span>
          ) : p.dateWindowLabel ? (
            <span>· {p.dateWindowLabel}</span>
          ) : null}
        </div>
      </div>
    </Link>
  );
}
