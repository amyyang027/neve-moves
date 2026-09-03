import type { MemberBioInput } from "./types";

// Member bio / intro generator.
//
// The result is stored on the Member (bio + bioUpdatedAt) and reused across
// every project — it is only regenerated when you ask for it.
//
// TODO: replace with real Claude API call — see README ("Wiring in real AI").

export async function generateMemberBio(input: MemberBioInput): Promise<string> {
  // --- MOCK START -----------------------------------------------------------
  const who = input.stageName ? `${input.name} (${input.stageName})` : input.name;
  const role = input.teamRole.toLowerCase();
  const pronoun = input.pronouns ? ` (${input.pronouns})` : "";

  const covers =
    input.pastCovers.length > 0
      ? ` You've seen ${who.split(" ")[0]} in our covers of ${listify(
          input.pastCovers,
        )}.`
      : ` This is an early chapter of ${who.split(" ")[0]}'s Neve Moves story.`;

  return (
    `${who}${pronoun} is one of Neve Moves' ${role}s, based in the SF Bay Area. ` +
    `Known on the team for showing up prepared, syncing fast, and making the ` +
    `back row look like the front row.${covers} ` +
    `Off the floor: still probably counting eights in their head.`
  );
  // --- MOCK END -------------------------------------------------------------
}

function listify(items: string[]): string {
  if (items.length === 1) return `"${items[0]}"`;
  if (items.length === 2) return `"${items[0]}" and "${items[1]}"`;
  return `"${items.slice(0, -1).join('", "')}", and "${items[items.length - 1]}"`;
}
