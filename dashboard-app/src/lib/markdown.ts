export interface Section {
  heading: string;
  content: string;
}

/** Разбить тело md на секции по заголовкам `## `. */
export function splitSections(body: string): Section[] {
  const sections: Section[] = [];
  let cur: Section | null = null;
  for (const line of body.split("\n")) {
    const m = line.match(/^##\s+(.*)$/);
    if (m) {
      if (cur) sections.push({ heading: cur.heading, content: cur.content.trim() });
      cur = { heading: m[1].trim(), content: "" };
    } else if (cur) {
      cur.content += line + "\n";
    }
  }
  if (cur) sections.push({ heading: cur.heading, content: cur.content.trim() });
  return sections;
}

/** Найти секцию по любому из имён (регистронезависимо). */
export function findSection(
  sections: Section[],
  names: string[]
): string | null {
  const lower = names.map((n) => n.toLowerCase());
  const hit = sections.find((s) =>
    lower.some((n) => s.heading.toLowerCase().startsWith(n))
  );
  return hit ? hit.content : null;
}

/**
 * Прогресс по DoD: считает `- [x]` (выполнено) и `- [ ]` (не выполнено).
 * Возвращает null, если чекбоксов нет.
 */
export function dodProgress(
  dod: string | null
): { done: number; total: number; pct: number } | null {
  if (!dod) return null;
  const all = dod.match(/^\s*-\s*\[[ xX]\]/gm) || [];
  if (all.length === 0) return null;
  const done = (dod.match(/^\s*-\s*\[[xX]\]/gm) || []).length;
  const total = all.length;
  return { done, total, pct: Math.round((done / total) * 100) };
}

/**
 * Преобразовать Obsidian-ссылки `[[...]]` в markdown-ссылки дашборда.
 * Сначала задачи (`[[tasks/x]]`), потом проекты (`[[proj/proj]]`).
 */
export function resolveWikiLinks(md: string, projectSlug: string): string {
  return md
    .replace(
      /\[\[tasks\/([^\]|]+)\|([^\]]+)\]\]/g,
      (_m, slug, label) => `[${label}](/projects/${projectSlug}/tasks/${slug})`
    )
    .replace(
      /\[\[tasks\/([^\]]+)\]\]/g,
      (_m, slug) => `[${slug}](/projects/${projectSlug}/tasks/${slug})`
    )
    .replace(
      /\[\[([^\]/|]+)\/[^\]|]+\|([^\]]+)\]\]/g,
      (_m, proj, label) => `[${label}](/projects/${proj})`
    )
    .replace(
      /\[\[([^\]/|]+)\/[^\]]+\]\]/g,
      (_m, proj) => `[${proj}](/projects/${proj})`
    );
}
