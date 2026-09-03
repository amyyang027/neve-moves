// Saves the channel's recent videos to src/data/youtube-covers.json so the
// About page gallery has content even when the live RSS feed is unreachable
// (some networks / data centres block it). Run this from a normal connection:
//
//   npm run sync:youtube
//
// Tries the RSS feed first, then falls back to scraping the channel's /videos
// page. No API key, no cost.

import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { parseYoutubeFeed, type YoutubeVideo } from "../src/lib/youtube";
import { BRAND } from "../src/lib/brand";

const UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0 Safari/537.36";

async function fromRss(): Promise<YoutubeVideo[]> {
  const res = await fetch(BRAND.youtubeRss, { headers: { "User-Agent": UA } });
  if (!res.ok) throw new Error(`RSS ${res.status}`);
  return parseYoutubeFeed(await res.text());
}

async function fromPage(): Promise<YoutubeVideo[]> {
  const res = await fetch(`${BRAND.youtubeUrl}/videos`, {
    headers: { "User-Agent": UA },
  });
  if (!res.ok) throw new Error(`page ${res.status}`);
  const html = await res.text();

  // Grab the ytInitialData JSON blob with brace matching.
  const start = html.indexOf("ytInitialData");
  const braceStart = html.indexOf("{", start);
  let depth = 0;
  let end = braceStart;
  for (let i = braceStart; i < html.length; i++) {
    const c = html[i];
    if (c === "{") depth++;
    else if (c === "}") {
      depth--;
      if (depth === 0) {
        end = i + 1;
        break;
      }
    }
  }
  const data = JSON.parse(html.slice(braceStart, end));

  const videos: YoutubeVideo[] = [];
  const seen = new Set<string>();
  const walk = (node: unknown) => {
    if (!node || typeof node !== "object") return;
    const obj = node as Record<string, unknown>;
    const vm = (obj.lockupViewModel ?? obj.videoRenderer ?? obj.gridVideoRenderer) as
      | Record<string, unknown>
      | undefined;
    if (vm) {
      const id =
        (vm.contentId as string) ??
        (vm.videoId as string) ??
        undefined;
      const title = findText(vm);
      if (id && title && !seen.has(id)) {
        seen.add(id);
        videos.push({
          id,
          title,
          url: `https://www.youtube.com/watch?v=${id}`,
          published: null,
          thumbnail: `https://i.ytimg.com/vi/${id}/hqdefault.jpg`,
        });
      }
    }
    for (const v of Object.values(obj)) walk(v);
  };
  walk(data);
  return videos;
}

function findText(vm: Record<string, unknown>): string | null {
  const md = vm.metadata as Record<string, unknown> | undefined;
  const lvm = md?.lockupMetadataViewModel as Record<string, unknown> | undefined;
  if (typeof lvm?.title === "object" && lvm.title) {
    const t = (lvm.title as Record<string, unknown>).content;
    if (typeof t === "string") return t;
  }
  const title = vm.title as Record<string, unknown> | undefined;
  if (title?.simpleText) return String(title.simpleText);
  const runs = title?.runs as { text: string }[] | undefined;
  if (runs?.[0]?.text) return runs[0].text;
  return null;
}

async function main() {
  let videos: YoutubeVideo[] = [];
  const notes: string[] = [];
  try {
    videos = await fromRss();
    notes.push(`RSS feed → ${videos.length} videos`);
  } catch (e) {
    notes.push(`RSS failed (${(e as Error).message}), trying page scrape…`);
    try {
      videos = await fromPage();
      notes.push(`page scrape → ${videos.length} videos`);
    } catch (e2) {
      notes.push(`page scrape failed (${(e2 as Error).message})`);
    }
  }

  notes.forEach((n) => console.log(n));
  if (!videos.length) {
    console.error("Got no videos. Nothing written.");
    process.exit(1);
  }

  const dir = path.join(process.cwd(), "src", "data");
  await mkdir(dir, { recursive: true });
  await writeFile(
    path.join(dir, "youtube-covers.json"),
    JSON.stringify(videos.slice(0, 24), null, 2) + "\n",
  );
  console.log(`Wrote src/data/youtube-covers.json (${videos.length} videos).`);
}

main();
