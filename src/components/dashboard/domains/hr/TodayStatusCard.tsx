import React from "react";
import {
  CheckCircle2,
  Clock3,
  TimerReset,
  Plane,
  CalendarDays,
} from "lucide-react";

const TodayStatusCard: React.FC = () => {
  const workedHours = 5.2;
  const targetHours = 8;

  const progress = (workedHours / targetHours) * 100;

  return (
    <section
      className="
        rounded-3xl
        border
        border-[var(--border)]
        bg-[var(--card)]
        p-6
        shadow-sm
      "
    >
      {/* HEADER */}
      <div className="mb-6">
        <h2
          className="
            text-lg
            font-semibold
            text-[var(--foreground)]
          "
        >
          Today's Status
        </h2>

        <p
          className="
            mt-1
            text-sm
            text-[var(--muted-foreground)]
          "
        >
          Operational overview of your workday
        </p>
      </div>

      <div className="space-y-5">

        {/* ATTENDANCE */}
        <div
          className="
            rounded-2xl
            border
            border-emerald-500/20
            bg-emerald-500/5
            p-4
          "
        >
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />

                <p className="text-sm font-medium text-emerald-700">
                  Checked In
                </p>
              </div>

              <p className="mt-2 text-2xl font-bold text-[var(--foreground)]">
                9:42 AM
              </p>
            </div>

            <div
              className="
                rounded-full
                bg-emerald-500/10
                px-3
                py-1
                text-xs
                font-medium
                text-emerald-700
              "
            >
              Active Shift
            </div>
          </div>
        </div>

        {/* WORK HOURS */}
        <div
          className="
            rounded-2xl
            border
            border-[var(--border)]
            p-4
          "
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock3 className="h-4 w-4 text-blue-600" />

              <p className="text-sm font-medium text-[var(--foreground)]">
                Work Progress
              </p>
            </div>

            <p
              className="
                text-xs
                font-medium
                text-[var(--muted-foreground)]
              "
            >
              {Math.round(progress)}% completed
            </p>
          </div>

          <div className="mt-4">
            <div
              className="
                h-2
                overflow-hidden
                rounded-full
                bg-[var(--muted)]
              "
            >
              <div
                className="
                  h-full
                  rounded-full
                  bg-blue-500
                  transition-all
                "
                style={{ width: `${progress}%` }}
              />
            </div>

            <div
              className="
                mt-3
                flex
                items-center
                justify-between
                text-sm
              "
            >
              <span className="text-[var(--foreground)]">
                {workedHours}h worked
              </span>

              <span className="text-[var(--muted-foreground)]">
                Target: {targetHours}h
              </span>
            </div>
          </div>
        </div>

        {/* LEAVE HEALTH */}
        <div
          className="
            rounded-2xl
            border
            border-[var(--border)]
            p-4
          "
        >
          <div className="flex items-center gap-2">
            <Plane className="h-4 w-4 text-violet-600" />

            <p className="text-sm font-medium text-[var(--foreground)]">
              Leave Health
            </p>
          </div>

          <div className="mt-4 flex items-end justify-between">
            <div>
              <p className="text-2xl font-bold text-[var(--foreground)]">
                12 Days
              </p>

              <p
                className="
                  mt-1
                  text-sm
                  text-[var(--muted-foreground)]
                "
              >
                Available balance
              </p>
            </div>

            <div
              className="
                rounded-full
                bg-violet-500/10
                px-3
                py-1
                text-xs
                font-medium
                text-violet-700
              "
            >
              Healthy Balance
            </div>
          </div>
        </div>

        {/* SCHEDULE */}
        <div
          className="
            rounded-2xl
            border
            border-[var(--border)]
            p-4
          "
        >
          <div className="flex items-center gap-2">
            <CalendarDays className="h-4 w-4 text-amber-600" />

            <p className="text-sm font-medium text-[var(--foreground)]">
              Schedule Awareness
            </p>
          </div>

          <div className="mt-4 space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-[var(--muted-foreground)]">
                Meetings Left
              </span>

              <span className="font-medium text-[var(--foreground)]">
                2 meetings
              </span>
            </div>

            <div className="flex items-center justify-between text-sm">
              <span className="text-[var(--muted-foreground)]">
                Next Break
              </span>

              <span className="font-medium text-[var(--foreground)]">
                4:00 PM
              </span>
            </div>

            <div className="flex items-center justify-between text-sm">
              <span className="text-[var(--muted-foreground)]">
                Shift Ends
              </span>

              <span className="font-medium text-[var(--foreground)]">
                7:00 PM
              </span>
            </div>
          </div>
        </div>

      </div>
    </section>
  );
};

export default TodayStatusCard;

// import React from "react";
// import {
//   Clock3,
//   TimerReset,
//   Plane,
//   CheckCircle2,
//   AlertTriangle,
// } from "lucide-react";

// const TodayStatusCard: React.FC = () => {
//   const shiftProgress = 68;

//   const signals = [
//     {
//       icon: CheckCircle2,
//       message: "No attendance issues detected",
//       tone: "success",
//     },
//     {
//       icon: AlertTriangle,
//       message: "Heavy meeting load after 3PM",
//       tone: "warning",
//     },
//     {
//       icon: Plane,
//       message: "Your leave balance is in healthy range",
//       tone: "success",
//     },
//   ];

