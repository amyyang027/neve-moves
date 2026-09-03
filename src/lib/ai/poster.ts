import type { PosterInput } from "./types";
import { MARCELLUS_WOFF2_BASE64 } from "./posterFont";

// Recruitment poster generator.
//
// This one is NOT a throwaway mock: it renders a real, usable SVG poster from a
// template — on the Neve Moves frost palette, in the brand's Marcellus display
// serif (embedded so the downloaded file is self-contained), with a background
// treated to the song's theme. `variant` cycles a few compositions.
//
// Free image *generation* (a themed illustration/photo background) isn't possible
// without a paid API, so that remains a hook.
//
// TODO: replace with real Claude API call — see README ("Wiring in real AI").
//   Good first upgrade: ask Claude for a 3-5 word tagline + which palette key
//   fits `themeVibe`, then pass them to `renderPosterSvg`.

export const POSTER_VARIANT_COUNT = 4;

type Palette = {
  bg1: string;
  bg2: string;
  panel: string;
  ink: string;
  sub: string;
  accent: string;
  spark: string;
};

// Default is the brand frost palette. Others are nudged by theme keywords.
const FROST: Palette = {
  bg1: "#f4f6fb", bg2: "#dfe4f2", panel: "#ffffff", ink: "#2c3547",
  sub: "#63708a", accent: "#6d81ac", spark: "#aab4c9",
};

const PALETTES: { match: string[]; palette: Palette }[] = [
  {
    match: ["neon", "night", "cyber", "future", "electric", "city"],
    palette: { bg1: "#101827", bg2: "#1e2b45", panel: "#182238", ink: "#eef2fb", sub: "#9fb0d0", accent: "#7dd3c8", spark: "#5b6b8c" },
  },
  {
    match: ["mono", "monochrome", "black", "high-fashion", "fashion", "editorial", "sleek", "sharp"],
    palette: { bg1: "#e9ebf0", bg2: "#c9cdd8", panel: "#ffffff", ink: "#20242e", sub: "#5b606c", accent: "#3b4250", spark: "#9aa0ad" },
  },
  {
    match: ["pastel", "soft", "dream", "cute", "pink", "spring", "y2k"],
    palette: { bg1: "#fbf1f7", bg2: "#f2dcec", panel: "#ffffff", ink: "#42283a", sub: "#8a6a80", accent: "#d98cb5", spark: "#e9c3dc" },
  },
  {
    match: ["retro", "vintage", "disco", "funk", "warm", "gold", "autumn"],
    palette: { bg1: "#2a1f33", bg2: "#3d2b4a", panel: "#33243f", ink: "#fbf1dd", sub: "#c9b28f", accent: "#e0a86b", spark: "#7a5f88" },
  },
  {
    match: ["dark", "moody", "gothic", "fierce", "intense", "raw"],
    palette: { bg1: "#0c0c10", bg2: "#1a1a22", panel: "#16161d", ink: "#f4f4f6", sub: "#a7a7b2", accent: "#c76b7d", spark: "#4a4a55" },
  },
];

function pickPalette(themeVibe: string | null): Palette {
  if (!themeVibe) return FROST;
  const t = themeVibe.toLowerCase();
  return PALETTES.find((p) => p.match.some((m) => t.includes(m)))?.palette ?? FROST;
}

