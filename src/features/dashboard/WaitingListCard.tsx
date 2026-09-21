import { Box, Typography, Chip, Tooltip, IconButton, CircularProgress, Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions } from "@mui/material";
import { Clock, Plus, Trash2, CalendarCheck, Dog } from "lucide-react";
import CustomCard from "../../components/Card/CustomCard";
import { useWaitingListMutations } from "../../hooks/useWaitingList";
import { useState, memo } from "react";
import WaitingListModal from "../appointments/waiting-list/WaitingListModal";
import type { WaitingListEntry } from "../appointments/waiting-list/types";
import { Button } from "../../components/Button/Button";

type Props = {
  onScheduleEntry: (entry: WaitingListEntry) => void;
  entries?: WaitingListEntry[];
  isFetching?: boolean;
};

function WaitingListCard({ onScheduleEntry, entries = [], isFetching = false }: Props) {
  const { deleteEntry } = useWaitingListMutations();
  const isLoading = isFetching && entries.length === 0;
  const [modalOpen, setModalOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<WaitingListEntry | undefined>(undefined);
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);

  return (
    <Box sx={{ mt: 2.5 }}>
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
          entries.map((entry: WaitingListEntry) => {
            const petsText = entry.items.map((i) => i.pet.name).join(", ");

            return (
              <CustomCard
                key={entry.id}
                onClick={() => {
                  setEditingEntry(entry);
                  setModalOpen(true);
                }}
                sx={{
                  p: { xs: 1.2, sm: 1.35 },
                  border: "1px solid",
                  borderColor: "divider",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 1.5,
                  cursor: "pointer",
                  transition: "border-color 0.15s ease",
                  "&:hover": {
                    borderColor: "primary.main",
                  },
                }}
              >
                {/* Lado Esquerdo: Nome da pessoa em cima, pets embaixo */}
                <Box sx={{ minWidth: 0, flex: 1, display: "flex", flexDirection: "column", gap: 0.35 }}>
                  <Typography
                    variant="body2"
                    fontWeight={700}
                    noWrap
                    sx={{ fontSize: { xs: "0.86rem", sm: "0.9rem" }, color: "text.primary" }}
                  >
                    {entry.client.name}
                  </Typography>

                  {petsText && (
                    <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, minWidth: 0 }}>
                      <Dog size={13} style={{ flexShrink: 0 }} />
                      <Typography
                        variant="caption"
                        noWrap
                        sx={{ color: "text.primary", fontSize: "0.78rem", fontWeight: 500 }}
                      >
                        {petsText}
                      </Typography>
                    </Box>
                  )}
                </Box>

                {/* Lado Direito: Botão Agendar + Remover */}
                <Box
                  sx={{ display: "flex", alignItems: "center", gap: { xs: 0.5, sm: 0.75 }, flexShrink: 0 }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <Button
                    size="small"
                    variant="contained"
                    color="success"
                    startIcon={<CalendarCheck size={13} />}
                    sx={{
                      height: 26,
                      fontSize: "0.72rem",
                      fontWeight: 700,
                      px: { xs: 1, sm: 1.25 },
                      py: 0,
                      borderRadius: 1,
                      flexShrink: 0,
                      textTransform: "none",
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      onScheduleEntry(entry);
                    }}
                  >
                    Agendar
                  </Button>

                  <Tooltip title="Remover">
                    <IconButton
                      size="small"
                      sx={{ p: 0.35, color: "text.primary", opacity: 0.7, "&:hover": { opacity: 1, color: "error.main" } }}
                      onClick={(e) => {
                        e.stopPropagation();
                        setConfirmDeleteId(entry.id);
                      }}
                    >
                      <Trash2 size={14} />
                    </IconButton>
                  </Tooltip>
                </Box>
              </CustomCard>
            );
          })
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

export default memo(WaitingListCard);
