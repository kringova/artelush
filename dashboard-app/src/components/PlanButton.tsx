"use client";
import { useState } from "react";

/** Кнопка «Запланировать»/«Запланировано» для todo-задачи — тоггл next_up через /api/next-up. */
export default function PlanButton({
  taskKey,
  planned,
}: {
  taskKey: string;
  planned: boolean;
}) {
  const [busy, setBusy] = useState(false);

  async function toggle() {
    if (busy) return;
    setBusy(true);
    try {
      const r = await fetch("/api/next-up", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: taskKey, value: !planned }),
      });
      if (r.ok) {
        window.location.reload();
      } else {
        setBusy(false);
      }
    } catch {
      setBusy(false);
    }
  }

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={busy}
      title={planned ? "Снять из запланированных" : "Запланировать — поднять наверх Todo"}
      className={`inline-flex items-center gap-1 rounded-md px-3 py-1 text-xs font-semibold transition disabled:opacity-50 ${
        planned
          ? "bg-amber-100 text-amber-700 ring-1 ring-inset ring-amber-300 hover:bg-amber-200"
          : "text-neutral-600 ring-1 ring-inset ring-neutral-300 hover:bg-neutral-100"
      }`}
    >
      📌 {busy ? "…" : planned ? "Запланировано" : "Запланировать"}
    </button>
  );
}
