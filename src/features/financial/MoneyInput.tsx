import React from "react";
import { TextField, InputAdornment, Typography, type TextFieldProps } from "@mui/material";
import { formatBRLFromCents } from "../../utils/masks";

interface MoneyInputProps extends Omit<TextFieldProps, "onChange" | "value"> {
  value?: number | null;
  onChange: (valueInReais: number) => void;
  showZeroAsEmpty?: boolean;
}

export const MoneyInput: React.FC<MoneyInputProps> = ({
  value,
  onChange,
  showZeroAsEmpty = true,
  placeholder = "0,00",
  size = "small",
  slotProps,
  ...rest
}) => {
  const cents = value !== undefined && value !== null ? Math.round(value * 100) : 0;
  const formatted = cents !== 0 || !showZeroAsEmpty ? formatBRLFromCents(cents) : "";

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const digits = e.target.value.replace(/\D/g, "");
    const newCents = digits ? parseInt(digits, 10) : 0;
    onChange(newCents / 100);
  };

  return (
    <TextField
      value={formatted}
      placeholder={placeholder}
      onChange={handleChange}
      size={size}
      slotProps={{
        ...slotProps,
        input: {
          ...slotProps?.input,
          startAdornment: (
            <InputAdornment position="start">
              <Typography
                sx={{
                  color: "text.secondary",
                  fontWeight: 600,
                  fontSize: size === "small" ? "0.8rem" : "0.9rem",
                }}
              >
                R$
              </Typography>
            </InputAdornment>
          ),
        },
      }}
      {...rest}
    />
  );
};

export default MoneyInput;
