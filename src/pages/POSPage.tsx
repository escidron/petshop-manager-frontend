import { Box } from "@mui/material";
import POSInterface from "../features/sales/POSInterface";

export default function POSPage() {
  return (
    <Box sx={{ height: { xs: "auto", lg: "100%" }, width: "100%", px: { xs: 0.5, sm: 2, md: 4 }, py: { xs: 0.5, sm: 1 }, overflow: { xs: "visible", lg: "hidden" }, maxWidth: "1600px", margin: "0 auto" }}>
        <POSInterface />
    </Box>
  );
}
