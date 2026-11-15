import { useEffect, useRef, useState } from "react";
import { EditorContent, Extension, useEditor, useEditorState } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { Markdown } from "@tiptap/markdown";
import { createPortal } from "react-dom";
import type { ScanFinding } from "@/services/jobScans";
import { ScanFindingEvidence } from "./JobScanPanel";
import { Decoration, DecorationSet } from "@tiptap/pm/view";
import { PluginKey, Plugin } from "@tiptap/pm/state";
import { Bold, Italic, List, ListOrdered, Undo2, Redo2 } from "lucide-react";
import {
  descriptionDocument,
  descriptionMarkdownPrefix,
  isFormattedDescription,
} from "@/lib/job-description";
import "./job-description.css";

const analysisKey = new PluginKey<DecorationSet>("descriptionAnalysis");
const emptyFindings: ScanFinding[] = [];
const AnalysisHighlights = Extension.create({
  name: "descriptionAnalysis",
  addProseMirrorPlugins() {
    return [
      new Plugin<DecorationSet>({
        key: analysisKey,
        state: {
          init: () => DecorationSet.empty,
          apply(transaction, previous) {
            const findings = transaction.getMeta(analysisKey) as ScanFinding[] | undefined;
            if (!findings) return transaction.docChanged ? DecorationSet.empty : previous;
            let text = "";
            const positions: number[] = [];
            transaction.doc.descendants((node, position) => {
              if (node.isTextblock && text) {
                text += "\n";
                positions.push(-1);
              }
              if (node.isText) {
                for (let i = 0; i < node.text!.length; i++) positions.push(position + i);
                text += node.text;
              }
            });
            const decorations: Decoration[] = [];
            findings.forEach((finding, index) => {
              const start = text.indexOf(finding.spanText);
              if (!finding.spanText || start < 0 || text.indexOf(finding.spanText, start + 1) >= 0)
                return;
              // Split at block boundaries; annotations never alter the editable document.
              let from = -1;
              let to = -1;
              const flush = () => {
                if (from >= 0)
                  decorations.push(
                    Decoration.inline(from, to, {
                      class: `jp-editor-mark jp-editor-mark--${finding.severity}`,
                      "data-analysis-finding": String(index),
                      tabindex: "0",
                      "aria-label": `Phát hiện AI ${index + 1}: ${finding.explanation}`,
                    }),
                  );
                from = -1;
              };
              for (let i = start; i < start + finding.spanText.length; i++) {
                const position = positions[i];
                if (position < 0) {
                  flush();
                  continue;
                }
                if (from >= 0 && position !== to) flush();
                if (from < 0) from = position;
                to = position + 1;
              }
              flush();
            });
            return DecorationSet.create(transaction.doc, decorations);
          },
        },
        props: { decorations: (state) => analysisKey.getState(state) },
      }),
    ];
  },
});

