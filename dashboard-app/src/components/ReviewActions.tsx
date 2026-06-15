"use client";
import { useState } from "react";

/** Кнопки для задачи в review: «Закрыть» (апрув → done) и «Вернуть» (→ doing). */
export default function ReviewActions({ taskKey }: { taskKey: string }) {
  const [busy, setBusy] = useState<null | "approve" | "reject">(null);
  const [err, setErr] = useState<string | null>(null);

  async function act(kind: "approve" | "reject") {
    setBusy(kind);
    setErr(null);
    try {
      const r = await fetch(`/api/${kind}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: taskKey }),
      });
      const j = await r.json();
      if (!r.ok) {
        setErr(j.error || "ошибка");
        setBusy(null);
        return;
      }
      window.location.reload();
    } catch (e) {
      setErr(String(e));
      setBusy(null);
    }
  }

  return (
    <span className="inline-flex items-center gap-2">
      <button
        onClick={() => act("approve")}
        disabled={busy !== null}
        className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 disabled:opacity-50"
      >
        {busy === "approve" ? "Закрываю…" : "✓ Закрыть"}
      </button>
      <button
        onClick={() => act("reject")}
        disabled={busy !== null}
        className="rounded-lg px-4 py-2 text-sm font-medium text-neutral-600 ring-1 ring-inset ring-neutral-300 transition hover:bg-neutral-100 disabled:opacity-50"
      >
        {busy === "reject" ? "Возвращаю…" : "↩ Вернуть"}
      </button>
      {err && <span className="text-xs text-rose-600">{err}</span>}
    </span>
  );
}
