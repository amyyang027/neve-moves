import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { POLL_KINDS } from "@/lib/constants";
import { cleanName } from "@/lib/format";
import { Section, Badge, EmptyState, Field } from "@/components/ui";
import { SubmitButton } from "@/components/SubmitButton";
import {
  createPoll,
  addOption,
  deleteOption,
  castVote,
  removeVote,
  setPollStatus,
  deletePoll,
} from "./actions";

type PollWithData = {
  id: string;
  kind: string;
  title: string;
  status: string;
  options: {
    id: string;
    label: string;
    url: string | null;
    thumbnailUrl: string | null;
    votes: { voterMemberId: string }[];
  }[];
};

export default async function VotesPage({ params }: PageProps<"/projects/[id]/votes">) {
  const { id } = await params;
  const project = await db.project.findUnique({
    where: { id },
    include: {
      polls: {
        include: { options: { include: { votes: true }, orderBy: { createdAt: "asc" } } },
        orderBy: { createdAt: "asc" },
      },
      roster: { include: { member: true }, orderBy: { createdAt: "asc" } },
    },
  });
  if (!project) notFound();

  const voters = project.roster.map((r) => ({
    id: r.member.id,
    name: cleanName(r.member.name),
  }));

  return (
    <>
      <p className="mb-6 text-sm text-muted">
        After filming you get a link with a few takes — log them here and have the
        team vote. Same again for the cover photo. Voters pick their own name
        (Phase 1 has no logins); one vote per person per poll, changeable.
      </p>

      {POLL_KINDS.map((k) => {
        const poll = project.polls.find((p) => p.kind === k.value) as PollWithData | undefined;
        return (
          <Section key={k.value} title={k.label}>
            {poll ? (
              <PollCard poll={poll} projectId={project.id} voters={voters} />
            ) : (
              <form action={createPoll.bind(null, project.id, k.value)} className="flex flex-wrap items-end gap-2">
                <div className="min-w-64 flex-1">
                  <Field label="Poll question">
                    <input
                      name="title"
                      type="text"
                      placeholder={k.value === "video_take" ? "Which Whiplash take?" : "Pick the thumbnail"}
                    />
                  </Field>
                </div>
                <SubmitButton>Create {k.label.toLowerCase()} poll</SubmitButton>
              </form>
            )}
          </Section>
        );
      })}
    </>
  );
}

