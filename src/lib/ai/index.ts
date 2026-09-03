// The AI helper surface, in one place.
//
// Phase 1: every function below returns a believable MOCK result so the whole
// app is clickable with no API key. Each function's file has a clearly marked
// `// TODO: replace with real Claude API call` block.
//
// To wire in real AI (Phase 2), see README.md → "Wiring in real AI". In short:
//   1. `npm install @anthropic-ai/sdk`
//   2. add ANTHROPIC_API_KEY to .env
//   3. replace the MOCK block in each file with a real call
//   4. set AI_IS_MOCKED = false in ./types.ts

export { AI_IS_MOCKED } from "./types";
export type {
  PosterInput,
  MemberBioInput,
  FilmSpotIdea,
  OutfitInput,
  SocialCopyInput,
  SongContext,
} from "./types";

export { generatePosterSvg, renderPosterSvg } from "./poster";
export { generateMemberBio } from "./bios";
export { suggestFilmSpots } from "./filmSpots";
export { suggestOutfit } from "./outfit";
export { generateInstagramCaption, generateYoutubeDescription } from "./socialCopy";
