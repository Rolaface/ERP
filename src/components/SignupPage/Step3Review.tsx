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

  const getMonthName = (month: number) => {
    if (!month) return "";
    return new Date(0, month - 1).toLocaleString("en-US", {
      month: "long",
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
          className="
            text-xs text-right
            border-b border-theme
            bg-transparent
            text-main
            focus:outline-none focus:border-primary
          "
        />
      );
    }

    return (
      <span
        onClick={() => setEditing(key)}
        className="cursor-pointer text-main hover:text-primary transition"
      >
        {value}
      </span>
    );
  };

  const Section = ({ title, children }: any) => (
    <div className="bg-card border border-theme rounded-xl p-4 transition hover:bg-hover">
      <div className="flex items-center justify-between mb-3">
        <span className="text-[10px] font-semibold tracking-wide uppercase text-muted">
          {title}
        </span>

        <button
          onClick={() => setEditing(null)}
          className="flex items-center gap-1 text-xs font-medium text-primary hover:opacity-80 transition"
        >
          <Pencil size={14} />
          Edit
        </button>
      </div>

      {children}
    </div>
  );

  return (
    <div className="form-section">

      {/* CONTENT */}
      <div className="p-6 space-y-4">

        {/* IDENTITY */}
        <Section title="Identity">
          <div className="grid grid-cols-2 gap-y-2">
            <div className="text-xs text-muted">Full Name</div>
            <div className="text-xs font-semibold text-main text-right">
              {renderField("fullName", form.fullName)}
            </div>

            <div className="text-xs text-muted">Email</div>
            <div className="text-xs text-main/70 text-right truncate pl-4">
              {renderField("email", form.email)}
            </div>
          </div>
        </Section>

        {/* ORGANIZATION */}
        <Section title="Organization">
          <div className="grid grid-cols-2 gap-y-2">
            <div className="text-xs text-muted">Company Name</div>
            <div className="text-xs font-semibold text-main text-right">
              {renderField("company", form.company)}
            </div>

            <div className="text-xs text-muted self-center">
              Abbreviation
            </div>
            <div className="flex justify-end">
              <span
                onClick={() => setEditing("abbr")}
                className="
                  px-2 py-0.5 rounded-full
                  bg-primary/10 text-primary
                  font-semibold text-xs tracking-wider
                  cursor-pointer
                "
              >
                {editing === "abbr" ? (
                  <input
                    value={form.abbr}
                    autoFocus
                    onChange={(e) =>
                      update("abbr", e.target.value.toUpperCase())
                    }
                    onBlur={() => setEditing(null)}
                    className="bg-transparent text-center w-16 outline-none"
                  />
                ) : (
                  form.abbr
                )}
              </span>
            </div>

            <div className="text-xs text-muted">Country</div>
            <div className="text-xs font-semibold text-main text-right">
              {renderField("country", form.country)}
            </div>
          </div>
        </Section>

        {/* FINANCE */}
        <Section title="Finance & Region">
          <div className="grid grid-cols-2 gap-y-3">
            <div className="text-xs text-muted">Base Country</div>
            <div className="text-xs font-semibold text-main text-right">
              {renderField("country", form.country)}
            </div>

            <div className="text-xs text-muted">
              Financial Year Start
            </div>
            <div className="text-xs text-main text-right">
              {getMonthName(form.fyStartMonth)}
            </div>

            <div className="text-xs text-muted">Currency</div>
            <div className="text-xs font-semibold text-main text-right">
              {renderField("currency", form.currency)}
            </div>

            <div className="text-xs text-muted">Timezone</div>
            <div className="text-xs text-main text-right">
              {renderField("timezone", form.timezone)}
            </div>

            <div className="text-xs text-muted">Chart of Accounts</div>
            <div className="text-xs text-main text-right">
              {renderField("chartOfAccounts", form.chartOfAccounts)}
            </div>
          </div>
        </Section>

      </div>

      {/* FOOTER */}
      <div className="form-footer">

        {apiError && (
          <div className="mb-3 text-danger text-sm text-center">
            {apiError}
          </div>
        )}

        <div className="flex gap-3">

          <ButtonPro
            onClick={back}
            variant="secondary"
            width="w-[40%]"
            leftIcon={<MoveLeftIcon size={16} />}
          >
            Back
          </ButtonPro>

          <ButtonPro
            onClick={submit}
            loading={loading}
            width="w-[60%]"
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