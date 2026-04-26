import {
  Box,
  Chip,
  Dialog,
  DialogContent,
  DialogTitle,
  DialogActions,
  Divider,
  Typography,
  Autocomplete,
  TextField,
} from "@mui/material";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getEmployees } from "../../api/services/employees";
import { assignAppointmentEmployees } from "../../api/services/appointments";
import { useToast } from "../../hooks/useToast";
import {
  CalendarCheck,
  Check,
  Dot,
  Info,
  Mars,
  Package,
  Pencil,
  Play,
  ShoppingCart,
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
import { getCoatTypeLabel } from "../../utils/formatCoatType";
import type { CoatType } from "../pets/types";

type Props = {
  open: boolean;
  appointment: Appointment;
  onClose: () => void;
  handleAction: (appointment: Appointment, action: AppointmentAction) => void;
  loadingAction: AppointmentAction | null;
  onEdit: (appointment: Appointment) => void;
};
const AppointmentDetailsModal = ({
  open,
  appointment,
  onClose,
  handleAction,
  loadingAction,
  onEdit,
}: Props) => {
  const navigate = useNavigate();
  const toast = useToast();
  const queryClient = useQueryClient();
  const [cancelConfirmOpen, setCancelConfirmOpen] = useState(false);
  const totalCents = getAppointmentTotal(appointment);

  const { data: employees = [] } = useQuery({
    queryKey: ["employees"],
    queryFn: getEmployees,
    enabled: open,
  });

  const activeEmployees = employees.filter((e) => e.is_active);

  const [localAssignments, setLocalAssignments] = useState<
    Record<string, number | null>
  >({});

  useEffect(() => {
    if (open && appointment) {
      const initial: Record<string, number | null> = {};
      appointment.items.forEach(item => {
        item.services.forEach(svc => {
          const key = `${item.id}-${svc.id}`;
          initial[key] = svc.employee_id || null;
        });
      });
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setLocalAssignments(initial);
    }
  }, [open, appointment]);

  const assignMutation = useMutation({
    mutationFn: (assignments: any) => assignAppointmentEmployees(appointment.id, assignments),
    onSuccess: () => {
      toast.success("Profissionais salvos com sucesso!");
      queryClient.invalidateQueries({ queryKey: ["appointments"] });
      queryClient.invalidateQueries({ queryKey: ["sales"] });
    },
    onError: () => {
      toast.error("Erro ao salvar profissionais");
    }
  });

  const handleSaveEmployees = () => {
    const payload = Object.entries(localAssignments).map(([key, empId]) => {
      const [itemId, svcId] = key.split("-").map(Number);
      return {
        appointment_item_id: itemId,
        service_id: svcId,
        employee_id: empId,
      };
    });
    assignMutation.mutate(payload);
  };

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
        backdrop: {
          sx: { backgroundColor: "rgba(0, 0, 0, 0.6)" },
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
                        disabled={!!loadingAction}
                        onClick={() => setCancelConfirmOpen(true)}
                      >
                        Cancelar Agendamento
                      </Button>
                      <Box sx={{ display: "flex", gap: 1 }}>
                        <Button
                          variant="outlined"
                          onClick={() => onEdit(appointment)}
                          startIcon={<Pencil size={16} />}
                          disabled={!!loadingAction}
                          size="small"
                        >
                          Alterar
                        </Button>
                        <Button
                          onClick={() => handleAction(appointment, "confirm")}
                          startIcon={<CalendarCheck size={16} />}
                          loading={loadingAction === "confirm"}
                          disabled={!!loadingAction}
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
                        disabled={!!loadingAction}
                        onClick={() => setCancelConfirmOpen(true)}
                      >
                        Cancelar Agendamento
                      </Button>
                      <Box sx={{ display: "flex", gap: 1 }}>
                        <Button
                          variant="outlined"
                          onClick={() => onEdit(appointment)}
                          startIcon={<Pencil size={16} />}
                          disabled={!!loadingAction}
                          size="small"
                        >
                          Alterar
                        </Button>
                        <Button
                          size="small"
                          startIcon={<Play size={16} />}
                          loading={loadingAction === "start"}
                          disabled={!!loadingAction}
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
                        loading={loadingAction === "complete"}
                        disabled={!!loadingAction}
                        onClick={() => handleAction(appointment, "complete")}
                      >
                        Finalizar
                      </Button>
                    </Box>
                  </>
                )}
                {appointment.status === "completed" && (
                  <>
                    <Divider sx={{ my: 1 }} />
                    <Box
                      sx={{
                        display: "flex",
                        justifyContent: "flex-end",
                        gap: 1,
                      }}
                    >
                      {appointment.is_paid ? (
                        <Chip
                          label="PAGO"
                          color="success"
                          size="small"
                          variant="filled"
                          sx={{ fontWeight: 900, px: 1 }}
                        />
                      ) : appointment.is_fully_package_covered ? (
                        <Chip
                          label="PAGO VIA PACOTE"
                          color="success"
                          size="small"
                          variant="filled"
                          icon={<Package size={13} />}
                          sx={{ fontWeight: 900, px: 1 }}
                        />
                      ) : (
                        <Button
                          size="small"
                          color="primary"
                          variant="contained"
                          startIcon={<ShoppingCart size={16} />}
                          onClick={() => {
                            navigate("/pos", {
                              state: { pullAppointment: appointment },
                            });
                          }}
                        >
                          Cobrar no Caixa
                        </Button>
                      )}
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
                        Pelagem {getCoatTypeLabel(item.pet.coat_type as CoatType)}
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
                {item.pet.notes && (
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
                )}

                <Divider sx={{ my: 1 }} />
                <Typography variant="h6" fontWeight={500}>
                  Serviços do pet
                </Typography>
                <Box>
                  {item.services.map((s) => {
                    const key = `${item.id}-${s.id}`;
                    const currentEmpId = localAssignments[key];

                    return (
                    <Box
                      key={s.id}
                      sx={{
                        display: "flex",
                        flexDirection: "column",
                        py: 0.5,
                      }}
                    >
                      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                          <Dot color={theme.palette.text.disabled} size={16} />
                          <Typography variant="body2">{s.name}</Typography>
                          {s.is_package_covered && (
                            <Chip
                              label="pacote"
                              size="small"
                              color="success"
                              variant="outlined"
                              icon={<Package size={10} />}
                              sx={{ height: 18, fontSize: 10, px: 0.5 }}
                            />
                          )}
                        </Box>
                        <Typography
                          variant="body2"
                          sx={{
                            textDecoration: s.is_package_covered
                              ? "line-through"
                              : "none",
                            color: s.is_package_covered
                              ? "text.disabled"
                              : "text.primary",
                          }}
                        >
                          {(s.price_cents / 100).toLocaleString("pt-BR", {
                            style: "currency",
                            currency: "BRL",
                          })}
                        </Typography>
                      </Box>

                      {/* Employee Select */}
                      {appointment.status !== "pending" && appointment.status !== "canceled" && appointment.status !== "no_show" && (
                        <Box sx={{ display: "flex", alignItems: "center", pl: 2, pb: 1, pt: 1 }}>
                          <Typography variant="caption" sx={{ width: 100, color: "text.primary" }}>Profissional:</Typography>
                          <Autocomplete
                            size="small"
                            sx={{ flex: 1, ml: 1 }}
                            options={activeEmployees}
                            getOptionLabel={(option) => option.name}
                            isOptionEqualToValue={(option, value) => String(option.id) === String(value.id)}
                            value={activeEmployees.find(e => String(e.id) === String(currentEmpId)) || null}
                            onChange={(_, val) => {
                              setLocalAssignments(prev => ({
                                ...prev,
                                [key]: val ? val.id : null
                              }));
                            }}
                            renderInput={(params) => <TextField {...params} placeholder="Selecionar..." />}
                          />
                        </Box>
                      )}
                    </Box>
                  )})}
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

            {appointment.status !== "pending" && appointment.status !== "canceled" && appointment.status !== "no_show" && activeEmployees.length > 0 && (
              <Box sx={{ display: "flex", justifyContent: "flex-end", mt: 1 }}>
                <Button 
                   variant="outlined" 
                   size="small" 
                   onClick={handleSaveEmployees}
                   loading={assignMutation.isPending}
                >
                   Salvar Profissionais
                </Button>
              </Box>
            )}
          </Box>
        </Box>
      </DialogContent>

      <Dialog open={cancelConfirmOpen} onClose={() => setCancelConfirmOpen(false)}>
        <DialogTitle>Cancelar Agendamento</DialogTitle>
        <DialogContent>
          <Typography>Tem certeza que deseja cancelar este agendamento? Esta ação não pode ser desfeita.</Typography>
        </DialogContent>
        <DialogActions>
          <Button variant="text" onClick={() => setCancelConfirmOpen(false)} disabled={!!loadingAction}>
            Voltar
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={() => {
              handleAction(appointment, "cancel");
              setCancelConfirmOpen(false);
            }}
            loading={loadingAction === "cancel"}
            disabled={!!loadingAction}
          >
            Sim, cancelar
          </Button>
        </DialogActions>
      </Dialog>
    </Dialog>
  );
};

export default AppointmentDetailsModal;
