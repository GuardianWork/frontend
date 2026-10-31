import Markdown from "react-markdown";
import { descriptionMarkdownPrefix, isFormattedDescription } from "@/lib/job-description";
import "./job-description.css";

export function JobDescription({ value }: { value: string }) {
  return (
    <div className="job-description">
      {isFormattedDescription(value) ? (
        <Markdown
          skipHtml
          allowedElements={["p", "strong", "em", "ul", "ol", "li", "br"]}
          unwrapDisallowed
        >
          {value.slice(descriptionMarkdownPrefix.length)}
        </Markdown>
      ) : (
        <p className="job-description-plain">{value}</p>
      )}
    </div>
  );
}
