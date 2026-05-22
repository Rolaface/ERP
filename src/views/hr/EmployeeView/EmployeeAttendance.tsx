import React, { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, CheckCircle2 } from "lucide-react";
import { postEmployeeAttendance, getEmployeeByEmployeeId} from "../../../api/employeeAttendanceApi";
import { useAuth } from "../../../context/AuthContext";
import { showApiError } from "../../../utils/alert";
import { parseFrappeError } from "../tabs/leave-config/hooks/parseFrappeError";

const SUMMARY_STATS = [
  { label: "Day off", value: "12", diff: "+ 12 vs last month", diffColor: "text-blue-500" },
  { label: "Late clock-in", value: "6", diff: "− 2 vs last month", diffColor: "text-orange-500" },
  { label: "Late clock-out", value: "21", diff: "− 12 vs last month", diffColor: "text-orange-500" },
  { label: "No clock-out", value: "2", diff: "+ 4 vs last month", diffColor: "text-blue-500" },
  { label: "Off time quota", value: "1", diff: "0 vs last month", diffColor: "text-gray-400" },
  { label: "Absent", value: "2", diff: "0 vs last month", diffColor: "text-gray-400" },
];

const segmentColors = {
  checked_in:        "bg-[#2578C5]",
  checked_in_active: "bg-[#2578C5]",   // same color, you can add "animate-pulse" here
  checked_out:       "bg-[#F58B1E]",
};

// --- Subcomponents ---
const TimelineScale = () => (
  <div className="relative flex justify-between text-[#9BA3AF] text-[10px] font-medium px-1 mb-2">
    <span>09:00</span>
    <span>11:00</span>
    <span>13:00</span>
    <span>15:00</span>
    <span>17:00</span>
    <span>19:00</span>
    <span>21:00</span>
    <span>23:59</span>
  </div>
);

