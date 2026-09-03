// Always read fresh data — this is a live, mutable app, not a static site.
export const dynamic = "force-dynamic";

import { BRAND } from "@/lib/brand";
import { getYoutubeCovers } from "@/lib/youtube";
import { Hero, Section, EmptyState } from "@/components/ui";

function year(iso: string | null): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  return Number.isNaN(d.getTime())
    ? null
    : new Intl.DateTimeFormat("en-US", { month: "short", year: "numeric" }).format(d);
}

export default async function AboutPage() {
  const covers = await getYoutubeCovers();

  return (
    <>
      <Hero title="About Neve Moves">{BRAND.tagline}</Hero>

      <Section>
        <div className="space-y-3 text-sm leading-relaxed">
          <p>
            <strong>Neve Moves</strong> — <em>neve</em> is snow — is a nonprofit
            K-pop dance cover group based in the San Francisco Bay Area. We mostly
            film dance covers, and occasionally perform live when we&rsquo;re invited.
          </p>
          <p>
            Every cover is a small production: pick a song, recruit 4&ndash;8
            dancers, rehearse over about three practices, film for a day around
            the Bay, then edit and post. This app is how we run that process.
          </p>
          <p className="flex flex-wrap gap-x-4 gap-y-1">
            <a href={BRAND.youtubeUrl} target="_blank" rel="noreferrer" className="font-medium text-accent underline">
              ▶ YouTube · {BRAND.youtubeHandle}
            </a>
            <span className="text-muted">Instagram / TikTok · @{BRAND.socialHandle}</span>
          </p>
        </div>
      </Section>

      <Section
        title="Our covers"
        description={
          covers.source === "rss"
            ? "Live from the channel's public RSS feed."
            : covers.source === "cache"
              ? "From a saved copy (npm run sync:youtube to refresh)."
              : "Pulled straight from YouTube — no API key."
        }
      >
        {covers.videos.length === 0 ? (
          <EmptyState>
            Couldn&rsquo;t load videos right now.{" "}
            <a href={BRAND.youtubeUrl} target="_blank" rel="noreferrer" className="text-accent underline">
              Watch on YouTube
            </a>
            . {covers.error ? <span className="block mt-1 text-xs">{covers.error}</span> : null}
          </EmptyState>
        ) : (
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {covers.videos.map((v) => (
              <li key={v.id}>
                <a
                  href={v.url}
                  target="_blank"
                  rel="noreferrer"
                  className="group block overflow-hidden rounded-2xl border border-border bg-surface shadow-[0_1px_2px_rgba(44,53,71,0.04),0_10px_28px_-14px_rgba(44,53,71,0.12)] transition-colors hover:border-accent"
                >
                  <div className="aspect-video overflow-hidden bg-ice-tint">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={v.thumbnail}
                      alt=""
                      loading="lazy"
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                    />
                  </div>
                  <div className="p-3">
                    <div className="line-clamp-2 text-sm font-medium">{v.title}</div>
                    {year(v.published) ? (
                      <div className="mt-1 text-xs text-muted">{year(v.published)}</div>
                    ) : null}
                  </div>
                </a>
              </li>
            ))}
          </ul>
        )}
      </Section>
    </>
  );
}
