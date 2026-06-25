export default function SuccessScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-background">
      <div className="w-full max-w-sm rounded-2xl overflow-hidden border border-border">
        <div className="text-center px-8 py-12" style={{ background: "#e8f5e9" }}>

          <div
            className="mx-auto mb-6 flex items-center justify-center rounded-full bg-white"
            style={{ width: 64, height: 64 }}
          >
            <svg
              width="28" height="28" viewBox="0 0 24 24" fill="none"
              stroke="#43a047" strokeWidth="2.5"
              strokeLinecap="round" strokeLinejoin="round"
            >
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>

          <h1 className="text-xl font-semibold mb-3" style={{ color: "#1b5e20" }}>
            Site creation in progress
          </h1>

          <p className="text-sm leading-relaxed" style={{ color: "#388e3c" }}>
Please wait while we build your site. You’ll receive an email once it’s ready.          </p>

        </div>
      </div>
    </div>
  );
}