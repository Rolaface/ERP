import React, { useEffect } from "react";
import { useEditor, EditorContent, Node, mergeAttributes } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import TextAlign from "@tiptap/extension-text-align";
import Placeholder from "@tiptap/extension-placeholder";

export interface RichTextEditorProps {
  value: string;
  onChange: (html: string) => void;
  minHeight?: number;
  placeholder: string;
  editable?: boolean;
  /**
   * Called once the Tiptap editor instance is initialised.
   * The modal uses this to insert variable nodes programmatically.
   */
  onEditorReady?: (editor: ReturnType<typeof useEditor>) => void;
}

/* =============================================================
   VariableNode
   - atom:true  → one backspace selects, next backspace deletes
   - addNodeView → renders the styled chip in the live editor
   - renderHTML  → used only for clipboard / copy-paste HTML
   ============================================================= */
const VariableNode = Node.create({
  name: "variable",
  group: "inline",
  inline: true,
  atom: true,

  addAttributes() {
    return {
      label: { default: "" },
    };
  },

  parseHTML() {
    return [
      {
        tag: "span[data-variable]",
        getAttrs: (el) => ({
          label: (el as HTMLElement).getAttribute("data-variable") ?? "",
        }),
      },
    ];
  },

  // Used for clipboard serialisation only — NOT live rendering.
  renderHTML({ node, HTMLAttributes }) {
    return [
      "span",
      mergeAttributes(HTMLAttributes, { "data-variable": node.attrs.label }),
      node.attrs.label,
    ];
  },

  // Live chip rendering inside the editor.
  addNodeView() {
    return ({ node }) => {
      const chip = document.createElement("span");
      chip.setAttribute("data-variable", node.attrs.label);
      chip.setAttribute("contenteditable", "false");
      chip.textContent = node.attrs.label;
      chip.style.cssText = [
        "display:inline-flex",
        "align-items:center",
        "padding:1px 7px",
        "border-radius:5px",
        "border:1px solid var(--primary,#3b82f6)",
        "background:color-mix(in srgb,var(--primary) 10%,transparent)",
        "color:var(--primary)",
        "font-size:12px",
        "font-family:monospace",
        "white-space:nowrap",
        "cursor:default",
        "user-select:none",
        "vertical-align:middle",
        "line-height:1.8",
        "margin:0 1px",
      ].join(";");

      return {
        dom: chip,
        update: (updatedNode) => {
          if (updatedNode.type.name !== "variable") return false;
          chip.textContent = updatedNode.attrs.label;
          chip.setAttribute("data-variable", updatedNode.attrs.label);
          return true;
        },
      };
    };
  },
});

/* =============================================================
   InvoiceTableNode
   - atom:true        → one backspace removes the whole table
   - addNodeView      → renders header-only preview table
   - serialises as {{ invoice_table }} via serializeToStorageHTML
   ============================================================= */
const INVOICE_TABLE_TOKEN = "{{ invoice_table }}";

const InvoiceTableNode = Node.create({
  name: "invoiceTable",
  group: "block",
  atom: true,
  selectable: true,
  draggable: false,

  parseHTML() {
    return [{ tag: "div[data-invoice-table]" }];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "div",
      mergeAttributes(HTMLAttributes, { "data-invoice-table": "true" }),
      0,
    ];
  },

  addNodeView() {
    return () => {
      const wrapper = document.createElement("div");
      wrapper.setAttribute("data-invoice-table", "true");
      wrapper.setAttribute("contenteditable", "false");
      wrapper.style.cssText = [
        "margin:8px 0",
        "border-radius:8px",
        "overflow:hidden",
        "border:1px solid #e2e8f0",
        "font-size:12px",
        "font-family:inherit",
        "user-select:none",
        "cursor:default",
      ].join(";");

      wrapper.innerHTML = buildInvoiceTableHTML();

      return {
        dom: wrapper,
        update: () => true,
        destroy: () => {},
      };
    };
  },
});

function buildInvoiceTableHTML(): string {
  const headerCells = ["#", "Invoice No", "Invoice Date", "Status", "Due Date", "Amount"]
    .map(
      (h) =>
        "<th style=\"padding:7px 10px;text-align:left;font-weight:600;font-size:11px;" +
        "background:#f1f5f9;color:#374151;border-right:1px solid #e2e8f0;" +
        "white-space:nowrap;\">" + h + "</th>",
    )
    .join("");

  return (
    "<div style=\"font-size:10px;font-weight:600;color:var(--muted,#64748b);" +
    "text-transform:uppercase;letter-spacing:0.05em;padding:4px 6px;" +
    "background:#f1f5f9;border-bottom:1px solid #e2e8f0;\">" +
    "Invoice Table Preview (data will be filled automatically)" +
    "</div>" +
    "<table style=\"width:100%;border-collapse:collapse;\">" +
    "<thead><tr>" + headerCells + "</tr></thead>" +
    "<tfoot><tr>" +
    "<td colspan=\"5\" style=\"padding:7px 10px;text-align:right;font-weight:600;" +
    "font-size:11px;color:#374151;background:#f8fafc;border-top:1px solid #e2e8f0;\">" +
    "Total Outstanding</td>" +
    "<td style=\"padding:7px 10px;text-align:left;font-weight:600;font-size:11px;" +
    "color:#374151;background:#f8fafc;border-top:1px solid #e2e8f0;\">" +
    "{{ total_outstanding }}</td>" +
    "</tr></tfoot>" +
    "</table>"
  );
}
/* =============================================================
   serializeToStorageHTML
   Converts custom nodes → raw Jinja tokens before saving.
   Called in onUpdate before passing HTML up via onChange.
   ============================================================= */
