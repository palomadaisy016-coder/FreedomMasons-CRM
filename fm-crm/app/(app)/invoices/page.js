"use client";

import { useState } from "react";
import { useTable } from "@/lib/useTable";
import { Modal, Field, Badge, PrimaryButton, GhostButton, EmptyState, money, fmtDate } from "../../components/ui";

const STATUSES = ["Draft", "Sent", "Paid", "Overdue"];
const TONE = { Draft: "default", Sent: "accent", Paid: "success", Overdue: "danger" };

function InvoiceForm({ initial, projects, onSave, onCancel, onDelete }) {
  const [f, setF] = useState(
    initial || { project_id: "", client: "", amount: "", status: "Draft", issue_date: "", due_date: "" }
  );
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (!f.amount) return;
        onSave(f);
      }}
      className="grid gap-3"
    >
      <Field label="Project">
        <select value={f.project_id || ""} onChange={set("project_id")}>
          <option value="">Unlinked</option>
          {projects.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
      </Field>
      <Field label="Client / bill to">
        <input value={f.client} onChange={set("client")} />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Amount">
          <input type="number" value={f.amount} onChange={set("amount")} required />
        </Field>
        <Field label="Status">
          <select value={f.status} onChange={set("status")}>
            {STATUSES.map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
        </Field>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Issue date">
          <input type="date" value={f.issue_date || ""} onChange={set("issue_date")} />
        </Field>
        <Field label="Due date">
          <input type="date" value={f.due_date || ""} onChange={set("due_date")} />
        </Field>
      </div>
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

export default function InvoicesPage() {
  const { rows, loading, add, update, remove } = useTable("invoices");
  const projectsTable = useTable("projects");
  const [modal, setModal] = useState(null);

  if (loading || projectsTable.loading) return <p className="text-sm text-muted">Loading…</p>;

  const projectName = (id) => projectsTable.rows.find((p) => p.id === id)?.name || "";

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-lg font-semibold text-ink">Invoices</h1>
        <PrimaryButton onClick={() => setModal({})}>Add invoice</PrimaryButton>
      </div>

      <div className="grid gap-2">
        {rows.map((inv) => (
          <div
            key={inv.id}
            onClick={() => setModal(inv)}
            className="bg-white border border-line rounded-lg px-4 py-3 flex items-center justify-between cursor-pointer hover:border-accent"
          >
            <div>
              <div className="text-sm font-medium">{inv.client || projectName(inv.project_id) || "Unlinked invoice"}</div>
              <div className="text-xs text-muted mt-0.5">
                {[projectName(inv.project_id), inv.due_date ? `Due ${fmtDate(inv.due_date)}` : null]
                  .filter(Boolean)
                  .join(" · ")}
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium">{money(inv.amount)}</span>
              <Badge text={inv.status} tone={TONE[inv.status]} />
            </div>
          </div>
        ))}
        {rows.length === 0 && (
          <EmptyState text="No invoices yet." actionLabel="Add invoice" onAction={() => setModal({})} />
        )}
      </div>

      {modal && (
        <Modal title={modal.id ? "Edit invoice" : "New invoice"} onClose={() => setModal(null)}>
          <InvoiceForm
            initial={modal.id ? modal : null}
            projects={projectsTable.rows}
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
