import { execFileSync } from "node:child_process";
import { VAULT_PATH } from "./vault";

function gitLog(args: string[]): string {
  try {
    return execFileSync("git", ["-C", VAULT_PATH, "log", ...args], {
      stdio: ["ignore", "pipe", "ignore"],
    })
      .toString()
      .trim();
  } catch {
    return "";
  }
}

/** Дата первого коммита, добавившего файл (YYYY-MM-DD) или "". */
export function firstCommitDate(relPath: string): string {
  const out = gitLog([
    "--diff-filter=A",
    "--format=%ad",
    "--date=short",
    "--",
    relPath,
  ]);
  if (!out) return "";
  const lines = out.split("\n").filter(Boolean);
  return lines[lines.length - 1] ?? "";
}

/** Дата последнего коммита, затронувшего файл (YYYY-MM-DD) или "". */
export function lastCommitDate(relPath: string): string {
  return gitLog(["-1", "--format=%ad", "--date=short", "--", relPath]);
}

/**
 * Дата (YYYY-MM-DD), когда статус задачи ВПЕРВЫЕ стал `review` или `done` —
 * момент завершения работы агентом (стабильная, неизменная при последующих правках).
 * Реализация: `git log` по файлу с -G'^status: (review|done)', --reverse → первая строка.
 * Fallback: firstCommitDate(relPath), затем "".
 */
export function completedDate(relPath: string): string {
  const out = gitLog([
    "-G",
    "^status: (review|done)",
    "--format=%ad",
    "--date=short",
    "--reverse",
    "--",
    relPath,
  ]);
  if (out) {
    const first = out.split("\n").filter(Boolean)[0];
    if (first) return first;
  }
  // fallback: дата первого коммита создания файла
  return firstCommitDate(relPath);
}

/**
 * Полный ISO-таймстемп (с временем), когда статус задачи ВПЕРВЫЕ стал `review` или `done`.
 * Аналог completedDate, но возвращает ISO со временем (формат %cI).
 * Fallback: ISO-таймстемп первого коммита создания файла; иначе "".
 */
export function completedAt(relPath: string): string {
  const out = gitLog([
    "-G",
    "^status: (review|done)",
    "--format=%cI",
    "--reverse",
    "--",
    relPath,
  ]);
  if (out) {
    const first = out.split("\n").filter(Boolean)[0];
    if (first) return first;
  }
  // fallback: ISO-таймстемп первого коммита создания файла
  const fallback = gitLog([
    "--diff-filter=A",
    "--format=%cI",
    "--",
    relPath,
  ]);
  if (fallback) {
    const lines = fallback.split("\n").filter(Boolean);
    return lines[lines.length - 1] ?? "";
  }
  return "";
}

/**
 * Дата (YYYY-MM-DD) корневого коммита репозитория vault, либо "".
 * Задачи, уже закрытые ДО того как vault стал git-репо, при импорте получают
 * `completedDate` = этой дате (артефакт «холодного старта»), а не реальную дату
 * закрытия — такой день стоит отфильтровывать в метриках по дате закрытия.
 */
export function repoFirstCommitDate(): string {
  return gitLog(["--max-parents=0", "--format=%ad", "--date=short"])
    .split("\n")
    .filter(Boolean)
    .pop() ?? "";
}

/**
 * Карта «путь файла → ISO-время последнего коммита, затронувшего файл».
 * Один проход `git log --name-only` по всей истории — даёт сортировку по реальному
 * времени (с точностью до секунд), в отличие от date-only `updated` в frontmatter.
 */
export function lastCommitIsoMap(): Map<string, string> {
  const map = new Map<string, string>();
  const out = gitLog(["--format=C%cI", "--name-only"]);
  if (!out) return map;
  let currentIso = "";
  for (const line of out.split("\n")) {
    if (line.startsWith("C")) {
      currentIso = line.slice(1);
    } else if (line.trim() && currentIso && !map.has(line)) {
      // первая встреча файла при обходе от новых к старым = его последний коммит
      map.set(line, currentIso);
    }
  }
  return map;
}
