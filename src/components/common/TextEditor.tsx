import React, { useEffect } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import TextAlign from "@tiptap/extension-text-align";
import Placeholder from "@tiptap/extension-placeholder";


export interface RichTextEditorProps {
  value: string;
  onChange: (html: string) => void;
  minHeight?: number;
  placeholder: string;
  editable?: boolean;
}

/* ─────────────────────────────────────────────
   Toolbar button
───────────────────────────────────────────── */
interface TBtnProps {
  title: string;
  active?: boolean;
  disabled?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}

function TBtn({ title, active, disabled, onClick, children }: TBtnProps) {
  return (
    <button
      type="button"
      title={title}
      disabled={disabled}
      onMouseDown={(e) => {
        e.preventDefault(); // keep editor focus
        onClick();
      }}
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        width: "26px",
        height: "26px",
        borderRadius: "4px",
        border: "none",
        cursor: disabled ? "default" : "pointer",
        fontSize: "12px",
        background: active
          ? "color-mix(in srgb, var(--primary) 15%, transparent)"
          : "transparent",
        color: active ? "var(--primary)" : "var(--muted, #64748b)",
        opacity: disabled ? 0.4 : 1,
        transition: "background 0.15s, color 0.15s",
      }}
    >
      {children}
    </button>
  );
}

function Sep() {
  return (
    <span
      style={{
        width: "1px",
        height: "18px",
        background: "var(--border, rgba(0,0,0,0.1))",
        margin: "0 2px",
        display: "inline-block",
        flexShrink: 0,
      }}
    />
  );
}

/* ─────────────────────────────────────────────
   RichTextEditor
───────────────────────────────────────────── */
const RichTextEditor: React.FC<RichTextEditorProps> = ({
  value,
  onChange,
  minHeight = 160,
  placeholder = "",
  editable = true, 
}) => {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      Placeholder.configure({ placeholder }),

    ],
    content: value,
    onUpdate({ editor }) {
      onChange(editor.getHTML());
    },
  });



  // Sync external value reset (e.g. when modal reopens)
  useEffect(() => {
    if (!editor) return;
    // Only update if content actually differs to avoid cursor jumping
    if (editor.getHTML() !== value) {
      editor.commands.setContent(value, false);
    }
  }, [value, editor]);

  useEffect(() => {
  if (!editor) return;
  editor.setEditable(editable);
}, [editable, editor]);

  if (!editor) return null;

  const btn = (
    title: string,
    isActive: boolean,
    action: () => void,
    children: React.ReactNode,
  ) => (
    <TBtn title={title} active={isActive} onClick={action}>
      {children}
    </TBtn>
  );

  return (
    <div
      style={{
        border: "1px solid var(--input-border, #e2e8f0)",
        borderRadius: "var(--input-radius, 12px)",
        overflow: "hidden",
        background: "var(--card, #fff)",
      }}
    >
      {/* ── Toolbar ── */}
      {editable && (
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          gap: "2px",
          padding: "6px 8px",
          borderBottom: "1px solid var(--border, rgba(0,0,0,0.08))",
          background: "var(--input-bg, #f8fafc)",
        }}
      >
        {/* Text format */}
        {btn("Bold", editor.isActive("bold"), () => editor.chain().focus().toggleBold().run(), <strong>B</strong>)}
        {btn("Italic", editor.isActive("italic"), () => editor.chain().focus().toggleItalic().run(), <em>I</em>)}
        {btn("Underline", editor.isActive("underline"), () => editor.chain().focus().toggleUnderline().run(), <span style={{ textDecoration: "underline" }}>U</span>)}
        {btn("Strikethrough", editor.isActive("strike"), () => editor.chain().focus().toggleStrike().run(), <span style={{ textDecoration: "line-through" }}>S</span>)}

        <Sep />

        {/* Lists */}
        {btn("Bullet list", editor.isActive("bulletList"), () => editor.chain().focus().toggleBulletList().run(), <>&#8801;</>)}
        {btn("Ordered list", editor.isActive("orderedList"), () => editor.chain().focus().toggleOrderedList().run(), <>&#8788;</>)}

        <Sep />

        {/* Alignment */}
        {btn("Align left", editor.isActive({ textAlign: "left" }), () => editor.chain().focus().setTextAlign("left").run(), <>&#11003;</>)}
        {btn("Align center", editor.isActive({ textAlign: "center" }), () => editor.chain().focus().setTextAlign("center").run(), <>&#9776;</>)}
        {btn("Align right", editor.isActive({ textAlign: "right" }), () => editor.chain().focus().setTextAlign("right").run(), <>&#11004;</>)}
        {btn("Justify", editor.isActive({ textAlign: "justify" }), () => editor.chain().focus().setTextAlign("justify").run(), <>&#9636;</>)}

        <Sep />

        {/* Blocks */}
        {btn("Blockquote", editor.isActive("blockquote"), () => editor.chain().focus().toggleBlockquote().run(), <>&ldquo;</>)}
        {btn("Code block", editor.isActive("codeBlock"), () => editor.chain().focus().toggleCodeBlock().run(), <>&lt;/&gt;</>)}

        <Sep />

        {/* History */}
        {btn("Undo", false, () => editor.chain().focus().undo().run(), <>&#8617;</>)}
        {btn("Redo", false, () => editor.chain().focus().redo().run(), <>&#8618;</>)}
      
      </div>
      )}

      {/* ── Editor area ── */}
      <style>{`
        .rte-send-email .tiptap {
          min-height: ${minHeight}px;
          max-height: 240px;
          overflow-y: auto;
          padding: 10px 12px;
          outline: none;
          font-size: 13px;
          color: var(--text);
          line-height: 1.6;
        }
        .rte-send-email .tiptap p { margin: 0 0 4px; }
        .rte-send-email .tiptap p.is-editor-empty:first-child::before {
          content: attr(data-placeholder);
          color: var(--muted, #94a3b8);
          float: left;
          height: 0;
          pointer-events: none;
        }
        .rte-send-email .tiptap ul,
        .rte-send-email .tiptap ol { padding-left: 20px; margin: 4px 0; }
        .rte-send-email .tiptap blockquote {
          border-left: 3px solid var(--primary, #3b82f6);
          margin: 4px 0;
          padding-left: 10px;
          color: var(--muted, #64748b);
        }
        .rte-send-email .tiptap code {
          background: color-mix(in srgb, var(--primary) 8%, transparent);
          border-radius: 4px;
          padding: 1px 4px;
          font-size: 12px;
        }
        .rte-send-email .tiptap pre {
          background: color-mix(in srgb, var(--primary) 8%, transparent);
          border-radius: 6px;
          padding: 8px 12px;
          overflow-x: auto;
        }
      `}</style>
      <div className="rte-send-email">
        <EditorContent editor={editor} />
      </div>
    </div>
  );
};

export default RichTextEditor;