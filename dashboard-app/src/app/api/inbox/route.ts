import { NextResponse } from "next/server";
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { randomUUID } from "node:crypto";
import { VAULT_PATH } from "@/lib/vault";

export const runtime = "nodejs";

const INBOX_DIR = path.join(VAULT_PATH, "_inbox");

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

/** Локальный штамп вида 2026-06-12-1430 для имени файла. */
function stamp(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}-${pad(
    d.getHours()
  )}${pad(d.getMinutes())}`;
}

export async function POST(req: Request) {
  let body: { text?: string; project?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "bad json" }, { status: 400 });
  }

  const text = (body.text ?? "").trim();
  const project = (body.project ?? "").trim();
  if (!text) {
    return NextResponse.json({ error: "пустая запись" }, { status: 400 });
  }

  fs.mkdirSync(INBOX_DIR, { recursive: true });

  const now = new Date();
  const slug = `${stamp(now)}-${randomUUID().slice(0, 4)}`;
  const file = path.join(INBOX_DIR, `${slug}.md`);

  const frontmatter = [
    "---",
    `created: ${now.toISOString()}`,
    project ? `project: ${project}` : null,
    "tags: [inbox]",
    "---",
    "",
    text,
    "",
  ]
    .filter((l) => l !== null)
    .join("\n");

  fs.writeFileSync(file, frontmatter, "utf8");

  // На VPS — закоммитить и запушить обратно в репо vault.
  // Локально (без INBOX_GIT_PUSH) просто пишем файл.
  let pushed = false;
  if (process.env.INBOX_GIT_PUSH) {
    try {
      const git = (...args: string[]) =>
        execFileSync("git", args, { cwd: VAULT_PATH, stdio: "pipe" });
      git("add", path.relative(VAULT_PATH, file));
      git("commit", "-m", `inbox: ${slug}`);
      git("pull", "--rebase", "--autostash");
      git("push");
      pushed = true;
    } catch (e) {
      // Файл записан — потеря пуша не критична, разберём при следующем pull.
      console.error("inbox git push failed:", e);
    }
  }

  return NextResponse.json({ ok: true, slug, pushed });
}