const TimelineRow = ({ data }) => (
  <div className="bg-white border border-gray-100 rounded-xl p-5 mb-4 shadow-sm">
    <div className="flex justify-between items-center mb-3">
      <h3 className="text-[15px] font-bold text-gray-900">{data.title}</h3>
      {data.status && (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold text-green-700 bg-green-50 border border-green-100">
          <CheckCircle2 size={12} className="text-green-600" />
          {data.status}
        </span>
      )}
    </div>

    <div className="flex items-end gap-6">
      {/* Clock In */}
      <div className="w-24 border-r border-gray-100 pb-1">
        <p className="text-[11px] text-gray-400 mb-1 font-medium">Clock-in</p>
        <p className="text-sm font-bold text-gray-900">{data.clockIn}</p>
      </div>

      {/* Timeline Bar */}
      <div className="flex-1 relative pb-1">
        <TimelineScale />
        <div className="h-6 bg-gray-50 rounded-sm relative flex w-full">
          {data.segments?.map((seg, i) => (
            <div
              key={i}
              className={`absolute h-full flex items-center justify-center text-[10px] text-white font-medium shadow-[inset_0_0_0_1px_rgba(255,255,255,0.2)] ${segmentColors[seg.type]} ${
                i === 0 ? "rounded-l-sm" : ""
              } ${i === data.segments.length - 1 ? "rounded-r-sm" : ""}`}
              style={{
                left: `${seg.start}%`,
                width: `${seg.end - seg.start}%`,
              }}
            >
              {seg.label}
              
              {(i === 0 || i === data.segments.length -1) && (
                <div className={`absolute ${i===0 ? 'left-0' : 'right-0'} w-1 h-8 ${segmentColors[seg.type]} top-[-4px]`}></div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Clock Out */}
      <div className="w-20 pl-4 border-l border-gray-100 pb-1">
        <p className="text-[11px] text-gray-400 mb-1 font-medium">Clock-out</p>
        <p className="text-sm font-bold text-gray-900">{data.clockOut}</p>
      </div>

      {/* Duration */}
      <div className="w-20 border-l border-gray-100 pl-4 pb-1">
        <p className="text-[11px] text-gray-400 mb-1 font-medium">Duration</p>
        <p className="text-sm font-bold text-gray-900">{data.duration}</p>
      </div>
    </div>
  </div>
);

// --- Helper for formatting date to "YYYY-MM-DD HH:mm:ss" ---
const getCurrentFormattedTime = () => {
  const now = new Date();
  const pad = (n) => n.toString().padStart(2, '0');
  
  const YYYY = now.getFullYear();
  const MM = pad(now.getMonth() + 1);
  const DD = pad(now.getDate());
  const HH = pad(now.getHours());
  const mm = pad(now.getMinutes());
  const ss = pad(now.getSeconds());
  
  return `${YYYY}-${MM}-${DD} ${HH}:${mm}:${ss}`;
};


const timeToPercent = (timeStr) => {
  if (!timeStr) return 0;
  const [hh, mm] = timeStr.split(':').map(Number);
  const totalMinutes = (hh * 60 + mm) - (9 * 60); // minutes since 09:00
  const scaleMinutes = 15 * 60; // 09:00 to 24:00 is 15 hours
  const percent = (totalMinutes / scaleMinutes) * 100;
  return Math.max(0, Math.min(100, percent));
};
interface TimelineSegment {
  start: number;
  end: number;
  type: string;
  label: string;
}
interface TimelineRowData {
  id: string;
  title: string;
  status: string;
  clockIn: string;
  clockOut: string;
  duration: string;
  segments: TimelineSegment[];
}
const formatTimelineData = (apiData: any[]): TimelineRowData[] => {
  if (!apiData || !apiData.length) return [];

  // Sort logs chronologically
  const sortedLogs = [...apiData].sort(
    (a, b) => new Date(a.time).getTime() - new Date(b.time).getTime()
  );
  
  // Group by Date (YYYY-MM-DD)
  const groupedByDate: Record<string, any[]> = sortedLogs.reduce((acc, log) => {
    const [date, time] = log.time.split(" ");
    if (!acc[date]) acc[date] = [];
    acc[date].push({ ...log, timeOnly: time.substring(0, 5) });
    return acc;
  }, {});

  const timelineRows: TimelineRowData[] = [];

  Object.entries(groupedByDate).forEach(([dateStr, logs]) => {
    const ins = logs.filter((l: any) => l.log_type === "IN");
    const outs = logs.filter((l: any) => l.log_type === "OUT");

    // For the text display on the left/right of the bar
    const firstIn = ins.length > 0 ? ins[0] : null;
    const lastOut = outs.length > 0 ? outs[outs.length - 1] : null;

    const clockIn = firstIn ? firstIn.timeOnly : "--:--";
    const clockOut = lastOut ? lastOut.timeOnly : "--:--";
    
    const segments: TimelineSegment[] = [];
    let currentIn: any = null;
    let totalDurationMs = 0;
    let lastStartPct: number = 0;

    // Loop through all logs for this day to pair INs and OUTs
    logs.forEach((log) => {
      if (log.log_type === "IN") {
        if (!currentIn) {
          currentIn = log;
          lastStartPct = timeToPercent(log.timeOnly);
         } 
      } else if (log.log_type === "OUT" && currentIn) {
        // Close the segment
        const startPct = timeToPercent(currentIn.timeOnly);
        const endPct = timeToPercent(log.timeOnly);
        
        segments.push({
          start: startPct,
          // Ensure a minimum width so 1-minute checkins don't disappear visually
          end: Math.max(startPct + 0.5, endPct), 
          type: "checked_in",
          label: "" 
        });

        // Add to total duration
        totalDurationMs += new Date(log.time).getTime() - new Date(currentIn.time).getTime();
        currentIn = null; // Reset for the next pair
      }
    });

    // Handle case where they are currently checked in (no OUT yet)
    if (currentIn) {
  const now = new Date();
  const nowPct = timeToPercent(
    `${now.getHours().toString().padStart(2,'0')}:${now.getMinutes().toString().padStart(2,'0')}`
  );

  segments.push({
    start: lastStartPct,
    end: Math.max(lastStartPct + 0.5, nowPct),
    type: "checked_in_active",   // ← new type
    label: ""
  });

  // Duration shows elapsed time so far
  totalDurationMs += now.getTime() - new Date(currentIn.time).getTime();
}

    // Format Duration
    let duration = "--h --m";
    if (totalDurationMs > 0) {
      const hours = Math.floor(totalDurationMs / 3600000);
      const mins = Math.floor((totalDurationMs % 3600000) / 60000);
      duration = `${hours}h ${mins}m`;
    }

    // Format date for title
    const dateObj = new Date(dateStr);
    const title = dateObj.toLocaleDateString("en-US", { weekday: "short", day: "numeric", month: "short" });

    timelineRows.push({
      id: dateStr,
      title: title,
      status: (!currentIn && firstIn) ? "Completed" : "Active",
      clockIn,
      clockOut: currentIn ? "--:--" : clockOut, 
      duration,
      segments
    });
  });

  // Return newest dates first
  return timelineRows.sort((a, b) => new Date(b.id).getTime() - new Date(a.id).getTime());
};

const EmployeeAttendance = () => {
  const { user } = useAuth();
  const [isCheckedIn, setIsCheckedIn] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [timelineData, setTimelineData] = useState<TimelineRowData[]>([]);

 const fetchAttendanceData = async () => {
    if (!user?.employeeId) return;

    try {
      const response = await getEmployeeByEmployeeId(user.employeeId);
      const rawLogs = response?.data?.data || response?.data;

      if (Array.isArray(rawLogs) && rawLogs.length > 0) {
        const formattedData = formatTimelineData(rawLogs);
        setTimelineData(formattedData);

        const sorted = [...rawLogs].sort(
          (a, b) => new Date(a.time).getTime() - new Date(b.time).getTime()
        );
        const latestLog = sorted[sorted.length - 1];
        if (latestLog) {
          setIsCheckedIn(latestLog.log_type === "IN");
        }
      } else {
        setTimelineData([]);
      }
    } catch (error) {
      console.error("Attendance Fetch Error:", error);
      showApiError("Failed to fetch attendance records.");
    }
  };

  useEffect(() => {
    fetchAttendanceData();
  }, [user]);

  const handleCheckInOut = async () => {
    if (!user) return;
    
    setIsSubmitting(true);
    
    const payload = {
       docstatus: 0,
       doctype: "Employee Checkin",
       owner: user.email,
       log_type: isCheckedIn ? "OUT" : "IN",
       time: getCurrentFormattedTime(),
       employee_name: user.fullName,
       employee: user.employeeId
    };

    try {
      await postEmployeeAttendance(payload);
      // Toggle button state on successful API call
      setIsCheckedIn(!isCheckedIn);
    } catch (error) {
      showApiError(parseFrappeError(error) || "Failed to log attendance. Please try again.");
     } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-6 bg-[#F8FAFC] min-h-screen font-sans">
      
      {/* Top Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex gap-6 items-center">
          <button className="bg-[#1B2533] text-white px-5 py-2 rounded-full text-sm font-semibold">
            Attendance
          </button>
        </div>
        
        <span className="text-[15px] font-bold text-gray-900">
          26 Jan - 26 Feb 2023
        </span>
        
        <div className="flex items-center gap-6">
          <div className="flex gap-2">
            {/* Pagination/Controls can go here */}
          </div>
          
          <button 
            onClick={handleCheckInOut}
            disabled={isSubmitting}
            className={`px-5 py-2 rounded-lg text-sm font-semibold transition-colors text-white shadow-sm ${
              isCheckedIn 
                ? "bg-orange-500 hover:bg-orange-600" 
                : "bg-[#1B2533] hover:bg-[#2c3b52]"
            } ${isSubmitting ? "opacity-70 cursor-not-allowed" : ""}`}
          >
            {isSubmitting ? "Processing..." : (isCheckedIn ? "Check Out" : "Check In")}
          </button>
        </div>
      </div>

      {/* Summary Cards Grid */}
      <div className="bg-white border border-gray-100 rounded-xl p-6 mb-6 shadow-sm flex justify-between divide-x divide-gray-100">
        {SUMMARY_STATS.map((stat, idx) => (
          <div key={idx} className="flex-1 px-6 first:pl-0 last:pr-0 text-center">
            <p className="text-[13px] text-gray-500 font-semibold mb-2">{stat.label}</p>
            <p className="text-3xl font-black text-gray-900 mb-1">{stat.value}</p>
            <p className={`text-[11px] font-bold ${stat.diffColor}`}>
              {stat.diff}
            </p>
          </div>
        ))}
      </div>

      {/* Timeline Rows */}
      <div>
        {timelineData.length > 0 ? (
          timelineData.map((data) => (
             <TimelineRow key={data.id} data={data} />
          ))
        ) : (
          <div className="text-center py-10 bg-white border border-gray-100 rounded-xl shadow-sm">
            <p className="text-gray-500 text-sm">No attendance records found for this period.</p>
          </div>
        )}
      </div>
      
    </div>
  );
};

export default EmployeeAttendance;