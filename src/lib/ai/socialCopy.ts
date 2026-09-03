import type { SocialCopyInput } from "./types";

// Instagram Reel caption + YouTube description generator for the finished video.
//
// Pulls dancer Instagram handles, the videographer credit, and the song info
// from the project. Two functions, one per platform.
//
// TODO: replace with real Claude API call — see README ("Wiring in real AI").

function creditLine(handles: string[]): string {
  const tagged = handles.filter(Boolean).map((h) => `@${h}`);
  return tagged.length ? tagged.join(" ") : "(add dancer Instagram handles in the member directory)";
}

export async function generateInstagramCaption(
  input: SocialCopyInput,
): Promise<string> {
  // --- MOCK START -----------------------------------------------------------
  const vibeTag = (input.themeVibe ?? "")
    .split(/[^a-zA-Z]+/)
    .filter(Boolean)
    .slice(0, 2)
    .join("");

  return [
    `${input.kpopGroup} – ${input.songTitle} 🎬 dance cover by Neve Moves`,
    input.themeVibe ? `we leaned all the way into the ${input.themeVibe} of it` : "",
    "",
    `dancers: ${creditLine(input.dancerHandles)}`,
    input.videographerCredit ? `filmed by ${input.videographerCredit}` : "",
    "",
    "full version on our YouTube (link in bio) 💫",
    "",
    `#nevemoves #kpop #kpopdancecover #dancecover #${input.kpopGroup.replace(/\s+/g, "").toLowerCase()} #${input.songTitle.replace(/[^a-zA-Z0-9]+/g, "").toLowerCase()}cover ${vibeTag ? "#" + vibeTag.toLowerCase() : ""} #bayarea #sfbayarea`,
  ]
    .filter((line) => line !== "")
    .join("\n");
  // --- MOCK END -------------------------------------------------------------
}

export async function generateYoutubeDescription(
  input: SocialCopyInput,
): Promise<string> {
  // --- MOCK START -----------------------------------------------------------
  const dancerList = input.dancerNames.length
    ? input.dancerNames
        .map((name, i) => `  ${name}${input.dancerHandles[i] ? ` – instagram.com/${input.dancerHandles[i]}` : ""}`)
        .join("\n")
    : "  (select dancers on the roster to list them here)";

  return [
    `Neve Moves presents our dance cover of "${input.songTitle}" by ${input.kpopGroup}.`,
    "",
    input.themeVibe
      ? `We took inspiration from the ${input.themeVibe} of the original.`
      : "",
    input.referenceUrl ? `Original: ${input.referenceUrl}` : "",
    "",
    "— DANCERS —",
    dancerList,
    "",
    input.videographerCredit ? `— FILMED BY —\n  ${input.videographerCredit}` : "",
    "",
    "— ABOUT —",
    "Neve Moves is a nonprofit K-pop dance cover group based in the SF Bay Area.",
    "Subscribe: https://www.youtube.com/@nevemove",
    "",
    "All rights to the original song belong to their respective owners. This is a",
    "non-monetized, fan-made cover created for the love of the choreography.",
    "",
    `#nevemoves #${input.kpopGroup.replace(/\s+/g, "").toLowerCase()} #kpopdancecover`,
  ]
    .filter((line) => line !== "")
    .join("\n");
  // --- MOCK END -------------------------------------------------------------
}
