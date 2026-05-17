import { Box } from "@mui/material";
import POSInterface from "../features/sales/POSInterface";

export default function POSPage() {
  return (
    <Box sx={{ height: "100%", px: 4, py: 1, overflow: "hidden", maxWidth: "1600px", margin: "0 auto" }}>
        <POSInterface />
    </Box>
  );
}
