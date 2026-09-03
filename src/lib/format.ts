// Tiny display helpers.

export function initials(name: string): string {
  return name
    .replace(/\[.*?\]/g, "") // drop "[SAMPLE]" tags
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
}

/** Strip our "[SAMPLE]" / "[SAMPLE PROJECT]" tags for display in prose. */
export function cleanName(name: string): string {
  return name.replace(/\s*\[SAMPLE[^\]]*\]/g, "").trim();
}

export function instagramUrl(handle: string | null | undefined): string | null {
  if (!handle) return null;
  return `https://instagram.com/${handle.replace(/^@/, "")}`;
}

export function pluralize(n: number, one: string, many = one + "s"): string {
  return `${n} ${n === 1 ? one : many}`;
}