function PollCard({
  poll,
  projectId,
  voters,
}: {
  poll: PollWithData;
  projectId: string;
  voters: { id: string; name: string }[];
}) {
  const totalVotes = poll.options.reduce((n, o) => n + o.votes.length, 0);
  const maxVotes = Math.max(0, ...poll.options.map((o) => o.votes.length));
  const voterName = (mid: string) => voters.find((v) => v.id === mid)?.name ?? "Someone";
  const whoVoted = new Set(poll.options.flatMap((o) => o.votes.map((v) => v.voterMemberId)));
  const notYetVoted = voters.filter((v) => !whoVoted.has(v.id));

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="font-semibold">{poll.title}</span>
          <Badge tone={poll.status === "closed" ? "neutral" : "good"}>{poll.status}</Badge>
          <span className="text-xs text-muted">{totalVotes} votes</span>
        </div>
        <div className="flex gap-2">
          <form action={setPollStatus.bind(null, poll.id, projectId, poll.status === "closed" ? "open" : "closed")}>
            <SubmitButton variant="secondary">{poll.status === "closed" ? "Reopen" : "Close poll"}</SubmitButton>
          </form>
          <form action={deletePoll.bind(null, poll.id, projectId)}>
            <SubmitButton variant="danger" confirm="Delete this poll and its votes?">
              Delete
            </SubmitButton>
          </form>
        </div>
      </div>

      <ul className="space-y-2">
        {poll.options.map((o) => {
          const count = o.votes.length;
          const leading = count > 0 && count === maxVotes;
          return (
            <li
              key={o.id}
              className={`rounded-xl border p-3 ${leading ? "border-accent bg-accent-soft" : "border-border"}`}
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  {o.thumbnailUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={o.thumbnailUrl} alt="" className="h-10 w-16 rounded object-cover" />
                  ) : null}
                  <div>
                    <div className="font-medium">
                      {o.label} {leading ? <Badge tone="accent">leading</Badge> : null}
                    </div>
                    {o.url ? (
                      <a href={o.url} target="_blank" rel="noreferrer" className="text-xs text-accent underline">
                        {o.url}
                      </a>
                    ) : null}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold">{count}</span>
                  <form action={deleteOption.bind(null, o.id, projectId)}>
                    <button className="text-xs text-muted hover:text-[var(--bad)]" title="Delete option">
                      ✕
                    </button>
                  </form>
                </div>
              </div>
              {count > 0 ? (
                <div className="mt-1.5 flex flex-wrap gap-1">
                  {o.votes.map((v) => (
                    <span key={v.voterMemberId} className="rounded-full bg-surface px-2 py-0.5 text-xs text-muted">
                      {voterName(v.voterMemberId)}
                    </span>
                  ))}
                </div>
              ) : null}
            </li>
          );
        })}
      </ul>

      {poll.options.length === 0 ? (
        <EmptyState>No options yet. Add the takes / photos below.</EmptyState>
      ) : null}

      {/* Add option */}
      <form action={addOption.bind(null, poll.id, projectId)} className="mt-3 grid gap-2 sm:grid-cols-[1fr_1fr_1fr_auto] sm:items-end">
        <Field label="Option label" hint="A plain label like “Take 1” is enough.">
          <input name="label" type="text" placeholder="Take 1" required />
        </Field>
        <Field label="Link (optional)">
          <input name="url" type="url" placeholder="https://drive.google.com/…" />
        </Field>
        <Field label="Thumbnail URL (optional)">
          <input name="thumbnailUrl" type="url" placeholder="https://…" />
        </Field>
        <SubmitButton variant="secondary">Add</SubmitButton>
      </form>

      {/* Cast a vote */}
      {poll.status !== "closed" && poll.options.length > 0 ? (
        <form action={castVote.bind(null, poll.id, projectId)} className="mt-4 rounded-xl border border-border p-3">
          <div className="grid gap-2 sm:grid-cols-[200px_1fr_auto] sm:items-end">
            <Field label="I am">
              <select name="voterMemberId" defaultValue="" required>
                <option value="" disabled>
                  Pick your name…
                </option>
                {voters.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.name}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="My vote">
              <select name="optionId" defaultValue="" required>
                <option value="" disabled>
                  Choose an option…
                </option>
                {poll.options.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.label}
                  </option>
                ))}
              </select>
            </Field>
            <SubmitButton>Vote</SubmitButton>
          </div>
          {notYetVoted.length > 0 ? (
            <p className="mt-2 text-xs text-muted">
              Haven&rsquo;t voted: {notYetVoted.map((v) => v.name).join(", ")}
            </p>
          ) : voters.length > 0 ? (
            <p className="mt-2 text-xs text-[var(--good)]">Everyone on the roster has voted.</p>
          ) : null}
        </form>
      ) : null}

      <VoteRemovers poll={poll} projectId={projectId} voterName={voterName} />
    </div>
  );
}

function VoteRemovers({
  poll,
  projectId,
  voterName,
}: {
  poll: PollWithData;
  projectId: string;
  voterName: (id: string) => string;
}) {
  const voted = poll.options.flatMap((o) => o.votes.map((v) => v.voterMemberId));
  if (voted.length === 0 || poll.status === "closed") return null;
  return (
    <div className="mt-2 flex flex-wrap items-center gap-1.5 text-xs text-muted">
      <span>Undo:</span>
      {voted.map((mid) => (
        <form key={mid} action={removeVote.bind(null, poll.id, mid, projectId)}>
          <button className="rounded-full border border-border px-2 py-0.5 hover:border-[var(--bad)] hover:text-[var(--bad)]">
            {voterName(mid)} ✕
          </button>
        </form>
      ))}
    </div>
  );
}
