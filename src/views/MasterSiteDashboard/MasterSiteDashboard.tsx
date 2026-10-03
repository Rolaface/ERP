import React, { useState } from "react";
import {
    ChevronDown,
    FileText,
} from "lucide-react";

interface KpiCardProps {
    title: string;
    value: string;
    badge: string;
    badgeTone?: "green" | "blue";
    footer?: React.ReactNode;
}

const KpiCard: React.FC<KpiCardProps> = ({
    title,
    value,
    badge,
    badgeTone = "green",
    footer,
}) => {
    return (
        <div className="min-w-0 rounded-xl border border-[var(--border)] bg-card px-4 py-4 shadow-sm">
            {/* Top */}
            <div className="flex items-center justify-between gap-3">
                <div className="flex min-w-0 items-center gap-2">
                    <span className="h-2 w-2 shrink-0 rounded-full bg-primary" />

                    <span className="truncate text-[11px] font-semibold text-muted">
                        {title}
                    </span>
                </div>

                <span
                    className={`shrink-0 rounded-full px-2 py-1 text-[10px] font-bold ${badgeTone === "blue"
                        ? "bg-primary/10 text-primary"
                        : "bg-emerald-50 text-emerald-600"
                        }`}
                >
                    {badge}
                </span>
            </div>

            {/* Value */}
            <div className="mt-4">
                <span className="text-[28px] font-extrabold leading-none tracking-tight text-main">
                    {value}
                </span>
            </div>

            {/* Footer */}
            {footer && <div className="mt-3">{footer}</div>}
        </div>
    );
};

interface PortfolioProduct {
    id: string;
    shortName: string;
    name: string;
    monthlyRevenue: number;
    annualRevenue: number;
    churnRate: number;
    growthRate: number;
    activeLicenses: number;
}

const portfolioProducts: PortfolioProduct[] = [
    {
        id: "erp",
        shortName: "EP",
        name: "ERP Enterprise",
        monthlyRevenue: 425000,
        annualRevenue: 5100000,
        churnRate: 3.1,
        growthRate: 14.2,
        activeLicenses: 850,
    },
    {
        id: "los",
        shortName: "LO",
        name: "LOS Origination",
        monthlyRevenue: 310000,
        annualRevenue: 3720000,
        churnRate: 0.8,
        growthRate: 42.8,
        activeLicenses: 3100,
    },
    {
        id: "hrms",
        shortName: "HR",
        name: "HRMS Suite",
        monthlyRevenue: 180000,
        annualRevenue: 2160000,
        churnRate: 2.5,
        growthRate: 22.0,
        activeLicenses: 22500,
    },
    {
        id: "lms",
        shortName: "LM",
        name: "LMS Platform",
        monthlyRevenue: 142000,
        annualRevenue: 1704000,
        churnRate: 1.2,
        growthRate: 18.5,
        activeLicenses: 14200,
    },
];

interface MajorClient {
    id: string;
    name: string;
    industry: string;
    product: string;
    annualRevenue: number;
    seats: number;
    status: "Active" | "At Risk";
}

const majorClients: MajorClient[] = [
    {
        id: "client-1",
        name: "Tata Capital",
        industry: "Financial Services",
        product: "LOS Origination",
        annualRevenue: 680000,
        seats: 4200,
        status: "Active",
    },
    {
        id: "client-2",
        name: "HDFC Life",
        industry: "Insurance",
        product: "ERP Enterprise",
        annualRevenue: 540000,
        seats: 3100,
        status: "Active",
    },
    {
        id: "client-3",
        name: "Bajaj Finance",
        industry: "Financial Services",
        product: "LMS Platform",
        annualRevenue: 425000,
        seats: 2800,
        status: "Active",
    },
    {
        id: "client-4",
        name: "Reliance Retail",
        industry: "Retail",
        product: "ERP Enterprise",
        annualRevenue: 390000,
        seats: 5200,
        status: "Active",
    },
    {
        id: "client-5",
        name: "Infosys BPM",
        industry: "IT Services",
        product: "HRMS Suite",
        annualRevenue: 315000,
        seats: 6400,
        status: "At Risk",
    },
];

