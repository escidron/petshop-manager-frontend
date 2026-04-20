import { Box, Typography, Avatar } from "@mui/material";
import CustomCard from "../../components/Card/CustomCard";
import { Receipt } from "lucide-react";

const dummyInvoices = [
  { id: 1, client: "Ana Silva", pet: "Rex", value: "R$ 85,00" },
  { id: 2, client: "Carlos Souza", pet: "Bela", value: "R$ 120,00" },
  { id: 3, client: "Mariana Oliveira", pet: "Pipoca", value: "R$ 45,00" },
  { id: 4, client: "João Pedro", pet: "Toby", value: "R$ 210,00" },
];

export default function OpenInvoices() {
  return (
    <Box>
      <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1.5 }}>
        <Receipt size={20} />
        <Typography variant="h6" fontWeight={600}>
          Comandas em Aberto
        </Typography>
      </Box>
      <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
        {dummyInvoices.map((invoice) => (
          <CustomCard
            key={invoice.id}
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              p: 1.5,
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
              <Avatar sx={{ bgcolor: "secondary.light", width: 32, height: 32, fontSize: "0.875rem" }}>
                {invoice.client[0]}
              </Avatar>
              <Box>
                <Typography variant="body2" fontWeight={600}>
                  {invoice.client}
                </Typography>
                <Typography variant="caption" color="text.disabled">
                  Pet: {invoice.pet}
                </Typography>
              </Box>
            </Box>
            <Typography variant="body2" fontWeight={700} color="primary.main">
              {invoice.value}
            </Typography>
          </CustomCard>
        ))}
      </Box>
    </Box>
  );
}
