import { Box, Container } from "@mui/material";
import POSInterface from "../features/sales/POSInterface";

export default function POSPage() {
  return (
    <Container maxWidth="xl" sx={{ height: "calc(100vh - 80px)" }}>
      <Box sx={{ py: 2, height: "100%" }}>
        <POSInterface />
      </Box>
    </Container>
  );
}
