import CustomCard from "../../components/Card/CustomCard";
import { Mail, Phone } from "lucide-react";
import { Chip, Typography, Box } from "@mui/material";
import type { Client } from "./types";

type Props = {
  client: Client;
};
const ClientePersonalInfo = ({ client }: Props) => {
  return (
    <CustomCard>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <Typography variant="h5" fontWeight={600}>
          {client.name}
        </Typography>
        <Chip
          label={client.is_active ? "Ativo" : "Inativo"}
          sx={{
            bgcolor: client.is_active ? "success.light" : "error.light",
            color: "text.secondary",
            height: "20px",
          }}
        />
      </Box>
      <Box sx={{ display: "flex", gap: 2, mt: 2 }}>
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 2,
            backgroundColor: "secondary.main",
            py: 1,
            px: 2,
            borderRadius: 2,
            fontSize: 14,
          }}
        >
          <Mail size={20} />
          {client.email}
        </Box>
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 2,
            backgroundColor: "secondary.main",
            py: 1,
            px: 2,
            borderRadius: 2,
            fontSize: 14,
          }}
        >
          <Phone size={20} />
          {client.phone}
        </Box>
      </Box>
    </CustomCard>
  );
};

export default ClientePersonalInfo;
