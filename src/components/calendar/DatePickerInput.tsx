import React, { useEffect, useState } from "react";
import dayjs, { Dayjs } from "dayjs";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import TextField from "@mui/material/TextField";
import FormHelperText from "@mui/material/FormHelperText";

interface Props {
  label?: string;
  value?: string;
  name: string;
  required?: boolean;
  disabled?: boolean;
  disableFuture?: boolean;
  onChange: (name: string, value: string) => void;
  sx?: Record<string, unknown>;
}

const DatePickerInput: React.FC<Props> = ({
  label,
  value,
  name,
  required,
  disabled,
  disableFuture,
  onChange,
  sx,
}) => {
  const [internalValue, setInternalValue] = useState<Dayjs | null>(
    value ? dayjs(value) : null,
  );
  const [error, setError] = useState<string | null>(null);


useEffect(() => {
  setInternalValue(value ? dayjs(value) : null);
}, [value]);

  const handleChange = (newValue: Dayjs | null) => {
    if (!newValue) {
      setInternalValue(null);
      setError(null);
      onChange(name, "");
      return;
    }

    if (!newValue.isValid()) {
      setInternalValue(newValue);
      setError("Invalid date");
      return;
    }
   if (disableFuture && newValue.isAfter(dayjs(), "day")) {
  setError("Future date not allowed");
  return;
}

    
    setInternalValue(newValue);
    setError(null);
    onChange(name, newValue.format("YYYY-MM-DD"));
  };
  return (
    <div className="flex flex-col text-sm w-full min-w-0">
      {label && (
        <span className="block text-[10px] font-medium text-main mb-1">
          {label}
          {required && <span className="text-danger">*</span>}
        </span>
      )}

      <DatePicker
        value={internalValue}
        format="DD-MMM-YYYY"
        disabled={disabled}
        disableFuture={disableFuture}
        enableAccessibleFieldDOMStructure={false}
        onChange={handleChange}
        onError={(reason) => {
          if (!reason) return;

          if (reason === "invalidDate") {
            setError("Invalid date");
          } else if (reason === "disableFuture") {
            setError("Future date not allowed");
          } else if (reason === "disablePast") {
            setError("Past date not allowed");
          }
        }}
        slots={{ textField: TextField }}
        slotProps={{
          popper: {
            disablePortal: false,
            modifiers: [{ name: "preventOverflow", enabled: true }],
          },
          textField: {
            size: "small",
            required,
            fullWidth: true,
            error: !!error,
            placeholder: "DD-MMM-YYYY",
            inputProps: { "aria-label": label ?? "Date" },
            sx: {
              // ── Make the whole field respect its container width ──
              width: "100%",
              minWidth: 0,

              "& .MuiOutlinedInput-root": {
                height: "28px",
                fontSize: "var(--text-xs)",
                backgroundColor: "var(--input-bg)",
                borderRadius: "6px",
                color: "var(--input-text)",
                minWidth: 0,
                width: "100%",
                paddingRight: "2px",
                display: "flex",
                alignItems: "center",
                overflow: "hidden",
                transition: "var(--input-transition)",
              },

              "& .MuiOutlinedInput-input": {
                padding: "2px 4px",
                fontSize: "var(--text-xs)",
                color: "var(--input-text)",
                minWidth: 0,
                width: "100%",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              },

              "& .MuiOutlinedInput-input::placeholder": {
                color: "var(--muted)",
                opacity: 0.6,
              },

              // ── Calendar icon: fixed size, never forces width ──
              "& .MuiIconButton-root": {
                padding: "2px",
                marginRight: "2px",
                flexShrink: 0,
                color: "var(--muted)",
              },
              "& .MuiSvgIcon-root": {
                fontSize: "14px",
                display: "block",
                flexShrink: 0,
              },
              "& .MuiInputAdornment-root": {
                height: "100%",
                display: "flex",
                alignItems: "center",
                margin: 0,
                flexShrink: 0,
              },

              // ── Border states, theme-driven ──
              "& fieldset": {
                borderColor: "var(--input-border)",
              },
              "&:hover fieldset": {
                borderColor: "var(--input-border-hover)",
              },
              "&.Mui-focused fieldset": {
                borderColor: "var(--input-border-focus)",
                borderWidth: "1px",
                boxShadow: `0 0 0 3px var(--input-focus-ring)`,
              },

              // ── Disabled state ──
              "&.Mui-disabled": {
                backgroundColor: "var(--input-bg-disabled)",
              },
              "& .Mui-disabled": {
                color: "var(--input-text-disabled)",
                WebkitTextFillColor: "var(--input-text-disabled)",
              },
              "&.Mui-disabled fieldset": {
                borderColor: "var(--input-border)",
              },

              // ── Error state ──
              "&.Mui-error .MuiOutlinedInput-root, & .Mui-error": {
                backgroundColor: "var(--input-bg-error)",
              },
              "&.Mui-error fieldset, & fieldset.Mui-error": {
                borderColor: "var(--input-border-error)",
              },
              "&.Mui-error:hover fieldset": {
                borderColor: "var(--input-border-error)",
              },
              "&.Mui-error.Mui-focused fieldset": {
                borderColor: "var(--input-border-error)",
                boxShadow: "0 0 0 3px rgba(220, 38, 38, 0.15)",
              },

              ...sx,
            },
          },
        }}
      />

      {error && (
        <FormHelperText
          error
          sx={{
            margin: "2px 0 0",
            fontSize: "10px",
            color: "var(--danger)",
          }}
        >
          {error}
        </FormHelperText>
      )}
    </div>
  );
};

export default DatePickerInput;
