import {
  Box,
  Divider,
  Dialog,
  DialogContent,
  DialogTitle,
  Typography,
} from "@mui/material";
import { Info, X, Utensils, Package, FileText } from "lucide-react";
import theme from "../../theme";
import CustomCard from "../../components/Card/CustomCard";
import type { DaycareGroup } from "./DaycareServiceSummaryModal";

type Props = {
  open: boolean;
  handleClose: () => void;
  group: DaycareGroup;
};

export default function DaycareObservationModal({
  open,
  handleClose,
  group,
}: Props) {
  const staysWithNotes = group.stays.filter((s) =>
    Boolean(
      (s.pet?.notes && s.pet.notes.trim() !== "") ||
      (s.food_info && s.food_info.trim() !== "") ||
      (s.belongings && s.belongings.trim() !== "") ||
      (s.notes && s.notes.trim() !== "" && s.notes !== group.primaryStay.notes)
    )
  );

  const hasGeneralNotes = Boolean(
    group.primaryStay.notes && group.primaryStay.notes.trim() !== ""
  );

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      fullWidth
      maxWidth="sm"
      slotProps={{
        paper: { sx: { borderRadius: 3, p: 1 } },
        backdrop: { sx: { backgroundColor: "rgba(0, 0, 0, 0.6)" } },
      }}
    >
      <DialogTitle sx={{ pb: 1 }}>
        <Box
          sx={{
            display: "flex",
            gap: 2,
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <Box sx={{ display: "flex", gap: 1.5, alignItems: "center" }}>
            <Info size={24} color={theme.palette.primary.main} />
            <Typography variant="h5" fontWeight={600}>
              Observações
            </Typography>
          </Box>
          <Box sx={{ cursor: "pointer", display: "flex" }} onClick={handleClose}>
            <X size={24} />
          </Box>
        </Box>
      </DialogTitle>
      <Divider />
      <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
        {hasGeneralNotes && (
          <CustomCard sx={{ p: 2 }}>
            <Typography variant="h6" fontWeight={600} gutterBottom sx={{ fontSize: "1rem" }}>
              Estadia / Agendamento
            </Typography>
            <Typography variant="body2" color="text.primary" sx={{ whiteSpace: "pre-line" }}>
              {group.primaryStay.notes}
            </Typography>
          </CustomCard>
        )}

        {staysWithNotes.map((stay) => (
          <CustomCard
            key={stay.id}
            sx={{ p: 2, display: "flex", flexDirection: "column", gap: 1.5 }}
          >
            <Typography variant="h6" fontWeight={700} sx={{ fontSize: "1.05rem" }}>
              {stay.pet?.name}
            </Typography>

            {stay.pet?.notes && stay.pet.notes.trim() !== "" && (
              <Box>
                <Typography
                  variant="caption"
                  fontWeight={700}
                  color="text.secondary"
                  sx={{ display: "flex", alignItems: "center", gap: 0.5, mb: 0.25 }}
                >
                  <FileText size={13} /> Observações do Pet
                </Typography>
                <Typography
                  variant="body2"
                  color="text.primary"
                  sx={{ whiteSpace: "pre-line" }}
                >
                  {stay.pet.notes}
                </Typography>
              </Box>
            )}

            {stay.food_info && stay.food_info.trim() !== "" && (
              <Box>
                <Typography
                  variant="caption"
                  fontWeight={700}
                  color="text.secondary"
                  sx={{ display: "flex", alignItems: "center", gap: 0.5, mb: 0.25 }}
                >
                  <Utensils size={13} /> Alimentação
                </Typography>
                <Typography
                  variant="body2"
                  color="text.primary"
                  sx={{ whiteSpace: "pre-line" }}
                >
                  {stay.food_info}
                </Typography>
              </Box>
            )}

            {stay.belongings && stay.belongings.trim() !== "" && (
              <Box>
                <Typography
                  variant="caption"
                  fontWeight={700}
                  color="text.secondary"
                  sx={{ display: "flex", alignItems: "center", gap: 0.5, mb: 0.25 }}
                >
                  <Package size={13} /> Pertences
                </Typography>
                <Typography
                  variant="body2"
                  color="text.primary"
                  sx={{ whiteSpace: "pre-line" }}
                >
                  {stay.belongings}
                </Typography>
              </Box>
            )}

            {stay.notes &&
              stay.notes.trim() !== "" &&
              stay.notes !== group.primaryStay.notes && (
                <Box>
                  <Typography
                    variant="caption"
                    fontWeight={700}
                    color="text.secondary"
                    sx={{ display: "flex", alignItems: "center", gap: 0.5, mb: 0.25 }}
                  >
                    <Info size={13} /> Observações Adicionais
                  </Typography>
                  <Typography
                    variant="body2"
                    color="text.primary"
                    sx={{ whiteSpace: "pre-line" }}
                  >
                    {stay.notes}
                  </Typography>
                </Box>
              )}
          </CustomCard>
        ))}

        {!hasGeneralNotes && staysWithNotes.length === 0 && (
          <Typography variant="body2" color="text.secondary" textAlign="center" py={2}>
            Nenhuma observação cadastrada para esta estadia.
          </Typography>
        )}
      </DialogContent>
    </Dialog>
  );
}

