import { Box, Divider, Typography } from "@mui/material";
import CustomCard from "../../components/Card/CustomCard";
import {
  type Appointment,
  type AppointmentAction,
} from "../../api/services/appointments";
import {
  CalendarCheck,
  CircleAlert,
  CircleCheck,
  Play,
  Plus,
  Scissors,
  ShowerHead,
  X,
} from "lucide-react";
import theme from "../../theme";
import dayjs from "dayjs";
import { Button } from "../../components/Button/Button";
import { getAppointmentStatusUI } from "../../utils/getAppointmentStatusColor";
import { getAgeUnitLabel } from "../../utils/getAgeUnitLabel";

type Props = {
  appointments: Appointment[];
  openFlow: () => void;
  handleAction: (appointment: Appointment, action: AppointmentAction) => void;
};
const AppointmentsDailyList = ({
  appointments,
  openFlow,
  handleAction,
}: Props) => {
  return (
    <>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <Typography variant="h5" fontWeight={600}>
          Agendas do dia
        </Typography>
        <Button startIcon={<Plus />} onClick={openFlow}>
          Novo Agendamento
        </Button>
      </Box>
      <Box sx={{ display: "flex", flexDirection: "column", gap: 1, mt: 2 }}>
        {appointments.map((appointment) => {
          const statusUI = getAppointmentStatusUI(appointment.status);
          const p = theme.palette[statusUI.palette];
          {
            return (
              <CustomCard
                key={appointment.id}
                sx={{
                  px: 2,
                  py: 1,
                  pb: 2,
                  borderLeft: "5px solid",
                  borderLeftColor: p.main,
                }}
              >
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    width: "100%",
                  }}
                >
                  <Box>
                    <Box sx={{ display: "flex", alignItems: "center" }}>
                      <Typography variant="h6" fontWeight={600}>
                        {appointment.pet.name},
                      </Typography>
                      <Typography
                        variant="body2"
                        sx={{ marginLeft: 0.5, marginTop: 1 }}
                      >
                        {appointment.pet.breed}
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant="body2" color="text.disabled">
                        {appointment.pet.species === "dog"
                          ? "Canino"
                          : "Felino"}{" "}
                        -{" "}
                        {appointment.pet.gender === "male" ? "Macho" : "Femea"}
                      </Typography>
                    </Box>
                  </Box>
                  <Box
                    sx={{
                      border: "1px solid",
                      borderColor: "divider",
                      px: 2,
                      borderRadius: 3,
                    }}
                  >
                    <Typography variant="h6" fontWeight={600}>
                      {dayjs(appointment.scheduled_at).format("HH:mm")}
                    </Typography>
                  </Box>
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 0.5,
                      bgcolor: p.light,
                      color: "text.secondary",
                      px: 1,
                      py: 0.5,
                      borderRadius: 1,
                      fontWeight: 500,
                      width: "fit-content",
                    }}
                  >
                    <statusUI.icon size={16} />
                    <Typography variant="body2" fontWeight={500}>
                      {statusUI.label}
                    </Typography>
                  </Box>
                </Box>
                <Divider sx={{ my: 1 }} />
                <Box
                  sx={{
                    display: "flex",
                    gap: 2,
                    justifyContent: "space-between",
                  }}
                >
                  <Box
                    sx={{
                      width: "100%",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      borderRadius: 1,
                    }}
                  >
                    <Box>
                      <Typography variant="body1" color="text.disabled">
                        Serviços
                      </Typography>
                      <Box sx={{ display: "flex", gap: 2 }}>
                        {appointment.services.map((service) => (
                          <Box
                            key={service.name}
                            sx={{ display: "flex", gap: 0.5, marginTop: 0.5 }}
                          >
                            {service.name === "Tosa" ? (
                              <Scissors size={16} />
                            ) : (
                              <ShowerHead size={16} />
                            )}
                            <Typography key={service.name} variant="body2">
                              {service.name}
                            </Typography>
                          </Box>
                        ))}
                      </Box>
                    </Box>
                    <Box>
                      <Typography variant="body1" color="text.disabled">
                        Dono
                      </Typography>
                      <Typography variant="body2">
                        {appointment.client.name}
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant="body1" color="text.disabled">
                        Idade
                      </Typography>
                      <Typography variant="body2">
                        {appointment.pet.age}{" "}
                        {getAgeUnitLabel(appointment.pet.age, appointment.pet.ageUnit)}
                      </Typography>
                    </Box>
                  </Box>
                </Box>
                {appointment.notes && (
                  <Box sx={{ mt: 2, pb: 1 }}>
                    <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
                      <CircleAlert
                        size={17}
                        color={theme.palette.text.disabled}
                      />
                      <Typography
                        variant="body1"
                        sx={{ mt: 0.2 }}
                        color="text.disabled"
                      >
                        Observações
                      </Typography>
                    </Box>
                    <Typography variant="body2">{appointment.notes}</Typography>
                  </Box>
                )}

                {appointment.status === "pending" && (
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
                        variant="outlined"
                        size="small"
                        startIcon={<X size={16} />}
                        onClick={() => handleAction(appointment, "cancel")}
                      >
                        Cancelar
                      </Button>
                      <Button
                        onClick={() => handleAction(appointment, "confirm")}
                        startIcon={<CalendarCheck size={16} />}
                        size="small"
                      >
                        Confirmar
                      </Button>
                    </Box>
                  </>
                )}

                {appointment.status === "confirmed" && (
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
                        startIcon={<Play size={16} />}
                        onClick={() => handleAction(appointment, "start")}
                      >
                        Iniciar
                      </Button>
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
                        startIcon={<CircleCheck size={16} />}
                        onClick={() => handleAction(appointment, "complete")}
                      >
                        Finalizar
                      </Button>
                    </Box>
                  </>
                )}
              </CustomCard>
            );
          }
        })}
      </Box>
    </>
  );
};

export default AppointmentsDailyList;
