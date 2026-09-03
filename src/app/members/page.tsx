// Always read fresh data — this is a live, mutable app, not a static site.
export const dynamic = "force-dynamic";

import Link from "next/link";
import { db } from "@/lib/db";
import { cleanName } from "@/lib/format";
import { createMember } from "./actions";
import { Avatar } from "@/components/Avatar";
import { SubmitButton } from "@/components/SubmitButton";
import {
  PageHeader,
  Section,
  Badge,
  SampleDataBadge,
  Field,
  EmptyState,
} from "@/components/ui";

export default async function MembersPage() {
  const members = await db.member.findMany({
    orderBy: [{ active: "desc" }, { name: "asc" }],
    include: {
      _count: { select: { rosterEntries: true, blockedDates: true } },
    },
  });

  return (
    <>
      <PageHeader
        title="Member directory"
        description="The whole group. Members are added here once and reused on every project. Bios live on the member and are only regenerated on request."
      />

      <Section title={`Members (${members.length})`}>
        {members.length === 0 ? (
          <EmptyState>No members yet. Add one below.</EmptyState>
        ) : (
          <ul className="grid gap-3 sm:grid-cols-2">
            {members.map((m) => (
              <li key={m.id}>
                <Link
                  href={`/members/${m.id}`}
                  className="flex gap-3 rounded-xl border border-border bg-surface p-4 transition-colors hover:border-accent"
                >
                  <Avatar name={m.name} photoUrl={m.photoUrl} />
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="font-semibold">{cleanName(m.name)}</span>
                      {m.isSample ? <SampleDataBadge /> : null}
                      {!m.active ? <Badge>inactive</Badge> : null}
                    </div>
                    <div className="text-sm text-muted">{m.teamRole}</div>
                    <div className="mt-1 flex flex-wrap gap-x-3 text-xs text-muted">
                      {m.instagramHandle ? <span>@{m.instagramHandle}</span> : null}
                      <span>{m._count.rosterEntries} projects</span>
                      {m._count.blockedDates > 0 ? (
                        <span>{m._count.blockedDates} blocked ranges</span>
                      ) : null}
                      {!m.bio ? <span className="text-[var(--warn)]">no bio</span> : null}
                    </div>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Section>

      <Section
        title="Add a member"
        description="Only the name is required — you can fill in the rest on their page."
      >
        <form action={createMember} className="grid gap-4 sm:grid-cols-2">
          <Field label="Name *">
            <input name="name" type="text" required />
          </Field>
          <Field label="Stage name" hint="Optional — leave blank unless the group uses them">
            <input name="stageName" type="text" />
          </Field>
          <Field label="Team role">
            <input name="teamRole" type="text" placeholder="Dancer" />
          </Field>
          <Field label="Pronouns">
            <input name="pronouns" type="text" placeholder="she/her" />
          </Field>
          <Field label="Instagram handle" hint="Without the @">
            <input name="instagramHandle" type="text" placeholder="nevemoves.amy" />
          </Field>
          <Field label="WeChat ID">
            <input name="wechatId" type="text" />
          </Field>
          <Field label="Photo URL" hint="A link for now; real uploads come in Phase 2">
            <input name="photoUrl" type="url" placeholder="https://…" />
          </Field>
          <Field label="Join date">
            <input name="joinDate" type="date" />
          </Field>
          <div className="sm:col-span-2">
            <SubmitButton pendingText="Adding…">Add member</SubmitButton>
          </div>
        </form>
      </Section>
    </>
  );
}
