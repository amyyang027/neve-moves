import type { OutfitInput } from "./types";

// Outfit description generator.
//
// Produces a shoppable text description based on the original MV / stage look.
// Real-time web image search isn't feasible for a free prototype, so a written
// description you can shop from is the deliverable for now.
//
// TODO: replace with real Claude API call — see README ("Wiring in real AI").
//   A real call should describe the actual MV outfit for this specific song.
//   A later upgrade could attach reference image links.

export async function suggestOutfit(input: OutfitInput): Promise<string> {
  // --- MOCK START -----------------------------------------------------------
  const vibe = input.themeVibe?.trim().toLowerCase() ?? "";
  const palette = vibe.includes("mono") || vibe.includes("black")
    ? "all-black with one metallic accent"
    : vibe.includes("pastel") || vibe.includes("soft")
      ? "soft pastels (blush, cream, pale blue)"
      : vibe.includes("neon") || vibe.includes("night")
        ? "dark base with neon or reflective accents"
        : "coordinated neutrals with a single bold accent colour";

  return [
    `Inspired by ${input.kpopGroup}'s "${input.songTitle}" (${input.themeVibe ?? "MV look"}).`,
    "",
    `Base: fitted black or ${palette.split("(")[0].trim()} top + high-waisted bottoms (trousers or a short skirt with shorts under). Everyone matches on silhouette, varies on detail.`,
    `Layer: cropped jacket, mesh sleeve, or corset belt to add structure for the camera.`,
    `Shoes: clean white or black sneakers, uniform across the group.`,
    `Accessories: one shared statement piece (choker, fingerless gloves, or a hair accent).`,
    `Palette: ${palette}.`,
    "",
    `Shopping notes: prioritise matching silhouettes and colour over identical items — thrift + a couple of shared new pieces is enough. Budget ~$25–40/person.`,
  ].join("\n");
  // --- MOCK END -------------------------------------------------------------
}
