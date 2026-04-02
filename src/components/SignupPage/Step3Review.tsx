export default function Step3Review({
  form,
  back,
  submit,
  loading,
  apiError,
}: any) {
  return (
    <div className="card stack-md">
      <h2 className="heading-lg">Review</h2>

      <div className="stack-sm text-body">
        <p><b>Name:</b> {form.fullName}</p>
        <p><b>Email:</b> {form.email}</p>
        <p><b>Company:</b> {form.company}</p>
      </div>

      {apiError && <div className="text-danger">{apiError}</div>}

      <div className="flex gap-2">
        <button className="btn btn-outline" onClick={back}>
          Back
        </button>
        <button className="btn btn-primary" onClick={submit}>
          {loading ? "Creating..." : "Confirm"}
        </button>
      </div>
    </div>
  );
}