function esc(s: string): string {
  return s.replace(/[<>&'"]/g, (c) =>
    ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", "'": "&apos;", '"': "&quot;" })[c]!,
  );
}

/** A stylised snowflake / sparkle at (x,y). */
function flake(x: number, y: number, r: number, color: string, opacity = 1): string {
  const arms = [0, 60, 120].map((deg) => {
    const rad = (deg * Math.PI) / 180;
    const dx = Math.cos(rad) * r;
    const dy = Math.sin(rad) * r;
    return `<line x1="${x - dx}" y1="${y - dy}" x2="${x + dx}" y2="${y + dy}" />`;
  }).join("");
  return `<g stroke="${color}" stroke-width="${Math.max(1, r / 10)}" stroke-linecap="round" opacity="${opacity}">${arms}</g>`;
}

function sparkles(seed: number, color: string, count = 14): string {
  let out = "";
  let s = seed * 9301 + 49297;
  const rnd = () => ((s = (s * 9301 + 49297) % 233280) / 233280);
  for (let i = 0; i < count; i++) {
    const x = 60 + rnd() * 680;
    const y = 60 + rnd() * 880;
    const r = 1 + rnd() * 2.5;
    out += `<circle cx="${x}" cy="${y}" r="${r}" fill="${color}" opacity="${0.3 + rnd() * 0.5}" />`;
  }
  return out;
}

function background(p: Palette, variant: number, seed: number): string {
  const common = `
    <defs>
      <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="${p.bg1}"/>
        <stop offset="1" stop-color="${p.bg2}"/>
      </linearGradient>
      <radialGradient id="glow" cx="50%" cy="38%" r="60%">
        <stop offset="0" stop-color="${p.panel}" stop-opacity="0.55"/>
        <stop offset="1" stop-color="${p.panel}" stop-opacity="0"/>
      </radialGradient>
    </defs>
    <rect width="800" height="1000" fill="url(#bg)"/>
    <rect width="800" height="1000" fill="url(#glow)"/>`;

  const orbital = `<ellipse cx="400" cy="330" rx="330" ry="70" fill="none" stroke="${p.accent}" stroke-width="1.5" opacity="0.5" transform="rotate(-12 400 330)"/>`;
  const bigFlakes =
    flake(120, 140, 46, p.spark, 0.5) +
    flake(690, 210, 34, p.spark, 0.45) +
    flake(140, 830, 40, p.spark, 0.4) +
    flake(670, 880, 28, p.spark, 0.4);

  switch (variant % 4) {
    case 1: // left band
      return common +
        `<rect x="0" y="0" width="14" height="1000" fill="${p.accent}"/>` +
        sparkles(seed, p.spark, 10) + flake(700, 150, 40, p.spark, 0.45) + flake(660, 870, 30, p.spark, 0.4);
    case 2: // framed with orbital
      return common +
        `<rect x="34" y="34" width="732" height="932" fill="none" stroke="${p.accent}" stroke-width="2" opacity="0.6"/>` +
        orbital + sparkles(seed, p.spark, 16);
    case 3: // heavy frost corners
      return common + bigFlakes +
        flake(80, 500, 24, p.spark, 0.35) + flake(720, 520, 22, p.spark, 0.35) +
        sparkles(seed, p.spark, 20);
    default: // 0 — clean, orbital + light sparkle
      return common + orbital + sparkles(seed, p.spark, 12) +
        flake(110, 160, 34, p.spark, 0.4) + flake(690, 860, 30, p.spark, 0.4);
  }
}

/** Pure renderer — swap the tagline for an AI-generated one and this still works. */
export function renderPosterSvg(input: PosterInput, tagline: string): string {
  const variant = ((input.variant ?? 0) % POSTER_VARIANT_COUNT + POSTER_VARIANT_COUNT) % POSTER_VARIANT_COUNT;
  const p = pickPalette(input.themeVibe);
  const seed = (input.songTitle + input.kpopGroup).length + variant * 7;
  const window = input.dateWindowLabel?.trim() || "Dates TBA";
  const title = esc(input.songTitle.toUpperCase());
  const group = esc(input.kpopGroup.toUpperCase());
  const vibe = esc(input.themeVibe?.trim() ?? "");
  const titleSize = title.length > 15 ? 62 : title.length > 10 ? 78 : 92;

  // left-aligned for variant 1, centred otherwise
  const leftAlign = variant === 1;
  const ax = leftAlign ? 70 : 400;
  const anchor = leftAlign ? "start" : "middle";

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 1000">
  <style>
    @font-face { font-family: 'NeveDisplay'; src: url(data:font/woff2;base64,${MARCELLUS_WOFF2_BASE64}) format('woff2'); }
    .d { font-family: 'NeveDisplay', Georgia, serif; }
    .s { font-family: 'Inter', 'Helvetica Neue', Arial, sans-serif; }
  </style>
  ${background(p, variant, seed)}

  <text x="${ax}" y="120" text-anchor="${anchor}" class="d" fill="${p.ink}" font-size="30" letter-spacing="12">NEVE MOVES</text>
  <text x="${ax}" y="150" text-anchor="${anchor}" class="s" fill="${p.sub}" font-size="13" letter-spacing="4">K-POP DANCE COVER · CASTING CALL</text>

  <text x="${ax}" y="330" text-anchor="${anchor}" class="d" fill="${p.ink}" font-size="${titleSize}">${title}</text>
  <text x="${ax}" y="378" text-anchor="${anchor}" class="s" fill="${p.accent}" font-size="26" letter-spacing="6">${group}</text>

  <text x="${ax}" y="470" text-anchor="${anchor}" class="d" fill="${p.ink}" font-size="24" opacity="0.9">${esc(tagline)}</text>
  ${vibe ? `<text x="${ax}" y="502" text-anchor="${anchor}" class="s" fill="${p.sub}" font-size="14" font-style="italic">vibe — ${vibe}</text>` : ""}

  <g transform="translate(${leftAlign ? 70 : 200}, 600)">
    <rect width="${leftAlign ? 520 : 400}" height="180" rx="16" fill="${p.panel}" opacity="0.85"/>
    <text x="${leftAlign ? 40 : 200}" y="58" text-anchor="${leftAlign ? "start" : "middle"}" class="s" fill="${p.sub}" font-size="18">Looking for</text>
    <text x="${leftAlign ? 40 : 200}" y="112" text-anchor="${leftAlign ? "start" : "middle"}" class="d" fill="${p.accent}" font-size="46">${input.rosterMin}–${input.rosterMax} dancers</text>
    <text x="${leftAlign ? 40 : 200}" y="150" text-anchor="${leftAlign ? "start" : "middle"}" class="s" fill="${p.ink}" font-size="18">Filming: ${esc(window)}</text>
  </g>

  <text x="400" y="880" text-anchor="middle" class="s" fill="${p.sub}" font-size="15">SF Bay Area · ~3 practices + 1 film day</text>
  <text x="400" y="908" text-anchor="middle" class="s" fill="${p.sub}" font-size="15">Sign up — link in bio</text>
</svg>`;
}

const TAGLINES = [
  (i: PosterInput) => `Bring ${i.kpopGroup}'s energy to the Bay`,
  (i: PosterInput) => `${i.songTitle} — let's cover it`,
  () => "New cover, new crew — come dance",
  () => "Your bias would want you to apply",
  () => "Snow's falling, so are the counts",
];

export async function generatePosterSvg(input: PosterInput): Promise<string> {
  // --- MOCK START -----------------------------------------------------------
  // A real call would ask Claude for `tagline` (and maybe a palette key) here.
  const idx = (input.songTitle.length + (input.variant ?? 0)) % TAGLINES.length;
  const tagline = TAGLINES[idx](input);
  // --- MOCK END -----------------------------------------------------------

  return renderPosterSvg(input, tagline);
}
