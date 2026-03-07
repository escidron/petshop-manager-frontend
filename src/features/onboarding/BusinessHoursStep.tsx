import Typography from "@mui/material/Typography";
import TenantBusinessHours from "../tenants/TenantBusinessHours";
import { Box } from "@mui/material";
import { Clock } from "lucide-react";

type Props = {
  onNext: () => void;
  onBack: () => void;
};

export default function BusinessHoursStep({ onNext }: Props) {
  async function handleSaveHours() {
    onNext();
  }

  return (
    <Box mt={4}>
      <Box
        sx={{ display: "flex", alignItems: "center", gap: 1 }}
      >
        <Clock />
        <Typography variant="h5">
          Defina seus horários de atendimento
        </Typography>
      </Box>

      <TenantBusinessHours onSubmit={handleSaveHours} />
    </Box>
  );
}
