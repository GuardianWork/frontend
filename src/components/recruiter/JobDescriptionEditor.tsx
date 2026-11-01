import { useEffect } from "react";
import { EditorContent, Extension, useEditor, useEditorState } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { Markdown } from "@tiptap/markdown";
import { Plugin } from "@tiptap/pm/state";
import { Bold, Italic, List, ListOrdered, Undo2, Redo2 } from "lucide-react";
import {
  descriptionDocument,
  descriptionMarkdownPrefix,
  isFormattedDescription,
} from "@/lib/job-description";
import "./job-description.css";

export function JobDescriptionEditor({
  value,
  onChange,
  disabled,
  invalid = false,
  onBlur,
  errorId,
}: {
  value: string;
  onChange: (value: string) => void;
  disabled: boolean;
  invalid?: boolean;
  onBlur?: () => void;
  errorId?: string;
}) {
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
      <EditorContent editor={editor} />
      <span className="jp-hint" id="job-description-count">
        {Array.from(value).length.toLocaleString("vi-VN")} / 10.000
      </span>
    </div>
  );
}
