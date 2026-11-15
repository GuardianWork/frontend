import type { ReactNode } from "react";
import Markdown from "react-markdown";
import type { Element, ElementContent, Root, RootContent, Text } from "hast";
import { ChevronDown } from "lucide-react";
import { descriptionMarkdownPrefix, isFormattedDescription } from "@/lib/job-description";
import type { ScanFinding } from "@/services/jobScans";
import "./job-description.css";

type TextPosition = {
  node: Text;
  parent: Element | Root;
  block?: Element;
  start: number;
  end: number;
};

function sliceInline(nodes: ElementContent[], start: number, end: number): ElementContent[] {
  let offset = 0;
  const slice = (node: ElementContent): ElementContent[] => {
    if (node.type === "text") {
      const from = Math.max(0, start - offset);
      const to = Math.min(node.value.length, end - offset);
      offset += node.value.length;
      return from < to ? [{ ...node, value: node.value.slice(from, to) }] : [];
    }
    if (node.type !== "element") return [];
    if (node.tagName === "br") {
      const include = offset >= start && offset < end;
      offset++;
      return include ? [node] : [];
    }
    const children = node.children.flatMap(slice);
    return children.length ? [{ ...node, properties: { ...node.properties }, children }] : [];
  };
  return nodes.flatMap(slice);
}

// Match the rendered text, so emphasis/list markup never becomes part of a quotation.
// Ambiguous repeated passages stay in the report rather than marking an unrelated occurrence.
function annotate(findings: ScanFinding[]) {
  const processed = new WeakSet<Root>();
  return () => (tree: Root) => {
    if (processed.has(tree)) return;
    processed.add(tree);
    let text = "";
    const positions: TextPosition[] = [];
    const parents = new Map<Element, Root | Element>();
    const walk = (parent: Root | Element, block?: Element) => {
      for (const node of parent.children) {
        if (node.type === "text") {
          const start = text.length;
          text += node.value;
          positions.push({ node, parent, block, start, end: text.length });
        } else if (node.type === "element") {
          parents.set(node, parent);
          walk(node, ["p", "li"].includes(node.tagName) ? node : block);
          if (["p", "li", "br"].includes(node.tagName)) text += "\n";
        }
      }
    };
    walk(tree);
    const ranges = findings.flatMap((finding, index) => {
      if (!finding.spanText.trim()) return [];
      const start = text.indexOf(finding.spanText);
      if (start < 0 || text.lastIndexOf(finding.spanText) !== start) return [];
      return [{ start, end: start + finding.spanText.length, index }];
    });
    for (const position of positions) {
      const matches = ranges.filter(
        (range) => range.start < position.end && range.end > position.start,
      );
      if (!matches.length || !position.block) continue;
      const ids = new Set(
        String(position.block.properties.dataFindingIds ?? "")
          .split(",")
          .filter(Boolean),
      );
      matches.forEach((match) => ids.add(String(match.index)));
      position.block.properties.dataFindingIds = [...ids].join(",");
      const boundaries = [
        ...new Set([
          position.start,
          position.end,
          ...matches.flatMap((match) => [
            Math.max(match.start, position.start),
            Math.min(match.end, position.end),
          ]),
        ]),
      ].sort((a, b) => a - b);
      const replacement: RootContent[] = boundaries.slice(0, -1).map((start, index) => {
        const end = boundaries[index + 1];
        const value = position.node.value.slice(start - position.start, end - position.start);
        const active = matches.filter((match) => match.start < end && match.end > start);
        if (!active.length) return { type: "text", value };
        const severity = active.some((match) => findings[match.index].severity === "high")
          ? "high"
          : active.some((match) => findings[match.index].severity === "medium")
            ? "medium"
            : "low";
        return {
          type: "element",
          tagName: "mark",
          properties: { className: [`jp-inline-mark`, `jp-inline-mark-${severity}`] },
          children: [{ type: "text", value }],
        };
      });
      position.parent.children.splice(
        position.parent.children.indexOf(position.node),
        1,
        ...replacement,
      );
    }
    const blocks = new Map<Element, { start: number; end: number }>();
    for (const position of positions) {
      if (!position.block) continue;
      const bounds = blocks.get(position.block);
      blocks.set(position.block, { start: bounds?.start ?? position.start, end: position.end });
    }
    for (const [block, bounds] of blocks) {
      // Nested lists keep their existing structure; their child paragraphs/items annotate themselves.
      if (
        block.tagName === "li" &&
        block.children.some(
          (node) => node.type === "element" && ["p", "ul", "ol"].includes(node.tagName),
        )
      )
        continue;
      const endings = new Map<number, number[]>();
      for (const range of ranges) {
        if (range.start >= bounds.end || range.end <= bounds.start) continue;
        const after = Math.min(range.end, bounds.end);
        const punctuation = text.slice(after, bounds.end).search(/[.!?](?=\s|$)/);
        const alreadyEnded =
          /[.!?]/.test(text[after - 1]) && (after === bounds.end || /\s/.test(text[after]));
        const end = alreadyEnded ? after : punctuation < 0 ? bounds.end : after + punctuation + 1;
        endings.set(end, [...(endings.get(end) ?? []), range.index]);
      }
      if (!endings.size) continue;
      const cuts = [...new Set([...endings.keys(), bounds.end])].sort((a, b) => a - b);
      let from = bounds.start;
      const chunks: Element[] = [];
      for (const end of cuts) {
        while (from < end && /\s/.test(text[from])) from++;
        if (from >= end) continue;
        chunks.push({
          type: "element",
          tagName: "p",
          properties: { ...block.properties, dataFindingIds: (endings.get(end) ?? []).join(",") },
          children: sliceInline(block.children, from - bounds.start, end - bounds.start),
        });
        from = end;
      }
      if (block.tagName === "li") {
        delete block.properties.dataFindingIds;
        block.children = chunks;
      } else {
        const parent = parents.get(block)!;
        parent.children.splice(parent.children.indexOf(block), 1, ...chunks);
      }
    }
  };
}

