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
function readKey(me, other) {
  return `unread_last_read::${me}::${other}`;
}
function lastRead(me, other) {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(readKey(me, other));
}
function markRead(me, other) {
  if (typeof window === "undefined") return;
  localStorage.setItem(readKey(me, other), new Date().toISOString());
}

function fileKind(name) {
  const ext = (name || "").split(".").pop()?.toLowerCase();
  if (["png", "jpg", "jpeg", "gif", "webp"].includes(ext)) return "image";
  if (["mp3", "wav", "webm", "m4a", "ogg"].includes(ext)) return "voice";
  return "file";
}

function fileIcon(name) {
  const ext = (name || "").split(".").pop()?.toLowerCase();
  if (ext === "pdf") return "📄";
  if (["doc", "docx"].includes(ext)) return "📝";
  if (["xls", "xlsx", "csv"].includes(ext)) return "📊";
  if (["ppt", "pptx"].includes(ext)) return "📽️";
  return "📎";
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

  const [recording, setRecording] = useState(false);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

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
      const other = otherOf(key, myEmail);
      const lastIncoming = msgs.filter((m) => m.status !== myEmail).slice(-1)[0];
      const readAt = lastRead(myEmail, other);
      const unread = lastIncoming && (!readAt || lastIncoming.created_at > readAt);
      return { key, other, last, unread };
    })
    .sort((a, b) => new Date(b.last?.created_at || 0) - new Date(a.last?.created_at || 0));

  const thread = active ? myMessages.filter((m) => m.client === convKey(myEmail, active)) : [];

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [thread.length, active]);

  useEffect(() => {
    if (active && myEmail) markRead(myEmail, active);
  }, [active, thread.length, myEmail]);

  const openChat = (email) => {
    const clean = (email || "").trim().toLowerCase();
    if (!clean || clean === myEmail?.toLowerCase()) return;
    setActive(clean);
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

  const uploadAndSend = async (file, kindOverride) => {
    if (!file || !active) return;
    setSending(true);
    const path = `${Date.now()}-${file.name}`;
    const { error: uploadError } = await supabase.storage.from("chat-images").upload(path, file);
    if (!uploadError) {
      const { data } = supabase.storage.from("chat-images").getPublicUrl(path);
      const kind = kindOverride || fileKind(file.name);
      await supabase.from("projects").insert({
        name: data.publicUrl,
        client: convKey(myEmail, active),
        notes: "",
        status: myEmail,
        created_by: me?.id || null,
        file_type: kind,
        file_name: file.name,
      });
    }
    setSending(false);
  };

  const sendFile = async (e) => {
    const file = e.target.files?.[0];
    await uploadAndSend(file);
    if (fileRef.current) fileRef.current.value = "";
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = async () => {
        const blob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        const file = new File([blob], `voice-${Date.now()}.webm`, { type: "audio/webm" });
        stream.getTracks().forEach((t) => t.stop());
        await uploadAndSend(file, "voice");
      };

      mediaRecorder.start();
      setRecording(true);
    } catch (err) {
      alert("Microphone access is needed to record a voice message.");
    }
  };

  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
    setRecording(false);
  };

  if (loading) return <p className="text-sm text-muted">Loading…</p>;

  return (
    <div className="flex h-[calc(100vh-140px)] border border-line rounded-lg overflow-hidden">
      <div className="w-64 border-r border-line bg-paper flex flex-col shrink-0">
        <div className="p-3 border-b border-line flex flex-col gap-2">
          <input
            value={newEmail}
            onChange={(e) => setNewEmail(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && openChat(newEmail)}
            placeholder="Teammate's email"
            className="w-full text-sm"
          />
          <button
            onClick={() => openChat(newEmail)}
            className="w-full px-3 py-1.5 rounded bg-accent text-white text-sm font-medium"
          >
            Start chat
          </button>
        </div>
        <div className="flex-1 overflow-y-auto">
          {conversations.length === 0 && (
            <p className="text-xs text-muted p-3">No conversations yet — enter an email above to start one.</p>
          )}
          {conversations.map((c) => (
            <button
              key={c.key}
              onClick={() => openChat(c.other)}
              className={`w-full text-left px-3 py-2 text-sm border-b border-line hover:bg-white flex items-center justify-between gap-2 ${
                active === c.other ? "bg-white font-medium" : ""
              }`}
            >
              <div className="min-w-0">
                <div className="truncate">{c.other}</div>
                <div className="text-xs text-muted truncate">
                  {c.last?.file_type === "image"
                    ? "📷 Image"
                    : c.last?.file_type === "voice"
                    ? "🎤 Voice message"
                    : c.last?.file_type === "file"
                    ? `📎 ${c.last?.file_name || "File"}`
                    : c.last?.notes || ""}
                </div>
              </div>
              {c.unread && active !== c.other && (
                <span className="shrink-0 w-2.5 h-2.5 rounded-full bg-danger" />
              )}
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
                      {m.file_type === "image" ? (
                        <img src={m.name} alt="Shared attachment" className="rounded max-w-full max-h-64 object-cover" />
                      ) : m.file_type === "voice" ? (
                        <audio controls src={m.name} className="max-w-full" />
                      ) : m.file_type === "file" ? (
                        
                          href={m.name}
                          download={m.file_name}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={`flex items-center gap-2 underline ${mine ? "text-white" : "text-accent"}`}
                        >
                          <span>{fileIcon(m.file_name)}</span>
                          <span className="truncate">{m.file_name || "Download file"}</span>
                        </a>
                      ) : m.name ? (
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
              <input
                type="file"
                accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.csv,.ppt,.pptx"
                ref={fileRef}
                onChange={sendFile}
                className="hidden"
                id="dm-file-input"
              />
              <label
                htmlFor="dm-file-input"
                className="px-3 py-2 rounded border border-line cursor-pointer text-sm hover:bg-paper shrink-0"
                title="Attach file"
              >
                📎
              </label>

              <button
                type="button"
                onClick={recording ? stopRecording : startRecording}
                className={`px-3 py-2 rounded border text-sm shrink-0 ${
                  recording ? "bg-danger text-white border-danger animate-pulse" : "border-line hover:bg-paper"
                }`}
                title={recording ? "Stop recording" : "Record voice message"}
              >
                {recording ? "⏹️" : "🎤"}
              </button>

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
