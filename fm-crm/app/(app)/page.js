"use client";

import Link from "next/link";
import { useTable } from "@/lib/useTable";
import { money, fmtDate } from "../components/ui";

function StatCard({ label, value }) {
  return (
    <div className="bg-white border border-line rounded-lg p-4">
      <div className="text-xs text-muted mb-1">{label}</div>
      <div className="text-xl font-semibold text-ink">{value}</div>
    </div>
  );
}

export default function DashboardPage() {
  const leads = useTable("leads");
  const projects = useTable("projects");
  const invoices = useTable("invoices");
  const tasks = useTable("tasks");

  const loading = leads.loading || projects.loading || invoices.loading || tasks.loading;
  if (loading) return <p className="text-sm text-muted">Loading…</p>;

  const openLeads = leads.rows.filter((l) => !["Won", "Lost"].includes(l.stage)).length;
  const activeProjects = projects.rows.filter((p) => p.status !== "Complete").length;
  const outstanding = invoices.rows
    .filter((i) => i.status !== "Paid")
    .reduce((s, i) => s + Number(i.amount || 0), 0);
  const openTasks = tasks.rows.filter((t) => !t.done).length;

  return (
    <div>
      <h1 className="text-lg font-semibold text-ink mb-4">Dashboard</h1>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
        <StatCard label="Open leads" value={openLeads} />
        <StatCard label="Active projects" value={activeProjects} />
        <StatCard label="Outstanding invoices" value={money(outstanding)} />
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
