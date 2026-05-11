// SalarySlipTab.tsx
import React, { useEffect, useState, useMemo } from "react";
import {
  FileText,
  TrendingUp,
  TrendingDown,
  Calendar,
  CreditCard,
  Layers,
  BarChart2,
  CheckCircle2,
  Download,
  Printer,
  ChevronDown,
  ChevronUp,
  Search,
  Filter,
  X,
  Eye,
  AlertCircle,
  DollarSign,
  Wallet,
  Clock,
  Award,
  Briefcase,
  Shield,
  Gift,
  Home,
  Car,
  Heart,
  Coffee,
  Moon,
  Sun,
  Zap,
  Target,
  Flag,
  Star,
  Users,
  Building,
  MapPin,
  Phone,
  Mail,
  Globe,
  Linkedin,
  Twitter,
  Facebook,
  Instagram,
  Youtube,
  Twitch,
 
} from "lucide-react";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  LineChart,
  Line,
  AreaChart,
  Area,
} from "recharts";

// Mock API functions - Replace with your actual API calls
const getSalarySlipsByEmployee = async (employeeId: string, filters?: any) => {
  // Generate comprehensive mock data with 24 months of history
  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];
  
  const years = [2023, 2024, 2025];
  const slips = [];
  
  for (const year of years) {
    for (let i = 0; i < (year === 2025 ? 3 : 12); i++) {
      const month = months[i];
      const statuses = ["Draft", "Submitted", "Paid", "Cancelled"];
      const status = year === 2025 && i > 1 ? "Draft" : i > 8 ? "Paid" : i > 4 ? "Submitted" : "Paid";
      
      slips.push({
        id: `SLIP-${year}${String(i+1).padStart(2,'0')}-${employeeId.slice(-4)}`,
        name: `slip_${year}_${i+1}`,
        month: month,
        year: year,
        period: `${month} ${year}`,
        status: status,
        generated_date: `${year}-${String(i+1).padStart(2,'0')}-15`,
        payment_date: status === "Paid" ? `${year}-${String(i+1).padStart(2,'0')}-28` : null,
        gross_pay: 75000 + Math.random() * 25000,
        net_pay: 58000 + Math.random() * 20000,
        deductions: {
          pf: 5400 + Math.random() * 1000,
          tax: 8500 + Math.random() * 3000,
          professional_tax: 200,
          health_insurance: 600 + Math.random() * 400,
          loan: Math.random() > 0.7 ? 5000 : 0,
        },
        earnings: {
          basic: 35000 + Math.random() * 5000,
          hra: 17500 + Math.random() * 2500,
          special_allowance: 12000 + Math.random() * 3000,
          bonus: Math.random() > 0.5 ? 5000 + Math.random() * 5000 : 0,
          conveyance: 1600,
          medical: 1250,
        },
        attendance: {
          working_days: 22,
          present_days: 20 + Math.floor(Math.random() * 3),
          absent_days: Math.floor(Math.random() * 3),
          leave_days: Math.floor(Math.random() * 2),
        },
      });
    }
  }
  
  // Sort by year and month descending
  return slips.sort((a, b) => {
    if (a.year !== b.year) return b.year - a.year;
    return months.indexOf(b.month) - months.indexOf(a.month);
  });
};

