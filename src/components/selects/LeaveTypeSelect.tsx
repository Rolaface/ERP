import React, { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { getAllLeaveTypes } from "../../api/leaveConfigApi";

type LeaveType = {
  name: string;
};

interface LeaveTypeSelectProps {
  value?: string;
  onChange: (leaveType: { name: string }) => void;
  className?: string;
  label?: string;
  required?: boolean;
  disabled?: boolean;
}

export default function LeaveTypeSelect({
  value = "",
  onChange,
  className = "",
  label = "Leave Type",
  required = false,
  disabled = false,
}: LeaveTypeSelectProps) {
  const [leaveTypes, setLeaveTypes] = useState<LeaveType[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState(value);

  const containerRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [dropdownStyle, setDropdownStyle] = useState<React.CSSProperties>({});

  // 1. Fetch leave types on demand
  const fetchLeaveTypes = async () => {
    try {
      setLoading(true);
      const res: any = await getAllLeaveTypes();

      // Handle both raw Axios response structures and directly returned arrays
      const rawTypes =
        res?.data?.message?.data ||
        res?.data?.message ||
        res?.data?.data ||
        res?.data ||
        res ||
        [];

      if (Array.isArray(rawTypes)) {
        setLeaveTypes(
          rawTypes.map((t: any) => ({
            name: t.name,
          }))
        );
      }
    } catch (err) {
      console.error("Failed to fetch leave types", err);
    } finally {
      setLoading(false);
    }
  };

  // Sync incoming value to search
  useEffect(() => {
    setSearch(value);
  }, [value]);

  // 2. Handle positioning and auto-closing on scroll
  useEffect(() => {
    if (open && containerRef.current) {
      const updatePosition = () => {
        const rect = containerRef.current!.getBoundingClientRect();
        setDropdownStyle({
          position: "fixed",
          top: rect.bottom + 4,
          left: rect.left,
          width: rect.width,
          zIndex: 99999,
        });
      };

      updatePosition();

      const handleScroll = (e: Event) => {
        if (
          dropdownRef.current &&
          e.target instanceof Node &&
          dropdownRef.current.contains(e.target)
        ) {
          return;
        }
        setOpen(false);
      };

      window.addEventListener("scroll", handleScroll, true);
      window.addEventListener("resize", handleScroll);

      return () => {
        window.removeEventListener("scroll", handleScroll, true);
        window.removeEventListener("resize", handleScroll);
      };
    }
  }, [open]);

  // 3. Check clicks outside both the input AND the portal dropdown
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node) &&
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Filter based on name
  const filteredTypes = leaveTypes.filter((t) =>
    t.name.toLowerCase().includes(search.toLowerCase())
  );

  const handleInteraction = () => {
    if (!disabled) {
      setOpen(true);
      if (leaveTypes.length === 0) fetchLeaveTypes();
    }
  };

  return (
    <div className={`w-full min-w-0 flex flex-col ${className}`}>
      {label && (
        <span className="block text-[10px] font-medium text-main mb-1">
          {label}
          {required && <span className="text-danger">*</span>}
        </span>
      )}

      <div ref={containerRef} className="relative w-full">
        <input
          className={[
            "py-1 px-2 border rounded text-[11px] text-main bg-card w-full min-w-0 overflow-hidden text-ellipsis whitespace-nowrap",
            "border-[var(--border)]",
            disabled
              ? "bg-gray-50 text-gray-500 cursor-not-allowed"
              : "hover:border-primary/40",
          ].join(" ")}
          placeholder={loading ? "Loading..." : "Select Leave Type"}
          value={search}
          disabled={disabled}
          onChange={(e) => {
            setSearch(e.target.value);
            if (!open) handleInteraction();
          }}
          onFocus={handleInteraction}
          onClick={handleInteraction}
        />

        {open &&
          !disabled &&
          createPortal(
            <div
              ref={dropdownRef}
              style={dropdownStyle}
              className="bg-card bg-white border border-[var(--border)] border-gray-200 shadow-xl rounded z-50 overflow-hidden"
            >
              <ul className="max-h-56 overflow-y-auto text-[13px] m-0 p-0 relative">
                {/* Mini loading indicator */}
                {loading && (
                  <div className="absolute top-0 left-0 w-full h-1 bg-gray-100 overflow-hidden">
                    <div className="h-full bg-blue-500 animate-pulse"></div>
                  </div>
                )}

                {filteredTypes.map((type) => (
                  <li
                    key={type.name}
                    className="px-2 py-1.5 cursor-pointer hover:bg-primary/5 hover:bg-gray-100 text-main text-[11px]"
                    onMouseDown={(e) => {
                      e.preventDefault(); // Prevents input from losing focus
                    }}
                    onClick={() => {
                      setSearch(type.name); 
                      setOpen(false);
                      onChange({ name: type.name });
                    }}
                  >
                    <div className="flex justify-between items-center">
                      <span className="font-medium truncate">{type.name}</span>
                    </div>
                  </li>
                ))}

                {!loading && filteredTypes.length === 0 && (
                  <li className="px-2 py-1 text-muted text-[11px]">
                    No match found
                  </li>
                )}
              </ul>
            </div>,
            document.body
          )}
      </div>
    </div>
  );
}