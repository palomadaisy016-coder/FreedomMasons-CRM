"use client";

import { useState } from "react";
import { useTable } from "@/lib/useTable";
import { Modal, Field, PrimaryButton, GhostButton, EmptyState, fmtDate } from "../../components/ui";

function TaskForm({ initial, projects, onSave, onCancel }) {
  const [f, setF] = useState(initial || { title: "", project_id: "", assignee: "", due_date: "", done: false });
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (!f.title.trim()) return;
        onSave(f);
      }}
      className="grid gap-3"
    >
      <Field label="Task">
        <input value={f.title} onChange={set("title")} required />
      </Field>
      <Field label="Related project">
        <select value={f.project_id || ""} onChange={set("project_id")}>
          <option value="">None</option>
          {projects.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Assignee">
          <input value={f.assignee} onChange={set("assignee")} />
        </Field>
        <Field label="Due date">
          <input type="date" value={f.due_date || ""} onChange={set("due_date")} />
        </Field>
      </div>
      <div className="flex justify-end gap-2 mt-1">
        <GhostButton type="button" onClick={onCancel}>
          Cancel
        </GhostButton>
        <PrimaryButton type="submit">Save</PrimaryButton>
      </div>
    </form>
  );
}

export default function TasksPage() {
  const { rows, loading, add, update, remove } = useTable("tasks");
  const projectsTable = useTable("projects");
  const [modal, setModal] = useState(null);

  if (loading || projectsTable.loading) return <p className="text-sm text-muted">Loading…</p>;

  const projectName = (id) => projectsTable.rows.find((p) => p.id === id)?.name || "";
  const sorted = [...rows].sort(
    (a, b) => Number(a.done) - Number(b.done) || (a.due_date || "").localeCompare(b.due_date || "")
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-lg font-semibold text-ink">Tasks</h1>
        <PrimaryButton onClick={() => setModal({})}>Add task</PrimaryButton>
      </div>

      <div className="grid gap-2">
        {sorted.map((t) => (
          <div
            key={t.id}
            className={`bg-white border border-line rounded-lg px-4 py-3 flex items-center gap-3 ${
              t.done ? "opacity-60" : ""
            }`}
          >
            <input type="checkbox" checked={!!t.done} onChange={() => update(t.id, { done: !t.done })} />
            <div className="flex-1 min-w-0">
              <div className={`text-sm font-medium ${t.done ? "line-through" : ""}`}>{t.title}</div>
              <div className="text-xs text-muted mt-0.5">
                {[projectName(t.project_id), t.assignee].filter(Boolean).join(" · ") || "Unassigned"}
              </div>
            </div>
            <span className="text-xs text-muted">{fmtDate(t.due_date)}</span>
            <button onClick={() => setModal(t)} className="text-xs text-accent">
              Edit
            </button>
            <button onClick={() => remove(t.id)} className="text-xs text-muted">
              Remove
            </button>
          </div>
        ))}
        {rows.length === 0 && <EmptyState text="No tasks yet." actionLabel="Add task" onAction={() => setModal({})} />}
      </div>

      {modal && (
        <Modal title={modal.id ? "Edit task" : "New task"} onClose={() => setModal(null)}>
          <TaskForm
            initial={modal.id ? modal : null}
            projects={projectsTable.rows}
            onSave={async (data) => {
              if (modal.id) await update(modal.id, data);
              else await add(data);
              setModal(null);
            }}
            onCancel={() => setModal(null)}
          />
        </Modal>
      )}
    </div>
  );
}
