import { Box, Typography, Chip, Tooltip, IconButton, CircularProgress, Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions } from "@mui/material";
import { User, Dog, Calendar, Clock, Scissors, Plus, Trash2, Pencil, CalendarCheck } from "lucide-react";
import CustomCard from "../../components/Card/CustomCard";
import { useWaitingListMutations } from "../../hooks/useWaitingList";
import { useState } from "react";
import WaitingListModal from "../appointments/waiting-list/WaitingListModal";
import dayjs from "dayjs";
import type { WaitingListEntry } from "../appointments/waiting-list/types";
import theme from "../../theme";
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
                p: 1.5,
                borderLeft: "4px solid",
                borderColor: "warning.main",
              }}
            >
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <Box sx={{ flex: 1 }}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                    <User size={14} color="gray" />
                    <Typography variant="body2" fontWeight={700}>
                      {entry.client.name}
                    </Typography>
                  </Box>
                  
                  {/* PETS E SERVIÇOS */}
                  <Box sx={{ mt: 1, display: "flex", flexDirection: "column", gap: 0.5 }}>
                    {entry.items.map((item) => (
                      <Box key={item.id} sx={{ mb: 0.5 }}>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                          <Dog size={12} color="gray" />
                          <Typography variant="caption" color="text.primary" fontWeight={600}>
                            {item.pet.name}
                          </Typography>
                        </Box>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, pl: 2 }}>
                          <Scissors size={10} color="gray" />
                          <Typography variant="caption" color="text.primary" fontSize="0.7rem">
                            {item.services.map((s) => s.name).join(", ")}
                          </Typography>
                        </Box>
                      </Box>
                    ))}
                  </Box>

                  <Box sx={{ display: "flex", gap: 1.5, mt: 1 }}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                      <Calendar size={12} color={theme.palette.primary.main} />
                      <Typography variant="caption" fontWeight={600} color="primary.main">
                        {entry.preferred_date ? dayjs(entry.preferred_date).format("DD/MM") : "Qualquer dia"}
                      </Typography>
                    </Box>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                      <Clock size={12} color={theme.palette.primary.main} />
                      <Typography variant="caption" fontWeight={600} color="primary.main">
                        {periodLabels[entry.preferred_period as keyof typeof periodLabels]}
                      </Typography>
                    </Box>
                  </Box>
                </Box>

                <Box sx={{ display: "flex", gap: 0.5 }}>
                  <Tooltip title="Editar">
                    <IconButton size="small" color="primary" onClick={() => { setEditingEntry(entry); setModalOpen(true); }}>
                      <Pencil size={16} />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Remover da Lista">
                    <IconButton size="small" color="error" onClick={() => setConfirmDeleteId(entry.id)}>
                      <Trash2 size={16} />
                    </IconButton>
                  </Tooltip>
                </Box>
              </Box>

              {entry.notes && (
                <Typography
                  variant="caption"
                  sx={{
                    display: "block",
                    mt: 1,
                    p: 0.75,
                    bgcolor: "action.hover",
                    borderRadius: 1,
                    fontStyle: "italic"
                  }}
                >
                  "{entry.notes}"
                </Typography>
              )}

              <Button
                size="small"
                variant="contained"
                color="success"
                startIcon={<CalendarCheck size={14} />}
                fullWidth
                sx={{ mt: 1.5 }}
                onClick={() => onScheduleEntry(entry)}
              >
                Agendar
              </Button>
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
