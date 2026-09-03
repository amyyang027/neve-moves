// Seed data for Neve Moves.
//
// Everything created here has isSample: true and names that make clear it's
// example data. Run `npm run db:reset` to wipe and re-seed at any time.
//
// The example project is a realistic mid-lifecycle dance cover:
// aespa – "Whiplash", monochrome high-fashion theme, filming "Late September".

import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

const BRAND_YOUTUBE = "https://www.youtube.com/@nevemove";

/** Build a UTC-midnight date for 2026. */
function d(month: number, day: number): Date {
  return new Date(Date.UTC(2026, month - 1, day));
}

async function main() {
  console.log("Clearing existing data…");
  // Order matters because of foreign keys. onDelete: Cascade covers children,
  // but we clear explicitly so re-seeding is predictable.
  await db.vote.deleteMany();
  await db.pollOption.deleteMany();
  await db.poll.deleteMany();
  await db.projectCopy.deleteMany();
  await db.outfitSuggestion.deleteMany();
  await db.filmSpotSuggestion.deleteMany();
  await db.locationOption.deleteMany();
  await db.candidateDate.deleteMany();
  await db.projectEvent.deleteMany();
  await db.videographer.deleteMany();
  await db.referenceLink.deleteMany();
  await db.rosterEntry.deleteMany();
  await db.blockedDate.deleteMany();
  await db.project.deleteMany();
  await db.member.deleteMany();

  console.log("Seeding members…");
  const members = await Promise.all(
    [
      {
        name: "Amy Kena [SAMPLE]",
        teamRole: "Leader / Main Dancer",
        pronouns: "she/her",
        instagramHandle: "nevemoves.amy",
        wechatId: "amykena_nv",
        joinDate: d(1, 15),
        bio: "Amy Kena runs Neve Moves and dances center more often than not. Started the group to make the Bay Area K-pop scene a little less flaky. Known for locking choreo in one practice.",
        bioUpdatedAt: d(1, 20),
      },
      {
        name: "Jhene Cruz [SAMPLE]",
        teamRole: "Choreographer / Lead Dancer",
        pronouns: "she/they",
        instagramHandle: "jhene.moves",
        wechatId: "jhenec",
        joinDate: d(2, 3),
        bio: "Jhene Cruz breaks down the hard sections so the rest of us survive them. Our resident count-fixer and formation-drawer.",
        bioUpdatedAt: d(2, 10),
      },
      {
        name: "Mika Tan [SAMPLE]",
        teamRole: "Main Dancer",
        pronouns: "she/her",
        instagramHandle: "mika.tnd",
        joinDate: d(3, 1),
        bio: null,
        bioUpdatedAt: null,
      },
      {
        name: "Priya Raman [SAMPLE]",
        teamRole: "Dancer / Social Media",
        pronouns: "she/her",
        instagramHandle: "priya.dnc",
        wechatId: "priyar_dance",
        joinDate: d(3, 18),
        bio: "Priya Raman dances and runs the Neve Moves Instagram. If a Reel went out on time, that was Priya.",
        bioUpdatedAt: d(4, 1),
      },
      {
        name: "Sofia Reyes [SAMPLE]",
        teamRole: "Dancer",
        pronouns: "she/her",
        instagramHandle: "sofiadances",
        joinDate: d(5, 20),
        bio: null,
        bioUpdatedAt: null,
      },
      {
        name: "Kai Nakamura [SAMPLE]",
        teamRole: "Dancer / Videographer Liaison",
        pronouns: "he/him",
        instagramHandle: "kai.nkmr",
        wechatId: "kai_nkmr",
        joinDate: d(6, 8),
        bio: "Kai Nakamura dances and is the person texting the videographer at 11pm to confirm call time. Keeps the shoot on schedule.",
        bioUpdatedAt: d(6, 15),
      },
    ].map((m) => db.member.create({ data: { ...m, isSample: true } })),
  );

  const [amy, jhene, mika, priya, sofia, kai] = members;

  console.log("Seeding blocked dates…");
  await db.blockedDate.createMany({
    data: [
      { memberId: mika.id, startDate: d(9, 11), endDate: d(9, 15), reason: "Family trip to LA" },
      { memberId: priya.id, startDate: d(9, 12), endDate: d(9, 12), reason: "Wedding" },
      { memberId: sofia.id, startDate: d(9, 19), endDate: d(9, 21), reason: "Work conference" },
      { memberId: kai.id, startDate: d(9, 26), endDate: d(9, 28), reason: "Out of town" },
      { memberId: jhene.id, startDate: d(10, 3), endDate: d(10, 10), reason: "Vacation (Japan)" },
    ],
  });

  console.log("Seeding example project…");
  const project = await db.project.create({
    data: {
      isSample: true,
      songTitle: "Whiplash [SAMPLE PROJECT]",
      kpopGroup: "aespa",
      themeVibe: "sleek monochrome high-fashion, sharp and confident",
      dateWindowLabel: "Late September",
      phase: "prep",
      crabfitUrl: "https://crabfit.app/example-whiplash-neve",
      references: {
        create: [
          { label: "YouTube (MV)", url: "https://www.youtube.com/watch?v=example-whiplash" },
          { label: "YouTube (dance practice)", url: "https://www.youtube.com/watch?v=example-whiplash-practice" },
        ],
      },
    },
  });

  console.log("Seeding roster…");
  // Amy, Jhene, Mika, Priya, Sofia dancing; Kai on roster but not dancing this one.
  await db.rosterEntry.createMany({
    data: [
      { projectId: project.id, memberId: amy.id, isDancer: true, projectRole: "Center" },
      { projectId: project.id, memberId: jhene.id, isDancer: true, projectRole: "Sub-center" },
      { projectId: project.id, memberId: mika.id, isDancer: true },
      { projectId: project.id, memberId: priya.id, isDancer: true },
      { projectId: project.id, memberId: sofia.id, isDancer: true },
      { projectId: project.id, memberId: kai.id, isDancer: false, projectRole: "Videographer liaison" },
    ],
  });

  console.log("Seeding events…");
  await db.projectEvent.createMany({
    data: [
      { projectId: project.id, kind: "practice", label: "Practice 1", orderIndex: 0, targetDate: d(9, 13), confirmedDate: d(9, 13), reminderDate: d(9, 11), locationCity: "San Mateo", locationNote: "Central Park covered area" },
      { projectId: project.id, kind: "practice", label: "Practice 2", orderIndex: 1, targetDate: d(9, 20), confirmedDate: null, reminderDate: d(9, 18), locationCity: "Santa Clara" },
      { projectId: project.id, kind: "practice", label: "Practice 3", orderIndex: 2, targetDate: d(9, 24), confirmedDate: null, reminderDate: d(9, 22), locationCity: "Mountain View" },
      { projectId: project.id, kind: "film", label: "Film Day", orderIndex: 3, targetDate: d(9, 27), confirmedDate: null, reminderDate: d(9, 24), locationCity: "San Francisco", locationNote: "Call time 9am" },
    ],
  });

  console.log("Seeding candidate dates (for the conflict grid)…");
  await db.candidateDate.createMany({
    data: [
      { projectId: project.id, date: d(9, 12), note: "Sat" },
      { projectId: project.id, date: d(9, 13), note: "Sun" },
      { projectId: project.id, date: d(9, 19), note: "Sat" },
      { projectId: project.id, date: d(9, 20), note: "Sun" },
      { projectId: project.id, date: d(9, 26), note: "Sat — film day option" },
      { projectId: project.id, date: d(9, 27), note: "Sun — film day option" },
    ],
  });

  console.log("Seeding locations…");
  await db.locationOption.createMany({
    data: [
      { projectId: project.id, kind: "practice", city: "San Mateo", source: "preferred", selected: true, note: "Central Park — free, covered, mirrors-ish" },
      { projectId: project.id, kind: "practice", city: "Santa Clara", source: "preferred", selected: true },
      { projectId: project.id, kind: "practice", city: "Mountain View", source: "preferred", selected: false },
      { projectId: project.id, kind: "film", city: "San Francisco", name: "SFMOMA exterior & staircase", source: "ai_suggested", selected: true, note: "Graphic white facade suits the monochrome look" },
      { projectId: project.id, kind: "film", city: "San Francisco", name: "Salesforce Park", source: "ai_suggested", selected: false },
    ],
  });

  console.log("Seeding videographer…");
  await db.videographer.create({
    data: {
      projectId: project.id,
      name: "Daniel (referral from LE SSERAFIM cover)",
      contactVia: "Instagram",
      contactHandle: "danfilms.bay",
      status: "contacted",
      reminderDate: d(9, 10),
      notes: "Said yes tentatively, needs final date. Follow up after Crabfit closes.",
    },
  });

  console.log("Seeding AI suggestions (film spots + outfit)…");
  await db.filmSpotSuggestion.createMany({
    data: [
      { projectId: project.id, name: "SFMOMA exterior & staircase (San Francisco)", description: "Rippled white facade and sculptural staircases. Bright, graphic, contemporary.", whyItFits: "The monochrome, high-fashion vibe reads perfectly against clean white architecture.", source: "ai", selected: true },
      { projectId: project.id, name: "Palace of Fine Arts (San Francisco)", description: "Roman-style rotunda and colonnade around a lagoon.", whyItFits: "Dramatic, editorial backdrop for a confident, sharp routine.", source: "ai", selected: false },
      { projectId: project.id, name: "Japantown Peace Plaza (San Francisco)", description: "Open plaza with the five-tiered Peace Pagoda.", whyItFits: "Clean lines and negative space keep focus on the formations.", source: "ai", selected: false },
    ],
  });
  await db.outfitSuggestion.create({
    data: {
      projectId: project.id,
      source: "ai",
      selected: true,
      referenceImageUrl: "/seed/whiplash-outfit.jpg",
      description:
        "Inspired by aespa's \"Whiplash\" (sleek monochrome high-fashion). The MV look is all-black with silver hardware: cargo trousers or a pleated micro-skirt, cropped structured leather or a cut-out top, knee-high buckled boots, and silver body chains / fingerless gloves.\n\nFor the cover:\nBase — fitted black top + high-waisted black cargos or a short black skirt with shorts under. Match on silhouette, vary on detail.\nLayer — cropped structured jacket or a corset belt for camera definition.\nShoes — black lace-up or buckled boots, uniform across the group.\nAccessories — one shared silver statement piece (choker, body chain, or fingerless gloves).\nPalette — all-black with one metallic accent.\n\nShopping notes: thrift the base layers, split the cost of two shared silver pieces. ~$30/person.\n\nReference: aespa 'Whiplash' MV (SMTOWN) — https://www.youtube.com/watch?v=jWQx2f-CErU",
    },
  });

  console.log("Seeding video-take poll with votes…");
  const takePoll = await db.poll.create({
    data: {
      projectId: project.id,
      kind: "video_take",
      title: "Which Whiplash take should we use?",
      status: "open",
      options: {
        create: [
          { label: "Take A — full group, wide", url: "https://drive.example.com/whiplash-take-a" },
          { label: "Take B — tighter framing, better sync", url: "https://drive.example.com/whiplash-take-b" },
          { label: "Take C — golden hour, softer", url: "https://drive.example.com/whiplash-take-c" },
        ],
      },
    },
    include: { options: true },
  });
  const [takeA, takeB] = takePoll.options;
  await db.vote.createMany({
    data: [
      { pollId: takePoll.id, optionId: takeB.id, voterMemberId: amy.id },
      { pollId: takePoll.id, optionId: takeB.id, voterMemberId: jhene.id },
      { pollId: takePoll.id, optionId: takeA.id, voterMemberId: priya.id },
      { pollId: takePoll.id, optionId: takeB.id, voterMemberId: sofia.id },
    ],
  });

  console.log("Seeding cover-photo poll (no votes yet)…");
  await db.poll.create({
    data: {
      projectId: project.id,
      kind: "cover_photo",
      title: "Pick the YouTube thumbnail",
      status: "open",
      options: {
        create: [
          { label: "Photo 1 — mid-formation", url: "https://drive.example.com/whiplash-photo-1" },
          { label: "Photo 2 — final pose", url: "https://drive.example.com/whiplash-photo-2" },
        ],
      },
    },
  });

  // One earlier, "published" sample project so the Projects list shows that
  // phase. The About page gallery now comes from the real YouTube channel, not
  // from seed data.
  console.log("Seeding one published sample project…");
  await db.project.create({
    data: {
      isSample: true,
      songTitle: "Supernatural [SAMPLE]",
      kpopGroup: "NewJeans",
      themeVibe: "retro city night, neon",
      phase: "published",
      dateWindowLabel: "August",
      youtubeUrl: BRAND_YOUTUBE,
      references: { create: [{ label: "YouTube (MV)", url: "https://www.youtube.com/watch?v=example-supernatural" }] },
    },
  });

  const counts = {
    members: await db.member.count(),
    projects: await db.project.count(),
    blockedDates: await db.blockedDate.count(),
    polls: await db.poll.count(),
  };
  console.log("Done:", counts);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
