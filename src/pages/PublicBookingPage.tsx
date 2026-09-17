import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import LoadingScreen from "../components/Loading/LoadingScreen";
import {
  Box,
  Card,
  CardContent,
  Container,
  Typography,
  TextField,
  Button as MuiButton,
  Grid,
  Checkbox,
  Stack,
  Divider,
} from "@mui/material";
import {
  Calendar,
  Clock,
  User,
  Scissors,
  CheckCircle2,
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import apiClient from "../api/apiClient";
import dayjs from "dayjs";
import "dayjs/locale/pt-br";
import theme from "../theme";

dayjs.locale("pt-br");

interface ServiceItem {
  id: number;
  name: string;
  description: string | null;
  price_cents: number;
  duration_minutes: number | null;
}

interface BusySlot {
  scheduled_at: string;
  duration_minutes: number;
}

interface WorkingDay {
  is_open: boolean;
  open: string;
  close: string;
}

interface RescheduleAppointment {
  id: number;
  client_name: string;
  client_phone: string;
  pet_name: string;
  services: { id: number; name: string; price_cents: number; duration_minutes: number | null }[];
  notes: string | null;
}

interface BookingInfo {
  employee_id: number;
  employee_name: string;
  employee_role: string;
  petshop_name: string;
  working_hours: Record<string, WorkingDay>;
  services: ServiceItem[];
  busy_slots: BusySlot[];
  reschedule_appointment: RescheduleAppointment | null;
}



export default function PublicBookingPage() {
  const { token } = useParams<{ token: string }>();

  const [info, setInfo] = useState<BookingInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form State
  const [step, setStep] = useState(1);
  const [selectedServices, setSelectedServices] = useState<number[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [selectedTime, setSelectedTime] = useState<string>("");
  
  const [clientName, setClientName] = useState("");
  const [clientPhone, setClientPhone] = useState("");
  const [petName, setPetName] = useState("");
  const [notes, setNotes] = useState("");

  const [bookingResult, setBookingResult] = useState<{ id: number; message: string } | null>(null);

  const [searchParams] = useSearchParams();
  const appointmentId = searchParams.get("appointment_id");
  const sig = searchParams.get("sig");

  useEffect(() => {
    if (!token) return;
    setLoading(true);
    
    const url = appointmentId && sig
      ? `/api/v1/public/employees/booking-info/${token}?appointment_id=${appointmentId}&sig=${sig}`
      : `/api/v1/public/employees/booking-info/${token}`;

    apiClient
      .get<BookingInfo>(url)
      .then((res) => {
        setInfo(res.data);
        setError(null);
        
        // If rescheduling, pre-fill values and skip to step 2
        if (res.data.reschedule_appointment) {
          const ra = res.data.reschedule_appointment;
          setSelectedServices(ra.services.map(s => s.id));
          setClientName(ra.client_name);
          setClientPhone(ra.client_phone);
          setPetName(ra.pet_name);
          setNotes(ra.notes || "");
          setStep(2);
        }
      })
      .catch((err) => {
        console.error(err);
        setError(
          err?.response?.data?.detail ||
            "Não foi possível carregar as informações do agendamento. O link pode ter expirado."
        );
      })
      .finally(() => setLoading(false));
  }, [token, appointmentId, sig]);

  // Generate dates list (next 14 days starting today)
  const availableDates = Array.from({ length: 14 }).map((_, i) => {
    const d = dayjs().add(i, "day");
    return {
      value: d.format("YYYY-MM-DD"),
      label: d.format("ddd, DD [de] MMM"),
      weekday: String(d.day()),
    };
  });

  // Calculate slots for the selected date
  const generateTimeSlots = () => {
    if (!selectedDate || !info) return [];

    const dateObj = dayjs(selectedDate);
    const weekday = String(dateObj.day());
    const dayConfig = info.working_hours[weekday];

    if (!dayConfig || !dayConfig.is_open) return [];

    const slots: string[] = [];
    const openTime = dayConfig.open.split(":");
    const closeTime = dayConfig.close.split(":");

    let current = dayjs(selectedDate)
      .hour(parseInt(openTime[0]))
      .minute(parseInt(openTime[1]))
      .second(0);

    const end = dayjs(selectedDate)
      .hour(parseInt(closeTime[0]))
      .minute(parseInt(closeTime[1]))
      .second(0);

    // Calculamos duração total dos serviços selecionados
    const totalDuration = info.services
      .filter((s) => selectedServices.includes(s.id))
      .reduce((sum, s) => sum + (s.duration_minutes || 30), 0) || 30;

    const now = dayjs();

    while (current.isBefore(end)) {
      const timeStr = current.format("HH:mm");
      const slotStart = current;
      const slotEnd = current.add(totalDuration, "minute");

      // 1. Verificar se o horário já passou (se for hoje)
      const isPast = slotStart.isBefore(now);

      // 2. Verificar overlap com horários ocupados (busy_slots)
      const isOverlapping = info.busy_slots.some((busy) => {
        const busyStart = dayjs(busy.scheduled_at);
        const busyEnd = busyStart.add(busy.duration_minutes, "minute");
        return slotStart.isBefore(busyEnd) && slotEnd.isAfter(busyStart);
      });

      if (!isPast && !isOverlapping && slotEnd.isBefore(end.add(1, "minute"))) {
        slots.push(timeStr);
      }

      // Intervalo de 30 minutos entre horários de agendamento sugeridos
      current = current.add(30, "minute");
    }

    return slots;
  };

  const timeSlots = generateTimeSlots();

  const handleServiceToggle = (serviceId: number) => {
    setSelectedServices((prev) =>
      prev.includes(serviceId)
        ? prev.filter((id) => id !== serviceId)
        : [...prev, serviceId]
    );
    setSelectedTime(""); // Reset time if service duration changes
  };

  const handleDateChange = (date: string) => {
    setSelectedDate(date);
    setSelectedTime("");
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!token || !clientName.trim() || !clientPhone.trim() || !petName.trim() || selectedServices.length === 0 || !selectedDate || !selectedTime) {
      return;
    }

    setSubmitting(true);
    const scheduledAt = dayjs(`${selectedDate}T${selectedTime}`).toISOString();

    const payload = {
      client_name: clientName.trim(),
      client_phone: clientPhone.trim(),
      pet_name: petName.trim(),
      service_ids: selectedServices,
      scheduled_at: scheduledAt,
      notes: notes.trim() || null,
    };

    try {
      const url = appointmentId && sig
        ? `/api/v1/public/employees/book/${token}?appointment_id=${appointmentId}&sig=${sig}`
        : `/api/v1/public/employees/book/${token}`;

      const response = await apiClient.post<{ success: boolean; appointment_id: number; message: string }>(
        url,
        payload
      );
      setBookingResult({
        id: response.data.appointment_id,
        message: response.data.message,
      });
      setStep(4);
    } catch (err: any) {
      console.error(err);
      alert(err?.response?.data?.detail || "Erro ao realizar o agendamento. Tente novamente.");
    } finally {
      setSubmitting(false);
    }
  };

  const getSelectedServicesTotal = () => {
    if (!info) return { price: 0, duration: 0 };
    return info.services
      .filter((s) => selectedServices.includes(s.id))
      .reduce(
        (acc, s) => {
          acc.price += s.price_cents / 100;
          acc.duration += s.duration_minutes || 30;
          return acc;
        },
        { price: 0, duration: 0 }
      );
  };

  const totals = getSelectedServicesTotal();


  if (loading) {
    return <LoadingScreen message="Carregando portal de agendamento..." />;
  }

  if (error) {
    return (
      <Box
        sx={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)",
          p: 3,
        }}
      >
        <Card
          sx={{
            maxWidth: 400,
            width: "100%",
            borderRadius: 3,
            boxShadow: "0 8px 30px rgba(0,0,0,0.12)",
            textAlign: "center",
            p: 3,
          }}
        >
          <AlertCircle size={48} color={theme.palette.error.main} style={{ margin: "0 auto 16px" }} />
          <Typography variant="h6" fontWeight={600} gutterBottom>
            Link Inválido ou Expirado
          </Typography>
          <Typography variant="body2" color="text.primary" sx={{ mb: 3 }}>
            {error}
          </Typography>
          <Typography variant="caption" color="text.disabled">
            Caso precise reagendar, entre em contato diretamente com o pet shop no WhatsApp.
          </Typography>
        </Card>
      </Box>
    );
  }

  return (
    <>
      {/* Fixed Background Layer */}
      <Box
        sx={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: "linear-gradient(135deg, #0f2027 0%, #203a43 50%, #2c5364 100%)",
          zIndex: -1,
          pointerEvents: "none",
        }}
      />
      
      {/* Scrollable Content Container */}
      <Box
        sx={{
          minHeight: "100vh",
          py: { xs: 4, sm: 6 },
          display: "flex",
          alignItems: "center",
          width: "100%",
        }}
      >
      <Container maxWidth="sm">
        <Card
          sx={{
            borderRadius: 5,
            boxShadow: "0 15px 40px rgba(0,0,0,0.35)",
            overflow: "hidden",
            bgcolor: "rgba(255, 255, 255, 0.96)",
            backdropFilter: "blur(10px)",
          }}
        >
          {/* TOP CARD BANNER */}
          <Box
            sx={{
              bgcolor: "#0288d1",
              color: "white",
              p: 3,
              textAlign: "center",
              position: "relative",
            }}
          >
            <Sparkles
              size={20}
              style={{ position: "absolute", right: 20, top: 20, opacity: 0.6 }}
            />
            <Typography variant="caption" sx={{ fontWeight: 700, textTransform: "uppercase", tracking: "1px", opacity: 0.9 }}>
              {info?.petshop_name}
            </Typography>
            <Typography variant="h5" fontWeight={850} sx={{ mt: 0.5, letterSpacing: "-0.5px" }}>
              {info?.reschedule_appointment ? "Reagendamento de Horário" : "Agendamento Online"}
            </Typography>
             <Typography variant="body2" sx={{ opacity: 0.85, mt: 0.5 }}>
              Escolha o melhor dia e horário para seu atendimento
            </Typography>
          </Box>

          {/* STEP INDICATOR */}
          {step < 4 && !info?.reschedule_appointment && (
            <Box sx={{ display: "flex", bgcolor: "#f1f3f5", borderBottom: "1px solid #e0e0e0" }}>
              {[1, 2, 3].map((s) => (
                <Box
                  key={s}
                  sx={{
                    flex: 1,
                    py: 1.5,
                    textAlign: "center",
                    borderBottom: step === s ? "3px solid #0288d1" : "none",
                    opacity: step === s ? 1 : 0.45,
                    transition: "all 0.2s",
                  }}
                >
                  <Typography variant="caption" fontWeight={700}>
                    {s === 1 && "1. Serviços"}
                    {s === 2 && "2. Data & Hora"}
                    {s === 3 && "3. Seus Dados"}
                  </Typography>
                </Box>
              ))}
            </Box>
          )}

          <CardContent sx={{ p: { xs: 3, sm: 4 } }}>
            {/* RESCHEDULE WARNING & INFO BOX */}
            {info?.reschedule_appointment && step < 4 && (
              <Box sx={{ bgcolor: "#f1f5f9", borderRadius: 3, p: 2, border: "1px solid #e2e8f0", mb: 3 }}>
                <Typography variant="caption" color="text.primary" sx={{ textTransform: "uppercase", fontWeight: 700, display: "block", mb: 1, color: "#0288d1" }}>
                  Dados do Agendamento Atual:
                </Typography>
                <Typography variant="body2" color="text.primary" sx={{ mb: 0.5 }}>
                  🐾 <strong>Pet:</strong> {petName}
                </Typography>
                <Typography variant="body2" color="text.primary" sx={{ mb: 0.5 }}>
                  👤 <strong>Tutor:</strong> {clientName}
                </Typography>
                <Typography variant="body2" color="text.primary" sx={{ mb: 1 }}>
                  ✂️ <strong>Serviços:</strong> {info.reschedule_appointment.services.map((s) => s.name).join(", ")}
                </Typography>
                <Divider sx={{ my: 1, borderStyle: "dashed" }} />
                <Typography variant="caption" color="text.primary" sx={{ display: "block", lineHeight: 1.4, fontWeight: 500, fontStyle: "italic" }}>
                  * Para alterar serviços ou dados cadastrais, entre em contato diretamente com o pet shop.
                </Typography>
              </Box>
            )}
            {/* STEP 1: SERVICES SELECTION */}
            {step === 1 && (
              <Box>
                <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 2, display: "flex", alignItems: "center", gap: 1 }}>
                  <Scissors size={18} color="#0288d1" />
                  Selecione os serviços que deseja realizar:
                </Typography>

                <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5, mb: 4 }}>
                  {info?.services.map((service) => {
                    const checked = selectedServices.includes(service.id);
                    return (
                      <Card
                        key={service.id}
                        variant="outlined"
                        onClick={() => handleServiceToggle(service.id)}
                        sx={{
                          cursor: "pointer",
                          borderRadius: 3,
                          borderColor: checked ? "#0288d1" : "#e0e0e0",
                          bgcolor: checked ? "rgba(2, 136, 209, 0.04)" : "white",
                          transition: "all 0.2s",
                          "&:hover": { borderColor: "#0288d1" },
                        }}
                      >
                        <CardContent sx={{ p: 2, display: "flex", alignItems: "center", justifyContent: "space-between", "&:last-child": { pb: 2 } }}>
                          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                            <Checkbox checked={checked} color="primary" sx={{ p: 0 }} />
                            <Box>
                              <Typography variant="body2" fontWeight={700} color="text.primary">
                                {service.name}
                              </Typography>
                              {service.description && (
                                <Typography variant="caption" color="text.secondary" display="block">
                                  {service.description}
                                </Typography>
                              )}
                              <Typography variant="caption" color="text.secondary">
                                Duração: {service.duration_minutes || 30} min
                              </Typography>
                            </Box>
                          </Box>
                          <Typography variant="body2" fontWeight={800} color="primary">
                            R$ {(service.price_cents / 100).toFixed(2).replace(".", ",")}
                          </Typography>
                        </CardContent>
                      </Card>
                    );
                  })}
                </Box>

                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <Box>
                    {selectedServices.length > 0 && (
                      <Typography variant="caption" color="text.secondary">
                        Total: <strong>R$ {totals.price.toFixed(2).replace(".", ",")}</strong> ({totals.duration} min)
                      </Typography>
                    )}
                  </Box>
                  <MuiButton
                    variant="contained"
                    disabled={selectedServices.length === 0}
                    onClick={() => setStep(2)}
                    endIcon={<ArrowRight size={16} />}
                    sx={{
                      borderRadius: 2,
                      textTransform: "none",
                      px: 3,
                      bgcolor: "#0288d1",
                      "&:hover": { bgcolor: "#01579b" },
                    }}
                  >
                    Próximo Passo
                  </MuiButton>
                </Box>
              </Box>
            )}

            {/* STEP 2: DATE & TIME */}
            {step === 2 && (
              <Box>
                <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 2, display: "flex", alignItems: "center", gap: 1 }}>
                  <Calendar size={18} color="#0288d1" />
                  Escolha um dia para o atendimento:
                </Typography>

                {/* DATES GRID */}
                <Grid container spacing={1} sx={{ mb: 4 }}>
                  {availableDates.map((date) => {
                    const weekdayConfig = info?.working_hours[date.weekday];
                    const isOpen = weekdayConfig?.is_open ?? false;
                    const selected = selectedDate === date.value;

                    return (
                      <Grid size={{ xs: 4, sm: 3 }} key={date.value}>
                        <MuiButton
                          variant={selected ? "contained" : "outlined"}
                          disabled={!isOpen}
                          fullWidth
                          onClick={() => handleDateChange(date.value)}
                          sx={{
                            height: 64,
                            borderRadius: 2,
                            textTransform: "none",
                            display: "flex",
                            flexDirection: "column",
                            justifyContent: "center",
                            p: 1,
                            borderColor: isOpen ? (selected ? "#0288d1" : "#cbd5e1") : "#f1f5f9",
                            color: isOpen ? (selected ? "white" : "text.primary") : "text.disabled",
                            bgcolor: selected ? "#0288d1" : "transparent",
                            "&:hover": {
                              bgcolor: selected ? "#01579b" : "rgba(2,136,209,0.04)",
                              borderColor: "#0288d1",
                            },
                          }}
                        >
                          <Typography variant="caption" sx={{ fontSize: "0.65rem", fontWeight: 700, textTransform: "uppercase" }}>
                            {date.label.split(",")[0]}
                          </Typography>
                          <Typography variant="body1" fontWeight={800} sx={{ my: -0.25 }}>
                            {date.value.split("-")[2]}
                          </Typography>
                          <Typography variant="caption" sx={{ fontSize: "0.6rem" }}>
                            {date.label.split(" de ")[1]}
                          </Typography>
                        </MuiButton>
                      </Grid>
                    );
                  })}
                </Grid>

                {selectedDate && (
                  <Box sx={{ mb: 4 }}>
                    <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 2, display: "flex", alignItems: "center", gap: 1 }}>
                      <Clock size={18} color="#0288d1" />
                      Selecione um horário disponível:
                    </Typography>

                    {timeSlots.length === 0 ? (
                      <Box sx={{ bgcolor: "#fff8e1", border: "1px dashed #ffe082", borderRadius: 3, p: 2, textAlign: "center" }}>
                        <Typography variant="body2" color="#b78103" fontWeight={600}>
                          Não há horários disponíveis para este dia. Por favor, selecione outra data.
                        </Typography>
                      </Box>
                    ) : (
                      <Grid container spacing={1}>
                        {timeSlots.map((slot) => {
                          const selected = selectedTime === slot;
                          return (
                            <Grid size={{ xs: 3 }} key={slot}>
                              <MuiButton
                                variant={selected ? "contained" : "outlined"}
                                fullWidth
                                onClick={() => setSelectedTime(slot)}
                                sx={{
                                  borderRadius: 2,
                                  fontWeight: 700,
                                  borderColor: selected ? "#0288d1" : "#cbd5e1",
                                  bgcolor: selected ? "#0288d1" : "transparent",
                                  color: selected ? "white" : "#0288d1",
                                  "&:hover": {
                                    bgcolor: selected ? "#01579b" : "rgba(2,136,209,0.04)",
                                    borderColor: "#0288d1",
                                  },
                                }}
                              >
                                {slot}
                              </MuiButton>
                            </Grid>
                          );
                        })}
                      </Grid>
                    )}
                  </Box>
                )}

                <Box sx={{ display: "flex", justifyContent: "space-between", mt: 3 }}>
                  {info?.reschedule_appointment ? (
                    <>
                      <Box />
                      <MuiButton
                        variant="contained"
                        disabled={!selectedDate || !selectedTime || submitting}
                        onClick={() => handleSubmit()}
                        sx={{
                          borderRadius: 2,
                          textTransform: "none",
                          px: 4,
                          bgcolor: "#2e7d32",
                          "&:hover": { bgcolor: "#1b5e20" },
                        }}
                      >
                        {submitting ? "Confirmando..." : "Confirmar Reagendamento 👍"}
                      </MuiButton>
                    </>
                  ) : (
                    <>
                      <MuiButton
                        variant="text"
                        onClick={() => setStep(1)}
                        startIcon={<ArrowLeft size={16} />}
                        sx={{ textTransform: "none", color: "text.secondary" }}
                      >
                        Voltar
                      </MuiButton>
                      <MuiButton
                        variant="contained"
                        disabled={!selectedDate || !selectedTime}
                        onClick={() => setStep(3)}
                        endIcon={<ArrowRight size={16} />}
                        sx={{
                          borderRadius: 2,
                          textTransform: "none",
                          px: 3,
                          bgcolor: "#0288d1",
                          "&:hover": { bgcolor: "#01579b" },
                        }}
                      >
                        Próximo Passo
                      </MuiButton>
                    </>
                  )}
                </Box>
              </Box>
            )}

            {/* STEP 3: CUSTOMER DATA */}
            {step === 3 && (
              <Box component="form" onSubmit={handleSubmit}>
                <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 2, display: "flex", alignItems: "center", gap: 1 }}>
                  <User size={18} color="#0288d1" />
                  Preencha seus dados para confirmar:
                </Typography>

                <Stack spacing={2} sx={{ mb: 4 }}>
                  <TextField
                    label="Seu Nome Completo"
                    required
                    fullWidth
                    size="small"
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                  />
                  <TextField
                    label="Seu WhatsApp"
                    required
                    fullWidth
                    size="small"
                    placeholder="Ex: 11999999999"
                    value={clientPhone}
                    onChange={(e) => setClientPhone(e.target.value)}
                    helperText="Número com DDD (apenas números)"
                  />
                  <TextField
                    label="Nome do Pet"
                    required
                    fullWidth
                    size="small"
                    placeholder="Ex: Rex, Mel, Mia"
                    value={petName}
                    onChange={(e) => setPetName(e.target.value)}
                  />
                  <TextField
                    label="Observações / Detalhes (Opcional)"
                    fullWidth
                    multiline
                    rows={2}
                    size="small"
                    placeholder="Ex: alergias, comportamento do pet, etc."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                  />
                </Stack>

                {/* BOOKING SUMMARY BOX */}
                <Box sx={{ bgcolor: "#f8f9fa", borderRadius: 3, p: 2, border: "1px solid #e9ecef", mb: 3 }}>
                  <Typography variant="caption" color="text.secondary" sx={{ textTransform: "uppercase", fontWeight: 700, display: "block", mb: 1 }}>
                    Resumo do Agendamento:
                  </Typography>
                  <Typography variant="body2" color="text.primary" sx={{ mb: 0.5 }}>
                    📅 Data: <strong>{dayjs(selectedDate).format("DD/MM/YYYY")}</strong> às <strong>{selectedTime}</strong>
                  </Typography>
                  <Typography variant="body2" color="text.primary" sx={{ mb: 0.5 }}>
                    💇 Serviços: <strong>{info?.services.filter((s) => selectedServices.includes(s.id)).map((s) => s.name).join(", ")}</strong>
                  </Typography>
                  <Typography variant="body2" color="text.primary">
                    💰 Total: <strong>R$ {totals.price.toFixed(2).replace(".", ",")}</strong> ({totals.duration} min)
                  </Typography>
                </Box>

                <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                  <MuiButton
                    variant="text"
                    disabled={submitting}
                    onClick={() => setStep(2)}
                    startIcon={<ArrowLeft size={16} />}
                    sx={{ textTransform: "none", color: "text.secondary" }}
                  >
                    Voltar
                  </MuiButton>
                  <MuiButton
                    type="submit"
                    variant="contained"
                    disabled={submitting || !clientName.trim() || !clientPhone.trim() || !petName.trim()}
                    sx={{
                      borderRadius: 2,
                      textTransform: "none",
                      px: 4,
                      bgcolor: "#2e7d32",
                      "&:hover": { bgcolor: "#1b5e20" },
                    }}
                  >
                    {submitting ? "Confirmando..." : "Confirmar Agendamento 👍"}
                  </MuiButton>
                </Box>
              </Box>
            )}

            {/* STEP 4: SUCCESS SCREEN */}
            {step === 4 && bookingResult && (
              <Box sx={{ textAlign: "center", py: 2 }}>
                <CheckCircle2 size={56} color="#2e7d32" style={{ margin: "0 auto 16px" }} />
                 <Typography variant="h5" fontWeight={850} color="success.main" gutterBottom>
                  {info?.reschedule_appointment ? "Reagendamento Confirmado!" : "Agendamento Confirmado!"}
                </Typography>
                <Typography variant="body2" color="text.primary" sx={{ mb: 4, px: 2 }}>
                  {info?.reschedule_appointment
                    ? `Seu horário foi reagendado com sucesso no ${info?.petshop_name}.`
                    : `Seu horário foi reservado com sucesso no ${info?.petshop_name}.`}
                </Typography>

                <Box sx={{ bgcolor: "#f4fcf4", border: "1px solid #c8e6c9", borderRadius: 4, p: 3, mb: 2, textAlign: "left" }}>
                  <Typography variant="subtitle2" fontWeight={800} color="#2e7d32" sx={{ mb: 1.5, textTransform: "uppercase", fontSize: "0.75rem", tracking: "0.5px" }}>
                    Detalhes do Agendamento:
                  </Typography>
                  <Typography variant="body2" sx={{ mb: 0.5 }}>
                    <strong>Tutor:</strong> {clientName}
                  </Typography>
                  <Typography variant="body2" sx={{ mb: 0.5 }}>
                    <strong>Pet:</strong> {petName}
                  </Typography>
                  <Typography variant="body2" sx={{ mb: 0.5 }}>
                    <strong>Serviços:</strong> {info?.services.filter((s) => selectedServices.includes(s.id)).map((s) => s.name).join(", ")}
                  </Typography>
                  <Typography variant="body2" sx={{ mb: 0.5 }}>
                    <strong>Data:</strong> {dayjs(selectedDate).format("DD/MM/YYYY")} às {selectedTime}
                  </Typography>
                  <Typography variant="body2">
                    <strong>Total:</strong> R$ {totals.price.toFixed(2).replace(".", ",")}
                  </Typography>
                </Box>
              </Box>
            )}
          </CardContent>
        </Card>
      </Container>
    </Box>
  </>
  );
}
