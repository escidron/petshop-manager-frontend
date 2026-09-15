import React, { useState } from "react";
import {
  Box,
  IconButton,
  Badge,
  Popover,
  Typography,
  Divider,
  Button,
  Chip,
  Tooltip,
} from "@mui/material";
import { Bell, AlertCircle, Clock, ArrowRight, CheckCircle2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import dayjs from "dayjs";
import { getBillDueAlerts, type BillAlertItem } from "../../../api/services/financialBills";

const fmtBRL = (val: number = 0) =>
  val.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export default function BillNotificationBell() {
  const navigate = useNavigate();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  const { data } = useQuery({
    queryKey: ["bills-due-alerts"],
    queryFn: getBillDueAlerts,
    refetchInterval: 3 * 60 * 1000, // atualiza a cada 3 minutos
    staleTime: 60 * 1000,
  });

  const totalCount = data?.total_count || 0;
  const todayCount = data?.today_count || 0;
  const overdueCount = data?.overdue_count || 0;
  const alerts = data?.alerts || [];

  const handleOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleNavigateToBills = () => {
    handleClose();
    navigate("/managerial/bills?bill_type=payable&status=pending");
  };

  // Separa alertas por tipo
  const todayAlerts = alerts.filter((a) => a.urgency === "today");
  const tomorrowAlerts = alerts.filter((a) => a.urgency === "tomorrow");
  const overdueAlerts = alerts.filter((a) => a.urgency === "overdue");

  // Cor do badge: Vermelho se tiver hoje ou atrasada, Laranja se tiver apenas amanhã
  const hasUrgent = todayCount > 0 || overdueCount > 0;
  const badgeColor = hasUrgent ? "#EF4444" : "#F97316";

  return (
    <>
      <Tooltip title={totalCount > 0 ? `${totalCount} contas a pagar com atenção` : "Lembretes de Pagamento"}>
        <IconButton
          onClick={handleOpen}
          size="small"
          sx={{
            width: { xs: 34, sm: 38 },
            height: { xs: 34, sm: 38 },
            color: totalCount > 0 ? (hasUrgent ? "#EF4444" : "#F97316") : "text.secondary",
            bgcolor: totalCount > 0 ? (hasUrgent ? "rgba(239, 68, 68, 0.08)" : "rgba(249, 115, 22, 0.08)") : "transparent",
            borderRadius: 2,
            transition: "all 0.2s ease",
            "&:hover": {
              bgcolor: totalCount > 0 ? (hasUrgent ? "rgba(239, 68, 68, 0.15)" : "rgba(249, 115, 22, 0.15)") : "action.hover",
            },
          }}
        >
          <Badge
            badgeContent={totalCount}
            max={99}
            sx={{
              "& .MuiBadge-badge": {
                bgcolor: badgeColor,
                color: "#FFFFFF",
                fontWeight: 700,
                fontSize: "0.7rem",
                height: 18,
                minWidth: 18,
                px: 0.5,
              },
            }}
          >
            <Bell size={20} />
          </Badge>
        </IconButton>
      </Tooltip>

      <Popover
        open={open}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{
          vertical: "bottom",
          horizontal: "right",
        }}
        transformOrigin={{
          vertical: "top",
          horizontal: "right",
        }}
        PaperProps={{
          sx: {
            width: { xs: "92vw", sm: 380 },
            maxWidth: 400,
            maxHeight: 520,
            display: "flex",
            flexDirection: "column",
            borderRadius: 3,
            boxShadow: "0 12px 36px rgba(0,0,0,0.14)",
            border: "1px solid",
            borderColor: "divider",
            overflow: "hidden",
            mt: 1,
          },
        }}
      >
        {/* Cabeçalho */}
        <Box
          sx={{
            p: 2,
            pb: 1.5,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            borderBottom: "1px solid",
            borderColor: "divider",
            bgcolor: "background.paper",
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Bell size={18} color={hasUrgent ? "#EF4444" : "#F97316"} />
            <Typography variant="subtitle2" fontWeight={700} fontSize="0.95rem">
              Lembretes de Contas
            </Typography>
          </Box>
          {totalCount > 0 && (
            <Chip
              label={`${totalCount} pendente${totalCount > 1 ? "s" : ""}`}
              size="small"
              sx={{
                height: 22,
                fontSize: "0.72rem",
                fontWeight: 700,
                bgcolor: hasUrgent ? "rgba(239, 68, 68, 0.12)" : "rgba(249, 115, 22, 0.12)",
                color: hasUrgent ? "#DC2626" : "#EA580C",
              }}
            />
          )}
        </Box>

        {/* Lista de Alertas */}
        <Box sx={{ p: 1.5, overflowY: "auto", flex: 1, display: "flex", flexDirection: "column", gap: 1.25 }}>
          {totalCount === 0 ? (
            <Box
              sx={{
                py: 4,
                px: 2,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: 1,
                textAlign: "center",
              }}
            >
              <CheckCircle2 size={36} color="#10B981" />
              <Typography variant="body2" fontWeight={600} color="text.primary">
                Tudo em dia!
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Não há contas a pagar vencendo hoje ou amanhã.
              </Typography>
            </Box>
          ) : (
            <>
              {/* Contas Vencendo Hoje */}
              {todayAlerts.length > 0 && (
                <Box>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 0.75, mb: 0.75, px: 0.5 }}>
                    <AlertCircle size={14} color="#EF4444" />
                    <Typography fontSize="0.75rem" fontWeight={700} color="#DC2626" textTransform="uppercase" letterSpacing={0.5}>
                      Vencem Hoje ({todayAlerts.length})
                    </Typography>
                  </Box>
                  <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                    {todayAlerts.map((item) => (
                      <AlertCard key={item.id} item={item} urgency="today" onClick={handleNavigateToBills} />
                    ))}
                  </Box>
                </Box>
              )}

              {/* Contas Vencendo Amanhã */}
              {tomorrowAlerts.length > 0 && (
                <Box sx={{ mt: todayAlerts.length > 0 ? 1 : 0 }}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 0.75, mb: 0.75, px: 0.5 }}>
                    <Clock size={14} color="#F97316" />
                    <Typography fontSize="0.75rem" fontWeight={700} color="#EA580C" textTransform="uppercase" letterSpacing={0.5}>
                      Vencem Amanhã ({tomorrowAlerts.length})
                    </Typography>
                  </Box>
                  <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                    {tomorrowAlerts.map((item) => (
                      <AlertCard key={item.id} item={item} urgency="tomorrow" onClick={handleNavigateToBills} />
                    ))}
                  </Box>
                </Box>
              )}

              {/* Contas Atrasadas */}
              {overdueAlerts.length > 0 && (
                <Box sx={{ mt: 1 }}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 0.75, mb: 0.75, px: 0.5 }}>
                    <AlertCircle size={14} color="#B91C1C" />
                    <Typography fontSize="0.75rem" fontWeight={700} color="#B91C1C" textTransform="uppercase" letterSpacing={0.5}>
                      Vencidas ({overdueAlerts.length})
                    </Typography>
                  </Box>
                  <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                    {overdueAlerts.map((item) => (
                      <AlertCard key={item.id} item={item} urgency="overdue" onClick={handleNavigateToBills} />
                    ))}
                  </Box>
                </Box>
              )}
            </>
          )}
        </Box>

        {/* Rodapé */}
        <Divider />
        <Box sx={{ p: 1.25, bgcolor: "grey.50", display: "flex", justifyContent: "center" }}>
          <Button
            size="small"
            onClick={handleNavigateToBills}
            endIcon={<ArrowRight size={14} />}
            sx={{
              fontSize: "0.82rem",
              fontWeight: 700,
              textTransform: "none",
              color: "primary.main",
            }}
          >
            Ver todas as contas a pagar
          </Button>
        </Box>
      </Popover>
    </>
  );
}