function Passage({
  node,
  children,
  findings,
  listItem = false,
}: {
  node?: Element;
  children?: ReactNode;
  findings: ScanFinding[];
  listItem?: boolean;
}) {
  const indices = String(node?.properties.dataFindingIds ?? "")
    .split(",")
    .filter(Boolean)
    .map(Number);
  const Tag = listItem ? "li" : "div";
  // No findings — render normally, preserving document flow.
  if (!indices.length) return listItem ? <li>{children}</li> : <p>{children}</p>;
  return (
    <Tag className="jp-inline-passage">
      <div className="jp-inline-passage-text">{children}</div>
      <div className="jp-inline-findings" aria-label="Phân tích AI">
        {indices.map((index) => {
          const finding = findings[index];
          return (
            <details key={index} className="jp-inline-finding" open>
              <summary>
                <span>Kết quả phân tích AI · Phát hiện {index + 1}</span>
                <span className={`jp-scan-severity jp-scan-severity-${finding.severity}`}>
                  Mức độ: {{ high: "Cao", medium: "Trung bình", low: "Thấp" }[finding.severity]}
                </span>
                <ChevronDown size={16} className="jp-inline-chevron" aria-hidden="true" />
              </summary>
              <div className="jp-inline-finding-body">
                {finding.verdict === "NEEDS_REVIEW" && (
                  <p className="jp-scan-review jp-inline-needs-review">Cần kiểm tra thêm</p>
                )}
                <p className="jp-inline-finding-explanation">{finding.explanation}</p>

                {finding.citations.length > 0 && (
                  <div className="jp-inline-citations">
                    {finding.citations.map((citation, ci) => (
                      <details key={`${citation.nodeId}:${ci}`} className="jp-inline-citation" open>
                        <summary>
                          <span className="jp-inline-citation-ref">
                            {citation.documentNumber} · {citation.label}
                          </span>
                          <ChevronDown size={16} className="jp-inline-chevron" aria-hidden="true" />
                        </summary>
                        <div className="jp-inline-citation-body">
                          {citation.applicability === "UNVERIFIED" && (
                            <p className="jp-scan-review">Cần xác minh hiệu lực điều khoản</p>
                          )}
                          {!citation.quoteGrounded && (
                            <p className="jp-scan-review">
                              Trích dẫn cần được đối chiếu với văn bản gốc.
                            </p>
                          )}
                          <blockquote>{citation.quote}</blockquote>
                        </div>
                      </details>
                    ))}
                  </div>
                )}
              </div>
            </details>
          );
        })}
      </div>
    </Tag>
  );
}

export function JobAnalyzedDescription({
  value,
  findings,
}: {
  value: string;
  findings: ScanFinding[];
}) {
  // Plain legacy text is represented by text nodes, never interpreted as Markdown or HTML.
  const legacyTree: Root = {
    type: "root",
    children: value.split(/\n\s*\n/).map((paragraph) => ({
      type: "element",
      tagName: "p",
      properties: {},
      children: [{ type: "text", value: paragraph }],
    })),
  };
  const formatted = isFormattedDescription(value);
  const legacy = () => () => legacyTree;
  return (
    <div className={`job-description${formatted ? "" : " jp-analyzed-plain"}`}>
      <Markdown
        skipHtml
        allowedElements={["p", "strong", "em", "ul", "ol", "li", "br", "mark"]}
        unwrapDisallowed
        rehypePlugins={formatted ? [annotate(findings)] : [legacy, annotate(findings)]}
        components={{
          p: ({ node, children }) => (
            <Passage node={node} findings={findings}>
              {children}
            </Passage>
          ),
          li: ({ node, children }) => (
            <Passage node={node} findings={findings} listItem>
              {children}
            </Passage>
          ),
        }}
      >
        {formatted ? value.slice(descriptionMarkdownPrefix.length) : value}
      </Markdown>
    </div>
  );
}
