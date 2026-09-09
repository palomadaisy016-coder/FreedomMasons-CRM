"use client";
import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const links = [
  { href: "/", label: "Dashboard" },
  { href: "/leads", label: "Leads" },
  { href: "/projects", label: "Chats" },
  { href: "/invoices", label: "Sales" },
  { href: "/call-history", label: "Call History" },
  { href: "/attendance", label: "Attendance" },
  { href: "/analytics", label: "Analytics" },
  { href: "/tasks", label: "Tasks" },
  { href: "/lost-clients", label: "Lost Clients" },
];

export default function NavBar({ email }) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();
  const [menuOpen, setMenuOpen] = useState(false);

  const signOut = async () => {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  };

  return (
    <div className="border-b border-line bg-white relative">
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-3 flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center gap-2 shrink-0 whitespace-nowrap">
          <img src="/logo.png" alt="Company logo" className="h-7 w-auto" />
          <span className="font-semibold text-ink whitespace-nowrap">Outreach 360 CRM</span>
        </div>

        {/* Desktop nav - hidden on mobile */}
        <nav className="hidden md:flex flex-wrap items-center gap-1 flex-1 justify-center min-w-0">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={`px-3 py-1.5 rounded text-sm whitespace-nowrap ${
                pathname === l.href ? "bg-ink text-white" : "text-muted hover:bg-paper"
              }`}
            >
              {l.label}
            </Link>
          ))}
        </nav>

        {/* Desktop right side */}
        <div className="hidden md:flex items-center gap-3 text-sm text-muted shrink-0 whitespace-nowrap">
          <span>{email}</span>
          <button onClick={signOut} className="px-3 py-1.5 rounded border border-line hover:bg-paper whitespace-nowrap">
            Sign out
          </button>
        </div>

        {/* Mobile hamburger button - hidden on desktop */}
        <button
          onClick={() => setMenuOpen((v) => !v)}
          className="md:hidden p-2 rounded hover:bg-paper"
          aria-label="Toggle menu"
        >
          {menuOpen ? (
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          ) : (
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          )}
        </button>
      </div>

      {/* Mobile dropdown menu */}
      {menuOpen && (
        <div className="md:hidden border-t border-line bg-white">
          <nav className="flex flex-col px-4 py-2">
            {links.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                onClick={() => setMenuOpen(false)}
                className={`px-3 py-2.5 rounded text-sm ${
                  pathname === l.href ? "bg-ink text-white" : "text-muted hover:bg-paper"
                }`}
              >
                {l.label}
              </Link>
            ))}
            <div className="border-t border-line mt-2 pt-2 flex items-center justify-between px-3">
              <span className="text-xs text-muted truncate">{email}</span>
              <button
                onClick={signOut}
                className="px-3 py-1.5 rounded border border-line hover:bg-paper text-sm shrink-0"
              >
                Sign out
              </button>
            </div>
          </nav>
        </div>
      )}
    </div>
  );
}
