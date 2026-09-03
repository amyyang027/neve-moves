import { readFile } from "node:fs/promises";
import path from "node:path";
import { BRAND } from "@/lib/brand";

// Pulls the channel's real videos for the About page gallery — for free, with
// no API key, from the public RSS feed:
//   https://www.youtube.com/feeds/videos.xml?channel_id=<id>
//
// The feed can be blocked from some networks/data centres. Layered fallback:
//   1. live RSS fetch (cached 1h)
//   2. src/data/youtube-covers.json  (written by `npm run sync:youtube`)
//   3. empty — the About page shows a "visit the channel" state
//
// The YouTube Data API v3 would give more detail but needs a Google Cloud
// signup + key, so it's deliberately not used here.

export type YoutubeVideo = {
  id: string;
  title: string;
  url: string;
  published: string | null;
  thumbnail: string;
};

export type YoutubeResult = {
  videos: YoutubeVideo[];
  source: "rss" | "cache" | "none";
  error?: string;
};

/** Parse the Atom feed YouTube returns. No XML library needed. */
export function parseYoutubeFeed(xml: string): YoutubeVideo[] {
  const entries = xml.split("<entry>").slice(1);
  const videos: YoutubeVideo[] = [];
  for (const raw of entries) {
    const id = raw.match(/<yt:videoId>([^<]+)<\/yt:videoId>/)?.[1];
    if (!id) continue;
    const title = decodeXml(raw.match(/<title>([\s\S]*?)<\/title>/)?.[1] ?? "");
    const url =
      raw.match(/<link rel="alternate" href="([^"]+)"/)?.[1] ??
      `https://www.youtube.com/watch?v=${id}`;
    const published = raw.match(/<published>([^<]+)<\/published>/)?.[1] ?? null;
    const thumbnail =
      raw.match(/<media:thumbnail url="([^"]+)"/)?.[1] ??
      `https://i.ytimg.com/vi/${id}/hqdefault.jpg`;
    videos.push({ id, title, url, published, thumbnail });
  }
  return videos;
}

function decodeXml(s: string): string {
  return s
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, "&")
    .trim();
}

export async function getYoutubeCovers(limit = 12): Promise<YoutubeResult> {
  try {
    const res = await fetch(BRAND.youtubeRss, {
      headers: { "User-Agent": "Mozilla/5.0 (Neve Moves app)" },
      next: { revalidate: 3600 },
    });
    if (res.ok) {
      const videos = parseYoutubeFeed(await res.text()).slice(0, limit);
      if (videos.length) return { videos, source: "rss" };
    }
  } catch {
    /* fall through to the cached file */
  }

  try {
    const file = path.join(process.cwd(), "src", "data", "youtube-covers.json");
    const cached = JSON.parse(await readFile(file, "utf8")) as YoutubeVideo[];
    if (Array.isArray(cached) && cached.length) {
      return { videos: cached.slice(0, limit), source: "cache" };
    }
  } catch {
    /* no cache file */
  }

  return {
    videos: [],
    source: "none",
    error:
      "Couldn't reach the YouTube RSS feed and no local cache exists. Run `npm run sync:youtube` (from a normal network connection) to save a copy.",
  };
}