function serializeToStorageHTML(html: string): string {
  const tmp = document.createElement("div");
  tmp.innerHTML = html;

  tmp.querySelectorAll("span[data-variable]").forEach((el) => {
    const label = el.getAttribute("data-variable") ?? "";
    el.replaceWith(document.createTextNode(label));
  });

  tmp.querySelectorAll("div[data-invoice-table]").forEach((el) => {
    const p = document.createElement("p");
    p.textContent = INVOICE_TABLE_TOKEN;
    el.replaceWith(p);
  });

  return tmp.innerHTML;
}

/* =============================================================
   parseStoredHTML
   Converts raw Jinja tokens → Tiptap-parseable HTML on load.
   ============================================================= */
function parseStoredHTML(html: string): string {
  // invoice_table first (may be wrapped in <p>)
  let result = html.replace(
    /(<p[^>]*>)?\s*\{\{\s*invoice_table\s*\}\}\s*(<\/p>)?/g,
    "<div data-invoice-table=\"true\"></div>",
  );

  // All other {{ variable }} tokens
  result = result.replace(/(\{\{[^}]+\}\})/g, (match) => {
    const label = match.trim();
    return "<span data-variable=\"" + label + "\">" + label + "</span>";
  });

  return result;
}

/* =============================================================
   Toolbar helpers (unchanged)
   ============================================================= */
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
        e.preventDefault();
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

/* =============================================================
   RichTextEditor — public API unchanged from original
   ============================================================= */
const RichTextEditor: React.FC<RichTextEditorProps> = ({
  value,
  onChange,
  minHeight = 160,
  placeholder = "",
  editable = true,
  onEditorReady,
}) => {
  const editor = useEditor({
    extensions: [
      StarterKit,
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      Placeholder.configure({ placeholder }),
      VariableNode,
      InvoiceTableNode,
    ],
    content: parseStoredHTML(value),
    onUpdate({ editor }) {
      if (editor.isDestroyed) return;
      const rawHTML = serializeToStorageHTML(editor.getHTML());
      onChange(rawHTML);
    },
  });

  // Notify parent once editor is ready so it can hold the instance ref.
  useEffect(() => {
    if (!editor || editor.isDestroyed) return;
    onEditorReady?.(editor);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editor]);

  // Sync external value reset (e.g. when modal reopens with DEFAULT_FORM).
  useEffect(() => {
    if (!editor || editor.isDestroyed) return;
    const currentRaw = serializeToStorageHTML(editor.getHTML());
    if (currentRaw !== value) {
      editor.commands.setContent(parseStoredHTML(value), false);
    }
  }, [value, editor]);

  useEffect(() => {
    if (!editor || editor.isDestroyed) return;
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
          {btn("Bold", editor.isActive("bold"), () => editor.chain().focus().toggleBold().run(), <strong>B</strong>)}
          {btn("Italic", editor.isActive("italic"), () => editor.chain().focus().toggleItalic().run(), <em>I</em>)}
          {btn("Underline", editor.isActive("underline"), () => editor.chain().focus().toggleUnderline().run(), <span style={{ textDecoration: "underline" }}>U</span>)}
          {btn("Strikethrough", editor.isActive("strike"), () => editor.chain().focus().toggleStrike().run(), <span style={{ textDecoration: "line-through" }}>S</span>)}
          <Sep />
          {btn("Bullet list", editor.isActive("bulletList"), () => editor.chain().focus().toggleBulletList().run(), <>&#8801;</>)}
          {btn("Ordered list", editor.isActive("orderedList"), () => editor.chain().focus().toggleOrderedList().run(), <>&#8788;</>)}
          <Sep />
          {btn("Align left", editor.isActive({ textAlign: "left" }), () => editor.chain().focus().setTextAlign("left").run(), <>&#11003;</>)}
          {btn("Align center", editor.isActive({ textAlign: "center" }), () => editor.chain().focus().setTextAlign("center").run(), <>&#9776;</>)}
          {btn("Align right", editor.isActive({ textAlign: "right" }), () => editor.chain().focus().setTextAlign("right").run(), <>&#11004;</>)}
          {btn("Justify", editor.isActive({ textAlign: "justify" }), () => editor.chain().focus().setTextAlign("justify").run(), <>&#9636;</>)}
          <Sep />
          {btn("Blockquote", editor.isActive("blockquote"), () => editor.chain().focus().toggleBlockquote().run(), <>&ldquo;</>)}
          {btn("Code block", editor.isActive("codeBlock"), () => editor.chain().focus().toggleCodeBlock().run(), <>&lt;/&gt;</>)}
          <Sep />
          {btn("Undo", false, () => editor.chain().focus().undo().run(), <>&#8617;</>)}
          {btn("Redo", false, () => editor.chain().focus().redo().run(), <>&#8618;</>)}
        </div>
      )}

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
        .rte-send-email .tiptap [data-invoice-table] {
          margin: 8px 0;
        }
      `}</style>
      <div className="rte-send-email">
        <EditorContent editor={editor} />
      </div>
    </div>
  );
};

export default RichTextEditor;