import {
  Box,
  Card,
  CardActionArea,
  CardContent,
  Chip,
  Typography,
} from "@mui/material";
import { BarChart2, Package, Wallet } from "lucide-react";
import { useNavigate } from "react-router-dom";
import type { ReactNode } from "react";

type ReportCard = {
  id: string;
  title: string;
  description: string;
  icon: ReactNode;
  path: string | null;
};

const reports: ReportCard[] = [
  {
    id: "commissions",
    title: "Comissões",
    description: "Visualize e gerencie as comissões dos funcionários por período.",
    icon: <BarChart2 size={32} />,
    path: "/commissions/report",
  },
  {
    id: "inventory",
    title: "Estoque",
    description: "Movimentação e posição atual do estoque de produtos.",
    icon: <Package size={32} />,
    path: "/reports/inventory",
  },
  {
    id: "financial",
    title: "Financeiro",
    description: "Faturamento, ticket médio, breakdown por método de pagamento e exportação CSV.",
    icon: <Wallet size={32} />,
    path: "/reports/financial",
  },
];

export default function ReportsPage() {
  const navigate = useNavigate();

  return (
    <Box sx={{ p: 3, maxWidth: 1200, mx: "auto" }}>
      <Typography variant="h5" fontWeight={700} mb={3}>
        Relatórios
      </Typography>

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
          gap: 2,
        }}
      >
        {reports.map((r) =>
          r.path ? (
            <Card key={r.id} variant="outlined">
              <CardActionArea onClick={() => navigate(r.path!)}>
                <CardContent sx={{ display: "flex", flexDirection: "column", gap: 1.5, p: 3 }}>
                  <Box sx={{ color: "text.primary" }}>{r.icon}</Box>
                  <Typography variant="h6" fontWeight={600}>
                    {r.title}
                  </Typography>
                  <Typography variant="body2" color="text.primary">
                    {r.description}
                  </Typography>
                </CardContent>
              </CardActionArea>
            </Card>
          ) : (
            <Card key={r.id} variant="outlined" sx={{ opacity: 0.55 }}>
              <CardContent sx={{ display: "flex", flexDirection: "column", gap: 1.5, p: 3 }}>
                <Box sx={{ color: "text.disabled" }}>{r.icon}</Box>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <Typography variant="h6" fontWeight={600}>
                    {r.title}
                  </Typography>
                  <Chip label="Em breve" size="small" />
                </Box>
                <Typography variant="body2" color="text.primary">
                  {r.description}
                </Typography>
              </CardContent>
            </Card>
          )
        )}
      </Box>
    </Box>
  );
}
