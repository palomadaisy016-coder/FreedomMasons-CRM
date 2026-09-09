"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";

function getWeekKey(dateStr) {
  const d = new Date(dateStr);
  const onejan = new Date(d.getFullYear(), 0, 1);
  const week = Math.ceil(((d - onejan) / 86400000 + onejan.getDay() + 1) / 7);
  return `${d.getFullYear()}-W${String(week).padStart(2, "0")}`;
}
function getMonthKey(dateStr) {
  const d = new Date(dateStr);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

const COLORS = ["#2563eb", "#16a34a", "#f59e0b", "#dc2626", "#7c3aed", "#0891b2", "#db2777", "#65a30d"];

export default function AnalyticsPage() {
  const supabase = createClient();
  const [leads, setLeads] = useState([]);
  const [calls, setCalls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [leadsView, setLeadsView] = useState("week");
  const [callsView, setCallsView] = useState("week");

  useEffect(() => {
    const load = async () => {
      const [leadsRes, callsRes] = await Promise.all([
        supabase.from("leads").select("id, stage, created_at"),
        supabase.from("call_history").select("calling_date, employee_name, calls_made"),
      ]);
      setLeads(leadsRes.data || []);
      setCalls(callsRes.data || []);
      setLoading(false);
    };
    load();
  }, []);

  const wonLeads = leads.filter((l) => l.stage === "Won");
  const leadsGrouped = {};
  wonLeads.forEach((l) => {
    if (!l.created_at) return;
    const key = leadsView === "week" ? getWeekKey(l.created_at) : getMonthKey(l.created_at);
    leadsGrouped[key] = (leadsGrouped[key] || 0) + 1;
  });
  const leadsChartData = Object.keys(leadsGrouped)
    .sort()
    .map((key) => ({ period: key, won: leadsGrouped[key] }));

  const callsGrouped = {};
  const employeesSet = new Set();
  calls.forEach((c) => {
    if (!c.calling_date) return;
    const key = callsView === "week" ? getWeekKey(c.calling_date) : getMonthKey(c.calling_date);
    const emp = c.employee_name || "Unknown";
    employeesSet.add(emp);
    const numCalls = parseInt(c.calls_made, 10) || 0;
    if (!callsGrouped[key]) callsGrouped[key] = {};
    callsGrouped[key][emp] = (callsGrouped[key][emp] || 0) + numCalls;
  });
  const employees = Array.from(employeesSet);
  const callsChartData = Object.keys(callsGrouped)
    .sort()
    .map((key) => {
      const row = { period: key };
      employees.forEach((emp) => {
        row[emp] = callsGrouped[key][emp] || 0;
      });
      return row;
    });

  if (loading) return <p className="text-sm text-muted">Loading…</p>;

  return (
    <div className="flex flex-col gap-8">
      <h1 className="text-lg font-semibold text-ink">Analytics</h1>

      <div className="border border-line rounded-lg p-4 bg-white">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-medium text-ink">Leads Won Over Time</h2>
          <div className="flex gap-1">
            <button
              onClick={() => setLeadsView("week")}
              className={`px-3 py-1 rounded text-xs ${
                leadsView === "week" ? "bg-ink text-white" : "text-muted hover:bg-paper"
              }`}
            >
              Weekly
            </button>
            <button
              onClick={() => setLeadsView("month")}
              className={`px-3 py-1 rounded text-xs ${
                leadsView === "month" ? "bg-ink text-white" : "text-muted hover:bg-paper"
              }`}
            >
              Monthly
            </button>
          </div>
        </div>
        {leadsChartData.length === 0 ? (
          <p className="text-sm text-muted text-center py-10">No won leads yet.</p>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={leadsChartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="period" tick={{ fontSize: 12 }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
              <Tooltip />
              <Line type="monotone" dataKey="won" stroke="#2563eb" strokeWidth={2} name="Leads Won" />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      <div className="border border-line rounded-lg p-4 bg-white">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-medium text-ink">Calls per Employee</h2>
          <div className="flex gap-1">
            <button
              onClick={() => setCallsView("week")}
              className={`px-3 py-1 rounded text-xs ${
                callsView === "week" ? "bg-ink text-white" : "text-muted hover:bg-paper"
              }`}
            >
              Weekly
            </button>
            <button
              onClick={() => setCallsView("month")}
              className={`px-3 py-1 rounded text-xs ${
                callsView === "month" ? "bg-ink text-white" : "text-muted hover:bg-paper"
              }`}
            >
              Monthly
            </button>
          </div>
        </div>
        {callsChartData.length === 0 ? (
          <p className="text-sm text-muted text-center py-10">No call history yet.</p>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={callsChartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="period" tick={{ fontSize: 12 }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
              <Tooltip />
              <Legend />
              {employees.map((emp, i) => (
                <Bar key={emp} dataKey={emp} fill={COLORS[i % COLORS.length]} />
              ))}
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
