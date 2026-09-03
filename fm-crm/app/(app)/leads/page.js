"use client";

import { useState } from "react";
import { useTable } from "@/lib/useTable";
import { Modal, Field, PrimaryButton, GhostButton, money } from "../../components/ui";

const STAGES = ["New", "Contacted", "Quoted", "Won", "Lost"];

function LeadForm({ initial, onSave, onCancel, onDelete }) {
  const [f, setF] = useState(
    initial || { name: "", company: "", phone: "", email: "", source: "", stage: "New", value: "", notes: "" }
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
      <div className="grid grid-cols-2 gap-3">
        <Field label="Source">
          <input value={f.source} onChange={set("source")} />
        </Field>
        <Field label="Est. value">
          <input type="number" value={f.value} onChange={set("value")} />
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

  if (loading) return <p className="text-sm text-muted">Loading…</p>;

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-lg font-semibold text-ink">Leads</h1>
        <PrimaryButton onClick={() => setModal({})}>Add lead</PrimaryButton>
      </div>

      <div className="flex gap-4 overflow-x-auto pb-2">
        {STAGES.map((stage) => {
          const items = rows.filter((l) => l.stage === stage);
          return (
            <div key={stage} className="min-w-[210px] flex-shrink-0">
              <div className="text-xs font-semibold text-muted uppercase tracking-wide mb-2 pb-1 border-b border-line">
                {stage} ({items.length})
              </div>
              <div className="grid gap-2">
                {items.map((l) => (
                  <div
                    key={l.id}
                    onClick={() => setModal(l)}
                    className="bg-white border border-line rounded-lg px-3 py-2 cursor-pointer hover:border-accent"
                  >
                    <div className="text-sm font-medium">{l.name}</div>
                    {l.company && <div className="text-xs text-muted">{l.company}</div>}
                    {Number(l.value) > 0 && <div className="text-xs text-accent mt-1">{money(l.value)}</div>}
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
