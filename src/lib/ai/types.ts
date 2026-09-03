// Shared input/output shapes for the AI helper functions.
//
// Every function in src/lib/ai is a REAL, callable function that the app uses
// today. For Phase 1 the body is a clearly-marked mock that returns a
// believable fake result, so every screen works with no API key. See
// README.md → "Wiring in real AI" for how to swap in a real Claude API call.

/**
 * Flip to false-ish reality once real calls are wired in. The UI reads this to
 * show a "sample AI output" badge so nobody mistakes a mock for the real thing.
 */
export const AI_IS_MOCKED = true;

export type SongContext = {
  songTitle: string;
  kpopGroup: string;
  themeVibe: string | null;
};

export type PosterInput = SongContext & {
  dateWindowLabel: string | null;
  rosterMin: number;
  rosterMax: number;
  /** Which template layout to use. "Regenerate" cycles this. */
  variant?: number;
};

export type MemberBioInput = {
  name: string;
  stageName: string | null;
  teamRole: string;
  pronouns: string | null;
  /** Titles of past covers this member has danced, for colour. */
  pastCovers: string[];
};

export type FilmSpotIdea = {
  name: string;
  description: string;
  whyItFits: string;
};

export type OutfitInput = SongContext;

export type SocialCopyInput = SongContext & {
  /** Instagram handles (no "@") of the dancers, in credit order. */
  dancerHandles: string[];
  dancerNames: string[];
  videographerCredit: string | null;
  referenceUrl: string | null;
};
