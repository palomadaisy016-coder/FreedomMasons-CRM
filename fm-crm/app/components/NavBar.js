"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const links = [
  { href: "/", label: "Dashboard" },
  { href: "/leads", label: "Leads" },
  { href: "/projects", label: "Projects" },
  { href: "/invoices", label: "Invoices" },
  { href: "/tasks", label: "Tasks" },
];

export default function NavBar({ email }) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();

  const signOut = async () => {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  };

  return (
    <div className="border-b border-line bg-white">
      <div className="max-w-5xl mx-auto px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <img src="/logo.png" alt="Company logo" className="h-7 w-auto" />
            <span className="font-semibold text-ink">Freedom Masons CRM</span>
          </div>
          <nav className="flex gap-1">
            {links.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className={`px-3 py-1.5 rounded text-sm ${
                  pathname === l.href ? "bg-ink text-white" : "text-muted hover:bg-paper"
                }`}
              >
                {l.label}
              </Link>
            ))}
          </nav>
        </div>
        <div className="flex items-center gap-3 text-sm text-muted">
          <span>{email}</span>
          <button onClick={signOut} className="px-3 py-1.5 rounded border border-line hover:bg-paper">
            Sign out
          </button>
        </div>
      </div>
    </div>
  );
}
