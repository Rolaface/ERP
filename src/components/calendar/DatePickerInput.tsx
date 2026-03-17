import React from "react";
import dayjs, { Dayjs } from "dayjs";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import TextField from "@mui/material/TextField";

interface Props {
  label?: string;
  value?: string;
  name: string;
  required?: boolean;
  disabled?: boolean;
  onChange: (name: string, value: string) => void;
  sx?: any;
}

const DatePickerInput: React.FC<Props> = ({
  label,
  value,
  name,
  required,
  disabled,
  onChange,
  sx
}) => {
  const parsed = value ? dayjs(value) : null;

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <div className="flex flex-col text-sm w-full min-w-0">
        {label && (
          <span className="block text-[10px] font-medium text-main mb-1">
            {label}
            {required && <span className="text-danger">*</span>}
          </span>
        )}

        <DatePicker
          value={parsed}
          format="DD-MMM-YYYY"
          disabled={disabled}
          enableAccessibleFieldDOMStructure={false}
          onChange={(newValue: Dayjs | null) => {
            if (!newValue) return;
            onChange(name, newValue.format("YYYY-MM-DD"));
          }}
          slots={{
            textField: TextField,
          }}
          slotProps={{
            textField: {
              size: "small",
              required,
              fullWidth: true,
              placeholder: "DD-MMM-YYYY",
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
              }
            },
          }}
        />
      </div>
    </LocalizationProvider>
  );
};

export default DatePickerInput;