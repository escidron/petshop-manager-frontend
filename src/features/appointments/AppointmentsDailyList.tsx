import {
  Box,
  Checkbox,
  FormControlLabel,
  InputAdornment,
  Skeleton,
  TextField,
  Typography,
} from "@mui/material";
import { applyAppointmentAction } from "../../api/services/appointments";
import { Plus, Search } from "lucide-react";
import type { Dayjs } from "dayjs";
import { Button } from "../../components/Button/Button";
import type { Appointment, AppointmentAction } from "./types";
import { useState } from "react";
import AppointmentListItem from "./AppointmentListItem";
import { buildDayTimeline } from "../../utils/getFreeSlotsforAppointment";
import AppointmentFreeTimeCard from "./AppointmentFreeTimeCard";
import AppointmentDetailsModal from "./AppointmentDetailsModal";

import { useQueryClient } from "@tanstack/react-query";
import NoAppointmentsBanner from "./NoAppointmentsBanner";

type Props = {
  onEdit: (appointment: Appointment) => void;
  openFlow: () => void;
  date: Dayjs;
  appointments: Appointment[];
  isFetching?: boolean;
};



const AppointmentsDailyList = ({
  openFlow,
  onEdit,
  date,
  appointments,
  isFetching = false,
}: Props) => {
  const [detailsModal, setDetailsModal] = useState<{
    open: boolean;
    appointmentId?: number;
  }>({ open: false });
  const [search, setSearch] = useState("");
  const [showCanceled, setShowCanceled] = useState(false);
  const [loadingAction, setLoadingAction] = useState<AppointmentAction | null>(null);
  const queryClient = useQueryClient();

  const workStart = date.hour(8).minute(0).second(0);
  const workEnd = date.hour(18).minute(0).second(0);

  const filteredAppointments = appointments.filter((a) => {
    if (!showCanceled && a.status === "canceled") return false;
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    const matchesClient = a.client.name.toLowerCase().includes(q);
    const matchesPet = a.items.some((item) =>
      item.pet.name.toLowerCase().includes(q),
    );
    return matchesClient || matchesPet;
  });

  const timeline = buildDayTimeline(
    filteredAppointments,
    workStart,
    workEnd,
    30,
  );

  const selectedAppointment = appointments.find(
    (a) => a.id === detailsModal.appointmentId,
  );

  const handleAction = async (
    appointment: Appointment,
    action: AppointmentAction,
    cancelAllFuture?: boolean
  ) => {
    setLoadingAction(action);
    try {
      await applyAppointmentAction(appointment.id, action, cancelAllFuture);
      queryClient.invalidateQueries({ queryKey: ["appointments"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-startup"] });
      queryClient.invalidateQueries({ queryKey: ["pos-startup"] });
      queryClient.invalidateQueries({ queryKey: ["pos-client"] });
    } finally {
      setLoadingAction(null);
    }
  };



  return (
    <>
      {/* Header */}
      <Box
        sx={{
          display: "flex",
          flexDirection: { xs: "column", sm: "row", lg: "column", xl: "row" },
          justifyContent: "space-between",
          alignItems: { xs: "stretch", sm: "center", lg: "stretch", xl: "center" },
          gap: 2,
        }}
      >
        <Box>
          <Typography variant="h5" fontWeight={600} color="text.primary" sx={{ fontSize: { xs: "1.25rem", lg: "1.1rem", xl: "1.5rem" } }}>
            Agendas do dia
          </Typography>
          <Typography 
            variant="body2" 
            sx={{ 
              color: "text.disabled", 
              fontWeight: 500,
              display: "block",
              mt: 0.2,
              textTransform: "capitalize",
              fontSize: { xs: "0.8rem", lg: "0.75rem", xl: "0.875rem" }
            }}
          >
            {date.format("dddd, DD [de] MMMM")}
          </Typography>
        </Box>
        <Box
          sx={{
            display: "flex",
            gap: 1.5,
            alignItems: "center",
            flex: { xs: "1 1 100%", sm: "0 1 auto", lg: "1 1 100%", xl: "0 1 auto" },
          }}
        >
          <TextField
            size="small"
            placeholder="Buscar tutor ou pet"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            sx={{ 
              flex: 1,
              width: { xs: "100%", sm: 200, md: 260 }, 
              backgroundColor: "white", 
              borderRadius: 1 
            }}
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <Search size={16} />
                  </InputAdornment>
                ),
              },
            }}
          />
          <Button
            size="small"
            sx={{ 
              minWidth: "40px", 
              height: "40px", 
              p: 1, 
              borderRadius: 1, 
              backgroundColor: "primary.main",
              color: "white"
            }}
            onClick={openFlow}
          >
            <Plus size={20} />
          </Button>
        </Box>
      </Box>
      {appointments.length > 0 && (
        <FormControlLabel
          sx={{ mt: 2, mb: 0 }}
          control={
            <Checkbox
              disableRipple
              size="small"
              checked={showCanceled}
              onChange={(e) => setShowCanceled(e.target.checked)}
              sx={{ color: "primary.main", py: 0 }}
            />
          }
          label={
            <Typography variant="body2" color="text.primary">
              Mostrar cancelados
            </Typography>
          }
        />
      )}


      {/* Lista */}
      <Box sx={{ display: "flex", flexDirection: "column", gap: 1, mt: 1.5 }}>
        {isFetching ? (
          Array.from({ length: 4 }).map((_, i) => (
            <Skeleton
              key={i}
              variant="rounded"
              height={64}
              sx={{ borderRadius: 2, bgcolor: "grey.200" }}
            />
          ))
        ) : appointments.length === 0 ? (
          <Box sx={{ py: 4 }}>
            <NoAppointmentsBanner />
          </Box>
        ) : (
          <>
            {timeline.map((block, index) => {
              if (block.type === "appointment") {
                return (
                  <AppointmentListItem
                    key={block.data.id}
                    appointment={block.data}
                    openDetails={() =>
                      setDetailsModal({
                        open: true,
                        appointmentId: block.data.id,
                      })
                    }
                  />
                );
              }
              if (block.type === "free") {
                return (
                  <AppointmentFreeTimeCard
                    key={`free-${index}`}
                    block={block}
                    openFlow={openFlow}
                  />
                );
              }
              return null;
            })}
            {filteredAppointments.length === 0 && search && (
              <Typography variant="body1" color="text.disabled">
                Nenhum agendamento encontrado para esta busca.
              </Typography>
            )}
          </>
        )}
      </Box>

      {detailsModal.open && selectedAppointment && (
        <AppointmentDetailsModal
          open={detailsModal.open}
          onClose={() => setDetailsModal({ open: false })}
          appointment={selectedAppointment}
          handleAction={handleAction}
          loadingAction={loadingAction}
          onEdit={onEdit}
        />
      )}
    </>
  );
};

export default AppointmentsDailyList;
