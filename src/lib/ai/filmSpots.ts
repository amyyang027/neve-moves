import { BAY_AREA_FILM_SPOTS } from "@/lib/constants";
import type { FilmSpotIdea, SongContext } from "./types";

// Film-location suggester.
//
// Returns a handful of Bay Area filming spots that fit the song's theme. The
// mock scores the curated library in src/lib/constants.ts against keywords in
// the theme text — no model involved. You pick from these or override.
//
// TODO: replace with real Claude API call — see README ("Wiring in real AI").
//   Keep BAY_AREA_FILM_SPOTS as grounding context so the model recommends
//   real, shootable places rather than inventing them.

export async function suggestFilmSpots(
  input: SongContext,
  count = 4,
): Promise<FilmSpotIdea[]> {
  // --- MOCK START -----------------------------------------------------------
  const themeWords = (input.themeVibe ?? "")
    .toLowerCase()
    .split(/[^a-z]+/)
    .filter((w) => w.length > 2);

  const scored = BAY_AREA_FILM_SPOTS.map((spot) => {
    const overlap = spot.tags.filter((tag) =>
      themeWords.some((w) => tag.includes(w) || w.includes(tag)),
    ).length;
    return { spot, score: overlap };
  });

  // If nothing matched the theme, just offer a varied default set.
  const anyMatch = scored.some((s) => s.score > 0);
  const ranked = scored
    .sort((a, b) => b.score - a.score || a.spot.name.localeCompare(b.spot.name))
    .slice(0, count);

  return ranked.map(({ spot, score }) => ({
    name: `${spot.name} (${spot.city})`,
    description: spot.description,
    whyItFits:
      anyMatch && score > 0
        ? `Matches the "${input.themeVibe}" vibe on: ${spot.tags
            .filter((tag) => themeWords.some((w) => tag.includes(w) || w.includes(tag)))
            .join(", ")}.`
        : `A reliable, camera-friendly Bay Area spot for "${input.songTitle}".`,
  }));
  // --- MOCK END -------------------------------------------------------------
}
