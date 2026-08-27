import {
  Box,
  Paper,
  Typography,
  Chip,
  IconButton,
  Collapse,
  alpha,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import { Calendar, User, X, ChevronDown, ChevronUp, Check } from "lucide-react";
import { useState } from "react";
import dayjs from "dayjs";
import { Button } from "../../../components/Button/Button";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@mui/material";
import type { Appointment } from "../../appointments/types";
import type { ClientPackage } from "../../client_packages/types";
import type { Pet } from "../../pets/types";

interface ClientInfo {
  id: number;
  name: string;
}

interface POSClientDashboardProps {
  client: ClientInfo;
  clientPets: Pet[];
  clientAppointments: Appointment[];
  clientActivePackages: ClientPackage[];
  selectedAppointmentId: number | null;
  getAppointmentPrice: (apt: Appointment) => number;
  onPullAppointment: (apt: Appointment) => void;
  onClearClient: () => void;
  hideHeader?: boolean;
}

export default function POSClientDashboard({
  client,
  clientPets,
  clientAppointments,
  clientActivePackages,
  selectedAppointmentId,
  getAppointmentPrice,
  onPullAppointment,
  onClearClient,
  hideHeader = false,
}: POSClientDashboardProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const [packagesOpen, setPackagesOpen] = useState(false);
  const [upcomingOpen, setUpcomingOpen] = useState(false);
  const [showAllPending, setShowAllPending] = useState(false);

  // 1. Pending to Pay
  const pendingToPay = clientAppointments
    .filter(
      (a) =>
        a.status === "completed" &&
        !a.is_paid &&
        !a.is_fully_package_covered
    )
    .sort((a, b) => dayjs(a.scheduled_at).valueOf() - dayjs(b.scheduled_at).valueOf());

  // 2. Active Packages with balance
  const packagesWithBalance = clientActivePackages
    .filter((pkg) => pkg.is_active)
    .map((pkg) => ({
      ...pkg,
      remaining: pkg.credits?.reduce((acc, credit) => acc + credit.remaining_qty, 0) || 0,
    }))
    .filter((pkg) => pkg.remaining > 0);

  // 3. Upcoming Appointments
  const allUpcoming = clientAppointments
    .filter(
      (a) =>
        a.id !== selectedAppointmentId &&
        ["pending", "confirmed"].includes(a.status) &&
        dayjs(a.scheduled_at).isAfter(dayjs().subtract(1, "day"))
    )
    .sort((a, b) => dayjs(a.scheduled_at).valueOf() - dayjs(b.scheduled_at).valueOf());

  const upcomingCount = allUpcoming.length;
  const upcoming = allUpcoming.slice(0, 3);
  const remainingUpcoming = upcomingCount > 3 ? upcomingCount - 3 : 0;

  const defaultLimit = isMobile ? 2 : 4;
  const displayedPendingToPay = showAllPending ? pendingToPay : pendingToPay.slice(0, defaultLimit);
  const hiddenPendingCount = pendingToPay.length - displayedPendingToPay.length;

  return (
    <Box sx={{ p: { xs: 0.5, sm: 1.5, md: 2 } }}>
      {/* Client Header — hidden when POSSessionHeader is already showing above */}
      {!hideHeader && (
        <Box
          sx={{
            display: "flex",
            flexDirection: "row",
            alignItems: "center",
            gap: 2,
            p: 2,
            border: "1px solid",
            borderRadius: 3,
            borderColor: "divider",
            bgcolor: (theme) => alpha(theme.palette.primary.main, 0.02),
            mb: 2,
          }}
        >
          <Box
            sx={{
              width: 40,
              height: 40,
              borderRadius: "50%",
              bgcolor: (theme) => alpha(theme.palette.primary.main, 0.1),
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "primary.main",
              flexShrink: 0,
            }}
          >
            <User size={20} />
          </Box>

          <Box sx={{ display: "flex", flexDirection: "row", alignItems: "center", gap: 1.5, flexGrow: 1, flexWrap: "wrap", minWidth: 0 }}>
            <Typography variant="h6" sx={{ fontWeight: 800, color: "primary.main", fontSize: { xs: "0.95rem", sm: "1.15rem" } }} noWrap>
              {client.name}
            </Typography>
            {clientPets && clientPets.length > 0 && (
              <Box sx={{ display: "flex", gap: 0.5, flexWrap: "wrap", alignItems: "center" }}>
                {clientPets.map((pet) => (
                  <Chip
                    key={pet.id}
                    label={pet.name}
                    size="small"
                    sx={{
                      bgcolor: (theme) => alpha(theme.palette.primary.main, 0.08),
                      color: "primary.main",
                      fontWeight: 700,
                      height: 20,
                      fontSize: "0.65rem",
                    }}
                  />
                ))}
              </Box>
            )}
          </Box>

          <IconButton
            onClick={onClearClient}
            sx={{
              color: "text.primary",
              opacity: 0.4,
              transition: "all 0.2s",
              "&:hover": { color: "error.main", opacity: 1, bgcolor: (theme) => alpha(theme.palette.error.main, 0.1) },
            }}
          >
            <X size={20} />
          </IconButton>
        </Box>
      )}

      {/* Info sections */}
      <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>

        {/* 1. Pending to Pay — always expanded, high priority */}
        {pendingToPay.length > 0 && (
          <Box>
            <Typography
              variant="overline"
              sx={{ fontWeight: 800, color: "text.primary", mb: 1, display: "block", letterSpacing: 1.2, fontSize: "0.65rem" }}
            >
              Comandas em Aberto
            </Typography>
            <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
              {displayedPendingToPay.map((apt) => {
                const isSelected = selectedAppointmentId === apt.id;
                return (
                  <Paper
                    key={apt.id}
                    elevation={0}
                    sx={{
                      display: "flex",
                      flexDirection: { xs: "column", sm: "row" },
                      justifyContent: "space-between",
                      alignItems: { xs: "stretch", sm: "center" },
                      p: 1.5,
                      gap: 1.25,
                      border: "1px solid",
                      borderColor: isSelected ? "success.main" : (theme) => alpha(theme.palette.primary.main, 0.35),
                      borderRadius: 2.5,
                      bgcolor: isSelected ? (theme) => alpha(theme.palette.success.main, 0.05) : (theme) => alpha(theme.palette.primary.main, 0.04),
                      transition: "all 0.3s ease",
                    }}
                  >
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, flex: 1, minWidth: 0 }}>
                      <Box
                        sx={{
                          width: 34,
                          height: 34,
                          borderRadius: 1.5,
                          bgcolor: isSelected ? (theme) => alpha(theme.palette.success.main, 0.1) : (theme) => alpha(theme.palette.primary.main, 0.1),
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          color: isSelected ? "success.main" : "primary.main",
                          flexShrink: 0,
                        }}
                      >
                        <Calendar size={16} />
                      </Box>
                      <Box sx={{ minWidth: 0, flex: 1 }}>
                        <Typography variant="body2" sx={{ fontWeight: 800, color: "text.primary", lineHeight: 1.2, mb: 0.25 }}>
                          {dayjs(apt.scheduled_at).format("DD/MM")} · {dayjs(apt.scheduled_at).format("HH:mm")}
                        </Typography>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 0.75, flexWrap: "wrap" }}>
                          <Typography variant="caption" sx={{ fontWeight: 800, color: isSelected ? "success.dark" : "primary.main", fontSize: "0.72rem" }}>
                            {apt.items.map((i) => i.pet.name).join(", ")}
                          </Typography>
                          <Box component="span" sx={{ width: 3, height: 3, borderRadius: "50%", bgcolor: "text.primary", opacity: 0.3, flexShrink: 0 }} />
                          <Typography variant="caption" sx={{ color: "text.primary", opacity: 0.75, fontSize: "0.68rem" }} noWrap>
                            {[...new Set(apt.items.flatMap((i) => i.services.map((s) => s.name)))].join(", ")}
                          </Typography>
                        </Box>
                      </Box>
                    </Box>

                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: { xs: "space-between", sm: "flex-end" },
                        gap: 1.5,
                        flexShrink: 0,
                        pt: { xs: 0.75, sm: 0 },
                        borderTop: { xs: "1px solid", sm: "none" },
                        borderColor: (theme) => alpha(theme.palette.divider, 0.5),
                      }}
                    >
                      <Typography variant="body2" sx={{ fontWeight: 800, color: isSelected ? "success.main" : "primary.main", fontSize: "0.9rem" }}>
                        R$ {(getAppointmentPrice(apt) / 100).toFixed(2)}
                      </Typography>
                      {isSelected ? (
                        <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, color: "success.main", px: 1 }}>
                          <Check size={16} />
                          <Typography variant="caption" sx={{ fontWeight: 800 }}>Adicionado</Typography>
                        </Box>
                      ) : (
                        <Button
                          variant="contained"
                          size="small"
                          onClick={() => onPullAppointment(apt)}
                          sx={{
                            bgcolor: "primary.main",
                            color: "white",
                            fontWeight: 700,
                            borderRadius: 1.5,
                            px: 1.5,
                            py: 0.5,
                            boxShadow: "none",
                            minWidth: 0,
                            fontSize: "0.75rem",
                            whiteSpace: "nowrap",
                            "&:hover": { bgcolor: "primary.dark", boxShadow: "none" },
                          }}
                        >
                          Adicionar ao carrinho
                        </Button>
                      )}
                    </Box>
                  </Paper>
                );
              })}
              {hiddenPendingCount > 0 && (
                <Button
                  variant="text"
                  size="small"
                  onClick={() => setShowAllPending(true)}
                  sx={{ color: "primary.main", fontWeight: 800, fontSize: "0.7rem", py: 0.5, mt: 0.5 }}
                >
                  Ver todas as {pendingToPay.length} comandas pendentes
                </Button>
              )}
            </Box>
          </Box>
        )}

        {/* Pending Commands Modal */}
        <Dialog open={showAllPending} onClose={() => setShowAllPending(false)} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3, m: { xs: 1, sm: 2 }, width: { xs: "96vw", sm: "auto" } } }}>
          <DialogTitle sx={{ fontWeight: 800, pb: 1, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            Comandas Pendentes ({pendingToPay.length})
            <IconButton onClick={() => setShowAllPending(false)} size="small">
              <X size={20} />
            </IconButton>
          </DialogTitle>
          <DialogContent sx={{ pt: 1, pb: 3, display: "flex", flexDirection: "column", gap: 1, maxHeight: "60vh" }}>
            {pendingToPay.map((apt) => {
              const isSelected = selectedAppointmentId === apt.id;
              return (
                <Paper
                  key={apt.id}
                  elevation={0}
                  sx={{
                    display: "flex",
                    flexDirection: { xs: "column", sm: "row" },
                    justifyContent: "space-between",
                    alignItems: { xs: "stretch", sm: "center" },
                    p: 1.5,
                    gap: 1.25,
                    border: "1px solid",
                    borderColor: isSelected ? "success.main" : (theme) => alpha(theme.palette.primary.main, 0.35),
                    borderRadius: 2.5,
                    bgcolor: isSelected ? (theme) => alpha(theme.palette.success.main, 0.05) : (theme) => alpha(theme.palette.primary.main, 0.04),
                    transition: "all 0.3s ease",
                  }}
                >
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, flex: 1, minWidth: 0 }}>
                    <Box
                      sx={{
                        width: 32,
                        height: 32,
                        borderRadius: 1.5,
                        bgcolor: isSelected ? (theme) => alpha(theme.palette.success.main, 0.1) : (theme) => alpha(theme.palette.primary.main, 0.1),
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: isSelected ? "success.main" : "primary.main",
                        flexShrink: 0,
                      }}
                    >
                      <Calendar size={16} />
                    </Box>
                    <Box sx={{ minWidth: 0, flex: 1 }}>
                      <Typography variant="body2" sx={{ fontWeight: 800, color: "text.primary", lineHeight: 1.2, mb: 0.25 }}>
                        {dayjs(apt.scheduled_at).format("DD/MM")} · {dayjs(apt.scheduled_at).format("HH:mm")}
                      </Typography>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 0.75, flexWrap: "wrap" }}>
                        <Typography variant="caption" sx={{ fontWeight: 800, color: isSelected ? "success.dark" : "primary.main", fontSize: "0.7rem" }}>
                          {apt.items.map((i) => i.pet.name).join(", ")}
                        </Typography>
                        <Box component="span" sx={{ width: 3, height: 3, borderRadius: "50%", bgcolor: "text.primary", opacity: 0.3, flexShrink: 0 }} />
                        <Typography variant="caption" sx={{ color: "text.primary", opacity: 0.6, fontSize: "0.65rem" }} noWrap>
                          {[...new Set(apt.items.flatMap((i) => i.services.map((s) => s.name)))].join(", ")}
                        </Typography>
                      </Box>
                    </Box>
                  </Box>
                  <Box sx={{ display: "flex", alignItems: "center", justifyContent: { xs: "space-between", sm: "flex-end" }, gap: 1.5, flexShrink: 0 }}>
                    <Typography variant="body2" sx={{ fontWeight: 800, color: isSelected ? "success.main" : "primary.main" }}>
                      R$ {(getAppointmentPrice(apt) / 100).toFixed(2)}
                    </Typography>
                    {isSelected ? (
                      <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, color: "success.main", px: 1 }}>
                        <Check size={18} />
                        <Typography variant="caption" sx={{ fontWeight: 800 }}>Adicionado</Typography>
                      </Box>
                    ) : (
                      <Button
                        variant="contained"
                        size="small"
                        onClick={() => {
                          onPullAppointment(apt);
                          setShowAllPending(false);
                        }}
                        sx={{ bgcolor: "primary.main", color: "white", fontWeight: 700, borderRadius: 1.5, px: 1.5, boxShadow: "none", minWidth: 0, fontSize: "0.75rem", "&:hover": { bgcolor: "primary.dark", boxShadow: "none" } }}
                      >
                        Adicionar
                      </Button>
                    )}
                  </Box>
                </Paper>
              );
            })}
          </DialogContent>
          <DialogActions sx={{ p: 2.5, pt: 2, borderTop: "1px solid", borderColor: "divider" }}>
            <Button onClick={() => setShowAllPending(false)}>Fechar</Button>
          </DialogActions>
        </Dialog>

        {/* 2. Packages */}
        <Box>
          <Box
            onClick={() => setPackagesOpen((p) => !p)}
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              cursor: "pointer",
              mb: packagesOpen ? 1 : 0,
              py: 0.5,
              px: 0.5,
              borderRadius: 1.5,
              "&:hover": { bgcolor: "action.hover" },
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <Typography variant="overline" sx={{ fontWeight: 800, color: "text.primary", letterSpacing: 1.2, fontSize: "0.65rem" }}>
                Pacotes Disponíveis
              </Typography>
              <Chip
                label={packagesWithBalance.length}
                size="small"
                sx={{ height: 18, fontSize: "0.6rem", fontWeight: 800, bgcolor: (theme) => alpha(theme.palette.primary.main, 0.1), color: "primary.dark" }}
              />
            </Box>
            {packagesOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </Box>

          <Collapse in={packagesOpen}>
            <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "repeat(3, 1fr)" }, gap: 1 }}>
              {packagesWithBalance.length === 0 ? (
                <Typography variant="caption" sx={{ color: "text.primary", opacity: 0.5, px: 1, py: 0.5 }}>
                  Nenhum pacote ativo.
                </Typography>
              ) : (
                packagesWithBalance.map((pkg) => (
                  <Box
                    key={pkg.id}
                    sx={{
                      display: "flex",
                      flexDirection: "column",
                      gap: 0.5,
                      p: 1.25,
                      border: "1px solid",
                      borderColor: "divider",
                      borderRadius: 2,
                      bgcolor: "background.paper",
                    }}
                  >
                    <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 0.25 }}>
                      <Typography variant="body2" sx={{ fontWeight: 800, color: "primary.main", fontSize: "0.75rem" }}>
                        {pkg.package_name}
                      </Typography>
                      <Typography variant="caption" sx={{ color: "text.primary", opacity: 0.5, fontSize: "0.65rem", fontWeight: 700 }}>
                        Vence: {pkg.expires_at ? dayjs(pkg.expires_at).format("DD/MM/YY") : "Sem validade"}
                      </Typography>
                    </Box>
                    <Box sx={{ display: "flex", flexDirection: "column", gap: 0.25 }}>
                      {pkg.credits?.map((credit) => (
                        <Typography key={credit.id} variant="caption" sx={{ display: "flex", alignItems: "center", gap: 0.5, color: "text.primary", fontSize: "0.65rem", lineHeight: 1.2 }}>
                          <Box component="span" sx={{ width: 4, height: 4, borderRadius: "50%", bgcolor: credit.remaining_qty > 0 ? "primary.main" : "text.disabled", flexShrink: 0 }} />
                          <Box component="span" sx={{ flex: 1, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                            {credit.service_name}
                          </Box>
                          <Box component="span" sx={{ fontWeight: 700, color: credit.remaining_qty > 0 ? "text.primary" : "text.disabled" }}>
                            restam {credit.remaining_qty}
                          </Box>
                          <Box component="span" sx={{ opacity: 0.5 }}>
                            (usou {credit.used_qty} de {credit.total_qty})
                          </Box>
                        </Typography>
                      ))}
                    </Box>
                  </Box>
                ))
              )}
            </Box>
          </Collapse>
        </Box>

        {/* 3. Upcoming Appointments — collapsible */}
        <Box>
          <Box
            onClick={() => setUpcomingOpen((p) => !p)}
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              cursor: "pointer",
              mb: upcomingOpen ? 1 : 0,
              py: 0.5,
              px: 0.5,
              borderRadius: 1.5,
              "&:hover": { bgcolor: "action.hover" },
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <Typography variant="overline" sx={{ fontWeight: 800, color: "text.primary", letterSpacing: 1.2, fontSize: "0.65rem" }}>
                Próximos Agendamentos
              </Typography>
              <Chip
                label={upcomingCount}
                size="small"
                sx={{ height: 18, fontSize: "0.6rem", fontWeight: 800, bgcolor: "action.hover", color: "text.primary" }}
              />
            </Box>
            {upcomingOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </Box>

          <Collapse in={upcomingOpen}>
            <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "repeat(3, 1fr)" }, gap: 1 }}>
              {upcomingCount === 0 ? (
                <Typography variant="caption" sx={{ color: "text.primary", opacity: 0.5, px: 1, py: 0.5, gridColumn: "1 / -1" }}>
                  Nenhum agendamento futuro.
                </Typography>
              ) : (
                <>
                  {upcoming.map((apt) => {
                    const isToday = dayjs(apt.scheduled_at).isSame(dayjs(), "day");
                    return (
                      <Box
                        key={apt.id}
                        sx={{
                          display: "flex",
                          flexDirection: "column",
                          gap: 0.25,
                          p: 1.25,
                          border: "1px solid",
                          borderColor: "divider",
                          borderRadius: 2,
                          bgcolor: "background.paper",
                        }}
                      >
                        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                          <Typography variant="body2" sx={{ fontWeight: 800, color: "text.primary", fontSize: "0.75rem" }}>
                            {isToday ? (
                              <Box component="span" sx={{ color: "warning.dark" }}>Hoje às {dayjs(apt.scheduled_at).format("HH:mm")}</Box>
                            ) : (
                              <>{dayjs(apt.scheduled_at).format("DD/MM")} às {dayjs(apt.scheduled_at).format("HH:mm")}</>
                            )}
                          </Typography>
                          <Typography variant="caption" sx={{ fontWeight: 700, color: "text.primary", opacity: 0.5, fontSize: "0.65rem", maxWidth: "45%", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", textAlign: "right" }}>
                            {apt.items.map((i) => i.pet.name).join(", ")}
                          </Typography>
                        </Box>
                        <Typography variant="caption" sx={{ color: "text.primary", opacity: 0.6, display: "block", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", fontSize: "0.7rem" }}>
                          {[...new Set(apt.items.flatMap((i) => i.services.map((s) => s.name)))].join(" • ")}
                        </Typography>
                      </Box>
                    );
                  })}
                  {remainingUpcoming > 0 && (
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        p: 1.25,
                        border: "1px dashed",
                        borderColor: "divider",
                        borderRadius: 2,
                        bgcolor: (theme) => alpha(theme.palette.text.primary, 0.02),
                      }}
                    >
                      <Typography variant="caption" sx={{ fontWeight: 700, color: "text.primary", opacity: 0.6 }}>
                        + {remainingUpcoming} agendamento{remainingUpcoming > 1 ? "s" : ""}
                      </Typography>
                    </Box>
                  )}
                </>
              )}
            </Box>
          </Collapse>
        </Box>
      </Box>

      {/* Back button — only when header is shown (not in session mode) */}
      {!hideHeader && (
        <Box sx={{ mt: 3 }}>
          <Button
            variant="outlined"
            color="secondary"
            onClick={onClearClient}
            sx={{ px: 3, py: 1, borderRadius: 2, fontWeight: 700, borderColor: "divider", "&:hover": { bgcolor: "action.hover" } }}
          >
            Voltar para Lista de Agendamentos
          </Button>
        </Box>
      )}
    </Box>
  );
}
