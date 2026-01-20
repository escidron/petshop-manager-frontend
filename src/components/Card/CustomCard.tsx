import { Paper, type PaperProps } from "@mui/material";
import type { ReactNode } from "react";

type CustomCardProps = {
  children: ReactNode;
} & PaperProps;

export default function CustomCard({
  children,
  sx,
  ...rest
}: CustomCardProps) {
  return (
    <Paper
      elevation={0}
      sx={{
        width: "100%",
        p: 3,
        border: "1px solid",
        borderColor: "divider",
        borderRadius: 2,
        ...sx, 
      }}
      {...rest}
    >
      {children}
    </Paper>
  );
}