function AlertCard({
  item,
  urgency,
  onClick,
}: {
  item: BillAlertItem;
  urgency: "today" | "tomorrow" | "overdue";
  onClick: () => void;
}) {
  const isToday = urgency === "today";
  const isTomorrow = urgency === "tomorrow";

  const borderColor = isToday ? "#EF4444" : isTomorrow ? "#F97316" : "#B91C1C";
  const chipBg = isToday
    ? "rgba(239, 68, 68, 0.1)"
    : isTomorrow
    ? "rgba(249, 115, 22, 0.1)"
    : "rgba(185, 28, 28, 0.1)";
  const chipText = isToday ? "#DC2626" : isTomorrow ? "#EA580C" : "#B91C1C";
  const chipLabel = isToday
    ? "Vence Hoje"
    : isTomorrow
    ? "Vence Amanhã"
    : `Venceu em ${dayjs(item.due_date).format("DD/MM")}`;

  return (
    <Box
      onClick={onClick}
      sx={{
        p: 1.25,
        borderRadius: 2,
        border: "1px solid",
        borderColor: "divider",
        borderLeft: "4px solid",
        borderLeftColor: borderColor,
        bgcolor: "background.paper",
        cursor: "pointer",
        transition: "all 0.15s ease",
        "&:hover": {
          bgcolor: "grey.50",
          boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
        },
      }}
    >
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 1, mb: 0.5 }}>
        <Typography
          fontSize="0.84rem"
          fontWeight={600}
          color="text.primary"
          sx={{
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
            flex: 1,
          }}
        >
          {item.description}
        </Typography>

        <Typography fontSize="0.85rem" fontWeight={700} color="text.primary" sx={{ flexShrink: 0 }}>
          {fmtBRL(item.amount)}
        </Typography>
      </Box>

      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 1 }}>
        <Typography
          fontSize="0.75rem"
          color="text.secondary"
          sx={{
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {item.supplier_name || item.category_name || "Sem fornecedor"}
        </Typography>

        <Chip
          label={chipLabel}
          size="small"
          sx={{
            height: 18,
            fontSize: "0.68rem",
            fontWeight: 700,
            bgcolor: chipBg,
            color: chipText,
            borderRadius: 1,
            px: 0.5,
          }}
        />
      </Box>
    </Box>
  );
}
