---
name: backlog
description: Add a task to a project backlog in this vault. Use when user says "добавь в беклог", "добавь задачу", "запиши в беклог", or asks to add something to backlog.
user_invocable: true
---

# backlog

Завести новую задачу в vault.

## Vault location

Корень текущего репозитория (папка, содержащая `CLAUDE.md` и `projects/`).

## Steps

1. Определи проект: папки в `projects/`. Непонятно из контекста — выбери наиболее вероятный и отметь сомнение в «Вопросах» задачи.
2. Прочитай шаблон `_templates/task.md`.
3. **Назначь id тикета**: максимальный `id:` среди всех `projects/*/tasks/*.md` + 1
   (`grep -rhoE '^id:\s*[0-9]+' projects/*/tasks/ | grep -oE '[0-9]+' | sort -n | tail -1`).
4. Придумай короткое kebab-case имя файла на английском (например `csv-export.md`).
5. Оцени время и RICE:
   - `est_days` — идеальные дни (1 ≈ 6 фокус-часов); большинство задач 0.5–3
   - `rice_effort` = `est_days / 5` (чел-недели, min 0.1) — выводить, не выдумывать
   - `rice_reach` (1–10), `rice_impact` (1–5), `rice_confidence` (50–100)
   - RICE = (reach × impact × confidence%) / effort
6. Запиши `projects/<project>/tasks/<имя>.md`:
   - frontmatter: `id`, `status: todo`, `created`/`updated` = сегодня, `est_days`, RICE, `summary`, `project: "[[<project>/<project>]]"`
   - «Что нужно сделать» — чёткое описание
   - «Почему важно» — связь с целью проекта
   - «Критерии готовности (DoD)» — наблюдаемые УСЛОВИЯ результата (что станет правдой), не действия
   - «Пререквизиты» — зависимости/блокеры (или «нет»)
   - «Пошаговый план» — упорядоченные шаги «как делать» (обычно при взятии в работу); не дублирует DoD
   - «Вопросы» — прояснить ДО старта; писать в файл, НЕ спрашивать в чате
   - «Заметки» — происхождение задачи
7. Если vault — git-репо: commit + push.
8. Подтверди пользователю: номер тикета, файл, RICE.

## Important rules

- `id` уникален — не переиспользовать и не пропускать
- Содержимое задач — на русском
- Кратко и actionable, не спека
