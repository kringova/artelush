import { permanentRedirect, notFound } from "next/navigation";
import { getTask } from "@/lib/vault";

export const dynamic = "force-dynamic";

/**
 * Старый длинный адрес и wiki-ссылки (по slug) → 301 на короткий канон /t/<key>.
 * Сохраняет работоспособность всех ранее расшаренных ссылок.
 */
export default async function TaskLegacyRedirect({
  params,
}: {
  params: Promise<{ slug: string; task: string }>;
}) {
  const { slug, task: taskSlug } = await params;
  const task = getTask(slug, taskSlug);
  if (!task) notFound();
  permanentRedirect(`/t/${task.key}`);
}
