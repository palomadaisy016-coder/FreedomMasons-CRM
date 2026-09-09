"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

const ALLOWED_EDITORS = ["eric.adam@freedommasons.co", "jerry.harper@freedommasons.co"];
const STATUS_OPTIONS = ["Present", "Absent", "Late", "Half-day"];

function statusColor(status) {
  if (status === "Present") return "bg-green-100 text-green-700";
  if (status === "Absent") return "bg-red-100 text-red-700";
  if (status === "Late") return "bg-yellow-100 text-yellow-700";
  if (status === "Half-day") return "bg-blue-100 text-blue-700";
  return "bg-gray-100 text-gray-700";
}

export default function AttendancePage() {
  const supabase = createClient();
  const [me, setMe] = useState(null);
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [filterDate, setFilterDate] = useState("");

  const [form, setForm] = useState({
    work_date: "",
    employee_name: "",
    check_in: "",
    check_out: "",
    status: "Present",
  });
  const [editingId, setEditingId] = useState(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setMe(data.user));
  }, []);

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase.from("attendance").select("*").order("work_date", { ascending: false });
      setRows(data || []);
      setLoading(false);
    };
    load();

    const channel = supabase
      .channel("attendance-changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "attendance" }, load)
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, []);

  const canEdit = ALLOWED_EDITORS.includes(me?.email);

  const filtered = filterDate ? rows.filter((r) => r.work_date === filterDate) : rows;

  const resetForm = () => {
    setForm({ work_date: "", employee_name: "", check_in: "", check_out: "", status: "Present" });
    setEditingId(null);
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!canEdit || saving) return;
    setSaving(true);
    const payload = {
      work_date: form.work_date,
      employee_name: form.employee_name,
      check_in: form.check_in || null,
      check_out: form.check_out || null,
      status: form.status,
    };
    if (editingId) {
      await supabase.from("attendance").update(payload).eq("id", editingId);
    } else {
      await supabase.from("attendance").insert({ ...payload, created_by: me?.id });
    }
    resetForm();
    setSaving(false);
  };

  const startEdit = (row) => {
    setForm({
      work_date: row.work_date || "",
      employee_name: row.employee_name || "",
      check_in: row.check_in || "",
      check_out: row.check_out || "",
      status: row.status || "Present",
    });
    setEditingId(row.id);
  };

  const remove = async (id) => {
    if (!canEdit) return;
    if (!confirm("Delete this entry?")) return;
    await supabase.from("attendance").delete().eq("id", id);
  };

  if (loading) return <p className="text-sm text-muted">Loading…</p>;

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-lg font-semibold text-ink">Daily Employee Attendance</h1>

      <div className="flex flex-wrap gap-3 items-end">
        <div>
          <label className="block text-xs text-muted mb-1">Filter by date</label>
          <input
            type="date"
            value={filterDate}
            onChange={(e) => setFilterDate(e.target.value)}
            className="text-sm"
          />
        </div>
        {filterDate && (
          <button onClick={() => setFilterDate("")} className="text-xs text-muted underline">
            Clear filter
          </button>
        )}
      </div>

      {canEdit && (
        <form onSubmit={submit} className="flex flex-wrap gap-3 items-end border border-line rounded-lg p-3 bg-paper">
          <div>
            <label className="block text-xs text-muted mb-1">Date</label>
            <input
              type="date"
              required
              value={form.work_date}
              onChange={(e) => setForm({ ...form, work_date: e.target.value })}
              className="text-sm"
            />
          </div>
          <div>
            <label className="block text-xs text-muted mb-1">Employee</label>
            <input
              required
              value={form.employee_name}
              onChange={(e) => setForm({ ...form, employee_name: e.target.value })}
              placeholder="Employee name"
              className="text-sm"
            />
          </div>
          <div>
            <label className="block text-xs text-muted mb-1">Check-in</label>
            <input
              type="time"
              value={form.check_in}
              onChange={(e) => setForm({ ...form, check_in: e.target.value })}
              className="text-sm"
            />
          </div>
          <div>
            <label className="block text-xs text-muted mb-1">Check-out</label>
            <input
              type="time"
              value={form.check_out}
              onChange={(e) => setForm({ ...form, check_out: e.target.value })}
              className="text-sm"
            />
          </div>
          <div>
            <label className="block text-xs text-muted mb-1">Status</label>
            <select
              value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value })}
              className="text-sm"
            >
              {STATUS_OPTIONS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
          <button
            type="submit"
            disabled={saving}
            className="px-4 py-2 rounded bg-accent text-white text-sm font-medium disabled:opacity-60"
          >
            {editingId ? "Update entry" : "Add entry"}
          </button>
          {editingId && (
            <button type="button" onClick={resetForm} className="text-sm text-muted underline">
              Cancel
            </button>
          )}
        </form>
      )}

      <div className="border border-line rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-paper border-b border-line">
            <tr>
              <th className="text-left px-3 py-2 font-medium text-ink">Date</th>
              <th className="text-left px-3 py-2 font-medium text-ink">Employee</th>
              <th className="text-left px-3 py-2 font-medium text-ink">Check-in</th>
              <th className="text-left px-3 py-2 font-medium text-ink">Check-out</th>
              <th className="text-left px-3 py-2 font-medium text-ink">Status</th>
              {canEdit && <th className="text-left px-3 py-2 font-medium text-ink">Actions</th>}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr>
                <td colSpan={canEdit ? 6 : 5} className="text-center text-muted py-6">
                  No entries found.
                </td>
              </tr>
            )}
            {filtered.map((r) => (
              <tr key={r.id} className="border-b border-line last:border-0">
                <td className="px-3 py-2">{r.work_date}</td>
                <td className="px-3 py-2">{r.employee_name}</td>
                <td className="px-3 py-2">{r.check_in || "—"}</td>
                <td className="px-3 py-2">{r.check_out || "—"}</td>
                <td className="px-3 py-2">
                  <span className={`px-2 py-0.5 rounded text-xs font-medium ${statusColor(r.status)}`}>
                    {r.status}
                  </span>
                </td>
                {canEdit && (
                  <td className="px-3 py-2 flex gap-3">
                    <button onClick={() => startEdit(r)} className="text-accent underline">
                      Edit
                    </button>
                    <button onClick={() => remove(r.id)} className="text-danger underline">
                      Delete
                    </button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
