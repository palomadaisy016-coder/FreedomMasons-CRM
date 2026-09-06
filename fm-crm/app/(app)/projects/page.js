"use client";

import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";

function convKey(a, b) {
  return [a, b].filter(Boolean).sort().join("::");
}
function otherOf(key, me) {
  const parts = key.split("::");
  return parts.find((p) => p !== me) || parts[0];
}
function fmtTime(ts) {
  if (!ts) return "";
  return new Date(ts).toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
}

export default function ChatsPage() {
  const supabase = createClient();
  const [me, setMe] = useState(null);
  const [allMessages, setAllMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [active, setActive] = useState(null);
  const [newEmail, setNewEmail] = useState("");
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const fileRef = useRef(null);
  const bottomRef = useRef(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setMe(data.user));
  }, []);

  useEffect(() => {
    let channel;
    const load = async () => {
      const { data } = await supabase.from("projects").select("*").order("created_at", { ascending: true });
      setAllMessages(data || []);
      setLoading(false);
    };
    load();

    channel = supabase
      .channel("dm-projects")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "projects" },
        (payload) => setAllMessages((prev) => [...prev, payload.new])
      )
      .subscribe();

    return () => {
      if (channel) supabase.removeChannel(channel);
    };
  }, []);

  const myEmail = me?.email;
  const myMessages = myEmail ? allMessages.filter((m) => m.client && m.client.split("::").includes(myEmail)) : [];

  const conversations = Array.from(new Set(myMessages.map((m) => m.client)))
    .map((key) => {
      const msgs = myMessages.filter((m) => m.client === key);
      const last = msgs[msgs.length - 1];
      return { key, other: otherOf(key, myEmail), last };
    })
    .sort((a, b) => new Date(b.last?.created_at || 0) - new Date(a.last?.created_at || 0));

  const thread = active ? myMessages.filter((m) => m.client === convKey(myEmail, active)) : [];

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [thread.length, active]);

  const openChat = (email) => {
    if (!email || email === myEmail) return;
    setActive(email);
    setNewEmail("");
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!text.trim() || !active || sending) return;
    setSending(true);
    await supabase.from("projects").insert({
      name: "",
      client: convKey(myEmail, active),
      notes: text.trim(),
      status: myEmail,
      created_by: me?.id || null,
    });
    setText("");
    setSending(false);
  };

  const sendImage = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !active) return;
    setSending(true);
    const path = `${Date.now()}-${file.name}`;
    const { error: uploadError } = await supabase.storage.from("chat-images").upload(path, file);
    if (!uploadError) {
      const { data } = supabase.storage.from("chat-images").getPublicUrl(path);
      await supabase.from("projects").insert({
        name: data.publicUrl,
        client: convKey(myEmail, active),
        notes: "",
        status: myEmail,
        created_by: me?.id || null,
      });
    }
    setSending(false);
    if (fileRef.current) fileRef.current.value = "";
  };

  if (loading) return <p className="text-sm text-muted">Loading…</p>;

  return (
    <div className="flex h-[calc(100vh-140px)] border border-line rounded-lg overflow-hidden">
      <div className="w-64 border-r border-line bg-paper flex flex-col shrink-0">
        <div className="p-3 border-b border-line">
          <input
            value={newEmail}
            onChange={(e) => setNewEmail(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && openChat(newEmail.trim())}
            placeholder="Start chat: teammate's email"
            className="w-full text-sm"
          />
        </div>
        <div className="flex-1 overflow-y-auto">
          {conversations.length === 0 && (
            <p className="text-xs text-muted p-3">No conversations yet — enter an email above to start one.</p>
          )}
          {conversations.map((c) => (
            <button
              key={c.key}
              onClick={() => openChat(c.other)}
              className={`w-full text-left px-3 py-2 text-sm border-b border-line hover:bg-white ${
                active === c.other ? "bg-white font-medium" : ""
              }`}
            >
              <div className="truncate">{c.other}</div>
              <div className="text-xs text-muted truncate">
                {c.last?.name ? "📷 Image" : c.last?.notes || ""}
              </div>
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 flex flex-col">
        {!active ? (
          <div className="flex-1 flex items-center justify-center text-sm text-muted">
            Select a conversation, or start a new one.
          </div>
        ) : (
          <>
            <div className="px-4 py-3 border-b border-line font-medium text-sm text-ink">{active}</div>
            <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3 bg-paper">
              {thread.length === 0 && (
                <p className="text-sm text-muted text-center mt-8">No messages yet — say hi!</p>
              )}
              {thread.map((m) => {
                const mine = m.status === myEmail;
                return (
                  <div key={m.id} className={`flex flex-col ${mine ? "items-end" : "items-start"}`}>
                    <div
                      className={`max-w-xs sm:max-w-sm rounded-lg px-3 py-2 text-sm ${
                        mine ? "bg-accent text-white" : "bg-white border border-line text-ink"
                      }`}
                    >
                      {m.name ? (
                        <img src={m.name} alt="Shared attachment" className="rounded max-w-full max-h-64 object-cover" />
                      ) : (
                        <p className="whitespace-pre-wrap break-words">{m.notes}</p>
                      )}
                    </div>
                    <span className="text-[11px] text-muted mt-1">{fmtTime(m.created_at)}</span>
                  </div>
                );
              })}
              <div ref={bottomRef} />
            </div>

            <form onSubmit={sendMessage} className="flex items-center gap-2 p-3 border-t border-line">
              <input type="file" accept="image/*" ref={fileRef} onChange={sendImage} className="hidden" id="dm-image-input" />
              <label
                htmlFor="dm-image-input"
                className="px-3 py-2 rounded border border-line cursor-pointer text-sm hover:bg-paper shrink-0"
                title="Attach image"
              >
                📎
              </label>
              <input
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Type a message…"
                className="flex-1"
              />
              <button
                type="submit"
                disabled={sending || !text.trim()}
                className="px-4 py-2 rounded bg-accent text-white text-sm font-medium disabled:opacity-60 shrink-0"
              >
                Send
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
