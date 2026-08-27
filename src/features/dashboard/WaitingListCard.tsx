import { Box, Typography, Chip, Tooltip, IconButton, CircularProgress, Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions } from "@mui/material";
import { Calendar, Clock, Plus, Trash2, Pencil, CalendarCheck } from "lucide-react";
import CustomCard from "../../components/Card/CustomCard";
import { useWaitingListMutations } from "../../hooks/useWaitingList";
import { useState } from "react";
import WaitingListModal from "../appointments/waiting-list/WaitingListModal";
import dayjs from "dayjs";
import type { WaitingListEntry } from "../appointments/waiting-list/types";
import { Button } from "../../components/Button/Button";

type Props = {
  onScheduleEntry: (entry: WaitingListEntry) => void;
  entries?: WaitingListEntry[];
  isFetching?: boolean;
};

export default function WaitingListCard({ onScheduleEntry, entries = [], isFetching = false }: Props) {
  const { deleteEntry } = useWaitingListMutations();
  const isLoading = isFetching && entries.length === 0;
  const [modalOpen, setModalOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<WaitingListEntry | undefined>(undefined);
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);

  // Mapeamento de labels para períodos
  const periodLabels = {
    any: "Qualquer Horário",
    morning: "Manhã",
    afternoon: "Tarde",
    evening: "Noite",
  };

  return (
    <Box sx={{ mt: 3 }}>
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 1.5 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <Clock size={20} />
          <Typography variant="h6" fontWeight={600}>
            Lista de Espera
          </Typography>
        </Box>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          {entries && entries.length > 0 && (
            <Chip
              label={entries.length}
              color="warning"
              size="small"
              sx={{ fontWeight: 700, minWidth: 28 }}
            />
          )}
          <Tooltip title="Adicionar à Lista de Espera">
            <IconButton 
              size="small" 
              color="primary" 
              onClick={() => setModalOpen(true)}
              sx={{ bgcolor: "primary.main", color: "white", "&:hover": { bgcolor: "primary.dark" } }}
            >
              <Plus size={18} />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
        {isLoading ? (
          <Box sx={{ display: "flex", justifyContent: "center", p: 3 }}>
            <CircularProgress size={24} />
          </Box>
        ) : !entries || entries.length === 0 ? (
          <CustomCard sx={{ p: 2.5, textAlign: "center" }}>
            <Typography variant="body2" color="text.disabled">
              Ninguém na fila de espera
            </Typography>
          </CustomCard>
        ) : (
          entries.map((entry: WaitingListEntry) => (
            <CustomCard
              key={entry.id}
              sx={{
                p: { xs: 1.1, sm: 1.25 },
                borderLeft: "4px solid",
                borderColor: "warning.main",
                display: "flex",
                flexDirection: "column",
                gap: 0.5,
                transition: "all 0.15s ease",
                "&:hover": {
                  boxShadow: 3,
                },
              }}
            >
              {/* Linha 1: Cliente e Pets | Botões de Ação */}
              <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 1 }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, minWidth: 0, overflow: "hidden" }}>
                  <Typography variant="body2" fontWeight={700} noWrap sx={{ fontSize: { xs: "0.85rem", sm: "0.88rem" }, lineHeight: 1.2 }}>
                    {entry.client.name}
                  </Typography>
                  <Typography variant="caption" noWrap sx={{ color: "text.primary", opacity: 0.65, fontSize: "0.74rem" }}>
                    • {entry.items.map((i) => `${i.pet.name} (${i.services.map((s) => s.name).join(", ")})`).join("; ")}
                  </Typography>
                </Box>

                <Box sx={{ display: "flex", alignItems: "center", gap: 0.25, flexShrink: 0 }}>
                  <Tooltip title="Editar">
                    <IconButton
                      size="small"
                      sx={{ p: 0.35, color: "text.primary", opacity: 0.7, "&:hover": { opacity: 1, color: "primary.main" } }}
                      onClick={() => { setEditingEntry(entry); setModalOpen(true); }}
                    >
                      <Pencil size={14} />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Remover">
                    <IconButton
                      size="small"
                      sx={{ p: 0.35, color: "text.primary", opacity: 0.7, "&:hover": { opacity: 1, color: "error.main" } }}
                      onClick={() => setConfirmDeleteId(entry.id)}
                    >
                      <Trash2 size={14} />
                    </IconButton>
                  </Tooltip>
                </Box>
              </Box>

              {/* Linha 2: Data, Período, Observações e Botão Agendar */}
              <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 1 }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1, minWidth: 0, overflow: "hidden", flexWrap: "nowrap" }}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 0.35, color: "primary.main", flexShrink: 0 }}>
                    <Calendar size={11} />
                    <Typography variant="caption" fontWeight={600} sx={{ fontSize: "0.72rem", color: "inherit" }}>
                      {entry.preferred_date ? dayjs(entry.preferred_date).format("DD/MM") : "Qualquer dia"}
                    </Typography>
                  </Box>

                  <Box sx={{ display: "flex", alignItems: "center", gap: 0.35, color: "text.disabled", flexShrink: 0 }}>
                    <Clock size={11} />
                    <Typography variant="caption" sx={{ fontSize: "0.72rem" }}>
                      {periodLabels[entry.preferred_period as keyof typeof periodLabels]}
                    </Typography>
                  </Box>

                  {entry.notes && (
                    <Typography
                      variant="caption"
                      noWrap
                      sx={{
                        color: "text.primary",
                        opacity: 0.75,
                        fontSize: "0.7rem",
                        fontStyle: "italic",
                        bgcolor: "action.hover",
                        px: 0.6,
                        py: 0.1,
                        borderRadius: 0.5,
                        maxWidth: { xs: "120px", sm: "180px" },
                      }}
                      title={entry.notes}
                    >
                      "{entry.notes}"
                    </Typography>
                  )}
                </Box>

                <Button
                  size="small"
                  variant="contained"
                  color="success"
                  startIcon={<CalendarCheck size={13} />}
                  sx={{
                    height: 26,
                    fontSize: "0.72rem",
                    fontWeight: 700,
                    px: 1.25,
                    py: 0,
                    borderRadius: 1,
                    flexShrink: 0,
                    textTransform: "none",
                  }}
                  onClick={() => onScheduleEntry(entry)}
                >
                  Agendar
                </Button>
              </Box>
            </CustomCard>
          ))
        )}
      </Box>

      {modalOpen && (
        <WaitingListModal
          key={editingEntry?.id ?? "new"}
          open={modalOpen}
          onClose={() => { setModalOpen(false); setEditingEntry(undefined); }}
          initialEntry={editingEntry}
          onSuccess={() => {
            setModalOpen(false);
            setEditingEntry(undefined);
          }}
        />
      )}

      <Dialog open={confirmDeleteId !== null} onClose={() => setConfirmDeleteId(null)}>
        <DialogTitle>Remover da Lista de Espera</DialogTitle>
        <DialogContent>
          <DialogContentText color="text.primary">
            Tem certeza que deseja remover este cliente da lista de espera?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button variant="outlined" onClick={() => setConfirmDeleteId(null)}>
            Cancelar
          </Button>
          <Button
            color="error"
            onClick={() => {
              if (confirmDeleteId !== null) deleteEntry(confirmDeleteId);
              setConfirmDeleteId(null);
            }}
          >
            Remover
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
