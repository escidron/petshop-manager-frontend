import { Box, Container } from "@mui/material";
import PackagesList from "../features/packages/PackagesList";

export default function PackagesPage() {
  return (
    <Container maxWidth="lg">
      <Box sx={{ py: 4 }}>
        <PackagesList />
      </Box>
    </Container>
  );
}
