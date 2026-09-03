// Centralised "fixed set" values.
//
// SQLite has no enum type, so these live here as plain data. Every dropdown and
// status badge in the app reads from this file — change it here and the whole
// app follows. In Phase 2 (Postgres) most of these can become real Prisma enums.

/** The lifecycle of a dance cover project, in order. */
export const PROJECT_PHASES = [
  { value: "planning", label: "Planning" },
  { value: "recruiting", label: "Recruiting" },
  { value: "scheduling", label: "Scheduling" },
  { value: "prep", label: "Prep (locations / outfits)" },
  { value: "filming", label: "Filming" },
  { value: "post", label: "Post (voting / captions)" },
  { value: "published", label: "Published" },
] as const;

export type ProjectPhase = (typeof PROJECT_PHASES)[number]["value"];

export function phaseLabel(value: string): string {
  return PROJECT_PHASES.find((p) => p.value === value)?.label ?? value;
}

/**
 * Bay Area cities the group tends to practice in. This is a starting set — each
 * project gets its own editable copy of location options, so you are never
 * locked into this list.
 */
export const PREFERRED_PRACTICE_CITIES = [
  "San Mateo",
  "San Francisco",
  "Santa Clara",
  "Mountain View",
  "Fremont",
  "Daly City",
  "Berkeley",
  "San Jose",
] as const;

/** Default set of events created with every new project. Editable afterward. */
export const DEFAULT_EVENT_TEMPLATE: {
  kind: "practice" | "film";
  label: string;
  /** Days before the event that the reminder should fire. */
  reminderLeadDays: number;
}[] = [
  { kind: "practice", label: "Practice 1", reminderLeadDays: 2 },
  { kind: "practice", label: "Practice 2", reminderLeadDays: 2 },
  { kind: "practice", label: "Practice 3", reminderLeadDays: 2 },
  { kind: "film", label: "Film Day", reminderLeadDays: 3 },
];

export const VIDEOGRAPHER_STATUSES = [
  { value: "not_contacted", label: "Not contacted" },
  { value: "contacted", label: "Contacted" },
  { value: "confirmed", label: "Confirmed" },
] as const;

export function videographerStatusLabel(value: string): string {
  return (
    VIDEOGRAPHER_STATUSES.find((s) => s.value === value)?.label ?? value
  );
}

export const CONTACT_CHANNELS = ["Instagram", "WeChat"] as const;

export const POLL_KINDS = [
  { value: "video_take", label: "Video take" },
  { value: "cover_photo", label: "Cover photo" },
] as const;

export const ROSTER_MIN = 4;
export const ROSTER_MAX = 8;

/**
 * A small curated library of well-known Bay Area filming spots. The (mock)
 * film-spot suggester in src/lib/ai/filmSpots.ts scores these against a
 * project's theme keywords. This is data, not AI — when you wire in a real
 * model you can keep it as grounding context or drop it.
 */
export const BAY_AREA_FILM_SPOTS: {
  name: string;
  city: string;
  description: string;
  /** Vibe tags used only for the mock keyword match. */
  tags: string[];
}[] = [
  {
    name: "Palace of Fine Arts",
    city: "San Francisco",
    description:
      "Roman-style rotunda and colonnade around a lagoon. Grand, romantic, classical.",
    tags: ["elegant", "classical", "romantic", "dramatic", "architecture", "monochrome", "high-fashion"],
  },
  {
    name: "Salesforce Park",
    city: "San Francisco",
    description:
      "Elevated garden deck with sleek modern railings and skyline views.",
    tags: ["modern", "sleek", "futuristic", "urban", "clean", "minimal"],
  },
  {
    name: "Bay Bridge / Embarcadero at night",
    city: "San Francisco",
    description:
      "Light-strung suspension bridge and waterfront promenade after dark.",
    tags: ["night", "neon", "city", "moody", "cinematic", "lights", "urban"],
  },
  {
    name: "SFMOMA exterior & staircase",
    city: "San Francisco",
    description:
      "Rippled white facade and sculptural staircases. Bright, graphic, contemporary.",
    tags: ["modern", "graphic", "minimal", "clean", "art", "high-fashion", "monochrome"],
  },
  {
    name: "Clarion Alley murals",
    city: "San Francisco",
    description:
      "Dense, colourful street-art alley in the Mission. Bold, playful, gritty.",
    tags: ["colourful", "street", "playful", "bold", "urban", "graffiti", "retro"],
  },
  {
    name: "Twin Peaks overlook",
    city: "San Francisco",
    description:
      "Hilltop panorama of the whole city grid. Windswept, wide, epic.",
    tags: ["epic", "wide", "dramatic", "sunset", "cinematic", "nature"],
  },
  {
    name: "Stanford Main Quad & Memorial Court",
    city: "Palo Alto",
    description:
      "Sandstone arcades, arches and palm rows. Warm, collegiate, symmetrical.",
    tags: ["classical", "warm", "symmetrical", "architecture", "elegant", "vintage"],
  },
  {
    name: "Googleplex / Charleston Park",
    city: "Mountain View",
    description:
      "Playful tech campus with primary-colour sculptures and open lawns.",
    tags: ["playful", "colourful", "bright", "modern", "fun", "y2k"],
  },
  {
    name: "Great Mall / Levi's Stadium plaza",
    city: "Santa Clara",
    description:
      "Big clean open plaza and modern stadium architecture. Lots of flat space.",
    tags: ["modern", "clean", "open", "urban", "sport", "minimal"],
  },
  {
    name: "Central Park lake & pavilion",
    city: "San Mateo",
    description:
      "Manicured park with a Japanese garden, bridges and a rose garden.",
    tags: ["nature", "soft", "romantic", "green", "calm", "dreamy", "pastel"],
  },
  {
    name: "Lake Elizabeth / Central Park",
    city: "Fremont",
    description:
      "Wide lakeside lawns and paths with East Bay hills behind. Airy, casual.",
    tags: ["nature", "airy", "casual", "bright", "open", "summer"],
  },
  {
    name: "UC Berkeley campus & Sather Gate",
    city: "Berkeley",
    description:
      "Historic gates, grand libraries and wooded glades. Academic, layered, vintage.",
    tags: ["vintage", "classical", "academic", "architecture", "moody", "autumn"],
  },
  {
    name: "Sutro Baths ruins",
    city: "San Francisco",
    description:
      "Concrete ruins on the ocean's edge with fog and crashing surf. Haunting, raw.",
    tags: ["moody", "dramatic", "raw", "ocean", "fog", "cinematic", "dark", "ethereal"],
  },
  {
    name: "Japantown Peace Plaza",
    city: "San Francisco",
    description:
      "Open plaza with the five-tiered Peace Pagoda. Clean lines, cultural landmark.",
    tags: ["clean", "cultural", "graphic", "urban", "minimal", "pop"],
  },
];
