import { splitSections, findSection, dodProgress } from "@/lib/markdown";
import Md from "@/components/Md";
import type { Task } from "@/lib/vault";

export default function ReviewReport({ task }: { task: Task }) {
  const sections = splitSections(task.body ?? "");
  const dod = findSection(sections, [
    "Критерии готовности",
    "DoD",
    "Definition of Done",
  ]);
  const notes = findSection(sections, ["Заметки"]);
  const progress = dodProgress(dod);

  return (
    <div className="mt-3 space-y-2 text-sm">
      {/* DoD block - always visible if dod exists */}
      {dod && (
        <div>
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-medium text-neutral-500">DoD</span>
            {progress && (
              <span className="text-xs text-neutral-400">
                {progress.done}/{progress.total} · {progress.pct}%
              </span>
            )}
          </div>
          {progress && (
            <div className="w-full h-1 bg-neutral-100 rounded-full mb-2">
              <div
                className="h-1 bg-emerald-500 rounded-full"
                style={{ width: `${progress.pct}%` }}
              />
            </div>
          )}
          <div className="text-xs text-neutral-600">
            <Md project={task.project}>{dod}</Md>
          </div>
        </div>
      )}
      {/* Notes section */}
      {notes && (
        <details className="text-xs text-neutral-600">
          <summary className="cursor-pointer text-neutral-400 hover:text-neutral-600 select-none">
            Отчёт: что сделано и как проверено
          </summary>
          <div className="mt-2">
            <Md project={task.project}>{notes}</Md>
          </div>
        </details>
      )}
      {/* Fallback */}
      {!dod && !notes && (
        <p className="text-xs text-neutral-400">
          Отчёт не заполнен — открой задачу
        </p>
      )}
    </div>
  );
}