const getSalarySlipDetail = async (slipId: string) => {
  // Generate detailed salary slip data
  const [_, year, month] = slipId.match(/SLIP-(\d{4})(\d{2})/) || [];
  const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  const monthIndex = parseInt(month) - 1;
  
  const baseGross = 85000;
  const bonus = monthIndex === 11 ? 25000 : (monthIndex === 2 ? 15000 : 5000);
  const gross = baseGross + bonus;
  const pf = Math.min(5400, gross * 0.12);
  const tax = Math.max(0, (gross - 50000) * 0.1);
  
  return {
    id: slipId,
    employee_id: "EMP001",
    employee_name: "Sarah Johnson",
    designation: "Senior Product Manager",
    department: "Product Management",
    location: "San Francisco, CA",
    joining_date: "2022-06-01",
    pan_number: "ABCDE1234F",
    bank_account: "XXXX-XXXX-1234",
    ifsc_code: "SBIN0012345",
    uan_number: "123456789012",
    
    period_start: `${year}-${month}-01`,
    period_end: `${year}-${month}-${new Date(parseInt(year), monthIndex + 1, 0).getDate()}`,
    generated_date: `${year}-${month}-15`,
    payment_date: `${year}-${month}-28`,
    payment_mode: "Bank Transfer",
    
    status: "Paid",
    currency: "USD",
    
    earnings: {
      basic: 42500,
      hra: 21250,
      special_allowance: 12750,
      bonus: bonus,
      conveyance: 1600,
      medical_reimbursement: 1250,
      leave_encashment: monthIndex === 5 ? 3000 : 0,
      performance_incentive: monthIndex === 8 ? 5000 : 0,
      shift_allowance: 2000,
      internet_reimbursement: 1000,
      fuel_reimbursement: 1500,
    },
    
    deductions: {
      provident_fund: pf,
      professional_tax: 200,
      income_tax: tax,
      health_insurance: 750,
      group_insurance: 300,
      loan_repayment: monthIndex < 6 ? 5000 : 0,
      advance_salary: 0,
      other_deductions: 0,
    },
    
    attendance: {
      working_days: 22,
      present_days: 21,
      absent_days: 0,
      paid_leaves: 1,
      unpaid_leaves: 0,
      overtime_hours: 8,
    },
    
    totals: {
      gross_pay: gross,
      total_earnings: gross,
      total_deductions: pf + 200 + tax + 750 + 300 + (monthIndex < 6 ? 5000 : 0),
      net_pay: gross - (pf + 200 + tax + 750 + 300 + (monthIndex < 6 ? 5000 : 0)),
      ctc_annual: 1400000,
    },
    
    year_to_date: {
      gross_ytd: gross * (monthIndex + 1),
      net_ytd: (gross - (pf + 200 + tax + 750 + 300)) * (monthIndex + 1),
      tax_ytd: tax * (monthIndex + 1),
      pf_ytd: pf * (monthIndex + 1),
    },
    
    additional_info: {
      approval_status: "Approved",
      approved_by: "John Smith (Finance Manager)",
      approval_date: `${year}-${month}-20`,
      notes: "Regular monthly payroll processing",
      revision_number: 0,
      is_revised: false,
    },
  };
};

// Helper functions
const formatCurrency = (amount: number, currency: string = "USD"): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

const formatDate = (dateString: string): string => {
  if (!dateString) return "N/A";
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
  const config = {
    Paid: { bg: "bg-success/10", text: "text-success", icon: CheckCircle2 },
    Submitted: { bg: "bg-warning/10", text: "text-warning", icon: Clock },
    Draft: { bg: "bg-info/10", text: "text-info", icon: FileText },
    Cancelled: { bg: "bg-danger/10", text: "text-danger", icon: X },
  };
  
  const { bg, text, icon: Icon } = config[status as keyof typeof config] || config.Draft;
  
  return (
    <span className={`inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded ${bg} ${text}`}>
      <Icon className="w-3 h-3" />
      {status}
    </span>
  );
};

// Main Component
interface Props {
  employee: {
    employee: string;
    employee_name: string;
    designation?: string;
    department?: string;
  };
}

