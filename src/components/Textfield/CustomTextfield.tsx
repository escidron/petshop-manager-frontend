// src/components/CustomTextField.tsx
import * as React from "react";
import TextField, { type TextFieldProps } from "@mui/material/TextField";
import InputAdornment from "@mui/material/InputAdornment";

type CustomTextFieldProps = TextFieldProps & {
  icon?: React.ReactNode;
  iconPosition?: "start" | "end";
};

const CustomTextField: React.FC<CustomTextFieldProps> = ({
  icon,
  iconPosition = "start",
  size = "small",
  slotProps,
  ...props
}) => {
  return (
    <TextField
      size={size}
      {...props}
      slotProps={{
        input: {
          ...slotProps?.input,
          ...(icon && {
            [iconPosition === "start" ? "startAdornment" : "endAdornment"]: (
              <InputAdornment position={iconPosition}>{icon}</InputAdornment>
            ),
          }),
          sx: {
            backgroundColor: "#fff",
            borderRadius: 1,
            ...((slotProps?.input as any)?.sx || {}),
          },
        },
      }}
    />
  );
};

export default CustomTextField;
