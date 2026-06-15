import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { resolveWikiLinks } from "@/lib/markdown";

export default function Md({
  children,
  project,
  className = "md-body",
}: {
  children: string;
  project: string;
  className?: string;
}) {
  return (
    <div className={className}>
      <ReactMarkdown remarkPlugins={[remarkGfm]}>
        {resolveWikiLinks(children, project)}
      </ReactMarkdown>
    </div>
  );
}