export const SalarySlipTab: React.FC<Props> = ({ employee }) => {
  const [loading, setLoading] = useState(true);
  const [allSlips, setAllSlips] = useState<any[]>([]);
  const [filteredSlips, setFilteredSlips] = useState<any[]>([]);
  const [selectedSlip, setSelectedSlip] = useState<any>(null);
  const [expandedSlipId, setExpandedSlipId] = useState<string | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  
  // Filter states
  const [filters, setFilters] = useState({
    month: "",
    year: "",
    startDate: "",
    endDate: "",
    slipId: "",
    status: "",
  });
  const [showFilters, setShowFilters] = useState(false);
  
  // Summary stats
  const [summary, setSummary] = useState({
    totalPaidThisYear: 0,
    averageMonthlySalary: 0,
    latestSalaryCredited: 0,
    pendingPayments: 0,
  });
  
  // Available years and months for filters
  const availableYears = useMemo(() => {
    const years = new Set(allSlips.map(slip => slip.year));
    return Array.from(years).sort((a, b) => b - a);
  }, [allSlips]);
  
  const availableMonths = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];
  
  // Load all salary slips
  useEffect(() => {
    loadAllSlips();
  }, [employee.employee]);
  
  const loadAllSlips = async () => {
    setLoading(true);
    try {
      const slips = await getSalarySlipsByEmployee(employee.employee);
      setAllSlips(slips);
      setFilteredSlips(slips);
      
      // Calculate summary statistics
      const currentYear = new Date().getFullYear();
      const yearSlips = slips.filter(s => s.year === currentYear && s.status === "Paid");
      const totalPaid = yearSlips.reduce((sum, s) => sum + s.net_pay, 0);
      
      const paidSlips = slips.filter(s => s.status === "Paid");
      const avgSalary = paidSlips.length > 0 
        ? paidSlips.reduce((sum, s) => sum + s.net_pay, 0) / paidSlips.length 
        : 0;
        
      const latestPaid = slips.find(s => s.status === "Paid")?.net_pay || 0;
      const pendingCount = slips.filter(s => s.status === "Draft" || s.status === "Submitted").length;
      
      setSummary({
        totalPaidThisYear: totalPaid,
        averageMonthlySalary: avgSalary,
        latestSalaryCredited: latestPaid,
        pendingPayments: pendingCount,
      });
      
      // Select the most recent slip by default
      if (slips.length > 0) {
        await loadSlipDetail(slips[0].id);
      }
    } catch (error) {
      console.error("Error loading salary slips:", error);
    } finally {
      setLoading(false);
    }
  };
  
  const loadSlipDetail = async (slipId: string) => {
    setLoadingDetail(true);
    try {
      const detail = await getSalarySlipDetail(slipId);
      setSelectedSlip(detail);
    } catch (error) {
      console.error("Error loading slip detail:", error);
    } finally {
      setLoadingDetail(false);
    }
  };
  
  // Apply filters
  const applyFilters = () => {
    let filtered = [...allSlips];
    
    if (filters.month) {
      filtered = filtered.filter(s => s.month === filters.month);
    }
    if (filters.year) {
      filtered = filtered.filter(s => s.year === parseInt(filters.year));
    }
    if (filters.startDate) {
      filtered = filtered.filter(s => s.generated_date >= filters.startDate);
    }
    if (filters.endDate) {
      filtered = filtered.filter(s => s.generated_date <= filters.endDate);
    }
    if (filters.slipId) {
      filtered = filtered.filter(s => s.id.toLowerCase().includes(filters.slipId.toLowerCase()));
    }
    if (filters.status) {
      filtered = filtered.filter(s => s.status === filters.status);
    }
    
    setFilteredSlips(filtered);
  };
  
  const clearFilters = () => {
    setFilters({
      month: "",
      year: "",
      startDate: "",
      endDate: "",
      slipId: "",
      status: "",
    });
    setFilteredSlips(allSlips);
  };
  
  const handleSlipSelect = async (slip: any) => {
    await loadSlipDetail(slip.id);
    setExpandedSlipId(null);
  };
  
  const handleDownload = (slip: any) => {
    console.log("Downloading salary slip:", slip.id);
    // Implement PDF download
  };
  
  const handlePrint = () => {
    window.print();
  };
  
  // Get top 5 recent slips
  const recentSlips = filteredSlips.slice(0, 5);
  
  if (loading) {
    return <LoadingSkeleton />;
  }
  
  return (
    <div className="space-y-5 salary-slip-tab">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-main">Salary & Payslip History</h2>
          <p className="text-xs text-muted mt-0.5">Complete compensation history with detailed breakdowns</p>
        </div>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors ${
            showFilters ? "bg-primary text-white border-primary" : "border-theme hover:bg-app"
          }`}
        >
          <Filter className="w-3.5 h-3.5" />
          {showFilters ? "Hide Filters" : "Show Filters"}
        </button>
      </div>
      
      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <SummaryCard
          title="Total Paid This Year"
          value={formatCurrency(summary.totalPaidThisYear)}
          subtitle="January - December 2024"
          icon={<DollarSign className="w-5 h-5" />}
          color="success"
        />
        <SummaryCard
          title="Average Monthly Salary"
          value={formatCurrency(summary.averageMonthlySalary)}
          subtitle="Based on 12 months"
          icon={<TrendingUp className="w-5 h-5" />}
          color="info"
        />
        <SummaryCard
          title="Latest Salary Credited"
          value={formatCurrency(summary.latestSalaryCredited)}
          subtitle="Most recent payment"
          icon={<Wallet className="w-5 h-5" />}
          color="primary"
        />
        <SummaryCard
          title="Pending Payments"
          value={summary.pendingPayments.toString()}
          subtitle="Awaiting processing"
          icon={<Clock className="w-5 h-5" />}
          color="warning"
        />
      </div>
      
      {/* Filters Panel */}
      {showFilters && (
        <div className="rounded-xl border border-theme bg-card p-4">
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-3">
            <div>
              <label className="text-[10px] font-semibold uppercase tracking-wider text-muted block mb-1">Month</label>
              <select
                value={filters.month}
                onChange={(e) => setFilters({ ...filters, month: e.target.value })}
                className="w-full px-2 py-1.5 text-xs rounded-lg border border-theme bg-card text-main focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="">All Months</option>
                {availableMonths.map(month => (
                  <option key={month} value={month}>{month}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-[10px] font-semibold uppercase tracking-wider text-muted block mb-1">Year</label>
              <select
                value={filters.year}
                onChange={(e) => setFilters({ ...filters, year: e.target.value })}
                className="w-full px-2 py-1.5 text-xs rounded-lg border border-theme bg-card text-main focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="">All Years</option>
                {availableYears.map(year => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-[10px] font-semibold uppercase tracking-wider text-muted block mb-1">From Date</label>
              <input
                type="date"
                value={filters.startDate}
                onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
                className="w-full px-2 py-1.5 text-xs rounded-lg border border-theme bg-card text-main focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
            <div>
              <label className="text-[10px] font-semibold uppercase tracking-wider text-muted block mb-1">To Date</label>
              <input
                type="date"
                value={filters.endDate}
                onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
                className="w-full px-2 py-1.5 text-xs rounded-lg border border-theme bg-card text-main focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
            <div>
              <label className="text-[10px] font-semibold uppercase tracking-wider text-muted block mb-1">Slip ID</label>
              <input
                type="text"
                placeholder="Search by ID..."
                value={filters.slipId}
                onChange={(e) => setFilters({ ...filters, slipId: e.target.value })}
                className="w-full px-2 py-1.5 text-xs rounded-lg border border-theme bg-card text-main focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
            <div>
              <label className="text-[10px] font-semibold uppercase tracking-wider text-muted block mb-1">Status</label>
              <select
                value={filters.status}
                onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                className="w-full px-2 py-1.5 text-xs rounded-lg border border-theme bg-card text-main focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="">All Status</option>
                <option value="Paid">Paid</option>
                <option value="Submitted">Submitted</option>
                <option value="Draft">Draft</option>
                <option value="Cancelled">Cancelled</option>
              </select>
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <button
              onClick={clearFilters}
              className="px-3 py-1.5 text-xs font-medium rounded-lg border border-theme hover:bg-app transition-colors"
            >
              Clear Filters
            </button>
            <button
              onClick={applyFilters}
              className="px-3 py-1.5 text-xs font-medium rounded-lg bg-primary text-white hover:bg-primary/90 transition-colors"
            >
              Apply Filters
            </button>
          </div>
        </div>
      )}
      
      {/* Recent Salary Slips - Quick Access Cards */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-main">Recent Salary Slips</h3>
          <span className="text-[10px] text-muted">{filteredSlips.length} total records</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
          {recentSlips.map((slip, idx) => (
            <RecentSlipCard
              key={slip.id}
              slip={slip}
              isSelected={selectedSlip?.id === slip.id}
              onSelect={() => handleSlipSelect(slip)}
              onDownload={() => handleDownload(slip)}
            />
          ))}
        </div>
      </div>
      
      {/* Full Salary Slips List */}
      <div>
        <h3 className="text-sm font-semibold text-main mb-3">All Salary Records</h3>
        <div className="space-y-3">
          {filteredSlips.map((slip) => (
            <SalarySlipRow
              key={slip.id}
              slip={slip}
              isExpanded={expandedSlipId === slip.id}
              isSelected={selectedSlip?.id === slip.id}
              onToggle={() => setExpandedSlipId(expandedSlipId === slip.id ? null : slip.id)}
              onSelect={() => handleSlipSelect(slip)}
              onDownload={() => handleDownload(slip)}
            />
          ))}
          
          {filteredSlips.length === 0 && (
            <EmptyState employeeName={employee.employee_name} />
          )}
        </div>
      </div>
      
      {/* Detailed Salary Breakdown Modal/Section */}
      {selectedSlip && (
        <SalaryBreakdownModal
          slip={selectedSlip}
          loading={loadingDetail}
          onClose={() => setSelectedSlip(null)}
          onDownload={() => handleDownload(selectedSlip)}
          onPrint={handlePrint}
        />
      )}
    </div>
  );
};

// Sub-components
const SummaryCard: React.FC<{
  title: string;
  value: string;
  subtitle: string;
  icon: React.ReactNode;
  color: "success" | "info" | "primary" | "warning";
}> = ({ title, value, subtitle, icon, color }) => {
  const colors = {
    success: "bg-success/10 text-success",
    info: "bg-info/10 text-info",
    primary: "bg-primary/10 text-primary",
    warning: "bg-warning/10 text-warning",
  };
  
  return (
    <div className="rounded-xl border border-theme bg-card p-4 hover:shadow-lg transition-shadow">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted">{title}</p>
          <p className="text-xl font-bold text-main mt-1">{value}</p>
          <p className="text-[10px] text-muted mt-1">{subtitle}</p>
        </div>
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${colors[color]}`}>
          {icon}
        </div>
      </div>
    </div>
  );
};

