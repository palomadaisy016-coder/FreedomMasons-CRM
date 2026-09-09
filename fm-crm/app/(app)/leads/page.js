"use client";

import { useState } from "react";
import { useTable } from "@/lib/useTable";
import { Modal, Field, PrimaryButton, GhostButton } from "../../components/ui";

const STAGES = ["New", "Contacted", "Quoted", "Won", "Lost"];

function LeadForm({ initial, onSave, onCancel, onDelete }) {
  const [f, setF] = useState(
    initial || { name: "", company: "", phone: "", email: "", stage: "New", notes: "" }
  );
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (!f.name.trim()) return;
        onSave(f);
      }}
      className="grid gap-3"
    >
      <Field label="Contact name">
        <input value={f.name} onChange={set("name")} required />
      </Field>
      <Field label="Company">
        <input value={f.company} onChange={set("company")} />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Phone">
          <input value={f.phone} onChange={set("phone")} />
        </Field>
        <Field label="Email">
          <input value={f.email} onChange={set("email")} />
        </Field>
      </div>
      <Field label="Stage">
        <select value={f.stage} onChange={set("stage")}>
          {STAGES.map((s) => (
            <option key={s}>{s}</option>
          ))}
        </select>
      </Field>
      <Field label="Notes">
        <textarea rows={3} value={f.notes} onChange={set("notes")} />
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

export default function LeadsPage() {
  const { rows, loading, add, update, remove } = useTable("leads");
  const [modal, setModal] = useState(null);
  const [query, setQuery] = useState("");

  if (loading) return <p className="text-sm text-muted">Loading…</p>;

  const q = query.trim().toLowerCase();
  const filtered = q
    ? rows.filter((l) => `${l.name} ${l.company || ""}`.toLowerCase().includes(q))
    : rows;

  return (
    <div>
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4 gap-3">
        <h1 className="text-lg font-semibold text-ink">Leads</h1>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search leads…"
            className="w-full sm:w-56"
          />
          <PrimaryButton onClick={() => setModal({})} className="whitespace-nowrap">
            Add lead
          </PrimaryButton>
        </div>
      </div>

      <div className="flex gap-4 overflow-x-auto pb-2 -mx-4 px-4 sm:mx-0 sm:px-0 snap-x snap-mandatory sm:snap-none">
        {STAGES.map((stage) => {
          const items = filtered.filter((l) => l.stage === stage);
          return (
            <div
              key={stage}
              className="min-w-[80vw] sm:min-w-[210px] flex-shrink-0 snap-start"
            >
              <div className="text-xs font-semibold text-muted uppercase tracking-wide mb-2 pb-1 border-b border-line whitespace-nowrap">
                {stage} ({items.length})
              </div>
              <div className="grid gap-2">
                {items.length === 0 && (
                  <p className="text-xs text-muted py-2">No leads in this stage.</p>
                )}
                {items.map((l) => (
                  <div
                    key={l.id}
                    onClick={() => setModal(l)}
                    className="bg-white border border-line rounded-lg px-3 py-2 cursor-pointer hover:border-accent"
                  >
                    <div className="text-sm font-medium truncate">{l.name}</div>
                    {l.company && <div className="text-xs text-muted truncate">{l.company}</div>}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {modal && (
        <Modal title={modal.id ? "Edit lead" : "New lead"} onClose={() => setModal(null)}>
          <LeadForm
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
