"use client";

import { useState, useEffect, useRef } from "react";
import { useTable } from "@/lib/useTable";
import { Modal, Field, PrimaryButton, GhostButton, EmptyState } from "../../components/ui";

function fmtDateTime(d) {
  if (!d) return "—";
  const dt = new Date(d);
  if (isNaN(dt)) return d;
  return dt.toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
}

function toLocalInputValue(iso) {
  if (!iso) return "";
  const dt = new Date(iso);
  if (isNaN(dt)) return "";
  const pad = (n) => String(n).padStart(2, "0");
  return `${dt.getFullYear()}-${pad(dt.getMonth() + 1)}-${pad(dt.getDate())}T${pad(dt.getHours())}:${pad(
    dt.getMinutes()
  )}`;
}

function TaskForm({ initial, onSave, onCancel, onDelete }) {
  const [f, setF] = useState(
    initial
      ? { ...initial, follow_up_at: toLocalInputValue(initial.follow_up_at) }
      : {
          title: "",
          client_name: "",
          contact: "",
          email: "",
          company_name: "",
          follow_up_at: "",
          remarks: "",
        }
  );
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (!f.title.trim()) return;
        const payload = {
          ...f,
          follow_up_at: f.follow_up_at ? new Date(f.follow_up_at).toISOString() : null,
          notified: false,
        };
        onSave(payload);
      }}
      className="grid gap-3"
    >
      <Field label="Task title">
        <input value={f.title} onChange={set("title")} required placeholder="Follow up call" />
      </Field>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Field label="Client name">
          <input value={f.client_name} onChange={set("client_name")} />
        </Field>
        <Field label="Company name">
          <input value={f.company_name} onChange={set("company_name")} />
        </Field>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Field label="Contact">
          <input value={f.contact} onChange={set("contact")} placeholder="Phone" />
        </Field>
        <Field label="Email">
          <input value={f.email} onChange={set("email")} />
        </Field>
      </div>
      <Field label="Follow-up date & time">
        <input type="datetime-local" value={f.follow_up_at} onChange={set("follow_up_at")} className="w-full" />
      </Field>
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

export default function TasksPage() {
  const { rows, loading, add, update, remove } = useTable("tasks");
  const [modal, setModal] = useState(null);
  const [query, setQuery] = useState("");
  const [notifStatus, setNotifStatus] = useState(
    typeof Notification !== "undefined" ? Notification.permission : "unsupported"
  );
  const checkedRef = useRef(new Set());

  useEffect(() => {
    if (typeof Notification === "undefined") return;
    if (Notification.permission === "default") {
      Notification.requestPermission().then(setNotifStatus);
    }
  }, []);

  useEffect(() => {
    if (typeof Notification === "undefined") return;
    const interval = setInterval(() => {
      if (Notification.permission !== "granted") return;
      const now = Date.now();
      rows.forEach((t) => {
        if (
          !t.done &&
          !t.notified &&
          t.follow_up_at &&
          new Date(t.follow_up_at).getTime() <= now &&
          !checkedRef.current.has(t.id)
        ) {
          checkedRef.current.add(t.id);
          new Notification("Follow-up time", {
            body: `Time to follow up with ${t.client_name || t.title}`,
          });
          update(t.id, { notified: true });
        }
      });
    }, 30000);
    return () => clearInterval(interval);
  }, [rows, update]);

  if (loading) return <p className="text-sm text-muted">Loading…</p>;

  const q = query.trim().toLowerCase();
  const filtered = q
    ? rows.filter((t) =>
        `${t.title} ${t.client_name || ""} ${t.company_name || ""}`.toLowerCase().includes(q)
      )
    : rows;
  const sorted = [...filtered].sort(
    (a, b) => Number(a.done) - Number(b.done) || (a.follow_up_at || "").localeCompare(b.follow_up_at || "")
  );

  return (
    <div>
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4 gap-3">
        <h1 className="text-lg font-semibold text-ink">Tasks</h1>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search tasks…"
            className="w-full sm:w-56"
          />
          <PrimaryButton onClick={() => setModal({})} className="whitespace-nowrap">
            Add task
          </PrimaryButton>
        </div>
      </div>

      {notifStatus === "denied" && (
        <p className="text-xs text-danger mb-3">
          Browser notifications are blocked for this site — enable them in your browser's site settings to get
          follow-up alerts.
        </p>
      )}

      <div className="grid gap-2">
        {sorted.map((t) => (
          <div
            key={t.id}
            className={`bg-white border border-line rounded-lg px-4 py-3 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 ${
              t.done ? "opacity-60" : ""
            }`}
          >
            <div className="flex items-start sm:items-center gap-3 min-w-0 flex-1">
              <input
                type="checkbox"
                checked={!!t.done}
                onChange={() => update(t.id, { done: !t.done })}
                className="mt-1 sm:mt-0 shrink-0"
              />
              <div className="min-w-0 flex-1">
                <div className={`text-sm font-medium break-words ${t.done ? "line-through" : ""}`}>{t.title}</div>
                <div className="text-xs text-muted mt-0.5 truncate">
                  {[t.client_name, t.company_name].filter(Boolean).join(" · ") || "No client set"}
                </div>
              </div>
            </div>
            <div className="flex items-center justify-between sm:justify-end gap-3 pl-7 sm:pl-0 shrink-0">
              <span className="text-xs text-muted whitespace-nowrap">{fmtDateTime(t.follow_up_at)}</span>
              <div className="flex items-center gap-3">
                <button onClick={() => setModal(t)} className="text-xs text-accent">
                  Edit
                </button>
                <button onClick={() => remove(t.id)} className="text-xs text-muted">
                  Remove
                </button>
              </div>
            </div>
          </div>
        ))}
        {filtered.length === 0 && rows.length > 0 && (
          <p className="text-sm text-muted py-6 text-center">No tasks match "{query}".</p>
        )}
        {rows.length === 0 && <EmptyState text="No tasks yet." actionLabel="Add task" onAction={() => setModal({})} />}
      </div>

      {modal && (
        <Modal title={modal.id ? "Edit task" : "New task"} onClose={() => setModal(null)}>
          <TaskForm
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