interface CustomerActivity {
    id: string;
    customer: string;
    action: string;
    product: string;
    time: string;
    type: "Expansion" | "Renewal" | "Support" | "New";
}

const recentActivities: CustomerActivity[] = [
    {
        id: "activity-1",
        customer: "Tata Capital",
        action: "Added 850 new seats",
        product: "LOS Origination",
        time: "18 min ago",
        type: "Expansion",
    },
    {
        id: "activity-2",
        customer: "HDFC Life",
        action: "Renewal completed",
        product: "ERP Enterprise",
        time: "1 hr ago",
        type: "Renewal",
    },
    {
        id: "activity-3",
        customer: "Bajaj Finance",
        action: "Support case resolved",
        product: "LMS Platform",
        time: "2 hrs ago",
        type: "Support",
    },
    {
        id: "activity-4",
        customer: "Reliance Retail",
        action: "Enterprise module activated",
        product: "ERP Enterprise",
        time: "4 hrs ago",
        type: "New",
    },
    {
        id: "activity-5",
        customer: "Infosys BPM",
        action: "Renewal discussion started",
        product: "HRMS Suite",
        time: "6 hrs ago",
        type: "Renewal",
    },
];

const RevenueContribution: React.FC = () => {
    const totalRevenue = portfolioProducts.reduce(
        (sum, product) => sum + product.annualRevenue,
        0
    );

    return (
        <div className="h-full rounded-xl border border-[var(--border)] bg-card p-4 shadow-sm">
            {/* Section Header */}
            <div className="mb-4 flex items-center justify-between gap-3">
                <div>
                    <h2 className="text-sm font-extrabold tracking-tight text-main">
                        Revenue Contribution
                    </h2>

                    <p className="mt-0.5 text-[10px] font-medium text-muted">
                        Annual revenue contribution by product
                    </p>
                </div>

                <span className="shrink-0 rounded-full bg-primary/10 px-2.5 py-1 text-[10px] font-bold text-primary">
                    ${(totalRevenue / 1000000).toFixed(2)}M ARR
                </span>
            </div>

            {/* Donut + Legend */}
            <div className="flex flex-col items-center gap-6">
                {/* Donut */}
                <div className="relative flex h-40 w-40 shrink-0 items-center justify-center">
                    <div
                        className="absolute inset-0 rounded-full"
                        style={{
                            background: `conic-gradient(
                                var(--primary) 0% 40.2%,
                                #8b5cf6 40.2% 69.5%,
                                #06b6d4 69.5% 86.5%,
                                #10b981 86.5% 100%
                            )`,
                        }}
                    />

                    <div className="absolute inset-[18px] rounded-full bg-card" />

                    <div className="relative text-center">
                        <div className="text-lg font-extrabold text-main">
                            $12.68M
                        </div>

                        <div className="text-[9px] font-semibold text-muted">
                            Total ARR
                        </div>
                    </div>
                </div>

                {/* Legend */}
                <div className="w-full space-y-3">
                    {portfolioProducts.map((product, index) => {
                        const share =
                            (product.annualRevenue / totalRevenue) * 100;

                        const dotClasses = [
                            "bg-primary",
                            "bg-violet-500",
                            "bg-cyan-500",
                            "bg-emerald-500",
                        ];

                        return (
                            <div
                                key={product.id}
                                className="flex items-center justify-between gap-3"
                            >
                                <div className="flex min-w-0 items-center gap-2">
                                    <span
                                        className={`h-2.5 w-2.5 shrink-0 rounded-full ${dotClasses[index]}`}
                                    />

                                    <span className="truncate text-xs font-bold text-main">
                                        {product.name}
                                    </span>
                                </div>

                                <div className="flex shrink-0 items-center gap-3">
                                    <span className="text-[10px] font-semibold text-muted">
                                        $
                                        {(
                                            product.annualRevenue / 1000000
                                        ).toFixed(2)}
                                        M
                                    </span>

                                    <span className="w-10 text-right text-[10px] font-extrabold text-main">
                                        {share.toFixed(1)}%
                                    </span>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

const MasterSiteDashboard: React.FC = () => {
    const [segment, setSegment] = useState("All Customer Segments");
    const [dateRange, setDateRange] = useState("Last 30 days");
    // const [notificationsOpen, setNotificationsOpen] = useState(false);
    const [portfolioTab, setPortfolioTab] = useState("all");
    const displayedProducts =
        portfolioTab === "growth"
            ? portfolioProducts.filter((product) => product.growthRate >= 20)
            : portfolioTab === "arr"
                ? [...portfolioProducts].sort(
                    (a, b) => b.annualRevenue - a.annualRevenue
                )
                : portfolioProducts;
    const totalMonthlyRevenue = portfolioProducts.reduce(
        (sum, product) => sum + product.monthlyRevenue,
        0
    );

    const totalAnnualRevenue = portfolioProducts.reduce(
        (sum, product) => sum + product.annualRevenue,
        0
    );

    const totalLicenses = portfolioProducts.reduce(
        (sum, product) => sum + product.activeLicenses,
        0
    );

    const getSalesShare = (revenue: number) =>
        (revenue / totalMonthlyRevenue) * 100;

    const handleExport = () => {
        const headers = [
            "Product",
            "Monthly Revenue",
            "Annual Revenue",
            "Churn Rate",
            "Annual Growth",
            "Active Licenses",
            "Sales Share",
        ];

        const rows = portfolioProducts.map((product) => [
            product.name,
            product.monthlyRevenue,
            product.annualRevenue,
            `${product.churnRate}%`,
            `${product.growthRate}%`,
            product.activeLicenses,
            `${getSalesShare(product.monthlyRevenue).toFixed(1)}%`,
        ]);

        const csv = [
            headers,
            ...rows,
        ]
            .map((row) =>
                row
                    .map((value) => `"${String(value).replace(/"/g, '""')}"`)
                    .join(",")
            )
            .join("\n");

        const blob = new Blob([csv], {
            type: "text/csv;charset=utf-8;",
        });

        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");

        link.href = url;
        link.download = "master-site-dashboard-report.csv";
        link.click();

        URL.revokeObjectURL(url);
    };


    return (
        <div className="h-full min-h-0 overflow-y-auto bg-background p-4 md:p-6">
            <div className="mx-auto w-full max-w-[1600px] space-y-4">

                {/* Page Heading */}
                <div className="px-1">
                    <h1 className="text-2xl font-extrabold tracking-tight text-main">
                        Dashboard Summary
                    </h1>
                </div>


                {/* KPI Row */}
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
                    <KpiCard
                        title="Total Sales & Revenue"
                        value="$14.28M"
                        badge="+28.4% YoY"
                        footer={
                            <span className="text-[11px] font-semibold text-emerald-600">
                                ↑ +28.4% YoY
                            </span>
                        }
                    />

                    <KpiCard
                        title="Annual Growth Rate"
                        value="+28.4%"
                        badge="+10.4% MoM"
                        footer={
                            <span className="text-[11px] font-semibold text-emerald-600">
                                then last year
                            </span>
                        }
                    />

                    <KpiCard
                        title="Active Paid Seats"
                        value="40,650"
                        badge="+1,420 Net Seats"
                        badgeTone="blue"
                        footer={
                            <div>
                                <div className="flex h-1.5 overflow-hidden rounded-full bg-slate-100">
                                    <span className="w-[55%] bg-amber-400" />
                                    <span className="w-[35%] bg-emerald-500" />
                                    <span className="w-[8%] bg-cyan-500" />
                                    <span className="w-[2%] bg-primary" />
                                </div>

                                <div className="mt-2 flex items-center justify-between text-[9px] font-semibold text-muted">
                                    <span>HR 22.5k</span>
                                    <span>LM 14.2k</span>
                                    <span>LO 3.1k</span>
                                    <span>EP 850</span>
                                </div>
                            </div>
                        }
                    />

                    <KpiCard
                        title="Blended Churn Rate"
                        value="1.9%"
                        badge="Optimal (&lt; 2.0%)"
                        footer={
                            <span className="text-[11px] font-semibold text-emerald-600">
                                -0.3% 90d
                            </span>
                        }
                    />
                </div>

                {/* Portfolio + Revenue */}
                <div className="grid grid-cols-1 items-stretch gap-4 xl:grid-cols-[4fr_1fr]">

                    {/* LEFT — Portfolio Breakdown — 80% */}
                    <div className="min-w-0 overflow-hidden rounded-xl border border-[var(--border)] bg-card shadow-sm">

                        {/* Section Header */}
                        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--border)] px-4 py-3">
                            <h2 className="text-sm font-extrabold tracking-tight text-main">
                                Portfolio Breakdown
                            </h2>

                            <div className="flex items-center rounded-lg bg-row-hover p-1">

                                {/* All */}
                                <button
                                    type="button"
                                    onClick={() => setPortfolioTab("all")}
                                    aria-pressed={portfolioTab === "all"}
                                    className={`rounded-md px-3 py-1.5 text-[10px] font-bold transition ${portfolioTab === "all"
                                        ? "bg-card text-primary shadow-sm"
                                        : "text-muted hover:text-main"
                                        }`}
                                >
                                    All 4 Products
                                </button>

                                {/* High Growth */}
                                <button
                                    type="button"
                                    onClick={() => setPortfolioTab("growth")}
                                    aria-pressed={portfolioTab === "growth"}
                                    className={`rounded-md px-3 py-1.5 text-[10px] font-bold transition ${portfolioTab === "growth"
                                        ? "bg-card text-primary shadow-sm"
                                        : "text-muted hover:text-main"
                                        }`}
                                >
                                    High Growth (
                                    {
                                        portfolioProducts.filter(
                                            (product) => product.growthRate >= 20
                                        ).length
                                    }
                                    )
                                </button>

                                {/* By ARR */}
                                <button
                                    type="button"
                                    onClick={() => setPortfolioTab("arr")}
                                    aria-pressed={portfolioTab === "arr"}
                                    className={`rounded-md px-3 py-1.5 text-[10px] font-bold transition ${portfolioTab === "arr"
                                        ? "bg-card text-primary shadow-sm"
                                        : "text-muted hover:text-main"
                                        }`}
                                >
                                    By ARR
                                </button>

                            </div>
                        </div>

                        {/* Table */}
                        <div className="overflow-x-auto">
                            <table className="w-full min-w-0 table-fixed text-left">

                                <thead>
                                    <tr className="border-b border-[var(--border)] bg-slate-50/70 dark:bg-slate-900/30">

                                        <th className="w-[20%] px-4 py-3 text-[10px] font-bold uppercase tracking-wide text-muted">
                                            Product Name
                                        </th>

                                        <th className="w-[14%] px-3 py-3 text-right text-[10px] font-bold uppercase tracking-wide text-muted">
                                            Monthly Rev (MRR)
                                        </th>

                                        <th className="w-[13%] px-3 py-3 text-right text-[10px] font-bold uppercase tracking-wide text-muted">
                                            Annual Rev (ARR)
                                        </th>

                                        <th className="w-[11%] px-3 py-3 text-center text-[10px] font-bold uppercase tracking-wide text-muted">
                                            Churn Rate
                                        </th>

                                        <th className="w-[14%] px-3 py-3 text-right text-[10px] font-bold uppercase tracking-wide text-muted">
                                            Annual Growth (YoY)
                                        </th>

                                        <th className="w-[14%] px-3 py-3 text-right text-[10px] font-bold uppercase tracking-wide text-muted">
                                            Active Licenses
                                        </th>

                                        <th className="w-[14%] px-4 py-3 text-right text-[10px] font-bold uppercase tracking-wide text-muted">
                                            Sales Share
                                        </th>

                                    </tr>
                                </thead>

                                <tbody>
                                    {displayedProducts.length > 0 ? (
                                        displayedProducts.map((product) => {
                                            const salesShare = getSalesShare(
                                                product.monthlyRevenue
                                            );

                                            return (
                                                <tr
                                                    key={product.id}
                                                    className="border-b border-[var(--border)] last:border-b-0 transition-colors hover:bg-row-hover/60"
                                                >
                                                    {/* Product */}
                                                    <td className="px-4 py-3">
                                                        <div className="flex min-w-0 items-center gap-2.5">
                                                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-primary/15 bg-primary/5 text-[10px] font-extrabold text-primary">
                                                                {product.shortName}
                                                            </div>

                                                            <span className="truncate text-xs font-bold text-main">
                                                                {product.name}
                                                            </span>
                                                        </div>
                                                    </td>

                                                    {/* MRR */}
                                                    <td className="px-3 py-3 text-right text-xs font-bold text-main">
                                                        ${product.monthlyRevenue.toLocaleString()}
                                                    </td>

                                                    {/* ARR */}
                                                    <td className="px-3 py-3 text-right text-xs font-bold text-primary">
                                                        $
                                                        {(
                                                            product.annualRevenue / 1000000
                                                        ).toFixed(2)}
                                                        M
                                                    </td>

                                                    {/* Churn */}
                                                    <td className="px-3 py-3 text-center">
                                                        <span
                                                            className={`inline-flex rounded-full px-2 py-1 text-[9px] font-bold ${product.churnRate >= 3
                                                                ? "bg-red-50 text-red-600"
                                                                : product.churnRate >= 2
                                                                    ? "bg-amber-50 text-amber-600"
                                                                    : "bg-emerald-50 text-emerald-600"
                                                                }`}
                                                        >
                                                            {product.churnRate}%
                                                        </span>
                                                    </td>

                                                    {/* Growth */}
                                                    <td className="px-3 py-3 text-right text-xs font-bold text-emerald-600">
                                                        +{product.growthRate}%
                                                    </td>

                                                    {/* Licenses */}
                                                    <td className="px-3 py-3 text-right text-xs font-semibold text-main">
                                                        {product.activeLicenses.toLocaleString()}
                                                    </td>

                                                    {/* Sales Share */}
                                                    <td className="px-4 py-3">
                                                        <div className="flex items-center justify-end gap-2">
                                                            <div className="h-1.5 w-14 overflow-hidden rounded-full bg-slate-100">
                                                                <div
                                                                    className="h-full rounded-full bg-primary"
                                                                    style={{
                                                                        width: `${salesShare}%`,
                                                                    }}
                                                                />
                                                            </div>

                                                            <span className="w-10 text-right text-[10px] font-bold text-muted">
                                                                {salesShare.toFixed(1)}%
                                                            </span>
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })
                                    ) : (
                                        <tr>
                                            <td
                                                colSpan={7}
                                                className="px-4 py-8 text-center text-xs font-semibold text-muted"
                                            >
                                                No products match this view.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>

                                {/* Total */}
                                <tfoot>
                                    <tr className="border-t border-primary/20 bg-primary/[0.03]">

                                        <td className="px-4 py-3">
                                            <div className="text-[10px] font-extrabold uppercase tracking-wide text-primary">
                                                Total Portfolio
                                            </div>

                                            <div className="text-[9px] font-semibold text-muted">
                                                Consolidated
                                            </div>
                                        </td>

                                        <td className="px-3 py-3 text-right text-xs font-bold text-main">
                                            ${totalMonthlyRevenue.toLocaleString()}
                                        </td>

                                        <td className="px-3 py-3 text-right text-xs font-bold text-primary">
                                            ${(totalAnnualRevenue / 1000000).toFixed(2)}M
                                        </td>

                                        <td className="px-3 py-3 text-center text-xs font-bold text-emerald-600">
                                            1.9%
                                        </td>

                                        <td className="px-3 py-3 text-right text-xs font-bold text-emerald-600">
                                            +28.4%
                                        </td>

                                        <td className="px-3 py-3 text-right text-xs font-bold text-main">
                                            {totalLicenses.toLocaleString()}
                                        </td>

                                        <td className="px-4 py-3 text-right text-xs font-bold text-main">
                                            100.0%
                                        </td>

                                    </tr>
                                </tfoot>

                            </table>
                        </div>

                    </div>

                    {/* RIGHT — Revenue Contribution — 20% */}
                    <RevenueContribution />

                </div>
                <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">

                    {/* Top 5 Major Client Accounts */}
                    <div className="rounded-xl border border-[var(--border)] bg-card shadow-sm">

                        <div className="flex items-center justify-between border-b border-[var(--border)] px-4 py-3">
                            <div>
                                <h2 className="text-sm font-extrabold tracking-tight text-main">
                                    Top 5 Major Client Accounts
                                </h2>

                                <p className="mt-0.5 text-[10px] font-medium text-muted">
                                    Highest-value customer accounts by ARR
                                </p>
                            </div>

                            <span className="rounded-full bg-primary/10 px-2.5 py-1 text-[10px] font-bold text-primary">
                                5 Accounts
                            </span>
                        </div>

                        <div className="divide-y divide-[var(--border)]">

                            {majorClients.map((client, index) => (
                                <div
                                    key={client.id}
                                    className="flex items-center gap-3 px-4 py-3"
                                >

                                    {/* Rank */}
                                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary/5 text-[10px] font-extrabold text-primary">
                                        {index + 1}
                                    </div>

                                    {/* Customer */}
                                    <div className="min-w-0 flex-1">
                                        <div className="truncate text-xs font-extrabold text-main">
                                            {client.name}
                                        </div>

                                        <div className="mt-0.5 truncate text-[9px] font-medium text-muted">
                                            {client.industry} · {client.product}
                                        </div>
                                    </div>

                                    {/* ARR */}
                                    <div className="text-right">
                                        <div className="text-xs font-extrabold text-main">
                                            ${(client.annualRevenue / 1000).toFixed(0)}K
                                        </div>

                                        <div className="text-[9px] font-medium text-muted">
                                            {client.seats.toLocaleString()} seats
                                        </div>
                                    </div>

                                    {/* Status */}
                                    <span
                                        className={`shrink-0 rounded-full px-2 py-1 text-[9px] font-bold ${client.status === "Active"
                                            ? "bg-emerald-50 text-emerald-600"
                                            : "bg-amber-50 text-amber-600"
                                            }`}
                                    >
                                        {client.status}
                                    </span>

                                </div>
                            ))}

                        </div>
                    </div>


                    {/* Recent Customer Activity */}
                    <div className="rounded-xl border border-[var(--border)] bg-card shadow-sm">

                        <div className="flex items-center justify-between border-b border-[var(--border)] px-4 py-3">
                            <div>
                                <h2 className="text-sm font-extrabold tracking-tight text-main">
                                    Recent Customer Activity
                                </h2>

                                <p className="mt-0.5 text-[10px] font-medium text-muted">
                                    Latest customer actions across the portfolio
                                </p>
                            </div>

                            <span className="rounded-full bg-primary/10 px-2.5 py-1 text-[10px] font-bold text-primary">
                                Live
                            </span>
                        </div>

                        <div className="divide-y divide-[var(--border)]">

                            {recentActivities.map((activity) => {

                                const activityStyles = {
                                    Expansion: "bg-emerald-50 text-emerald-600",
                                    Renewal: "bg-primary/10 text-primary",
                                    Support: "bg-amber-50 text-amber-600",
                                    New: "bg-cyan-50 text-cyan-600",
                                };

                                return (
                                    <div
                                        key={activity.id}
                                        className="flex items-center gap-3 px-4 py-3"
                                    >

                                        {/* Activity indicator */}
                                        <div
                                            className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-[9px] font-extrabold ${activityStyles[activity.type]
                                                }`}
                                        >
                                            {activity.type === "Expansion"
                                                ? "↑"
                                                : activity.type === "Renewal"
                                                    ? "↻"
                                                    : activity.type === "Support"
                                                        ? "?"
                                                        : "+"}
                                        </div>

                                        {/* Activity */}
                                        <div className="min-w-0 flex-1">
                                            <div className="truncate text-xs font-bold text-main">
                                                {activity.customer}
                                            </div>

                                            <div className="mt-0.5 truncate text-[9px] font-medium text-muted">
                                                {activity.action} · {activity.product}
                                            </div>
                                        </div>

                                        {/* Time */}
                                        <div className="shrink-0 text-[9px] font-semibold text-muted">
                                            {activity.time}
                                        </div>

                                    </div>
                                );
                            })}

                        </div>
                    </div>

                </div>

            </div>
        </div>
    );
};

export default MasterSiteDashboard;