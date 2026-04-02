export default function Step1Account({ form, update, next }: any) {
  return (
    <div className="card stack-md">
      <h2 className="heading-lg">Create your account</h2>

      <div className="stack-sm">
        <label className="form-label">Full Name</label>
        <input
          value={form.fullName}
          onChange={(e) => update("fullName", e.target.value)}
          placeholder="John Doe"
        />
      </div>

      <div className="stack-sm">
        <label className="form-label">Email</label>
        <input
          value={form.email}
          onChange={(e) => update("email", e.target.value)}
          placeholder="you@company.com"
        />
      </div>

      <div className="stack-sm">
        <label className="form-label">Password</label>
        <input
          type="password"
          value={form.password}
          onChange={(e) => update("password", e.target.value)}
          placeholder="Min 8 characters"
        />
      </div>

      <button className="btn btn-primary" onClick={next}>
        Continue
      </button>
    </div>
  );
}