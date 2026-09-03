"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function ProjectNav({ projectId }: { projectId: string }) {
  const pathname = usePathname();
  const base = `/projects/${projectId}`;
  const tabs = [
    { href: base, label: "Overview" },
    { href: `${base}/poster`, label: "Poster" },
    { href: `${base}/roster`, label: "Roster" },
    { href: `${base}/schedule`, label: "Schedule" },
    { href: `${base}/locations`, label: "Locations" },
    { href: `${base}/outfits`, label: "Outfits" },
    { href: `${base}/videographer`, label: "Videographer" },
    { href: `${base}/votes`, label: "Voting" },
    { href: `${base}/copy`, label: "Copy" },
  ];

  return (
    <nav className="mb-6 flex flex-wrap gap-1 border-b border-border">
      {tabs.map((t) => {
        const active = pathname === t.href;
        return (
          <Link
            key={t.href}
            href={t.href}
            className={`-mb-px border-b-2 px-3 py-2 text-sm font-medium transition-colors ${
              active
                ? "border-accent text-accent"
                : "border-transparent text-muted hover:text-foreground"
            }`}
          >
            {t.label}
          </Link>
        );
      })}
    </nav>
  );
}
