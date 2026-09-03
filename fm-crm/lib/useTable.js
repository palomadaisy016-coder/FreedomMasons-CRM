"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";

export function useTable(table, orderBy = "created_at") {
  const supabase = createClient();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase.from(table).select("*").order(orderBy, { ascending: false });
    if (error) setError(error.message);
    else setRows(data || []);
    setLoading(false);
  }, [table, orderBy]);

  useEffect(() => {
    load();
  }, [load]);

  const add = async (values) => {
    const { error } = await supabase.from(table).insert(values);
    if (error) {
      setError(error.message);
      return false;
    }
    await load();
    return true;
  };

  const update = async (id, values) => {
    const { error } = await supabase.from(table).update(values).eq("id", id);
    if (error) {
      setError(error.message);
      return false;
    }
    await load();
    return true;
  };

  const remove = async (id) => {
    const { error } = await supabase.from(table).delete().eq("id", id);
    if (error) {
      setError(error.message);
      return false;
    }
    await load();
    return true;
  };

  return { rows, loading, error, add, update, remove, reload: load };
}
