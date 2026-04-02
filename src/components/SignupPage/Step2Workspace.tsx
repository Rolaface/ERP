export default function Step2Workspace({ form, update, next, back }: any) {
  return (
    <div className="card stack-md">
      <h2 className="heading-lg">Workspace Setup</h2>

      <div className="stack-sm">
        <label className="form-label">Company</label>
        <input
          value={form.company}
          onChange={(e) => update("company", e.target.value)}
        />
      </div>

      <div className="stack-sm">
        <label className="form-label">Abbreviation</label>
        <input
          value={form.abbr}
          onChange={(e) => update("abbr", e.target.value)}
        />
      </div>

      <div className="stack-sm">
        <label className="form-label">Country</label>
        <select
          value={form.country}
          onChange={(e) => update("country", e.target.value)}
        >
          <option>India</option>
          <option>United States</option>
        </select>
      </div>

      <div className="stack-sm">
        <label className="form-label">Currency</label>
        <input value={form.currency} readOnly />
      </div>

      <div className="flex gap-2">
        <button className="btn btn-outline" onClick={back}>
          Back
        </button>
        <button className="btn btn-primary" onClick={next}>
          Continue
        </button>
      </div>
    </div>
  );
}