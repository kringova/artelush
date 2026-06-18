import { NextResponse } from "next/server";
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { VAULT_PATH, getAllTasks } from "@/lib/vault";

export const runtime = "nodejs";

export async function POST(req: Request) {
  let body: { key?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "bad json" }, { status: 400 });
  }
  const key = (body.key ?? "").trim();
  if (!key) return NextResponse.json({ error: "no key" }, { status: 400 });

  const task = getAllTasks().find((t) => t.key === key);
  if (!task) return NextResponse.json({ error: "task not found" }, { status: 404 });
  if (task.status !== "review")
    return NextResponse.json({ error: `task not in review (${task.status})` }, { status: 409 });

  const abs = path.join(VAULT_PATH, task.file);
  let md: string;
  try {
    md = fs.readFileSync(abs, "utf8");
  } catch {
    return NextResponse.json({ error: "file read failed" }, { status: 500 });
  }

  const now = new Date().toISOString();
  const today = now.slice(0, 10);
  let changed = md.replace(/^status:\s*review\s*$/m, "status: done");
  if (changed === md)
    return NextResponse.json({ error: "status: review not found in file" }, { status: 409 });
  // закрытая задача больше не «next up» — снимаем маркер
  changed = changed.replace(/^next_up:.*\n?/m, "");
  changed = changed.replace(/^updated:\s*.*$/m, `updated: ${today}`);
  // точное время закрытия; если поля нет — добавим после updated
  if (/^closed_at:.*$/m.test(changed)) {
    changed = changed.replace(/^closed_at:.*$/m, `closed_at: ${now}`);
  } else {
    changed = changed.replace(/^updated:\s*.*$/m, (m) => `${m}\nclosed_at: ${now}`);
  }
  fs.writeFileSync(abs, changed, "utf8");

  let pushed = false;
  if (process.env.INBOX_GIT_PUSH) {
    try {
      const git = (...args: string[]) =>
        execFileSync("git", args, {
          cwd: VAULT_PATH,
          stdio: "pipe",
          env: { ...process.env, OGOROD_APPROVE: "1" },
        });
      git("add", task.file);
      git("commit", "-m", `close: ${key} approved`);
      git("pull", "--rebase", "--autostash");
      git("push");
      pushed = true;
    } catch (e) {
      console.error("approve git push failed:", e);
      return NextResponse.json({ error: "git push failed", detail: String(e) }, { status: 500 });
    }
  }
  return NextResponse.json({ ok: true, key, pushed });
}
