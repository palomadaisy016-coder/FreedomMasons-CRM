"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      setError(error.message);
      return;
    }
    router.push("/");
    router.refresh();
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-paper px-4">
      <form onSubmit={handleSubmit} className="w-full max-w-sm bg-white border border-line rounded-lg p-6">
        <img src="/logo.png" alt="Company logo" className="h-10 w-auto mb-4" />
        <h1 className="text-lg font-semibold text-ink mb-1">Freedom Masons CRM</h1>
        <p className="text-sm text-muted mb-5">Sign in with your team account.</p>
        <div className="grid gap-3">
          <label className="text-xs text-muted">
            Email
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="mt-1" />
          </label>
          <label className="text-xs text-muted">
            Password
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="mt-1"
            />
          </label>
        </div>
        {error && <p className="text-sm text-danger mt-3">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="mt-5 w-full bg-accent text-white rounded py-2 text-sm font-medium disabled:opacity-60"
        >
          {loading ? "Signing in…" : "Sign in"}
        </button>
        <p className="text-xs text-muted mt-4">
          No account yet? Ask your admin to add you in the Supabase dashboard (Authentication → Users).
        </p>
      </form>
    </div>
  );
}
