import React, { useRef, useState } from "react";
import { Card } from "../../ui/modal/formComponent";

interface EmailTemplateTabProps {
  templateName: string;
  templateType: string;
  subject: string;
  messageHtml: string;
  sendAttachedFiles: boolean;
  sendPrint: boolean;
  onTemplateNameChange: (value: string) => void;
  onTemplateTypeChange: (value: string) => void;
  onSubjectChange: (value: string) => void;
  onMessageHtmlChange: (value: string) => void;
  onSendAttachedFilesChange: (value: boolean) => void;
  onSendPrintChange: (value: boolean) => void;
  onSaveTemplate: () => void;
  onResetTemplate: () => void;
}

export const EmailTemplateTab: React.FC<EmailTemplateTabProps> = ({
  templateName,
  templateType,
  subject,
  sendAttachedFiles,
  sendPrint,
  onTemplateNameChange,
  onTemplateTypeChange,
  onSubjectChange,
  onMessageHtmlChange,
  onSendAttachedFilesChange,
  onSendPrintChange,
  onSaveTemplate,
  onResetTemplate,
}) => {
  const editorRef = useRef<HTMLDivElement | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);

  const exec = (command: string, value?: string) => {
    document.execCommand(command, false, value);
    editorRef.current?.focus();
  };

  const insertToken = (token: string) => {
    exec("insertHTML", token);
  };

  const getEditorHtml = () => editorRef.current?.innerHTML || "";

  const handleSave = () => {
    onMessageHtmlChange(getEditorHtml());
    onSaveTemplate();
    setPreviewOpen(false);
  };

  return (
    <Card title="Email Template">
      <div className="mx-auto bg-card text-main rounded-lg p-6 border border-theme">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-main">Email Template</h3>
        </div>

        {/* HEADER FORM */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium text-muted">Name</span>
            <input
              value={templateName}
              onChange={(e) => onTemplateNameChange(e.target.value)}
              placeholder="Template name"
              className="px-3 py-2 rounded border border-theme bg-app focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </label>

          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium text-muted">Type</span>
            <select
              value={templateType}
              onChange={(e) => onTemplateTypeChange(e.target.value)}
              className="px-3 py-2 rounded border border-theme bg-app focus:outline-none focus:ring-2 focus:ring-primary/30"
            >
              <option>Quote Email</option>
              <option>Order Confirmation</option>
              <option>Reminder</option>
            </select>
          </label>

          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium text-muted">Subject</span>
            <input
              value={subject}
              onChange={(e) => onSubjectChange(e.target.value)}
              placeholder="Subject line"
              className="px-3 py-2 rounded border border-theme bg-app focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </label>
        </div>

        {/* TOOLBAR */}
        <div className="border border-theme rounded-t-md bg-app p-2 flex items-center gap-2">
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => exec("bold")}
              className="px-2 py-1 rounded row-hover"
            >
              B
            </button>
            <button
              type="button"
              onClick={() => exec("italic")}
              className="px-2 py-1 rounded row-hover"
            >
              I
            </button>
            <button
              type="button"
              onClick={() => exec("underline")}
              className="px-2 py-1 rounded row-hover"
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
              <option value="rfq_number">rfq_number</option>
              <option value="portal_link">portal_link</option>
            </select>
          </div>

          <div className="ml-auto flex items-center gap-2">
            <select
              onChange={(e) => {
                if (!e.target.value) return;
                insertToken(`<br/>${e.target.value}<br/>`);
                e.target.selectedIndex = 0;
              }}
              defaultValue=""
              className="px-2 py-1 border border-theme bg-app rounded text-sm"
            >
              <option value="">Insert signature</option>
              <option value="Regards,<br/>[Company Name]">Standard</option>
              <option value="Best regards,<br/>[Procurement Team]">
                Procurement
              </option>
            </select>

            <button
              type="button"
              onClick={() => setPreviewOpen(true)}
              className="px-3 py-1 text-sm rounded border border-theme row-hover"
            >
              Preview
            </button>
          </div>
        </div>

        {/* EDITOR */}
        <div className="border border-t-0 border-theme rounded-b-md bg-card">
          <div
            ref={editorRef}
            contentEditable
            suppressContentEditableWarning
            className="min-h-[240px] p-4 prose max-w-none text-sm text-main outline-none"
            style={{ whiteSpace: "pre-wrap" }}
          >
            <p style={{ color: "var(--muted)" }}>
              Start typing your message here. Use tokens to personalize.
            </p>
          </div>
        </div>

        {/* FOOTER */}
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
              className="px-4 py-2 bg-app border border-theme text-main rounded-full row-hover text-sm"
            >
              Reset
            </button>

            <button
              onClick={handleSave}
              className="px-4 py-2 bg-primary text-white rounded-full hover:bg-primary-600 text-sm"
            >
              Save Template
            </button>
          </div>
        </div>

        {/* PREVIEW MODAL */}
        {previewOpen && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-4">
            <div className="w-full max-w-3xl bg-card text-main rounded shadow-lg overflow-auto border border-theme">
              <div className="flex items-center justify-between p-4 border-b border-theme">
                <h4 className="font-semibold">Email Preview</h4>
                <button
                  onClick={() => setPreviewOpen(false)}
                  className="px-2 py-1 rounded row-hover"
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
    </Card>
  );
};
