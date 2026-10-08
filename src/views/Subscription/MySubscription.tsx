import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Award, Clock, Copy, CreditCard, Layers } from "lucide-react";
import { Button, Card } from "../../components/ui/modal/formComponent";
import { showApiError, showSuccess } from "../../utils/alert";
import { AppPage, AppPageBody, AppPageHeader } from "../../components/ui/app-shell";
import {
  getMySubscription,
  type MySubscriptionResponse,
} from "../../api/SubscriptionApi";

const parseDate = (d: string) => new Date(`${d.slice(0, 10)}T00:00:00`);

const formatDate = (d: string | null | undefined) => {
  if (!d) return "-";
  const date = parseDate(d);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
};

const daysFromToday = (d: string) => {
  const date = parseDate(d);
  if (Number.isNaN(date.getTime())) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.ceil((date.getTime() - today.getTime()) / 86400000);
};

const formatMoney = (amount: number, currency: string) => {
  try {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    }).format(amount ?? 0);
  } catch {
    // invalid / missing currency code
    return `${currency ?? ""} ${amount ?? 0}`.trim();
  }
};

const getErrorMessage = (err: unknown) => {
  const e = err as { response?: { data?: { message?: string } }; message?: string };
  return e?.response?.data?.message || e?.message || "Failed to load subscription";
};

const Skeleton: React.FC<{ className?: string }> = ({ className = "" }) => (
  <div className={`animate-pulse rounded-md bg-app ${className}`} />
);

const LoadingState: React.FC = () => (
  <>
    <Card>
      <Skeleton className="h-6 w-40" />
      <Skeleton className="mt-3 h-8 w-64" />
      <div className="mt-5 grid grid-cols-2 gap-4 lg:grid-cols-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-12" />
        ))}
      </div>
    </Card>
    <Card>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-40" />
        ))}
      </div>
    </Card>
  </>
);

const Field: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <div className="min-w-0">
    <p className="text-[11px] font-medium text-white/70">{label}</p>
    {children}
  </div>
);

