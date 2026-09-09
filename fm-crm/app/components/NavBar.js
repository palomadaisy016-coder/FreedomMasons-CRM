"use client";
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
  const signOut = async () => {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  };
  return (
    <div className="border-b border-line bg-white">
      <div className="max-w-7xl mx-auto px-6 py-3 flex flex-wrap items-center justify-between gap-y-3">
        <div className="flex items-center gap-2 shrink-0 whitespace-nowrap">
          <img src="/logo.png" alt="Company logo" className="h-7 w-auto" />
          <span className="font-semibold text-ink whitespace-nowrap">Outreach 360 CRM</span>
        </div>

        <nav className="flex flex-wrap items-center gap-1 flex-1 justify-center min-w-0">
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

        <div className="flex items-center gap-3 text-sm text-muted shrink-0 whitespace-nowrap">
          <span className="hidden md:inline">{email}</span>
          <button onClick={signOut} className="px-3 py-1.5 rounded border border-line hover:bg-paper whitespace-nowrap">
            Sign out
          </button>
        </div>
      </div>
    </div>
  );
}
