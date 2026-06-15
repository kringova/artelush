import Link from "next/link";
import { notFound } from "next/navigation";
import { readProjectDoc } from "@/lib/vault";
import Md from "@/components/Md";

export const dynamic = "force-dynamic";

const DOC_LABELS: Record<string, string> = {
  brief: "Бриф",
  decisions: "Решения",
  scenarios: "Сценарии",
  roadmap: "Роадмап",
};

export default async function ProjectDocPage({
  params,
}: {
  params: Promise<{ slug: string; name: string }>;
}) {
  const { slug, name } = await params;

  // whitelist — защита от path traversal
  if (!DOC_LABELS[name]) notFound();

  const content = readProjectDoc(slug, name);
  if (content === null) notFound();

  const label = DOC_LABELS[name];

  return (
    <div>
      <Link
        href={`/projects/${slug}`}
        className="text-sm text-neutral-400 hover:text-neutral-600"
      >
        ← {slug}
      </Link>

      <h1 className="mt-3 text-2xl font-semibold tracking-tight">
        {slug} · {label}
      </h1>

      <div className="mt-6">
        <Md project={slug}>{content}</Md>
      </div>
    </div>
  );
}
