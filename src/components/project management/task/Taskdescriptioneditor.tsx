
import React, { useEffect, useRef } from "react";
import { Bold, Italic, Link2, List, Quote, Underline } from "lucide-react";

interface TaskDescriptionEditorProps {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
}

const BLOCKS = [
  { value: "p", label: "Normal" },
  { value: "h3", label: "Heading" },
  { value: "h4", label: "Subheading" },
];

const TOOLS = [
  { cmd: "bold", label: "Bold", Icon: Bold },
  { cmd: "italic", label: "Italic", Icon: Italic },
  { cmd: "underline", label: "Underline", Icon: Underline },
  { cmd: "insertUnorderedList", label: "Bullet list", Icon: List },
] as const;

const TOOL_BTN =
  "flex h-6 w-6 items-center justify-center rounded text-muted transition-colors hover:bg-row-hover hover:text-main";

const Divider = () => <span className="mx-1 h-4 w-px bg-[var(--border)]" />;

const TaskDescriptionEditor: React.FC<TaskDescriptionEditorProps> = ({
  value,
  onChange,
  placeholder = "Describe the task, goals, and any relevant details...",
}) => {
  const ref = useRef<HTMLDivElement>(null);

  // Sync only on external changes (e.g. Reset); never while the user types.
  useEffect(() => {
    if (ref.current && ref.current.innerHTML !== value) {
      ref.current.innerHTML = value;
    }
  }, [value]);

  const emit = () => {
    const el = ref.current;
    if (!el) return;
    const empty = !el.textContent?.trim() && !el.querySelector("li,blockquote");
    onChange(empty ? "" : el.innerHTML);
  };

  const exec = (cmd: string, arg?: string) => {
    ref.current?.focus();
    document.execCommand(cmd, false, arg);
    emit();
  };

  const toolbarButton = (
    key: string,
    label: string,
    Icon: React.ComponentType<{ size?: number }>,
    action: () => void,
  ) => (
    <button
      key={key}
      type="button"
      aria-label={label}
      title={label}
      onMouseDown={(e) => {
        e.preventDefault();
        action();
      }}
      className={TOOL_BTN}
    >
      <Icon size={13} />
    </button>
  );

  return (
    <div className="overflow-hidden rounded border border-[var(--border)] bg-card transition-colors focus-within:border-primary">
      <div className="flex items-center gap-1 border-b border-[var(--border)] bg-app px-2 py-1">
        <select
          defaultValue="p"
          onChange={(e) => exec("formatBlock", e.target.value)}
          className="h-6 rounded bg-transparent px-1 text-[11px] text-main outline-none"
        >
          {BLOCKS.map((b) => (
            <option key={b.value} value={b.value}>
              {b.label}
            </option>
          ))}
        </select>
        <Divider />
        {TOOLS.map(({ cmd, label, Icon }) =>
          toolbarButton(cmd, label, Icon, () => exec(cmd)),
        )}
        <Divider />
        {toolbarButton("link", "Link", Link2, () => {
          const url = window.prompt("Link URL");
          if (url) exec("createLink", url);
        })}
        {toolbarButton("quote", "Quote", Quote, () =>
          exec("formatBlock", "blockquote"),
        )}
      </div>

      <div className="relative">
        {!value && (
          <span className="pointer-events-none absolute left-3 top-2 text-[11px] text-muted">
            {placeholder}
          </span>
        )}
        <div
          ref={ref}
          contentEditable
          suppressContentEditableWarning
          onInput={emit}
          onBlur={emit}
          className="min-h-[96px] resize-y overflow-auto px-3 py-2 text-[11px] text-main outline-none [&_a]:text-primary [&_a]:underline [&_blockquote]:border-l-2 [&_blockquote]:border-[var(--border)] [&_blockquote]:pl-3 [&_blockquote]:text-muted [&_h3]:text-sm [&_h3]:font-semibold [&_h4]:text-xs [&_h4]:font-semibold [&_ul]:list-disc [&_ul]:pl-5"
        />
      </div>
    </div>
  );
};

export default TaskDescriptionEditor;