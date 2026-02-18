import {
  Box,
  Chip,
  Dialog,
  DialogContent,
  DialogTitle,
  Divider,
  Typography,
} from "@mui/material";
import {
  CalendarCheck,
  Check,
  Dot,
  Info,
  Mars,
  Pencil,
  Play,
  Venus,
  X,
} from "lucide-react";
import type { Appointment, AppointmentAction } from "./types";
import ClientePersonalInfo from "../clients/ClientePersonalInfo";
import CustomCard from "../../components/Card/CustomCard";
import theme from "../../theme";
import { getAppointmentTotal } from "../../utils/getAppointmentTotalPrice";
import { Button } from "../../components/Button/Button";
import { AppointmentStatusChip } from "./AppointmentStatusChip";
import { formatAppointmentDate } from "../../utils/formatAppointmentDate";

type Props = {
  open: boolean;
  appointment: Appointment;
  onClose: () => void;
  handleAction: (appointment: Appointment, action: AppointmentAction) => void;
  onEdit: (appointment: Appointment) => void;
};
const AppointmentDetailsModal = ({
  open,
  appointment,
  onClose,
  handleAction,
  onEdit,
}: Props) => {

  const totalCents = getAppointmentTotal(appointment);

  const formattedTotal = (totalCents / 100).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
  return (
    <Dialog
      onClose={onClose}
      open={open}
      maxWidth={false}
      slotProps={{
        paper: {
          sx: {
            width: "60%",
            maxWidth: "1400px",
            minWidth: "1250px",
          },
        },
      }}
    >
      <DialogTitle
        sx={{ display: "flex", justifyContent: "space-between", pr: 4, pb: 0 }}
      >
        <Typography variant="h5">Detalhes do agendamento</Typography>
        <Box sx={{ cursor: "pointer" }}>
          <X onClick={onClose} />
        </Box>
      </DialogTitle>

      <Divider />
      <DialogContent sx={{ display: "flex", justifyContent: "space-between" }}>
        <Box
          className="coluna-1"
          sx={{
            width: "45%",
            display: "flex",
            gap: 2,
            flexDirection: "column",
          }}
        >
          <Box>
            <Typography variant="h5" fontWeight={600}>
              Agendamento
            </Typography>
            <CustomCard sx={{ mt: 1, px: 2, py: 1, minWidth: "580px" }}>
              <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                <Typography variant="h6" fontWeight={500}>
                  {formatAppointmentDate(appointment.scheduled_at)}
                </Typography>
                <AppointmentStatusChip status={appointment.status} />
              </Box>
              {appointment.notes && (
                <Box sx={{ mt: 1 }}>
                  <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
                    <Info size={14} color={theme.palette.error.main} />
                    <Typography variant="body2" color="error.main">
                      Observações do agendamento
                    </Typography>
                  </Box>
                  <Typography variant="body2" sx={{ ml: 3 }}>
                    {appointment.notes}
                  </Typography>
                </Box>
              )}

              <Box sx={{ p: 2 }}>
                {appointment.status === "pending" && (
                  <>
                    <Divider sx={{ my: 1 }} />
                    <Box
                      sx={{
                        display: "flex",
                        justifyContent: "space-between",
                        gap: 1,
                      }}
                    >
                      <Button
                        variant="text"
                        size="small"
                        startIcon={<X size={16} />}
                        onClick={() => handleAction(appointment, "cancel")}
                      >
                        Cancelar Agendamento
                      </Button>
                      <Box sx={{ display: "flex", gap: 1 }}>
                        <Button
                          variant="outlined"
                          onClick={() => onEdit(appointment)}
                          startIcon={<Pencil size={16} />}
                          size="small"
                        >
                          Alterar
                        </Button>
                        <Button
                          onClick={() => handleAction(appointment, "confirm")}
                          startIcon={<CalendarCheck size={16} />}
                          size="small"
                        >
                          Confirmar
                        </Button>
                      </Box>
                    </Box>
                  </>
                )}

                {appointment.status === "confirmed" && (
                  <>
                    <Divider sx={{ my: 1 }} />
                    <Box
                      sx={{
                        display: "flex",
                        justifyContent: "space-between",
                        gap: 1,
                      }}
                    >
                      <Button
                        variant="text"
                        size="small"
                        startIcon={<X size={16} />}
                        onClick={() => handleAction(appointment, "cancel")}
                      >
                        Cancelar Agendamento
                      </Button>
                      <Box sx={{ display: "flex", gap: 1 }}>
                        <Button
                          variant="outlined"
                          onClick={() => onEdit(appointment)}
                          startIcon={<Pencil size={16} />}
                          size="small"
                        >
                          Alterar
                        </Button>
                        <Button
                          size="small"
                          startIcon={<Play size={16} />}
                          onClick={() => handleAction(appointment, "start")}
                        >
                          Iniciar Serviços
                        </Button>
                      </Box>
                    </Box>
                  </>
                )}
                {appointment.status === "in_progress" && (
                  <>
                    <Divider sx={{ my: 1 }} />
                    <Box
                      sx={{
                        display: "flex",
                        justifyContent: "flex-end",
                        gap: 1,
                      }}
                    >
                      <Button
                        size="small"
                        startIcon={<Check size={16} />}
                        onClick={() => handleAction(appointment, "complete")}
                      >
                        Finalizar
                      </Button>
                    </Box>
                  </>
                )}
              </Box>
            </CustomCard>
          </Box>
          <Box>
            <Typography variant="h5" fontWeight={600}>
              Tutor
            </Typography>
            <Box sx={{ mt: 1 }}>
              <ClientePersonalInfo client={appointment.client} />
            </Box>
          </Box>
        </Box>

        <Box className="coluna-2" sx={{ width: "50%" }}>
          <Box sx={{ display: "flex", justifyContent: "space-between" }}>
            <Typography variant="h5" fontWeight={600}>
              Pets & Serviços
            </Typography>
            <Typography variant="h5" fontWeight={600}>
              {formattedTotal}
            </Typography>
          </Box>
          <Box sx={{ mt: 1, display: "flex", gap: 2, flexDirection: "column" }}>
            {appointment.items.map((item) => (
              <CustomCard sx={{ px: 2, py: 1, minWidth: "600px" }}>
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <Box sx={{ display: "flex", alignItems: "center" }}>
                    <Typography variant="h6" fontWeight={500}>
                      {item.pet.name}
                    </Typography>

                    {item.pet.breed && (
                      <>
                        ,
                        <Typography
                          variant="body2"
                          color={theme.palette.text.disabled}
                          sx={{ mt: 1, ml: 0.5 }}
                        >
                          {item.pet.breed}
                        </Typography>
                      </>
                    )}
                  </Box>
                  <Chip
                    label={item.pet.gender === "male" ? "Macho" : "Femea"}
                    icon={
                      item.pet.gender === "male" ? (
                        <Mars color={theme.palette.text.primary} size={16} />
                      ) : (
                        <Venus color={theme.palette.text.primary} size={16} />
                      )
                    }
                    sx={{
                      bgcolor:
                        item.pet.gender === "male"
                          ? "rgba(33, 150, 243, 0.3)"
                          : "rgba(233, 30, 99, 0.3)",
                      color: "text.primary",
                      px: 1,
                      height: "25px",
                      borderRadius: 2,
                    }}
                  />
                </Box>
                <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                  <Typography variant="body2">{item.pet.species}</Typography>
                  {item.pet.size && (
                    <>
                      <Dot color={theme.palette.text.disabled} size={16} />
                      <Typography variant="body2">
                        Porte {item.pet.size}
                      </Typography>
                    </>
                  )}
                  {item.pet.coat_type && (
                    <>
                      <Dot color={theme.palette.text.disabled} size={16} />
                      <Typography variant="body2">
                        Pelagem {item.pet.coat_type}
                      </Typography>
                    </>
                  )}
                  {item.pet.coat_color && (
                    <>
                      <Dot size={16} />
                      <Typography variant="body2">
                        Cor {item.pet.coat_color}
                      </Typography>
                    </>
                  )}
                </Box>
                <Box sx={{ mt: 1 }}>
                  <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
                    <Info size={14} color={theme.palette.error.main} />
                    <Typography variant="body2" color="error.main">
                      Observações do pet
                    </Typography>
                  </Box>
                  <Typography variant="body2" sx={{ ml: 3 }}>
                    {item.pet.notes}
                  </Typography>
                </Box>
                <Divider sx={{ my: 1 }} />
                <Typography variant="h6" fontWeight={500}>
                  Serviços do pet
                </Typography>
                <Box>
                  {item.services.map((s) => (
                    <Box
                      key={s.id}
                      sx={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        py: 0.5,
                      }}
                    >
                      {/* Nome do serviço */}
                      <Box
                        sx={{ display: "flex", alignItems: "center", gap: 0.5 }}
                      >
                        <Dot color={theme.palette.text.disabled} size={16} />
                        <Typography variant="body2">{s.name}</Typography>
                      </Box>

                      {/* Preço */}
                      <Typography variant="body2">
                        {(s.price_cents / 100).toLocaleString("pt-BR", {
                          style: "currency",
                          currency: "BRL",
                        })}
                      </Typography>
                    </Box>
                  ))}
                  <Divider sx={{ my: 1 }} />
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      fontWeight: 600,
                    }}
                  >
                    <Typography variant="body2" fontWeight={600}>
                      Total
                    </Typography>
                    <Typography variant="body2" fontWeight={600}>
                      {item.services
                        .reduce((acc, s) => acc + s.price_cents / 100, 0)
                        .toLocaleString("pt-BR", {
                          style: "currency",
                          currency: "BRL",
                        })}
                    </Typography>
                  </Box>
                </Box>
              </CustomCard>
            ))}
          </Box>
        </Box>
      </DialogContent>
    </Dialog>
  );
};

export default AppointmentDetailsModal;
