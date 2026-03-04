import React, { useRef, useState } from "react";

interface EmailTabProps {
  templateName: string;
  templateType: string;
  subject: string;
  sendAttachedFiles: boolean;
  sendPrint: boolean;
  onTemplateNameChange: (value: string) => void;
  onTemplateTypeChange: (value: string) => void;
  onSubjectChange: (value: string) => void;
  onSendAttachedFilesChange: (value: boolean) => void;
  onSendPrintChange: (value: boolean) => void;
  onSaveTemplate: (html: string) => void;
  onResetTemplate: () => void;
}

export const EmailTab: React.FC<EmailTabProps> = ({
  templateName,
  templateType,
  subject,
  sendAttachedFiles,
  sendPrint,
  onTemplateNameChange,
  onTemplateTypeChange,
  onSubjectChange,
  onSendAttachedFilesChange,
  onSendPrintChange,
  onSaveTemplate,
  onResetTemplate,
}) => {
  const editorRef = useRef<HTMLDivElement | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);

  const exec = (cmd: string) => {
    document.execCommand(cmd, false, null);
    editorRef.current?.focus();
  };

  const insertToken = (token: string) => {
    if (!editorRef.current) return;
    document.execCommand("insertHTML", false, token);
  };

  const getEditorHtml = () => editorRef.current?.innerHTML || "";

  const handleSave = () => {
    onSaveTemplate(getEditorHtml());
    setPreviewOpen(false);
  };

  return (
    <div className="mx-auto bg-card text-main rounded-lg p-6 border border-theme mt-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-main">Email Template</h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-muted">Name</label>
          <input
            value={templateName}
            onChange={(e) => onTemplateNameChange(e.target.value)}
            placeholder="Template name"
            className="px-3 py-2 border border-theme bg-app rounded focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-muted">Type</label>
          <select
            value={templateType}
            onChange={(e) => onTemplateTypeChange(e.target.value)}
            className="px-3 py-2 border border-theme bg-app rounded focus:outline-none focus:ring-2 focus:ring-primary/30"
          >
            <option>Quote Email</option>
            <option>Order Confirmation</option>
            <option>Reminder</option>
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-muted">Subject</label>
          <input
            value={subject}
            onChange={(e) => onSubjectChange(e.target.value)}
            placeholder="Email subject line"
            className="px-3 py-2 border border-theme bg-app rounded focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>
      </div>

      {/* Toolbar */}
      <div className="border border-theme rounded-t-md bg-app p-2 flex items-center gap-2">
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => exec("bold")}
            className="px-2 py-1 rounded hover:bg-app"
          >
            B
          </button>
          <button
            type="button"
            onClick={() => exec("italic")}
            className="px-2 py-1 rounded hover:bg-app"
          >
            I
          </button>
          <button
            type="button"
            onClick={() => exec("underline")}
            className="px-2 py-1 rounded hover:bg-app"
          >
            U
          </button>
        </div>

        <div className="w-px h-6 bg-border mx-2" />

        <div className="flex items-center gap-2">
          <label className="text-xs text-muted">Insert token</label>
          <select
            onChange={(e) => {
              if (!e.target.value) return;
              insertToken(`{{${e.target.value}}}`);
              e.target.selectedIndex = 0;
            }}
            defaultValue=""
            className="px-2 py-1 border border-theme bg-app rounded text-sm"
          >
            <option value="">-- select token --</option>
            <option value="contact.first_name">contact.first_name</option>
            <option value="supplier_name">supplier_name</option>
          </select>
        </div>

        <div className="ml-auto">
          <button
            type="button"
            onClick={() => setPreviewOpen(true)}
            className="px-3 py-1 text-sm rounded border border-theme hover:bg-app"
          >
            Preview
          </button>
        </div>
      </div>

      {/* Editor */}
      <div className="border border-t-0 border-theme rounded-b-md bg-card">
        <div
          ref={editorRef}
          contentEditable
          suppressContentEditableWarning
          className="min-h-[240px] p-4 prose max-w-none text-sm text-main outline-none"
        >
          <p style={{ color: "var(--muted)" }}>
            Start typing your message here...
          </p>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-4 flex items-start gap-4">
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={sendAttachedFiles}
            onChange={(e) => onSendAttachedFilesChange(e.target.checked)}
          />
          <span>Attach files</span>
        </label>

        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={sendPrint}
            onChange={(e) => onSendPrintChange(e.target.checked)}
          />
          <span>Attach PDF print</span>
        </label>

        <div className="ml-auto flex gap-2">
          <button
            onClick={onResetTemplate}
            className="px-4 py-2 bg-app border border-theme text-main rounded-md hover:bg-app/70 text-sm"
          >
            Reset
          </button>

          <button
            onClick={handleSave}
            className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-600 text-sm"
          >
            Save Template
          </button>
        </div>
      </div>

      {/* Preview Modal */}
      {previewOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-3xl bg-card text-main rounded shadow-lg overflow-auto border border-theme">
            <div className="flex items-center justify-between p-4 border-b border-theme">
              <h4 className="font-semibold">Email Preview</h4>
              <button
                onClick={() => setPreviewOpen(false)}
                className="px-2 py-1 rounded hover:bg-app"
              >
                Close
              </button>
            </div>

            <div className="p-6">
              <div className="text-sm text-muted mb-3">
                {subject || <span className="text-muted">[No subject]</span>}
              </div>
              <div
                className="prose max-w-none text-sm text-main"
                dangerouslySetInnerHTML={{ __html: getEditorHtml() }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
