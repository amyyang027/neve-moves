import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { cleanName, instagramUrl } from "@/lib/format";
import { formatDate, toDateInputValue } from "@/lib/dates";
import { Avatar } from "@/components/Avatar";
import { SubmitButton } from "@/components/SubmitButton";
import {
  PageHeader,
  Section,
  Badge,
  SampleDataBadge,
  Field,
  EmptyState,
  MockAiNote,
} from "@/components/ui";
import {
  updateMember,
  deleteMember,
  regenerateBio,
  addBlockedDate,
  deleteBlockedDate,
  uploadMemberPhoto,
} from "../actions";

export default async function MemberDetailPage({
  params,
}: PageProps<"/members/[id]">) {
  const { id } = await params;
  const member = await db.member.findUnique({
    where: { id },
    include: {
      blockedDates: { orderBy: { startDate: "asc" } },
      rosterEntries: {
        include: { project: { select: { id: true, songTitle: true, kpopGroup: true } } },
        orderBy: { createdAt: "desc" },
      },
    },
  });
  if (!member) notFound();

  const ig = instagramUrl(member.instagramHandle);

  return (
    <>
      <PageHeader
        breadcrumb={<Link href="/members">← Member directory</Link>}
        title={cleanName(member.name)}
        description={member.teamRole}
        actions={
          member.isSample ? <SampleDataBadge /> : undefined
        }
      />

      <div className="grid gap-6 lg:grid-cols-[1fr_1.2fr]">
        <div>
          <Section title="Details">
            <div className="mb-4 flex items-start gap-3">
              <Avatar name={member.name} photoUrl={member.photoUrl} size={64} />
              <div className="flex-1 text-sm text-muted">
                {member.pronouns ? <div>{member.pronouns}</div> : null}
                {ig ? (
                  <a href={ig} target="_blank" rel="noreferrer" className="text-accent underline">
                    @{member.instagramHandle}
                  </a>
                ) : null}
                {member.wechatId ? <div>WeChat: {member.wechatId}</div> : null}
                {member.joinDate ? <div>Joined {formatDate(member.joinDate)}</div> : null}
                <form
                  action={uploadMemberPhoto.bind(null, member.id)}
                  className="mt-2 flex flex-wrap items-center gap-2"
                >
                  <input
                    type="file"
                    name="photo"
                    accept="image/jpeg,image/png,image/webp,image/gif"
                    required
                    className="text-xs"
                    style={{ width: "auto" }}
                  />
                  <SubmitButton variant="secondary" pendingText="Uploading…">
                    Upload photo
                  </SubmitButton>
                </form>
                <p className="mt-1 text-xs">
                  Saved to <code>/public/uploads</code> (local disk). Or paste a URL below.
                </p>
              </div>
            </div>

            <form action={updateMember.bind(null, member.id)} className="grid gap-4">
              <Field label="Name *">
                <input name="name" type="text" defaultValue={member.name} required />
              </Field>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Stage name">
                  <input name="stageName" type="text" defaultValue={member.stageName ?? ""} />
                </Field>
                <Field label="Team role">
                  <input name="teamRole" type="text" defaultValue={member.teamRole} />
                </Field>
                <Field label="Pronouns">
                  <input name="pronouns" type="text" defaultValue={member.pronouns ?? ""} />
                </Field>
                <Field label="Instagram handle" hint="Without the @">
                  <input
                    name="instagramHandle"
                    type="text"
                    defaultValue={member.instagramHandle ?? ""}
                  />
                </Field>
                <Field label="WeChat ID">
                  <input name="wechatId" type="text" defaultValue={member.wechatId ?? ""} />
                </Field>
                <Field label="Join date">
                  <input name="joinDate" type="date" defaultValue={toDateInputValue(member.joinDate)} />
                </Field>
              </div>
              <Field label="Photo URL">
                <input name="photoUrl" type="url" defaultValue={member.photoUrl ?? ""} />
              </Field>
              <Field label="Bio" hint="Edit directly, or regenerate it on the right.">
                <textarea name="bio" rows={4} defaultValue={member.bio ?? ""} />
              </Field>
              <label className="flex items-center gap-2 text-sm font-medium text-foreground">
                <input
                  name="active"
                  type="checkbox"
                  defaultChecked={member.active}
                  className="h-4 w-4"
                />
                Active member
              </label>
              <div className="flex gap-2">
                <SubmitButton pendingText="Saving…">Save changes</SubmitButton>
              </div>
            </form>

            <form
              action={deleteMember.bind(null, member.id)}
              className="mt-4 border-t border-border pt-4"
            >
              <SubmitButton
                variant="danger"
                confirm={`Delete ${cleanName(member.name)}? This also removes them from any project rosters.`}
              >
                Delete member
              </SubmitButton>
            </form>
          </Section>
        </div>

        <div>
          <Section
            title="Bio"
            description="Written once and reused across projects."
            actions={
              <form action={regenerateBio.bind(null, member.id)}>
                <SubmitButton variant="secondary" pendingText="Generating…">
                  {member.bio ? "Regenerate" : "Generate"} bio
                </SubmitButton>
              </form>
            }
          >
            {member.bio ? (
              <>
                <p className="whitespace-pre-wrap text-sm">{member.bio}</p>
                {member.bioUpdatedAt ? (
                  <p className="mt-2 text-xs text-muted">
                    Updated {formatDate(member.bioUpdatedAt)}
                  </p>
                ) : null}
              </>
            ) : (
              <EmptyState>No bio yet.</EmptyState>
            )}
            <MockAiNote what="The member bio" />
          </Section>

          <Section
            title="Blocked dates"
            description="Hard conflicts (usually travel). Used by every project's schedule conflict grid."
          >
            {member.blockedDates.length === 0 ? (
              <EmptyState>No blocked dates.</EmptyState>
            ) : (
              <ul className="mb-4 divide-y divide-border">
                {member.blockedDates.map((b) => (
                  <li
                    key={b.id}
                    className="flex items-center justify-between gap-2 py-2 text-sm"
                  >
                    <div>
                      <span className="font-medium">
                        {formatDate(b.startDate)}
                        {b.endDate.getTime() !== b.startDate.getTime()
                          ? ` – ${formatDate(b.endDate)}`
                          : ""}
                      </span>
                      {b.reason ? (
                        <span className="text-muted"> — {b.reason}</span>
                      ) : null}
                    </div>
                    <form action={deleteBlockedDate.bind(null, b.id, member.id)}>
                      <SubmitButton variant="danger">Remove</SubmitButton>
                    </form>
                  </li>
                ))}
              </ul>
            )}

            <form
              action={addBlockedDate.bind(null, member.id)}
              className="grid gap-3 sm:grid-cols-2"
            >
              <Field label="Start date *">
                <input name="startDate" type="date" required />
              </Field>
              <Field label="End date" hint="Leave blank for a single day">
                <input name="endDate" type="date" />
              </Field>
              <div className="sm:col-span-2">
                <Field label="Reason">
                  <input name="reason" type="text" placeholder="Travel — visiting family" />
                </Field>
              </div>
              <div className="sm:col-span-2">
                <SubmitButton variant="secondary">Add blocked range</SubmitButton>
              </div>
            </form>
          </Section>

          <Section title="Projects">
            {member.rosterEntries.length === 0 ? (
              <EmptyState>Not on any project rosters yet.</EmptyState>
            ) : (
              <ul className="space-y-1.5 text-sm">
                {member.rosterEntries.map((r) => (
                  <li key={r.id}>
                    <Link
                      href={`/projects/${r.project.id}`}
                      className="hover:text-accent"
                    >
                      {cleanName(r.project.songTitle)}
                      <span className="text-muted"> — {r.project.kpopGroup}</span>
                    </Link>{" "}
                    {r.isDancer ? (
                      <Badge tone="good">dancing</Badge>
                    ) : (
                      <Badge>roster only</Badge>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </Section>
        </div>
      </div>
    </>
  );
}
