"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

const ALLOWED_EDITORS = ["eric.adam@freedommasons.co", "jerry.harper@freedommasons.co"];

export default function CallHistoryPage() {
  const supabase = createClient();
  const [me, setMe] = useState(null);
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [searchName, setSearchName] = useState("");
  const [filterDate, setFilterDate] = useState("");

  const [form, setForm] = useState({ calling_date: "", employee_name: "", calls_made: "" });
  const [editingId, setEditingId] = useState(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setMe(data.user));
  }, []);

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase.from("call_history").select("*").order("calling_date", { ascending: false });
      setRows(data || []);
      setLoading(false);
    };
    load();

    const channel = supabase
      .channel("call-history-changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "call_history" }, load)
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, []);

  const canEdit = ALLOWED_EDITORS.includes(me?.email);

  const filtered = rows.filter((r) => {
    const matchesName = searchName ? (r.employee_name || "").toLowerCase().includes(searchName.toLowerCase()) : true;
    const matchesDate = filterDate ? r.calling_date === filterDate : true;
    return matchesName && matchesDate;
  });

  const resetForm = () => {
    setForm({ calling_date: "", employee_name: "", calls_made: "" });
    setEditingId(null);
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!canEdit || saving) return;
    setSaving(true);
    if (editingId) {
      await supabase.from("call_history").update(form).eq("id", editingId);
    } else {
      await supabase.from("call_history").insert({ ...form, created_by: me?.id });
    }
    resetForm();
    setSaving(false);
  };

  const startEdit = (row) => {
    setForm({
      calling_date: row.calling_date || "",
      employee_name: row.employee_name || "",
      calls_made: row.calls_made || "",
    });
    setEditingId(row.id);
  };

  const remove = async (id) => {
    if (!canEdit) return;
    if (!confirm("Delete this entry?")) return;
    await supabase.from("call_history").delete().eq("id", id);
  };

  if (loading) return <p className="text-sm text-muted">Loading…</p>;

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-lg font-semibold text-ink">Yearly Calling History</h1>

      <div className="flex flex-wrap gap-3 items-end">
        <div className="w-full sm:w-auto">
          <label className="block text-xs text-muted mb-1">Search employee</label>
          <input
            value={searchName}
            onChange={(e) => setSearchName(e.target.value)}
            placeholder="Employee name…"
            className="text-sm w-full sm:w-auto"
          />
        </div>
        <div className="w-full sm:w-auto">
          <label className="block text-xs text-muted mb-1">Filter by date</label>
          <input
            type="date"
            value={filterDate}
            onChange={(e) => setFilterDate(e.target.value)}
            className="text-sm w-full sm:w-auto"
          />
        </div>
        {(searchName || filterDate) && (
          <button
            onClick={() => {
              setSearchName("");
              setFilterDate("");
            }}
            className="text-xs text-muted underline"
          >
            Clear filters
          </button>
        )}
      </div>

      {canEdit && (
        <form onSubmit={submit} className="flex flex-wrap gap-3 items-end border border-line rounded-lg p-3 bg-paper">
          <div className="w-full sm:w-auto">
            <label className="block text-xs text-muted mb-1">Date</label>
            <input
              type="date"
              required
              value={form.calling_date}
              onChange={(e) => setForm({ ...form, calling_date: e.target.value })}
              className="text-sm w-full sm:w-auto"
            />
          </div>
          <div className="w-full sm:w-auto sm:flex-1 sm:min-w-[160px]">
            <label className="block text-xs text-muted mb-1">Employee</label>
            <input
              required
              value={form.employee_name}
              onChange={(e) => setForm({ ...form, employee_name: e.target.value })}
              placeholder="Employee name"
              className="text-sm w-full"
            />
          </div>
          <div className="w-full sm:w-28">
            <label className="block text-xs text-muted mb-1">Calls made</label>
            <input
              required
              value={form.calls_made}
              onChange={(e) => setForm({ ...form, calls_made: e.target.value })}
              placeholder="e.g. 45"
              className="text-sm w-full"
            />
          </div>
          <button
            type="submit"
            disabled={saving}
            className="w-full sm:w-auto px-4 py-2 rounded bg-accent text-white text-sm font-medium disabled:opacity-60"
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

      <div className="border border-line rounded-lg overflow-x-auto">
        <table className="w-full text-sm min-w-[480px]">
          <thead className="bg-paper border-b border-line">
            <tr>
              <th className="text-left px-3 py-2 font-medium text-ink whitespace-nowrap">Date</th>
              <th className="text-left px-3 py-2 font-medium text-ink whitespace-nowrap">Employee</th>
              <th className="text-left px-3 py-2 font-medium text-ink whitespace-nowrap">Calls Made</th>
              {canEdit && <th className="text-left px-3 py-2 font-medium text-ink whitespace-nowrap">Actions</th>}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr>
                <td colSpan={canEdit ? 4 : 3} className="text-center text-muted py-6">
                  No entries found.
                </td>
              </tr>
            )}
            {filtered.map((r) => (
              <tr key={r.id} className="border-b border-line last:border-0">
                <td className="px-3 py-2 whitespace-nowrap">{r.calling_date}</td>
                <td className="px-3 py-2 whitespace-nowrap">{r.employee_name}</td>
                <td className="px-3 py-2 whitespace-nowrap">{r.calls_made}</td>
                {canEdit && (
                  <td className="px-3 py-2 whitespace-nowrap">
                    <div className="flex gap-3">
                      <button onClick={() => startEdit(r)} className="text-accent underline">
                        Edit
                      </button>
                      <button onClick={() => remove(r.id)} className="text-danger underline">
                        Delete
                      </button>
                    </div>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-muted sm:hidden -mt-2">Swipe the table sideways to see all columns.</p>
    </div>
  );
}
