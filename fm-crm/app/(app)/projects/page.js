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

// Guess file type category from mime/extension for rendering + icon
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

  // Voice recording state
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

  // Unified uploader for images, documents, and voice notes
  const
