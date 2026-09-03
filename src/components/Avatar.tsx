import { initials, cleanName } from "@/lib/format";

export function Avatar({
  name,
  photoUrl,
  size = 44,
}: {
  name: string;
  photoUrl?: string | null;
  size?: number;
}) {
  if (photoUrl) {
    // Plain <img>: Phase 1 photos are arbitrary external URLs. Phase 2 (real
    // uploads) can switch to next/image with a configured loader.
    // eslint-disable-next-line @next/next/no-img-element
    return (
      <img
        src={photoUrl}
        alt={cleanName(name)}
        className="shrink-0 rounded-full object-cover"
        style={{ width: size, height: size }}
      />
    );
  }
  return (
    <div
      className="flex shrink-0 items-center justify-center rounded-full bg-accent-soft font-bold text-accent"
      style={{ width: size, height: size, fontSize: size * 0.32 }}
    >
      {initials(name)}
    </div>
  );
}
