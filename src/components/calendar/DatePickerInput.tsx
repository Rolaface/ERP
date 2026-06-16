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
          if (reason === "invalidDate") setError("Invalid date");
          else if (reason === "disableFuture") setError("Future date not allowed");
          else if (reason === "disablePast") setError("Past date not allowed");
          else setError(null);
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
                fontSize: "11px",
                backgroundColor: "var(--card)",
                borderRadius: "6px",
                // Remove any MUI-injected minWidth so the field
                // collapses to whatever the table column allows
                minWidth: 0,
                width: "100%",
                paddingRight: "2px",
                display: "flex",
                alignItems: "center",
                // Clip the input text instead of forcing the field wider
                overflow: "hidden",
              },

              "& .MuiOutlinedInput-input": {
                padding: "2px 4px",
                fontSize: "11px",
                // Critical: allow the text portion to shrink
                minWidth: 0,
                width: "100%",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              },

              // ── Calendar icon: fixed size, never forces width ──
              "& .MuiIconButton-root": {
                padding: "2px",
                marginRight: "2px",
                flexShrink: 0,
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

              "& fieldset": {
                borderColor: "var(--border)",
              },
              "&:hover fieldset": {
                borderColor: "rgba(37,99,235,0.4)",
              },

              ...sx,
            },
          },
        }}
      />

      {error && (
        <FormHelperText error sx={{ margin: "2px 0 0", fontSize: "10px" }}>
          {error}
        </FormHelperText>
      )}
    </div>
  );
};

export default DatePickerInput;