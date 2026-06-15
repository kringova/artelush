import { permanentRedirect, notFound } from "next/navigation";
import { getTaskById, getProject } from "@/lib/vault";
import TaskView from "@/components/TaskView";

export const dynamic = "force-dynamic";

/** Канонический адрес задачи: /t/ARTEL-0042 (или /t/42 → 301 на канон). */
export default async function TaskShortPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const num = parseInt(id.replace(/\D/g, ""), 10);
  const task = Number.isFinite(num) ? getTaskById(num) : null;
  if (!task) notFound();

  // канонизируем: /t/42 или иные формы → /t/ARTEL-0042
  if (id !== task.key) permanentRedirect(`/t/${task.key}`);

  const project = getProject(task.project);
  return <TaskView task={task} project={project} />;
}
