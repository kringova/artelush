import { NextResponse } from "next/server";
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { VAULT_PATH, getAllTasks } from "@/lib/vault";

export const runtime = "nodejs";

/** Пометить/снять «next up» у задачи. Пишет next_up в frontmatter, коммит+пуш (как /api/approve). */
export async function POST(req: Request) {
  let body: { key?: string; value?: boolean };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "bad json" }, { status: 400 });
  }
  const key = (body.key ?? "").trim();
  const value = body.value === true;
  if (!key) return NextResponse.json({ error: "no key" }, { status: 400 });

  const task = getAllTasks().find((t) => t.key === key);
  if (!task) return NextResponse.json({ error: "task not found" }, { status: 404 });

  const abs = path.join(VAULT_PATH, task.file);
  let md: string;
  try {
    md = fs.readFileSync(abs, "utf8");
  } catch {
    return NextResponse.json({ error: "file read failed" }, { status: 500 });
  }

  const today = new Date().toISOString().slice(0, 10);
  const has = /^next_up:.*$/m.test(md);
  let changed = md;
  if (value) {
    changed = has
      ? md.replace(/^next_up:.*$/m, "next_up: true")
      : md.replace(/^status:\s*.*$/m, (m) => `${m}\nnext_up: true`);
  } else {
    changed = has ? md.replace(/^next_up:.*\n?/m, "") : md;
  }
  if (changed !== md) {
    changed = changed.replace(/^updated:\s*.*$/m, `updated: ${today}`);
    fs.writeFileSync(abs, changed, "utf8");
  }

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
      git("commit", "-m", `next-up: ${key} ${value ? "on" : "off"}`);
      git("pull", "--rebase", "--autostash");
      git("push");
      pushed = true;
    } catch (e) {
      console.error("next-up git push failed:", e);
      return NextResponse.json({ error: "git push failed", detail: String(e) }, { status: 500 });
    }
  }
  return NextResponse.json({ ok: true, key, value, pushed });
}
