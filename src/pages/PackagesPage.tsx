import { Box } from "@mui/material";
import PackagesList from "../features/packages/PackagesList";

export default function PackagesPage() {
  return (
    <Box
      sx={{
        width: "100%",
        mx: "auto",
        p: { xs: 1.5, sm: 2.5, md: 3 },
        pb: { xs: "calc(32px + env(safe-area-inset-bottom, 0px))", md: 3 },
        maxWidth: "1200px",
      }}
    >
      <PackagesList />
    </Box>
  );
}
