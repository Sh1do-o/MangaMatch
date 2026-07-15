"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/library", label: "Library" },
  { href: "/search", label: "Search" },
  { href: "/recommendations", label: "Recommend" },
];

export default function Nav() {
  const pathname = usePathname();

  return (
    <nav className="sticky top-0 z-40 bg-[#0B1220]/80 backdrop-blur-md border-b border-[#1E2C42] shadow-[0_4px_20px_rgba(0,0,0,0.25)]">
    <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#E8C77E]/50 to-transparent" />
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        {/* Brand – gradient gold for a subtle premium touch */}
        <Link
          href="/"
          className="group font-[family-name:var(--font-display)] text-sm font-semibold uppercase tracking-[0.15em] transition-all duration-300"
        >
          <span className="text-gradient-gold">MangaMatch</span>
        </Link>

        {/* Nav links */}
        <div className="flex items-center gap-1">
          {links.map((link) => {
            const isActive =
              pathname === link.href ||
              (link.href !== "/" && pathname.startsWith(link.href));

            return (
              <Link
                key={link.href}
                href={link.href}
                className={`group relative rounded-full px-4 py-2 font-mono text-xs uppercase tracking-wide transition-all duration-300 ${
                  isActive
                    ? "bg-[#F5F5F0] text-[#0B1220] shadow-[0_0_15px_rgba(245,245,240,0.2)]"
                    : "text-[#8CA0BE] hover:bg-[#1E2C42]/50 hover:text-[#F5F5F0]"
                }`}
              >
                {link.label}

                {/* Active indicator – a subtle gold underline dot */}
                {isActive && (
                  <span className="absolute -bottom-0.5 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full bg-[#E8C77E] opacity-80" />
                )}
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}