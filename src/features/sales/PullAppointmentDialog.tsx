import {
  Dialog,
  DialogTitle,
  DialogContent,
  List,
  ListItem,
  Typography,
  Box,
  IconButton,
  Chip,
  Paper,
} from "@mui/material";
import { X, Calendar, User, Dog } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { getAppointmentsByTenant } from "../../api/services/appointments";
import { listUnpaidPackages } from "../../api/services/client_packages";
import { listPackages } from "../../api/services/packages";
import dayjs from "dayjs";
import type { Appointment } from "../appointments/types";
import type { ClientPackage } from "../client_packages/types";

interface PullAppointmentDialogProps {
  open: boolean;
  onClose: () => void;
  onSelect: (item: any, type: "appointment" | "package") => void;
}

export default function PullAppointmentDialog({
  open,
  onClose,
  onSelect,
}: PullAppointmentDialogProps) {
  const { data: allAppointments = [], isLoading: isLoadingApts } = useQuery({
    queryKey: ["appointments", "pull-list"],
    queryFn: () => getAppointmentsByTenant(),
  });

  const { data: unpaidPkgs = [], isLoading: isLoadingPkgs } = useQuery({
    queryKey: ["unpaid-packages"],
    queryFn: listUnpaidPackages,
  });

  const { data: allPackages = [], isLoading: isLoadingAllPkgs } = useQuery({
    queryKey: ["packages"],
    queryFn: listPackages,
  });

  const isLoading = isLoadingApts || isLoadingPkgs || isLoadingAllPkgs;

  const pullableItems = [
    ...allAppointments
      .filter((apt) => apt.status === "completed" && !apt.is_paid && !apt.is_fully_package_covered)
      .map((apt) => ({ type: "appointment" as const, data: apt, date: apt.scheduled_at })),
    ...unpaidPkgs.map((pkg) => ({ type: "package" as const, data: pkg, date: pkg.created_at }))
  ].sort((a, b) => dayjs(b.date).valueOf() - dayjs(a.date).valueOf());

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle
        sx={{
          m: 0,
          p: 2,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          bgcolor: "primary.main",
          color: "white",
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <Calendar size={20} />
          <Typography variant="h6" fontWeight={700}>
            Puxar Agendamentos
          </Typography>
        </Box>
        <IconButton onClick={onClose} size="small" sx={{ color: "white" }}>
          <X size={20} />
        </IconButton>
      </DialogTitle>
      <DialogContent sx={{ p: 0 }}>
        {isLoading ? (
          <Box sx={{ p: 4, textAlign: "center" }}>
            <Typography color="text.secondary">
              Carregando agendamentos...
            </Typography>
          </Box>
        ) : pullableItems.length === 0 ? (
          <Box sx={{ p: 4, textAlign: "center" }}>
            <Typography color="text.primary">
              Nenhum item pendente encontrado.
            </Typography>
          </Box>
        ) : (
          <List sx={{ pt: 0 }}>
            {pullableItems.map(({ type, data }) => {
              const key = `${type}-${data.id}`;
              const isApt = type === "appointment";
              const apt = data as Appointment;
              const pkg = data as ClientPackage;

              let timeFormatted = "";
              let clientName = "";
              let priceFormatted = "";
              let isPackageCoveredApt = false;
              let hasPetDetails = false;
              let petDetails: any[] = [];
              let statusLabel = "";
              let statusColor: "info" | "warning" | "success" | "default" = "default";
              let priceColor = "primary.main";

              if (isApt) {
                timeFormatted = dayjs(apt.scheduled_at).format("HH:mm");
                clientName = apt.client.name;
                isPackageCoveredApt = apt.is_fully_package_covered;
                priceFormatted = isPackageCoveredApt
                  ? "Pacote"
                  : `R$ ${(
                      apt.items.reduce(
                        (acc, item) =>
                          acc +
                          item.services
                            .filter((s) => !s.is_package_covered)
                            .reduce((sAcc, s) => sAcc + s.price_cents, 0),
                        0,
                      ) / 100
                    ).toFixed(2)}`;
                priceColor = isPackageCoveredApt ? "success.main" : "primary.main";
                hasPetDetails = true;
                petDetails = apt.items.map(item => ({
                  petName: item.pet.name,
                  servicesStr: item.services.map((s) => s.name).join(", "),
                }));
                statusLabel = apt.status === "confirmed" ? "Confirmado" : apt.status === "in_progress" ? "Em Andamento" : "Finalizado";
                statusColor = apt.status === "confirmed" ? "info" : apt.status === "in_progress" ? "warning" : "success";
              } else {
                timeFormatted = dayjs(pkg.created_at).format("DD/MM");
                clientName = pkg.client.name;
                const packageDef = allPackages.find((p) => p.id === pkg.package_id);
                priceFormatted = packageDef ? `R$ ${(packageDef.price_cents / 100).toFixed(2)}` : "R$ 0.00";
                hasPetDetails = true;
                petDetails = [{ petName: pkg.pet.name, servicesStr: pkg.package_name }];
                statusLabel = "Pacote";
                statusColor = "info";
              }

              return (
                <ListItem
                  key={key}
                  component={Paper}
                  elevation={0}
                  onClick={() => onSelect(data, type)}
                  sx={{
                    m: 1,
                    border: "1px solid",
                    borderColor: "divider",
                    borderRadius: 2,
                    cursor: "pointer",
                    width: "auto",
                    "&:hover": {
                      borderColor: "primary.main",
                      bgcolor: "action.hover",
                    },
                  }}
                >
                  <Box sx={{ width: "100%" }}>
                    <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                        <Typography variant="subtitle2" fontWeight={700}>
                          {timeFormatted}
                        </Typography>
                        <Chip
                          label={statusLabel}
                          size="small"
                          color={statusColor as any}
                          variant="outlined"
                          sx={{ height: 20, fontSize: "0.65rem" }}
                        />
                        <Chip
                          label="PAGAMENTO PENDENTE"
                          size="small"
                          color="error"
                          variant="filled"
                          sx={{
                            height: 20,
                            fontSize: "0.65rem",
                            fontWeight: 900,
                          }}
                        />
                      </Box>
                      <Typography variant="subtitle2" color={priceColor} fontWeight={800}>
                        {priceFormatted}
                      </Typography>
                    </Box>

                    <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.5 }}>
                      <User size={14} color="gray" />
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {clientName}
                      </Typography>
                    </Box>

                    {hasPetDetails && (
                      <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
                        {petDetails.map((pd, idx) => (
                          <Box
                            key={idx}
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              gap: 0.5,
                              bgcolor: "action.hover",
                              px: 1,
                              borderRadius: 1,
                            }}
                          >
                            <Dog size={12} color="gray" />
                            <Typography variant="caption" sx={{ fontWeight: 600 }}>
                              {pd.petName}:
                            </Typography>
                            <Typography variant="caption">{pd.servicesStr}</Typography>
                          </Box>
                        ))}
                      </Box>
                    )}
                  </Box>
                </ListItem>
              );
            })}
          </List>
        )}
      </DialogContent>
    </Dialog>
  );
}
