import type { TaskStatus } from "./vault";

export const STATUS_LABEL: Record<string, string> = {
  todo: "Todo",
  doing: "В работе",
  review: "На ревью",
  blocked: "Заблокировано",
  done: "Готово",
  cancelled: "Отменено",
  active: "Активен",
  idea: "Идея",
  paused: "Пауза",
};

/** Классы бейджа статуса задачи/проекта. */
export const STATUS_CLASS: Record<string, string> = {
  todo: "bg-slate-100 text-slate-600 ring-slate-200",
  doing: "bg-blue-50 text-blue-700 ring-blue-200",
  review: "bg-violet-50 text-violet-700 ring-violet-200",
  blocked: "bg-orange-50 text-orange-700 ring-orange-200",
  done: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  cancelled: "bg-neutral-100 text-neutral-400 ring-neutral-200 line-through",
  active: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  idea: "bg-amber-50 text-amber-700 ring-amber-200",
  paused: "bg-neutral-100 text-neutral-500 ring-neutral-200",
};

export const PRIORITY_LABEL: Record<string, string> = {
  high: "Высокий",
  medium: "Средний",
  low: "Низкий",
};

export const PRIORITY_CLASS: Record<string, string> = {
  high: "bg-rose-50 text-rose-700 ring-rose-200",
  medium: "bg-amber-50 text-amber-700 ring-amber-200",
  low: "bg-neutral-100 text-neutral-500 ring-neutral-200",
};

export const KANBAN_COLUMNS: { status: TaskStatus; label: string }[] = [
  { status: "todo", label: "Todo" },
  { status: "doing", label: "В работе" },
  { status: "done", label: "Готово" },
];

export function fmtRice(rice: number | null): string {
  return rice == null ? "—" : rice.toFixed(1);
}

/** Номер тикета: 42 → "ARTEL-0042". */
export function fmtTicket(id: number): string {
  return id ? `ARTEL-${String(id).padStart(4, "0")}` : "";
}