const MySubscription: React.FC = () => {
  const [data, setData] = useState<MySubscriptionResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const mounted = useRef(true);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getMySubscription();
      if (mounted.current) setData(res);
    } catch (err: unknown) {
      if (!mounted.current) return;
      setError(getErrorMessage(err));
      showApiError(err);
    } finally {
      if (mounted.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    mounted.current = true;
    load();
    return () => {
      mounted.current = false;
    };
  }, [load]);

  const d = data?.details;

  const products = useMemo(() => {
    if (!d) return [];
    const codes = (d.products ?? "")
      .split(",")
      .map((p) => p.trim())
      .filter(Boolean);
    const modules = d.modules ?? [];

    return codes.map((code) => {
      const enabled = modules.filter((m) => m.product === code && m.is_enabled);
      return {
        code,
        active: enabled.length > 0,
        subFeatures: enabled.map((m) => m.module_name),
      };
    });
  }, [d]);

  const handleCopyId = async () => {
    if (!data) return;
    try {
      await navigator.clipboard.writeText(data.name);
      showSuccess("Subscription ID copied");
    } catch {
      // clipboard blocked (permissions / insecure context) — nothing to do
    }
  };

  const renewalDate = d?.end_date ?? null;
  const daysToRenewal = renewalDate ? daysFromToday(renewalDate) : null;

  return (
    <AppPage>
      <AppPageHeader
        title="My Subscription"
        description="View your current plan, billing details and activated products."
        icon={<CreditCard className="h-4 w-4" />}
      />

      <AppPageBody className="gap-5">
        {loading && <LoadingState />}

        {!loading && error && (
          <Card>
            <div className="flex flex-col items-center gap-3 py-6 text-center">
              <p className="text-sm text-main">{error}</p>
              <Button variant="secondary" onClick={load}>
                Retry
              </Button>
            </div>
          </Card>
        )}

        {!loading && !error && !data && (
          <Card>
            <p className="py-6 text-center text-sm text-muted">No subscription found.</p>
          </Card>
        )}

        {!loading && !error && data && d && (
          <div className="shrink-0 rounded-2xl border border-theme bg-card shadow-sm">
            <div className="rounded-t-2xl bg-primary p-6 text-white">
              <div className="flex flex-wrap items-start justify-between gap-1">
                <div>
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-white">
                    <Award className="h-3.5 w-3.5" /> Current Plan
                  </span>
                  <h3 className="mt-2 text-2xl font-bold text-white">{d.plan_name}</h3>
                </div>
                <div className="text-right">
                  <span className="text-3xl font-bold text-white">
                    {formatMoney(d.plan_price, d.currency)}
                  </span>
                  <span className="ml-1 text-sm text-white/70">/ {d.billing_frequency}</span>
                </div>
              </div>

              <div className="mt-5 grid grid-cols-2 gap-4 border-t border-white/20 pt-4 md:grid-cols-3 lg:grid-cols-6">
                <Field label="Subscription ID">
                  <div className="mt-1 flex items-center gap-1.5">
                    <span className="truncate rounded border border-white/25 bg-white/10 px-2 py-1 font-mono text-xs text-white">
                      {data.name}
                    </span>
                    <button
                      type="button"
                      onClick={handleCopyId}
                      className="shrink-0 rounded p-1 text-white/80 transition-colors hover:bg-white/20 hover:text-white"
                      aria-label="Copy subscription ID"
                    >
                      <Copy className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </Field>

                <Field label="Start Date">
                  <p className="mt-1.5 text-sm font-semibold text-white">{formatDate(d.start_date)}</p>
                </Field>

                <Field label="Next Renewal">
                  <p className="mt-1.5 text-sm font-semibold text-white">{formatDate(renewalDate)}</p>
                  {daysToRenewal !== null && (
                    <p className="mt-0.5 flex items-center gap-1 text-[11px] text-white/70">
                      <Clock className="h-3 w-3" />
                      {daysToRenewal >= 0
                        ? `(in ${daysToRenewal} days)`
                        : `(${Math.abs(daysToRenewal)} days ago)`}
                    </p>
                  )}
                </Field>

                {d.trial_enabled ? (
                  <Field label="Free Trial">
                    <p className="mt-1.5 text-sm font-semibold text-white">{d.trial_days} days</p>
                  </Field>
                ) : null}

                <Field label="Setup Fee">
                  <p className="mt-1.5 text-sm font-semibold text-white">
                    {formatMoney(d.setup_fee, d.currency)}
                  </p>
                </Field>
              </div>
            </div>

            <div className="p-6">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <h3 className="text-lg font-bold text-main">Products</h3>
                  <p className="text-sm text-muted">
                    Detailed view of products activated under your account, and sub-modules.
                  </p>
                </div>
              </div>

              {products.length === 0 ? (
                <p className="mt-4 text-sm text-muted">No products activated.</p>
              ) : (
                <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {products.map((product) => (
                    <div key={product.code} className="rounded-xl border border-theme bg-app p-4">
                      <div className="flex items-center gap-2.5">
                        <span className="rounded-lg bg-primary/10 p-2">
                          <Layers className="h-5 w-5 text-primary" />
                        </span>
                        <span className="text-sm font-semibold text-main">{product.code}</span>
                      </div>

                      {product.subFeatures.length > 0 && (
                        <div className="mt-0">
                          <p className="text-[10px] font-medium uppercase tracking-wide text-muted">
                            Included Modules
                          </p>
                          <div className="mt-1.5 flex flex-wrap gap-1.5">
                            {product.subFeatures.map((f) => (
                              <span
                                key={f}
                                className="inline-flex items-center gap-1 rounded-md border border-theme bg-card px-2 py-1 text-[11px] text-main"
                              >
                                {f}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </AppPageBody>
    </AppPage>
  );
};

export default MySubscription;