export function JobDescriptionEditor({
  value,
  onChange,
  disabled,
  invalid = false,
  onBlur,
  errorId,
  findings = emptyFindings,
  analysisTargetRef,
}: {
  findings?: ScanFinding[];
  analysisTargetRef?: (node: HTMLDivElement | null) => void;
  value: string;
  onChange: (value: string) => void;
  disabled: boolean;
  invalid?: boolean;
  onBlur?: () => void;
  errorId?: string;
}) {
  const [popup, setPopup] = useState<{ index: number; x: number; y: number } | null>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const keepPopup = () => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
  };
  const closePopup = () => {
    keepPopup();
    closeTimer.current = setTimeout(() => setPopup(null), 180);
  };
  const showFinding = (target: EventTarget | null) => {
    const mark =
      target instanceof Element ? target.closest<HTMLElement>("[data-analysis-finding]") : null;
    if (!mark) return;
    keepPopup();
    const rect = mark.getBoundingClientRect();
    setPopup({
      index: Number(mark.dataset.analysisFinding),
      x: Math.max(16, Math.min(rect.left, window.innerWidth - 376)),
      y: rect.bottom + 328 < window.innerHeight ? rect.bottom + 8 : Math.max(12, rect.top - 328),
    });
  };
  useEffect(() => {
    const dismiss = (event: Event) => {
      if (event.target instanceof Element && event.target.closest(".jp-editor-analysis-popup"))
        return;
      setPopup(null);
    };
    window.addEventListener("scroll", dismiss, true);
    window.addEventListener("resize", dismiss);
    return () => {
      window.removeEventListener("scroll", dismiss, true);
      window.removeEventListener("resize", dismiss);
    };
  }, []);
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: false,
        blockquote: false,
        code: false,
        codeBlock: false,
        horizontalRule: false,
        strike: false,
        underline: false,
        link: false,
      }),
      Markdown,
      AnalysisHighlights,
      Extension.create({
        name: "descriptionLength",
        addProseMirrorPlugins() {
          const editor = this.editor;
          return [
            new Plugin({
              filterTransaction(transaction) {
                if (!transaction.docChanged) return true;
                const document = transaction.doc.toJSON();
                const formatted = /"(bold|italic|bulletList|orderedList)"/.test(
                  JSON.stringify(document),
                );
                const serialized = formatted
                  ? descriptionMarkdownPrefix + editor.markdown!.serialize(document)
                  : transaction.doc.textBetween(0, transaction.doc.content.size, "\n");
                return Array.from(serialized).length <= 10000;
              },
            }),
          ];
        },
      }),
    ],
    content: isFormattedDescription(value)
      ? value.slice(descriptionMarkdownPrefix.length)
      : descriptionDocument(value),
    ...(isFormattedDescription(value) ? { contentType: "markdown" as const } : {}),
    editable: !disabled,
    editorProps: {
      attributes: {
        role: "textbox",
        "aria-label": "Mô tả công việc",
        "aria-multiline": "true",
        "aria-required": "true",
        "aria-describedby": "job-description-count",
      },
    },
    onUpdate: ({ editor }) => {
      const hasFormatting = JSON.stringify(editor.getJSON()).match(
        /"(bold|italic|bulletList|orderedList)"/,
      );
      onChange(
        !editor.getText().trim()
          ? ""
          : hasFormatting
            ? descriptionMarkdownPrefix + editor.getMarkdown()
            : editor.getText({ blockSeparator: "\n" }),
      );
    },
  });
  useEffect(() => {
    if (editor && !editor.isDestroyed)
      editor.view.dispatch(editor.state.tr.setMeta(analysisKey, findings));
    setPopup(null);
  }, [editor, findings, value]);
  useEffect(
    () => () => {
      if (closeTimer.current) clearTimeout(closeTimer.current);
    },
    [],
  );
  const state = useEditorState({
    editor,
    selector: ({ editor }) => ({
      bold: editor?.isActive("bold"),
      italic: editor?.isActive("italic"),
      bullet: editor?.isActive("bulletList"),
      ordered: editor?.isActive("orderedList"),
      undo: editor?.can().undo(),
      redo: editor?.can().redo(),
    }),
  });
  useEffect(() => {
    editor?.setEditable(!disabled);
  }, [editor, disabled]);
  useEffect(() => {
    if (!editor) return;
    editor.setOptions({
      editorProps: {
        attributes: {
          role: "textbox",
          "data-job-field": "description",
          "aria-label": "Mô tả công việc",
          "aria-multiline": "true",
          "aria-required": "true",
          "aria-invalid": String(invalid),
          "aria-describedby": ["job-description-count", errorId].filter(Boolean).join(" "),
        },
      },
    });
  }, [editor, invalid, errorId]);
  useEffect(() => {
    if (!editor) return;
    const current = editor.isEmpty
      ? ""
      : isFormattedDescription(value)
        ? descriptionMarkdownPrefix + editor.getMarkdown()
        : editor.getText({ blockSeparator: "\n" });
    if (current === value) return;
    if (isFormattedDescription(value))
      editor.commands.setContent(value.slice(descriptionMarkdownPrefix.length), {
        contentType: "markdown",
        emitUpdate: false,
      });
    else editor.commands.setContent(descriptionDocument(value), { emitUpdate: false });
  }, [editor, value]);
  const actions = [
    {
      label: "In đậm",
      Icon: Bold,
      pressed: state?.bold,
      run: () => editor?.chain().focus().toggleBold().run(),
    },
    {
      label: "In nghiêng",
      Icon: Italic,
      pressed: state?.italic,
      run: () => editor?.chain().focus().toggleItalic().run(),
    },
    {
      label: "Danh sách dấu đầu dòng",
      Icon: List,
      pressed: state?.bullet,
      run: () => editor?.chain().focus().toggleBulletList().run(),
    },
    {
      label: "Danh sách đánh số",
      Icon: ListOrdered,
      pressed: state?.ordered,
      run: () => editor?.chain().focus().toggleOrderedList().run(),
    },
    {
      label: "Hoàn tác",
      Icon: Undo2,
      unavailable: !state?.undo,
      run: () => editor?.chain().focus().undo().run(),
    },
    {
      label: "Làm lại",
      Icon: Redo2,
      unavailable: !state?.redo,
      run: () => editor?.chain().focus().redo().run(),
    },
  ];
  return (
    <div
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) onBlur?.();
      }}
      className="job-description-field"
      data-invalid={invalid || undefined}
    >
      <div className="job-description-toolbar" role="group" aria-label="Định dạng mô tả công việc">
        {actions.map(({ label, Icon, pressed, unavailable, run }) => (
          <button
            key={label}
            type="button"
            aria-label={label}
            title={label}
            aria-pressed={pressed}
            disabled={disabled || !editor || unavailable}
            onClick={run}
          >
            <Icon size={18} aria-hidden="true" />
          </button>
        ))}
      </div>
      <div
        onMouseOver={(event) => showFinding(event.target)}
        onMouseOut={closePopup}
        onFocus={(event) => showFinding(event.target)}
        onBlur={closePopup}
        onKeyDown={(event) => {
          if (event.key === "Escape") setPopup(null);
        }}
      >
        <EditorContent editor={editor} />
      </div>
      {analysisTargetRef && <div ref={analysisTargetRef} className="jp-editor-analysis-slot" />}
      {popup &&
        findings[popup.index] &&
        createPortal(
          <div
            className="jp-editor-analysis-popup"
            role="region"
            aria-label="Kết quả phân tích AI"
            style={{ left: popup.x, top: popup.y }}
            onMouseEnter={keepPopup}
            onMouseLeave={closePopup}
            onFocus={keepPopup}
            onBlur={closePopup}
            onKeyDown={(event) => {
              if (event.key === "Escape") setPopup(null);
            }}
          >
            <div className="jp-editor-popup-heading">
              <strong>Phát hiện {popup.index + 1}</strong>
              <span
                className={`jp-scan-severity jp-scan-severity-${findings[popup.index].severity}`}
              >
                Mức độ:{" "}
                {{ low: "Thấp", medium: "Trung bình", high: "Cao" }[findings[popup.index].severity]}
              </span>
            </div>
            <ScanFindingEvidence finding={findings[popup.index]} showExcerpt={false} />
          </div>,
          document.body,
        )}
      <span className="jp-hint" id="job-description-count">
        {Array.from(value).length.toLocaleString("vi-VN")} / 10.000
      </span>
    </div>
  );
}
