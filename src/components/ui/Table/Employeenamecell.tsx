import React, { useEffect, useState } from "react";
interface EmployeeNameCellProps {
  name: string;
  employeeId?: string;
  image?: string | null;
  /** Optional: sub-label shown below the name (e.g. designation) */
  subLabel?: string;
}


const AVATAR_PALETTE: [string, string][] = [
  ["#E8F0FE", "#3B6FD4"],
  ["#FCE8E6", "#C5433A"],
  ["#E6F4EA", "#2D7D46"],
  ["#FFF3E0", "#C07A1B"],
  ["#F3E8FD", "#7B3FC4"],
  ["#E8F5E9", "#388E3C"],
  ["#FFF8E1", "#F9A825"],
  ["#E3F2FD", "#1565C0"],
];

function getAvatarColors(seed: string): [string, string] {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = seed.charCodeAt(i) + ((hash << 5) - hash);
  }
  return AVATAR_PALETTE[Math.abs(hash) % AVATAR_PALETTE.length];
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

const EmployeeNameCell: React.FC<EmployeeNameCellProps> = ({
  name,
  employeeId = "",
  image,
  subLabel,
}) => {
 const [imgFailed, setImgFailed] = useState(false);

const ERP_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const imageUrl = image
  ? image.startsWith("http")
    ? image
    : `${ERP_BASE_URL}${image}`
  : null;
const showImage = !!imageUrl && !imgFailed;
console.log("FINAL IMAGE URL", imageUrl);

const [bg, fg] = getAvatarColors(employeeId || name);

const initials = getInitials(name);

  return (
    <div className="flex items-center gap-2.5 min-w-0">
      {/* ── Avatar ── */}
      <span
        className="relative shrink-0 rounded-full overflow-hidden"
        style={{ width: 30, height: 30 }}
        aria-hidden="true"
      >
        {showImage ? (
          <img
            src={imageUrl!}
            alt={name}
            onError={(e) => {
  console.log("IMAGE FAILED", imageUrl, e);
  setImgFailed(true);
}}
            style={{
              width: 30,
              height: 30,
              objectFit: "cover",
              borderRadius: "50%",
              display: "block",
            }}
          />
        ) : (
          <span
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: 30,
              height: 30,
              borderRadius: "50%",
              background: bg,
              color: fg,
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: "0.03em",
              userSelect: "none",
            }}
          >
            {initials}
          </span>
        )}
      </span>

      {/* ── Text ── */}
      <span className="min-w-0 flex flex-col leading-tight">
        <span
          className="block truncate text-sm font-semibold text-main"
          style={{ lineHeight: "1.25" }}
        >
          {name}
        </span>
        {subLabel && (
          <span
            className="block truncate text-xs text-muted"
            style={{ lineHeight: "1.3", marginTop: 1 }}
          >
            {subLabel}
          </span>
        )}
      </span>
    </div>
  );
};

export default EmployeeNameCell;