const RecentSlipCard: React.FC<{
  slip: any;
  isSelected: boolean;
  onSelect: () => void;
  onDownload: () => void;
}> = ({ slip, isSelected, onSelect, onDownload }) => {
  return (
    <div
      className={`rounded-xl border p-3 cursor-pointer transition-all hover:shadow-md ${
        isSelected ? "border-primary bg-primary/5" : "border-theme bg-card"
      }`}
      onClick={onSelect}
    >
      <div className="flex items-start justify-between mb-2">
        <div>
          <p className="text-xs font-semibold text-main">{slip.period}</p>
          <p className="text-[10px] text-muted font-mono mt-0.5">{slip.id}</p>
        </div>
        <StatusBadge status={slip.status} />
      </div>
      <div className="space-y-1">
        <div className="flex justify-between items-center">
          <span className="text-[9px] text-muted">Gross Pay</span>
          <span className="text-xs font-semibold text-main">{formatCurrency(slip.gross_pay)}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-[9px] text-muted">Net Pay</span>
          <span className="text-xs font-semibold text-success">{formatCurrency(slip.net_pay)}</span>
        </div>
      </div>
      <div className="flex gap-2 mt-3">
        <button
          onClick={(e) => { e.stopPropagation(); onDownload(); }}
          className="flex-1 flex items-center justify-center gap-1 px-2 py-1 text-[9px] font-medium rounded bg-app border border-theme hover:bg-card transition-colors"
        >
          <Download className="w-3 h-3" />
          PDF
        </button>
      </div>
    </div>
  );
};

