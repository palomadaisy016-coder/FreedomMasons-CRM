"use client";

import { useState } from "react";
import { useTable } from "@/lib/useTable";
import { Modal, Field, PrimaryButton, GhostButton, EmptyState, money } from "../../components/ui";

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

function yearOf(dateStr) {
  return dateStr ? Number(dateStr.slice(0, 4)) : null;
}
function monthIndexOf(dateStr) {
  return dateStr ? Number(dateStr.slice(5, 7)) - 1 : null;
}

function SaleForm({ initial, onSave, onCancel, onDelete }) {
  const now = new Date();
  const [f, setF] = useState(
    initial || {
      client: "",
      amount: "",
      month: now.getMonth(),
      year: now.getFullYear(),
    }
  );
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (!f.client || !f.amount) return;
        const mm = String(Number(f.month) + 1).padStart(2, "0");
        onSave({
          client: f.client,
          amount: f.amount,
          issue_date: `${f.year}-${mm}-01`,
          status: "Paid",
          project_id: null,
          due_date: null,
        });
      }}
      className="grid gap-3"
    >
      <Field label="Agent name">
        <input value={f.client} onChange={set("client")} required />
      </Field>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Field label="Month">
          <select value={f.month} onChange={set("month")} className="w-full">
            {MONTHS.map((m, i) => (
              <option key={m} value={i}>
                {m}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Year">
          <input type="number" value={f.year} onChange={set("year")} required className="w-full" />
        </Field>
      </div>
      <Field label="Sales amount">
        <input type="number" value={f.amount} onChange={set("amount")} required />
      </Field>
      <div className="flex justify-between items-center mt-1">
        {onDelete ? (
          <button type="button" onClick={onDelete} className="text-danger text-sm">
            Delete
          </button>
        ) : (
          <span />
        )}
        <div className="flex gap-2">
          <GhostButton type="button" onClick={onCancel}>
            Cancel
          </GhostButton>
          <PrimaryButton type="submit">Save</PrimaryButton>
        </div>
      </div>
    </form>
  );
}

export default function SalesPage() {
  const { rows, loading, add, update, remove } = useTable("invoices");
  const [modal, setModal] = useState(null);
  const [query, setQuery] = useState("");
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());

  if (loading) return <p className="text-sm text-muted">Loading…</p>;

  const years = Array.from(
    new Set([now.getFullYear(), ...rows.map((r) => yearOf(r.issue_date)).filter(Boolean)])
  ).sort((a, b) => b - a);

  const q = query.trim().toLowerCase();
  const filtered = q ? rows.filter((r) => (r.client || "").toLowerCase().includes(q)) : rows;

  const yearRows = filtered.filter((r) => yearOf(r.issue_date) === Number(year));
  const agents = Array.from(new Set(yearRows.map((r) => r.client).filter(Boolean))).sort();

  const cell = (agent, mIdx) =>
    yearRows
      .filter((r) => r.client === agent && monthIndexOf(r.issue_date) === mIdx)
      .reduce((s, r) => s + Number(r.amount || 0), 0);

  const agentTotal = (agent) => MONTHS.reduce((s, _, i) => s + cell(agent, i), 0);
  const monthTotal = (mIdx) => agents.reduce((s, a) => s + cell(a, mIdx), 0);
  const grandTotal = agents.reduce((s, a) => s + agentTotal(a), 0);

  return (
    <div>
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4 gap-3">
        <h1 className="text-lg font-semibold text-ink">Sales</h1>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search agent…"
            className="w-full sm:w-56"
          />
          <select value={year} onChange={(e) => setYear(e.target.value)} className="w-full sm:w-28">
            {years.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
          <PrimaryButton onClick={() => setModal({})} className="whitespace-nowrap">
            Add sale
          </PrimaryButton>
        </div>
      </div>

      {agents.length === 0 ? (
        <EmptyState text={`No sales recorded for ${year} yet.`} actionLabel="Add sale" onAction={() => setModal({})} />
      ) : (
        <div className="overflow-x-auto mb-8 border border-line rounded-lg">
          <table className="w-full text-sm min-w-[900px]">
            <thead>
              <tr className="bg-paper text-left">
                <th className="px-3 py-2 font-medium text-ink whitespace-nowrap">Agent</th>
                {MONTHS.map((m) => (
                  <th key={m} className="px-3 py-2 font-medium text-muted text-right whitespace-nowrap">
                    {m.slice(0, 3)}
                  </th>
                ))}
                <th className="px-3 py-2 font-medium text-ink text-right whitespace-nowrap">Total</th>
              </tr>
            </thead>
            <tbody>
              {agents.map((a) => (
                <tr key={a} className="border-t border-line">
                  <td className="px-3 py-2 font-medium whitespace-nowrap">{a}</td>
                  {MONTHS.map((_, i) => (
                    <td key={i} className="px-3 py-2 text-right text-muted whitespace-nowrap">
                      {cell(a, i) ? money(cell(a, i)) : "—"}
                    </td>
                  ))}
                  <td className="px-3 py-2 text-right font-semibold text-ink whitespace-nowrap">{money(agentTotal(a))}</td>
                </tr>
              ))}
              <tr className="border-t border-line bg-paper">
                <td className="px-3 py-2 font-semibold text-ink whitespace-nowrap">Total</td>
                {MONTHS.map((_, i) => (
                  <td key={i} className="px-3 py-2 text-right font-medium text-ink whitespace-nowrap">
                    {monthTotal(i) ? money(monthTotal(i)) : "—"}
                  </td>
                ))}
                <td className="px-3 py-2 text-right font-semibold text-ink whitespace-nowrap">{money(grandTotal)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      )}
      <p className="text-xs text-muted sm:hidden -mt-6 mb-6">Swipe the table sideways to see all months.</p>

      <h2 className="text-sm font-semibold text-ink mb-2">All entries</h2>
      <div className="grid gap-2">
        {yearRows
          .slice()
          .sort((a, b) => (b.issue_date || "").localeCompare(a.issue_date || ""))
          .map((r) => (
            <div
              key={r.id}
              onClick={() =>
                setModal({
                  id: r.id,
                  client: r.client,
                  amount: r.amount,
                  month: monthIndexOf(r.issue_date),
                  year: yearOf(r.issue_date),
                })
              }
              className="bg-white border border-line rounded-lg px-4 py-3 flex items-center justify-between gap-3 cursor-pointer hover:border-accent"
            >
              <div className="min-w-0">
                <div className="text-sm font-medium truncate">{r.client}</div>
                <div className="text-xs text-muted mt-0.5">
                  {MONTHS[monthIndexOf(r.issue_date)]} {yearOf(r.issue_date)}
                </div>
              </div>
              <span className="text-sm font-medium shrink-0">{money(r.amount)}</span>
            </div>
          ))}
        {yearRows.length === 0 && <p className="text-sm text-muted py-4">No entries for {year} yet.</p>}
      </div>

      {modal && (
        <Modal title={modal.id ? "Edit sale" : "New sale"} onClose={() => setModal(null)}>
          <SaleForm
            initial={modal.id ? modal : null}
            onSave={async (data) => {
              if (modal.id) await update(modal.id, data);
              else await add(data);
              setModal(null);
            }}
            onCancel={() => setModal(null)}
            onDelete={
              modal.id
                ? async () => {
                    await remove(modal.id);
                    setModal(null);
                  }
                : null
            }
          />
        </Modal>
      )}
    </div>
  );
}
