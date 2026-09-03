"use client";

import { useState } from "react";
import { useTable } from "@/lib/useTable";
import { Modal, Field, Badge, PrimaryButton, GhostButton, EmptyState, fmtDate } from "../../components/ui";

const STATUSES = ["Planning", "Drafting", "Review", "Complete"];
const TONE = { Planning: "default", Drafting: "accent", Review: "accent", Complete: "success" };

function ProjectForm({ initial, leads, onSave, onCancel, onDelete }) {
  const [f, setF] = useState(
    initial || {
      name: "",
      client: "",
      lead_id: "",
      status: "Planning",
      start_date: "",
      due_date: "",
      budget: "",
      notes: "",
    }
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
      <Field label="Project name">
        <input value={f.name} onChange={set("name")} required />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Client">
          <input value={f.client} onChange={set("client")} />
        </Field>
        <Field label="Linked lead">
          <select value={f.lead_id || ""} onChange={set("lead_id")}>
            <option value="">None</option>
            {leads.map((l) => (
              <option key={l.id} value={l.id}>
                {l.name}
              </option>
            ))}
          </select>
        </Field>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Start date">
          <input type="date" value={f.start_date || ""} onChange={set("start_date")} />
        </Field>
        <Field label="Due date">
          <input type="date" value={f.due_date || ""} onChange={set("due_date")} />
        </Field>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Budget">
          <input type="number" value={f.budget} onChange={set("budget")} />
        </Field>
        <Field label="Status">
          <select value={f.status} onChange={set("status")}>
            {STATUSES.map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
        </Field>
      </div>
      <Field label="Scope notes">
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

export default function ProjectsPage() {
  const { rows, loading, add, update, remove } = useTable("projects");
  const leadsTable = useTable("leads");
  const [modal, setModal] = useState(null);

  if (loading || leadsTable.loading) return <p className="text-sm text-muted">Loading…</p>;

  const leadName = (id) => leadsTable.rows.find((l) => l.id === id)?.name || "";

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-lg font-semibold text-ink">Projects</h1>
        <PrimaryButton onClick={() => setModal({})}>Add project</PrimaryButton>
      </div>

      <div className="grid gap-2">
        {rows.map((p) => (
          <div
            key={p.id}
            onClick={() => setModal(p)}
            className="bg-white border border-line rounded-lg px-4 py-3 flex items-center justify-between cursor-pointer hover:border-accent"
          >
            <div>
              <div className="text-sm font-medium">{p.name}</div>
              <div className="text-xs text-muted mt-0.5">
                {[p.client || leadName(p.lead_id), p.due_date ? `Due ${fmtDate(p.due_date)}` : null]
                  .filter(Boolean)
                  .join(" · ")}
              </div>
            </div>
            <Badge text={p.status} tone={TONE[p.status]} />
          </div>
        ))}
        {rows.length === 0 && (
          <EmptyState text="No projects logged yet." actionLabel="Add project" onAction={() => setModal({})} />
        )}
      </div>

      {modal && (
        <Modal title={modal.id ? "Edit project" : "New project"} onClose={() => setModal(null)}>
          <ProjectForm
            initial={modal.id ? modal : null}
            leads={leadsTable.rows}
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
