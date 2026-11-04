import { useState } from "react";
import { Box, Tab, Tabs } from "@mui/material";
import PackagesList from "../features/packages/PackagesList";
import DaycarePackagesSection from "../features/daycare/DaycarePackagesSection";

export default function PackagesPage() {
  const [activeTab, setActiveTab] = useState<"grooming" | "daycare">("grooming");

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
      {/* ABAS: BANHO E TOSA | CRECHE */}
      <Box
        sx={{
          borderBottom: 1,
          borderColor: "divider",
          mb: 2.5,
        }}
      >
        <Tabs
          value={activeTab}
          onChange={(_, val) => setActiveTab(val)}
          sx={{
            "& .MuiTab-root": {
              textTransform: "none",
              fontWeight: 700,
              fontSize: "0.95rem",
              minHeight: 44,
            },
          }}
        >
          <Tab value="grooming" label="Banho e Tosa" />
          <Tab value="daycare" label="Creche" />
        </Tabs>
      </Box>

      {activeTab === "grooming" ? (
        <PackagesList />
      ) : (
        <DaycarePackagesSection />
      )}
    </Box>
  );
}
