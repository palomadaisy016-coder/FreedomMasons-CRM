"use client";

import { useState } from "react";
import { useTable } from "@/lib/useTable";
import { Modal, Field, PrimaryButton, GhostButton, EmptyState, fmtDate } from "../../components/ui";

function LostClientForm({ initial, onSave, onCancel, onDelete }) {
  const [f, setF] = useState(
    initial || {
      client_name: "",
      contact: "",
      email: "",
      company_name: "",
      website: "",
      lost_date: "",
      project_name: "",
      remarks: "",
    }
  );
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (!f.client_name.trim()) return;
        onSave(f);
      }}
      className="grid gap-3"
    >
      <Field label="Client name">
        <input value={f.client_name} onChange={set("client_name")} required />
      </Field>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Field label="Contact">
          <input value={f.contact} onChange={set("contact")} placeholder="Phone" />
        </Field>
        <Field label="Email">
          <input value={f.email} onChange={set("email")} />
        </Field>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Field label="Company name">
          <input value={f.company_name} onChange={set("company_name")} />
        </Field>
        <Field label="Website link">
          <input value={f.website} onChange={set("website")} placeholder="https://" />
        </Field>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Field label="Project name">
          <input value={f.project_name} onChange={set("project_name")} />
        </Field>
        <Field label="Date">
          <input type="date" value={f.lost_date || ""} onChange={set("lost_date")} className="w-full" />
        </Field>
      </div>
      <Field label="Remarks">
        <textarea rows={3} value={f.remarks} onChange={set("remarks")} />
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

export default function LostClientsPage() {
  const { rows, loading, add, update, remove } = useTable("lost_clients");
  const [modal, setModal] = useState(null);
  const [query, setQuery] = useState("");

  if (loading) return <p className="text-sm text-muted">Loading…</p>;

  const q = query.trim().toLowerCase();
  const filtered = q
    ? rows.filter((c) =>
        `${c.client_name} ${c.company_name || ""} ${c.project_name || ""}`.toLowerCase().includes(q)
      )
    : rows;

  return (
    <div>
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4 gap-3">
        <h1 className="text-lg font-semibold text-ink">Lost Clients</h1>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search lost clients…"
            className="w-full sm:w-56"
          />
          <PrimaryButton onClick={() => setModal({})} className="whitespace-nowrap">
            Add lost client
          </PrimaryButton>
        </div>
      </div>

      <div className="grid gap-2">
        {filtered.map((c) => (
          <div
            key={c.id}
            onClick={() => setModal(c)}
            className="bg-white border border-line rounded-lg px-4 py-3 cursor-pointer hover:border-accent"
          >
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-0.5 sm:gap-2">
              <div className="text-sm font-medium truncate">{c.client_name}</div>
              {c.lost_date && <span className="text-xs text-muted shrink-0">{fmtDate(c.lost_date)}</span>}
            </div>
            <div className="text-xs text-muted mt-0.5 truncate">
              {[c.company_name, c.project_name].filter(Boolean).join(" · ")}
            </div>
          </div>
        ))}
        {filtered.length === 0 && rows.length > 0 && (
          <p className="text-sm text-muted py-6 text-center">No lost clients match "{query}".</p>
        )}
        {rows.length === 0 && (
          <EmptyState text="No lost clients logged yet." actionLabel="Add lost client" onAction={() => setModal({})} />
        )}
      </div>

      {modal && (
        <Modal title={modal.id ? "Edit lost client" : "New lost client"} onClose={() => setModal(null)}>
          <LostClientForm
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