const SalarySlipRow: React.FC<{
  slip: any;
  isExpanded: boolean;
  isSelected: boolean;
  onToggle: () => void;
  onSelect: () => void;
  onDownload: () => void;
}> = ({ slip, isExpanded, isSelected, onToggle, onSelect, onDownload }) => {
  return (
    <div className={`rounded-xl border ${isSelected ? "border-primary" : "border-theme"} bg-card overflow-hidden`}>
      {/* Row Header */}
      <div
        className={`flex items-center justify-between p-4 cursor-pointer hover:bg-app transition-colors ${
          isExpanded ? "border-b border-theme" : ""
        }`}
        onClick={onToggle}
      >
        <div className="flex items-center gap-4 flex-1">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
            <FileText className="w-5 h-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="text-sm font-semibold text-main">{slip.period}</p>
              <StatusBadge status={slip.status} />
            </div>
            <p className="text-[10px] text-muted font-mono mt-0.5">{slip.id}</p>
            <p className="text-[10px] text-muted mt-0.5">Generated: {formatDate(slip.generated_date)}</p>
          </div>
        </div>
        
        <div className="flex items-center gap-6">
          <div className="text-right hidden sm:block">
            <p className="text-[10px] text-muted">Gross Pay</p>
            <p className="text-sm font-semibold text-main">{formatCurrency(slip.gross_pay)}</p>
          </div>
          <div className="text-right">
            <p className="text-[10px] text-muted">Net Pay</p>
            <p className="text-sm font-semibold text-success">{formatCurrency(slip.net_pay)}</p>
          </div>
          <button
            onClick={(e) => { e.stopPropagation(); onSelect(); }}
            className="px-3 py-1.5 text-xs font-medium rounded-lg bg-primary text-white hover:bg-primary/90 transition-colors"
          >
            View Details
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onDownload(); }}
            className="p-1.5 rounded-lg border border-theme hover:bg-app transition-colors"
          >
            <Download className="w-4 h-4 text-muted" />
          </button>
          {isExpanded ? (
            <ChevronUp className="w-4 h-4 text-muted" />
          ) : (
            <ChevronDown className="w-4 h-4 text-muted" />
          )}
        </div>
      </div>
      
      {/* Expanded Content - Quick Stats */}
      {isExpanded && (
        <div className="p-4 bg-app border-t border-theme">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-[9px] text-muted uppercase tracking-wider">Working Days</p>
              <p className="text-sm font-semibold text-main mt-0.5">{slip.attendance?.working_days || 22}</p>
            </div>
            <div>
              <p className="text-[9px] text-muted uppercase tracking-wider">Present Days</p>
              <p className="text-sm font-semibold text-main mt-0.5">{slip.attendance?.present_days || 20}</p>
            </div>
            <div>
              <p className="text-[9px] text-muted uppercase tracking-wider">Payment Date</p>
              <p className="text-xs font-medium text-main mt-0.5">{formatDate(slip.payment_date)}</p>
            </div>
            <div>
              <p className="text-[9px] text-muted uppercase tracking-wider">Total Deductions</p>
              <p className="text-sm font-semibold text-danger mt-0.5">
                {formatCurrency(Object.values(slip.deductions || {}).reduce((a: number, b: number) => a + b, 0))}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const SalaryBreakdownModal: React.FC<{
  slip: any;
  loading: boolean;
  onClose: () => void;
  onDownload: () => void;
  onPrint: () => void;
}> = ({ slip, loading, onClose, onDownload, onPrint }) => {
  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-card rounded-xl max-w-4xl w-full max-h-[90vh] overflow-auto">
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="text-sm text-muted mt-4">Loading salary details...</p>
          </div>
        </div>
      </div>
    );
  }
  
  if (!slip) return null;
  
  const earningsEntries = Object.entries(slip.earnings || {});
  const deductionsEntries = Object.entries(slip.deductions || {});
  
  // Chart data
  const pieData = earningsEntries.map(([key, value]) => ({
    name: key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
    value: value as number,
  }));
  
  const COLORS = ["#185FA5", "#1D9E75", "#BA7517", "#8B5CF6", "#EC4899", "#0891B2", "#059669", "#D97706"];
  
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-card rounded-xl max-w-5xl w-full max-h-[90vh] overflow-auto" onClick={(e) => e.stopPropagation()}>
        {/* Modal Header */}
        <div className="sticky top-0 bg-card border-b border-theme px-6 py-4 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-main">Salary Breakdown</h3>
            <p className="text-xs text-muted">{slip.period} | {slip.id}</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onPrint}
              className="p-2 rounded-lg border border-theme hover:bg-app transition-colors"
            >
              <Printer className="w-4 h-4" />
            </button>
            <button
              onClick={onDownload}
              className="p-2 rounded-lg border border-theme hover:bg-app transition-colors"
            >
              <Download className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-lg border border-theme hover:bg-app transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
        
        {/* Modal Content */}
        <div className="p-6 space-y-6">
          {/* Employee Info */}
          <div className="bg-app rounded-xl p-4 border border-theme">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-[9px] text-muted uppercase tracking-wider">Employee Name</p>
                <p className="text-sm font-medium text-main mt-0.5">{slip.employee_name}</p>
              </div>
              <div>
                <p className="text-[9px] text-muted uppercase tracking-wider">Designation</p>
                <p className="text-sm font-medium text-main mt-0.5">{slip.designation}</p>
              </div>
              <div>
                <p className="text-[9px] text-muted uppercase tracking-wider">Department</p>
                <p className="text-sm font-medium text-main mt-0.5">{slip.department}</p>
              </div>
              <div>
                <p className="text-[9px] text-muted uppercase tracking-wider">PAN Number</p>
                <p className="text-sm font-medium text-main mt-0.5">{slip.pan_number}</p>
              </div>
            </div>
          </div>
          
          {/* Earnings & Deductions Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Earnings Chart */}
            <div className="rounded-xl border border-theme p-4">
              <h4 className="text-sm font-semibold text-main mb-4 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-success" />
                Earnings Breakdown
              </h4>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={70}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <RechartsTooltip
                    formatter={(value: number) => formatCurrency(value)}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="mt-4 space-y-1 max-h-32 overflow-y-auto">
                {earningsEntries.map(([key, value], idx) => (
                  <div key={key} className="flex justify-between text-xs">
                    <span className="text-muted">{key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</span>
                    <span className="font-medium text-success">{formatCurrency(value as number)}</span>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Deductions Chart */}
            <div className="rounded-xl border border-theme p-4">
              <h4 className="text-sm font-semibold text-main mb-4 flex items-center gap-2">
                <TrendingDown className="w-4 h-4 text-danger" />
                Deductions Breakdown
              </h4>
              <div className="space-y-3 max-h-[280px] overflow-y-auto">
                {deductionsEntries.map(([key, value]) => (
                  <div key={key} className="flex justify-between items-center border-b border-theme pb-2">
                    <span className="text-xs text-muted">{key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</span>
                    <span className="text-xs font-medium text-danger">{formatCurrency(value as number)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
          
          {/* Salary Summary */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="rounded-xl border border-theme p-3 text-center">
              <p className="text-[9px] text-muted">Gross Pay</p>
              <p className="text-lg font-bold text-main">{formatCurrency(slip.totals.gross_pay)}</p>
            </div>
            <div className="rounded-xl border border-theme p-3 text-center">
              <p className="text-[9px] text-muted">Total Earnings</p>
              <p className="text-lg font-bold text-success">{formatCurrency(slip.totals.total_earnings)}</p>
            </div>
            <div className="rounded-xl border border-theme p-3 text-center">
              <p className="text-[9px] text-muted">Total Deductions</p>
              <p className="text-lg font-bold text-danger">{formatCurrency(slip.totals.total_deductions)}</p>
            </div>
            <div className="rounded-xl border border-theme p-3 text-center bg-success/5">
              <p className="text-[9px] text-muted">Net Pay</p>
              <p className="text-lg font-bold text-success">{formatCurrency(slip.totals.net_pay)}</p>
            </div>
          </div>
          
          {/* Year-to-Date Summary */}
          <div className="rounded-xl border border-theme p-4">
            <h4 className="text-sm font-semibold text-main mb-3">Year-to-Date Summary</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div>
                <p className="text-[9px] text-muted">Gross YTD</p>
                <p className="text-sm font-semibold text-main">{formatCurrency(slip.year_to_date.gross_ytd)}</p>
              </div>
              <div>
                <p className="text-[9px] text-muted">Net YTD</p>
                <p className="text-sm font-semibold text-success">{formatCurrency(slip.year_to_date.net_ytd)}</p>
              </div>
              <div>
                <p className="text-[9px] text-muted">Tax YTD</p>
                <p className="text-sm font-semibold text-danger">{formatCurrency(slip.year_to_date.tax_ytd)}</p>
              </div>
              <div>
                <p className="text-[9px] text-muted">PF YTD</p>
                <p className="text-sm font-semibold text-info">{formatCurrency(slip.year_to_date.pf_ytd)}</p>
              </div>
            </div>
          </div>
          
          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-4 border-t border-theme">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium rounded-lg border border-theme hover:bg-app transition-colors"
            >
              Close
            </button>
            <button
              onClick={onDownload}
              className="px-4 py-2 text-sm font-medium rounded-lg bg-primary text-white hover:bg-primary/90 transition-colors"
            >
              Download Full Report
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const LoadingSkeleton: React.FC = () => (
  <div className="space-y-4">
    <div className="h-8 w-48 bg-gray-200 rounded animate-pulse"></div>
    <div className="grid grid-cols-4 gap-4">
      {[1, 2, 3, 4].map(i => (
        <div key={i} className="h-28 bg-gray-200 rounded-xl animate-pulse"></div>
      ))}
    </div>
    <div className="h-32 bg-gray-200 rounded-xl animate-pulse"></div>
    <div className="space-y-3">
      {[1, 2, 3, 4, 5].map(i => (
        <div key={i} className="h-20 bg-gray-200 rounded-xl animate-pulse"></div>
      ))}
    </div>
  </div>
);

const EmptyState: React.FC<{ employeeName: string }> = ({ employeeName }) => (
  <div className="flex flex-col items-center justify-center py-16 gap-4">
    <div className="w-20 h-20 rounded-2xl flex items-center justify-center bg-app border-2 border-theme">
      <FileText className="w-10 h-10 text-muted opacity-40" />
    </div>
    <div className="text-center">
      <p className="text-base font-semibold text-main">No salary records found</p>
      <p className="text-sm text-muted mt-1 max-w-md">
        No salary slips have been generated for <span className="font-semibold text-main">{employeeName}</span> yet.
      </p>
    </div>
  </div>
);