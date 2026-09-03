import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { ROSTER_MIN, ROSTER_MAX } from "@/lib/constants";
import { cleanName } from "@/lib/format";
import { Avatar } from "@/components/Avatar";
import { Section, Badge, EmptyState, Field } from "@/components/ui";
import { SubmitButton } from "@/components/SubmitButton";
import {
  addToRoster,
  toggleDancer,
  setProjectRole,
  removeFromRoster,
} from "./actions";

export default async function RosterPage({ params }: PageProps<"/projects/[id]/roster">) {
  const { id } = await params;
  const project = await db.project.findUnique({
    where: { id },
    include: {
      roster: {
        include: { member: true },
        orderBy: { createdAt: "asc" },
      },
    },
  });
  if (!project) notFound();

  const rosterMemberIds = new Set(project.roster.map((r) => r.memberId));
  const availableMembers = await db.member.findMany({
    where: { active: true, id: { notIn: [...rosterMemberIds] } },
    orderBy: { name: "asc" },
  });

  const dancerCount = project.roster.filter((r) => r.isDancer).length;
  const countTone =
    dancerCount >= ROSTER_MIN && dancerCount <= ROSTER_MAX ? "good" : "warn";

  return (
    <>
      <Section
        title="Roster"
        description="Everyone signed up for this project. Mark who is actually dancing this cover — that drives the credits later."
        actions={
          <Badge tone={countTone}>
            {dancerCount} dancing · target {ROSTER_MIN}–{ROSTER_MAX}
          </Badge>
        }
      >
        {project.roster.length === 0 ? (
          <EmptyState>No one on the roster yet. Add members below.</EmptyState>
        ) : (
          <ul className="divide-y divide-border">
            {project.roster.map((r) => (
              <li key={r.id} className="flex flex-wrap items-center gap-3 py-3">
                <Avatar name={r.member.name} photoUrl={r.member.photoUrl} size={40} />
                <div className="min-w-0 flex-1">
                  <Link
                    href={`/members/${r.member.id}`}
                    className="font-medium hover:text-accent"
                  >
                    {cleanName(r.member.name)}
                  </Link>
                  <div className="text-xs text-muted">{r.member.teamRole}</div>
                </div>

                <form
                  action={setProjectRole.bind(null, r.id, project.id)}
                  className="flex items-end gap-1.5"
                >
                  <div className="w-40">
                    <input
                      name="projectRole"
                      type="text"
                      placeholder="role this cover"
                      defaultValue={r.projectRole ?? ""}
                    />
                  </div>
                  <SubmitButton variant="secondary">Save</SubmitButton>
                </form>

                <form action={toggleDancer.bind(null, r.id, project.id)}>
                  <SubmitButton variant={r.isDancer ? "secondary" : "primary"}>
                    {r.isDancer ? "Dancing ✓" : "Roster only"}
                  </SubmitButton>
                </form>

                <form action={removeFromRoster.bind(null, r.id, project.id)}>
                  <SubmitButton
                    variant="danger"
                    confirm={`Remove ${cleanName(r.member.name)} from this project?`}
                  >
                    Remove
                  </SubmitButton>
                </form>
              </li>
            ))}
          </ul>
        )}
      </Section>

      <Section title="Add members from the directory">
        {availableMembers.length === 0 ? (
          <EmptyState>
            Everyone active is already on the roster.{" "}
            <Link href="/members" className="text-accent underline">
              Add a new member
            </Link>
            .
          </EmptyState>
        ) : (
          <form
            action={addToRoster.bind(null, project.id)}
            className="flex flex-wrap items-end gap-2"
          >
            <div className="min-w-56 flex-1">
              <Field label="Member">
                <select name="memberId" defaultValue="">
                  <option value="" disabled>
                    Choose a member…
                  </option>
                  {availableMembers.map((m) => (
                    <option key={m.id} value={m.id}>
                      {cleanName(m.name)} — {m.teamRole}
                    </option>
                  ))}
                </select>
              </Field>
            </div>
            <SubmitButton>Add to roster</SubmitButton>
          </form>
        )}
      </Section>
    </>
  );
}
