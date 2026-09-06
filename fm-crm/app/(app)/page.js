"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useTable } from "@/lib/useTable";
import { createClient } from "@/lib/supabase/client";
import { money, fmtDate } from "../components/ui";
function StatCard({ label, value }) {
  return (
    <div className="bg-white border border-line rounded-lg p-4">
      <div className="text-xs text-muted mb-1">{label}</div>
      <div className="text-xl font-semibold text-ink">{value}</div>
    </div>
  );
}
function readKey(me, other) {
  return `unread_last_read::${me}::${other}`;
}
export default function DashboardPage() {
  const supabase = createClient();
  const [myEmail, setMyEmail] = useState(null);
  const leads = useTable("leads");
  const projects = useTable("projects");
  const invoices = useTable("invoices");
  const tasks = useTable("tasks");
  const loading = leads.loading || projects.loading || invoices.loading || tasks.loading;

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setMyEmail(data.user?.email || null));
  }, []);

  if (loading) return <p className="text-sm text-muted">Loading...</p>;
  const openLeads = leads.rows.filter((l) => !["Won", "Lost"].includes(l.stage)).length;
  const currentYear = new Date().getFullYear();
  const yearlySales = invoices.rows
    .filter((i) => i.issue_date && Number(i.issue_date.slice(0, 4)) === currentYear)
    .reduce((s, i) => s + Number(i.amount || 0), 0);
  const openTasks = tasks.rows.filter((t) => !t.done).length;

  const incoming = myEmail
    ? projects.rows
        .filter((m) => m.client && m.client.split("::").includes(myEmail) && m.status !== myEmail)
        .sort((a, b) => (b.created_at || "").localeCompare(a.created_at || ""))
    : [];
  const latest = incoming[0];

  let unreadCount = 0;
  if (myEmail && typeof window !== "undefined") {
    const otherPartners = Array.from(
      new Set(incoming.map((m) => m.client.split("::").find((p) => p !== myEmail)))
    );
    otherPartners.forEach((other) => {
      const readAt = localStorage.getItem(readKey(myEmail, other));
      const unreadFromThem = incoming.filter(
        (m) => m.client.split("::").includes(other) && (!readAt || m.created_at > readAt)
      );
      unreadCount += unreadFromThem.length;
    });
  }

  return (
    <div>
      <div className="bg-white border border-line rounded-lg px-6 py-6 mb-6 flex items-center gap-4">
        <img src="/logo.png" alt="Company logo" className="h-12 w-auto" />
        <div>
          <h1 className="text-lg font-semibold text-ink">Outreach 360 CRM</h1>
          <p className="text-sm text-muted">Leads, projects, sales, and tasks in one place.</p>
        </div>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
        <StatCard label="Open leads" value={openLeads} />
        <Link href="/projects" className="block">
          <div className="bg-white border border-line rounded-lg p-4 hover:border-accent cursor-pointer relative">
            {unreadCount > 0 && (
              <span className="absolute -top-2 -right-2 bg-danger text-white text-xs font-semibold rounded-full h-5 min-w-5 px-1 flex items-center justify-center">
                {unreadCount}
              </span>
            )}
            <div className="text-xs text-muted mb-1">Messages</div>
            <div className="text-sm font-semibold text-ink">
              {latest ? `You got a text from ${latest.status}` : "No new messages"}
            </div>
          </div>
        </Link>
        <StatCard label={`Yearly sales (${currentYear})`} value={money(yearlySales)} />
        <StatCard label="Open tasks" value={openTasks} />
      </div>
      <div className="grid md:grid-cols-2 gap-6">
        <div>
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-sm font-semibold text-ink">Recent leads</h2>
            <Link href="/leads" className="text-xs text-accent">
              View all
            </Link>
          </div>
          <div className="grid gap-2">
            {leads.rows.slice(0, 5).map((l) => (
              <div key={l.id} className="bg-white border border-line rounded-lg px-3 py-2 flex justify-between text-sm">
                <span>{l.name}</span>
                <span className="text-muted">{l.stage}</span>
              </div>
            ))}
            {leads.rows.length === 0 && <p className="text-sm text-muted">No leads yet.</p>}
          </div>
        </div>
        <div>
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-sm font-semibold text-ink">Tasks due soon</h2>
            <Link href="/tasks" className="text-xs text-accent">
              View all
            </Link>
          </div>
          <div className="grid gap-2">
            {tasks.rows
              .filter((t) => !t.done)
              .sort((a, b) => (a.due_date || "").localeCompare(b.due_date || ""))
              .slice(0, 5)
              .map((t) => (
                <div key={t.id} className="bg-white border border-line rounded-lg px-3 py-2 flex justify-between text-sm">
                  <span>{t.title}</span>
                  <span className="text-muted">{fmtDate(t.due_date)}</span>
                </div>
              ))}
            {tasks.rows.filter((t) => !t.done).length === 0 && <p className="text-sm text-muted">Nothing pending.</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
