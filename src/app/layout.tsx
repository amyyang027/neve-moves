import type { Metadata } from "next";
import { Inter, Marcellus } from "next/font/google";
import Link from "next/link";
import "./globals.css";
import { BRAND } from "@/lib/brand";

const inter = Inter({ variable: "--font-inter", subsets: ["latin"] });
const marcellus = Marcellus({
  variable: "--font-marcellus",
  weight: "400",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Neve Moves",
  description: "Run a K-pop dance cover project end to end.",
};

const NAV = [
  { href: "/", label: "Dashboard" },
  { href: "/projects", label: "Projects" },
  { href: "/members", label: "Members" },
  { href: "/about", label: "About" },
];

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${marcellus.variable} h-full`}
    >
      <body className="min-h-full">
        <header className="border-b border-border bg-surface/80 backdrop-blur">
          <div className="mx-auto flex max-w-5xl flex-wrap items-center gap-x-8 gap-y-2 px-4 py-3">
            <Link href="/" className="flex items-baseline gap-2">
              <span className="font-display text-2xl tracking-[0.14em] text-ink">
                NEVE
              </span>
              <span className="text-xs font-semibold uppercase tracking-[0.3em] text-muted">
                Moves
              </span>
            </Link>
            <nav className="flex flex-wrap gap-x-6 gap-y-1 text-sm font-medium text-muted">
              {NAV.map((item) => (
                <Link key={item.href} href={item.href} className="hover:text-accent">
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>
        </header>

        <div className="border-b border-border bg-[var(--warn-soft)] px-4 py-1.5 text-center text-xs text-[var(--warn)]">
          Prototype · local data only · ships with clearly-labelled{" "}
          <strong>SAMPLE DATA</strong>
        </div>

        <main className="mx-auto max-w-5xl px-4 py-8">{children}</main>

        <footer className="mx-auto max-w-5xl px-4 py-10 text-xs text-muted">
          Neve Moves prototype · Phase 1 · every &ldquo;AI&rdquo; feature is a
          mock — see the README ·{" "}
          <a href={BRAND.youtubeUrl} target="_blank" rel="noreferrer" className="underline">
            YouTube
          </a>
        </footer>
      </body>
    </html>
  );
}
