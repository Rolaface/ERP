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
  onChange: (name: string, value: string) => void;
  sx?: Record<string, unknown>;
}

const DatePickerInput: React.FC<Props> = ({
  label,
  value,
  name,
  required,
  disabled,
  onChange,
  sx,
}) => {
  // : Sync internal state when the external `value` prop changes (e.g. form reset)
  const [internalValue, setInternalValue] = useState<Dayjs | null>(
    value ? dayjs(value) : null,
  );
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setInternalValue(value ? dayjs(value) : null);
  }, [value]);

  const handleChange = (newValue: Dayjs | null) => {
    //: Allow clearing — don't early-return on null
    if (!newValue) {
      setInternalValue(null);
      setError(null);
      onChange(name, "");
      return;
    }

    // : Validate the date before firing onChange
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
        enableAccessibleFieldDOMStructure={false}
        onChange={handleChange}
        // : Hook into MUI's built-in error reporting for invalid dates
        onError={(reason) => {
          if (reason === "invalidDate") setError("Invalid date");
          else if (reason === "disableFuture")
            setError("Future date not allowed");
          else if (reason === "disablePast") setError("Past date not allowed");
          else setError(null);
        }}
        slots={{
          textField: TextField,
        }}
        slotProps={{
          // : Render the calendar popup in a portal at document body
          // so it never gets clipped by overflow:hidden parents
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
            inputProps: {
              "aria-label": label ?? "Date",
            },

            sx: {
              "& .MuiOutlinedInput-root": {
                height: "28px",
                fontSize: "11px",
                backgroundColor: "var(--card)",
                borderRadius: "6px",
                paddingRight: "2px",
                display: "flex",
                alignItems: "center",
              },
              "& .MuiOutlinedInput-input": {
                padding: "2px 6px",
              },
              "& .MuiIconButton-root": {
                padding: "2px",
                marginRight: "2px",
              },
              "& .MuiSvgIcon-root": {
                fontSize: "16px",
                display: "block",
              },
              "& .MuiInputAdornment-root": {
                height: "100%",
                display: "flex",
                alignItems: "center",
                margin: 0,
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