//   const toneStyles: Record<string, string> = {
//     success:
//       "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",

//     warning:
//       "bg-amber-500/10 text-amber-600 border-amber-500/20",
//   };

//   return (
//     <section
//       className="
//         rounded-3xl
//         border
//         border-[var(--border)]
//         bg-[var(--card)]
//         p-6
//         shadow-sm
//       "
//     >
//       {/* HEADER */}
//       <div className="space-y-1">
//         <h2
//           className="
//             text-lg
//             font-semibold
//             text-[var(--foreground)]
//           "
//         >
//           Today's Status
//         </h2>

//         <p
//           className="
//             text-sm
//             text-[var(--muted-foreground)]
//           "
//         >
//           Operational overview for your workday
//         </p>
//       </div>

//       {/* CONTENT */}
//       <div className="mt-6 space-y-6">

//         {/* ATTENDANCE */}
//         <div className="space-y-4">
//           <div className="flex items-center gap-2">
//             <Clock3 className="h-4 w-4 text-[var(--primary)]" />

//             <h3 className="text-sm font-semibold text-[var(--foreground)]">
//               Attendance Status
//             </h3>
//           </div>

//           <div className="grid grid-cols-2 gap-4">
//             <div className="rounded-2xl bg-[var(--background)] p-4">
//               <p className="text-xs text-[var(--muted-foreground)]">
//                 Checked In
//               </p>

//               <p className="mt-1 text-lg font-semibold">
//                 9:42 AM
//               </p>
//             </div>

//             <div className="rounded-2xl bg-[var(--background)] p-4">
//               <p className="text-xs text-[var(--muted-foreground)]">
//                 Shift Timing
//               </p>

//               <p className="mt-1 text-lg font-semibold">
//                 10AM – 7PM
//               </p>
//             </div>
//           </div>
//         </div>

//         {/* WORKDAY PROGRESS */}
//         <div className="space-y-4">
//           <div className="flex items-center gap-2">
//             <TimerReset className="h-4 w-4 text-[var(--primary)]" />

//             <h3 className="text-sm font-semibold text-[var(--foreground)]">
//               Workday Progress
//             </h3>
//           </div>

//           <div className="rounded-2xl bg-[var(--background)] p-4">
//             <div className="flex items-center justify-between">
//               <p className="text-sm text-[var(--muted-foreground)]">
//                 Shift Completion
//               </p>

//               <p className="text-sm font-medium">
//                 {shiftProgress}%
//               </p>
//             </div>

//             <div className="mt-3 h-2 overflow-hidden rounded-full bg-[var(--border)]">
//               <div
//                 className="h-full rounded-full bg-[var(--primary)]"
//                 style={{ width: `${shiftProgress}%` }}
//               />
//             </div>

//             <div className="mt-4 flex items-center justify-between text-sm">
//               <div>
//                 <p className="text-[var(--muted-foreground)]">
//                   Hours Worked
//                 </p>

//                 <p className="mt-1 font-semibold">
//                   5h 24m
//                 </p>
//               </div>

//               <div className="text-right">
//                 <p className="text-[var(--muted-foreground)]">
//                   Break Remaining
//                 </p>

//                 <p className="mt-1 font-semibold">
//                   18 mins
//                 </p>
//               </div>
//             </div>
//           </div>
//         </div>

//         {/* LEAVE HEALTH */}
//         <div className="space-y-4">
//           <div className="flex items-center gap-2">
//             <Plane className="h-4 w-4 text-[var(--primary)]" />

//             <h3 className="text-sm font-semibold text-[var(--foreground)]">
//               Leave Health
//             </h3>
//           </div>

//           <div className="grid grid-cols-2 gap-4">
//             <div className="rounded-2xl bg-[var(--background)] p-4">
//               <p className="text-xs text-[var(--muted-foreground)]">
//                 Annual Leave
//               </p>

//               <p className="mt-1 text-lg font-semibold">
//                 12 Days
//               </p>
//             </div>

//             <div className="rounded-2xl bg-[var(--background)] p-4">
//               <p className="text-xs text-[var(--muted-foreground)]">
//                 Upcoming Leave
//               </p>

//               <p className="mt-1 text-lg font-semibold">
//                 May 28
//               </p>
//             </div>
//           </div>
//         </div>

//         {/* TODAY SIGNALS */}
//         <div className="space-y-3">
//           <h3 className="text-sm font-semibold text-[var(--foreground)]">
//             Today's Signals
//           </h3>

//           <div className="space-y-2">
//             {signals.map((signal) => {
//               const Icon = signal.icon;

//               return (
//                 <div
//                   key={signal.message}
//                   className={`
//                     flex
//                     items-start
//                     gap-3
//                     rounded-2xl
//                     border
//                     px-4
//                     py-3
//                     text-sm
//                     ${toneStyles[signal.tone]}
//                   `}
//                 >
//                   <Icon className="mt-0.5 h-4 w-4 shrink-0" />

//                   <p>{signal.message}</p>
//                 </div>
//               );
//             })}
//           </div>
//         </div>

//       </div>
//     </section>
//   );
// };

// export default TodayStatusCard;