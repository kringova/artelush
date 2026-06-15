/**
 * GanttChart — переиспользуемый Гант-компонент.
 * Используется в /roadmap (глобальный агрегатный вид) и /projects/[slug] (секция роадмапа проекта).
 */
import Link from "next/link";
import type { Task } from "@/lib/vault";
import { fmtTicket } from "@/lib/ui";
import { daysToCalendarWeeks } from "@/lib/config";

const PX_PER_WEEK = 46;
const LABEL_W = 220;
const ROW_H = 38;

function addWeeks(base: Date, weeks: number): Date {
  const d = new Date(base);
  d.setDate(d.getDate() + Math.round(weeks * 7));
  return d;
}

function fmtMonth(d: Date): string {
  return d.toLocaleDateString("ru-RU", { month: "short", year: "2-digit" });
}

function fmtDay(d: Date): string {
  return d.toLocaleDateString("ru-RU", { day: "2-digit", month: "short" });
}

const MS_WEEK = 7 * 24 * 3600 * 1000;

const BAR_COLOR: Record<string, string> = {
  done: "bg-emerald-500",
  doing: "bg-[color:var(--color-accent)]",
  todo: "bg-slate-400",
};

export function GanttChart({
  open,
  done,
}: {
  open: Task[];
  done: Task[];
}) {
  const today = new Date();

  // открытые: прогноз встык от сегодня
  let cursor = 0;
  const openBars = open.map((t) => {
    const days = t.estDays > 0 ? t.estDays : 0.5;
    const start = addWeeks(today, cursor);
    cursor += daysToCalendarWeeks(days);
    const end = addWeeks(today, cursor);
    return { t, start, end, days, kind: t.status === "doing" ? "doing" : "todo" };
  });

  // закрытые: бар заканчивается датой закрытия (updated), длина = оценка
  const doneBars = done
    .map((t) => {
      const end = new Date(t.updated);
      const days = t.estDays > 0 ? t.estDays : 0.5;
      const start = addWeeks(end, -daysToCalendarWeeks(days));
      return { t, start, end, days, kind: "done" as const };
    })
    .sort((a, b) => a.end.getTime() - b.end.getTime());

  const bars = [...doneBars, ...openBars];

  if (bars.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-neutral-200 py-8 text-center text-sm text-neutral-400">
        Нет задач
      </p>
    );
  }

  const tMin = Math.min(today.getTime(), ...bars.map((b) => b.start.getTime()));
  const tMax = Math.max(today.getTime(), ...bars.map((b) => b.end.getTime()));
  const x = (d: Date) => ((d.getTime() - tMin) / MS_WEEK) * PX_PER_WEEK;
  const trackW = ((tMax - tMin) / MS_WEEK) * PX_PER_WEEK;
  const todayLeft = x(today);

  // метки месяцев
  const ticks: { left: number; label: string }[] = [];
  let prevMonth = -1;
  for (let w = 0; w <= Math.ceil((tMax - tMin) / MS_WEEK); w++) {
    const d = new Date(tMin + w * MS_WEEK);
    if (d.getMonth() !== prevMonth) {
      ticks.push({ left: w * PX_PER_WEEK, label: fmtMonth(d) });
      prevMonth = d.getMonth();
    }
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-neutral-200 bg-white">
      <div className="relative" style={{ width: LABEL_W + trackW }}>
        {/* линия «сегодня» */}
        <div
          className="absolute bottom-0 z-0 border-l-2 border-dashed border-neutral-300"
          style={{ left: LABEL_W + todayLeft, top: 28 }}
        />
        {/* ось месяцев */}
        <div
          className="relative border-b border-neutral-200 bg-neutral-50"
          style={{ height: 28, marginLeft: LABEL_W }}
        >
          {ticks.map((tk, i) => (
            <div
              key={i}
              className="absolute top-0 h-full border-l border-neutral-200 pl-1 text-[11px] leading-7 text-neutral-400"
              style={{ left: tk.left }}
            >
              {tk.label}
            </div>
          ))}
        </div>

        {/* строки задач */}
        {bars.map((b) => (
          <div
            key={`${b.kind}-${b.t.id}`}
            className="relative border-b border-neutral-100 last:border-0"
            style={{ height: ROW_H }}
          >
            <Link
              href={`/t/${b.t.key}`}
              className="sticky left-0 z-10 flex h-full flex-col justify-center overflow-hidden bg-white px-3 hover:bg-neutral-50"
              style={{ width: LABEL_W }}
            >
              <span
                className={`truncate font-mono text-[11px] font-semibold ${
                  b.kind === "done" ? "text-neutral-400" : "text-neutral-900"
                }`}
              >
                {fmtTicket(b.t.id)}
              </span>
              <span className="truncate text-[11px] text-neutral-400">
                {b.t.summary || b.t.title}
              </span>
            </Link>
            <div
              className="absolute top-1/2 -translate-y-1/2"
              style={{ left: LABEL_W + x(b.start) }}
            >
              <div
                className={`flex h-6 items-center rounded-md px-2 text-[11px] font-medium text-white ${BAR_COLOR[b.kind]}`}
                style={{ width: Math.max(x(b.end) - x(b.start), 14) }}
                title={`${b.t.sp != null ? `${b.t.sp} SP` : `${b.days} дн`} · ${
                  b.kind === "done" ? "закрыта" : "до"
                } ${fmtDay(b.end)}`}
              >
                <span className="truncate">{fmtDay(b.end)}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function GanttLegend() {
  const items = [
    ["bg-emerald-500", "закрыто"],
    ["bg-[color:var(--color-accent)]", "в работе"],
    ["bg-slate-400", "todo (прогноз)"],
  ];
  return (
    <div className="mt-2 flex flex-wrap items-center gap-4 text-xs text-neutral-400">
      {items.map(([c, l]) => (
        <span key={l} className="flex items-center gap-1.5">
          <span className={`inline-block h-2.5 w-4 rounded ${c}`} />
          {l}
        </span>
      ))}
      <span className="flex items-center gap-1.5">
        <span className="inline-block h-3 border-l-2 border-dashed border-neutral-300" />
        сегодня
      </span>
    </div>
  );
}
