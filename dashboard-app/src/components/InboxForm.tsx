"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function InboxForm({ projects }: { projects: string[] }) {
  const router = useRouter();
  const [text, setText] = useState("");
  const [project, setProject] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!text.trim() || busy) return;
    setBusy(true);
    setMsg(null);
    try {
      const res = await fetch("/api/inbox", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, project }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error ?? "ошибка");
      }
      setText("");
      setProject("");
      setMsg("Записано ✓");
      router.refresh();
    } catch (err) {
      setMsg(err instanceof Error ? err.message : "ошибка");
    } finally {
      setBusy(false);
      setTimeout(() => setMsg(null), 2500);
    }
  }

  return (
    <form
      onSubmit={submit}
      className="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm"
    >
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Кинуть мысль… (Cmd+Enter — отправить)"
        rows={4}
        onKeyDown={(e) => {
          if ((e.metaKey || e.ctrlKey) && e.key === "Enter") submit(e);
        }}
        className="w-full resize-none rounded-lg border border-neutral-200 px-3 py-2 text-sm outline-none focus:border-[color:var(--color-accent)] focus:ring-1 focus:ring-[color:var(--color-accent)]"
      />
      <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
        <select
          value={project}
          onChange={(e) => setProject(e.target.value)}
          className="min-h-[40px] rounded-lg border border-neutral-200 px-2 py-1.5 text-sm text-neutral-600 outline-none focus:border-[color:var(--color-accent)]"
        >
          <option value="">Без проекта</option>
          {projects.map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </select>
        <div className="flex items-center gap-3">
          {msg && <span className="text-sm text-neutral-500">{msg}</span>}
          <button
            type="submit"
            disabled={busy || !text.trim()}
            className="min-h-[40px] rounded-lg bg-[color:var(--color-accent)] px-4 py-2 text-sm font-medium text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {busy ? "…" : "Добавить"}
          </button>
        </div>
      </div>
    </form>
  );
}
