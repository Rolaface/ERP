import { Pencil, Check, MoveLeftIcon } from "lucide-react";
import ButtonPro from "../Form/ButtonPro";
import { useState } from "react";

export default function Step3Review({
  form,
  back,
  submit,
  loading,
  apiError,
  update,
}: any) {

  const [editing, setEditing] = useState<string | null>(null);

  const formatDate = (date: string) => {
    if (!date) return "";
    return new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const renderField = (key: string, value: any, type: string = "text") => {
    if (editing === key) {
      return (
        <input
          type={type}
          value={value}
          autoFocus
          onChange={(e) => update(key, e.target.value)}
          onBlur={() => setEditing(null)}
          className="text-[12px] text-right border-b border-outline focus:outline-none bg-transparent"
        />
      );
    }

    return (
      <span
        onClick={() => setEditing(key)}
        className="cursor-pointer"
      >
        {value}
      </span>
    );
  };

  return (
    <div className="form-section">

      {/* CONTENT */}
      <div className="p-6 space-y-4">

        {/* USER IDENTITY */}
        <div className="bg-surface-container-low rounded-xl p-4 transition-all duration-300 hover:bg-surface-container-high">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] font-bold tracking-[0.05em] text-on-surface-variant uppercase">
              Identity
            </span>

            <button
              onClick={() => setEditing(null)}
              className="flex items-center gap-1 text-[11px] font-semibold text-primary-container hover:text-primary transition-colors"
            >
              <Pencil size={14} />
              Edit
            </button>
          </div>

          <div className="grid grid-cols-2 gap-y-2">
            <div className="text-[12px] text-on-surface-variant">
              Full Name
            </div>
            <div className="text-[12px] font-semibold text-on-surface text-right">
              {renderField("fullName", form.fullName)}
            </div>

            <div className="text-[12px] text-on-surface-variant">
              Email
            </div>
            <div className="text-[12px] font-medium text-on-surface/60 text-right truncate pl-4">
              {renderField("email", form.email)}
            </div>
          </div>
        </div>

        {/* ORGANIZATION */}
        <div className="bg-surface-container-low rounded-xl p-4 transition-all duration-300 hover:bg-surface-container-high">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] font-bold tracking-[0.05em] text-on-surface-variant uppercase">
              Organization
            </span>

            <button
              onClick={() => setEditing(null)}
              className="flex items-center gap-1 text-[11px] font-semibold text-primary-container hover:text-primary transition-colors"
            >
              <Pencil size={14} />
              Edit
            </button>
          </div>

          <div className="grid grid-cols-2 gap-y-2">
            <div className="text-[12px] text-on-surface-variant">
              Company Name
            </div>
            <div className="text-[12px] font-semibold text-on-surface text-right">
              {renderField("company", form.company)}
            </div>

            <div className="text-[12px] text-on-surface-variant self-center">
              Abbreviation
            </div>
            <div className="flex justify-end">
              <span
                onClick={() => setEditing("abbr")}
                className="px-2 py-0.5 rounded-full bg-primary/10 text-primary font-bold text-[10px] tracking-wider cursor-pointer"
              >
                {editing === "abbr" ? (
                  <input
                    value={form.abbr}
                    autoFocus
                    onChange={(e) => update("abbr", e.target.value.toUpperCase())}
                    onBlur={() => setEditing(null)}
                    className="bg-transparent text-center w-16 outline-none"
                  />
                ) : (
                  form.abbr
                )}
              </span>
            </div>

            <div className="text-[12px] text-on-surface-variant">
              Country
            </div>
            <div className="text-[12px] font-semibold text-on-surface text-right">
              {renderField("country", form.country)}
            </div>
          </div>
        </div>

        {/* FINANCE */}
        <div className="bg-surface-container-low rounded-xl p-4 transition-all duration-300 hover:bg-surface-container-high">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] font-bold tracking-[0.05em] text-on-surface-variant uppercase">
              Finance & Region
            </span>

            <button
              onClick={() => setEditing(null)}
              className="flex items-center gap-1 text-[11px] font-semibold text-primary-container hover:text-primary transition-colors"
            >
              <Pencil size={14} />
              Edit
            </button>
          </div>

          <div className="grid grid-cols-2 gap-y-3">
            <div className="text-[12px] text-on-surface-variant">
              Base Country
            </div>
            <div className="text-[12px] font-semibold text-on-surface text-right">
              {renderField("country", form.country)}
            </div>

            <div className="text-[12px] text-on-surface-variant">
              Financial Year
            </div>
            <div className="text-[12px] font-medium text-on-surface text-right">
              {editing === "fyStart" || editing === "fyEnd" ? (
                <div className="flex gap-1 justify-end">
                  <input
                    type="date"
                    value={form.fyStart}
                    onChange={(e) => update("fyStart", e.target.value)}
                    onBlur={() => setEditing(null)}
                    className="text-[12px] border-b outline-none bg-transparent"
                  />
                  <input
                    type="date"
                    value={form.fyEnd}
                    onChange={(e) => update("fyEnd", e.target.value)}
                    onBlur={() => setEditing(null)}
                    className="text-[12px] border-b outline-none bg-transparent"
                  />
                </div>
              ) : (
                <span
                  onClick={() => setEditing("fyStart")}
                  className="cursor-pointer"
                >
                  {formatDate(form.fyStart)} – {formatDate(form.fyEnd)}
                </span>
              )}
            </div>

            <div className="text-[12px] text-on-surface-variant">
              Currency
            </div>
            <div className="text-[12px] font-semibold text-on-surface text-right">
              {renderField("currency", form.currency)}
            </div>
          </div>
        </div>
      </div>

      {/* FOOTER */}
      <div className="form-footer">

        {apiError && (
          <div className="mb-3 text-error text-sm text-center">
            {apiError}
          </div>
        )}

        <div className="flex gap-3">

          <ButtonPro
            onClick={back}
            variant="secondary"
            width="w-[40%]"
            size="md"
            leftIcon={<MoveLeftIcon size={16} />}
          >
            Back
          </ButtonPro>

          <ButtonPro
            onClick={submit}
            loading={loading}
            width="w-[60%]"
            size="md"
            rightIcon={<Check size={16} />}
            className="whitespace-nowrap"
          >
            {loading ? "Creating..." : "Confirm & Create"}
          </ButtonPro>

        </div>
      </div>
    </div>
  );
}