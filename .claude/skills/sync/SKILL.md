---
name: sync
description: Load current project and task context from this vault. Use when user says "sync", "status", "что по проектам", "обзор", or at the start of a session to get up to speed.
user_invocable: true
---

# sync

Загрузить актуальное состояние проектов и задач из vault.

## Vault location

Корень текущего репозитория (папка, содержащая `CLAUDE.md` и `projects/`). Если рабочая директория глубже — поднимись до корня git-репо.

## What to read

1. `_rules.md` — конвенции vault
2. `_dashboard.md` — общая картина
3. Для каждой папки в `projects/`:
   - `projects/X/X.md` — статус, приоритет, метрики, топ-задача
   - `roadmap.md` — фазы и планы
   - `tasks/*.md` — статусы и RICE (frontmatter достаточно; для скорости можно `grep` по `status:`/`rice_*`/`summary:`)

## How to present the result

Краткая сводка на русском:

```
## Проекты
- **[название]** — статус: X, приоритет: Y
  - Топ-задача: [название] (RICE: N)
  - Фаза роадмапа: [текущая]

## Активные задачи (todo + doing)
| Проект | Задача | Статус | RICE |

## Недавно завершённые (последние 5)
```

Активные задачи — по убыванию RICE. Не пересказывать файлы целиком — только ключевые поля.

## Important rules

- Навык read-only: ничего не изменять
- После сводки спросить пользователя, над чем работаем
