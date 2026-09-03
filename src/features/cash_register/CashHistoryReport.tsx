import {
  Box,
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  CircularProgress,
  Button,
  Chip,
  useTheme,
  useMediaQuery,
} from "@mui/material";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import dayjs, { type Dayjs } from "dayjs";
import { Eye, Printer, Lock, Unlock, AlertTriangle, CheckCircle2 } from "lucide-react";
import { listCashSessions, getCashSession } from "../../api/services/cash";
import type { CashSessionDetailResponse } from "./types";
import CashStatementModal from "./CashStatementModal";
import CashReceiptPrintModal from "./CashReceiptPrintModal";

interface CashHistoryReportProps {
  startDate: Dayjs | null;
  endDate: Dayjs | null;
}

export default function CashHistoryReport({
  startDate,
  endDate,
}: CashHistoryReportProps) {
  const currentTheme = useTheme();
  const isMobile = useMediaQuery(currentTheme.breakpoints.down("md"));

  const [selectedSessionId, setSelectedSessionId] = useState<number | null>(null);
  const [isStatementOpen, setIsStatementOpen] = useState(false);
  const [isPrintOpen, setIsPrintOpen] = useState(false);

  const startStr = startDate ? startDate.format("YYYY-MM-DD") : undefined;
  const endStr = endDate ? endDate.format("YYYY-MM-DD") : undefined;

  const { data: sessions = [], isLoading } = useQuery<CashSessionDetailResponse[]>({
    queryKey: ["cash-sessions-history", startStr, endStr],
    queryFn: () => listCashSessions(startStr, endStr),
  });

  const { data: selectedSessionData } = useQuery<CashSessionDetailResponse>({
    queryKey: ["cash-session-detail", selectedSessionId],
    queryFn: () => getCashSession(selectedSessionId!),
    enabled: !!selectedSessionId,
  });

  const handleOpenDetail = (sessionId: number) => {
    setSelectedSessionId(sessionId);
    setIsStatementOpen(true);
  };

  const handleOpenPrint = (sessionId: number) => {
    setSelectedSessionId(sessionId);
    setIsPrintOpen(true);
  };

  return (
    <Box sx={{ width: "100%" }}>
      <Paper
        elevation={0}
        sx={{
          p: { xs: 1.5, sm: 2.5, md: 3 },
          bgcolor: "#ffffff",
          borderRadius: 3,
          border: "1px solid #E5E7EB",
        }}
      >
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2.5 }}>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 800, color: "#111827", fontSize: { xs: "1.1rem", sm: "1.25rem" } }}>
              Histórico de Sessões de Caixa
            </Typography>
            <Typography variant="body2" sx={{ color: "#4B5563", fontSize: { xs: "0.8rem", sm: "0.875rem" } }}>
              Consulte e audite todas as aberturas, fechamentos e movimentações de caixa por período.
            </Typography>
          </Box>
        </Box>

        {isLoading ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
            <CircularProgress size={32} sx={{ color: "#2563EB" }} />
          </Box>
        ) : sessions.length === 0 ? (
          <Box sx={{ textAlign: "center", py: 6, color: "#6B7280" }}>
            <Typography variant="body1" sx={{ fontWeight: 600, color: "#374151" }}>
              Nenhuma sessão de caixa encontrada no período selecionado.
            </Typography>
          </Box>
        ) : isMobile ? (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
            {sessions.map((item) => {
              const s = item.session;
              const isOpen = s.status === "open";
              const diff = s.difference_amount ?? 0;
              const finalBalance = s.actual_closing_amount ?? item.current_balance;

              return (
                <Paper
                  key={s.id}
                  elevation={0}
                  sx={{
                    p: 1.75,
                    borderRadius: 2.5,
                    border: "1.5px solid",
                    borderColor: "divider",
                    bgcolor: "#FFFFFF",
                    display: "flex",
                    flexDirection: "column",
                    gap: 1.25,
                  }}
                >
                  <Box sx={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 1 }}>
                    <Box sx={{ minWidth: 0, flex: 1 }}>
                      <Typography variant="body1" fontWeight={800} color="#111827" sx={{ fontSize: "0.98rem" }}>
                        Sessão #{s.id} • {item.cash_register.name}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Aberto por {s.opened_by_name || "-"} em {dayjs(s.opened_at).format("DD/MM/YY HH:mm")}
                      </Typography>
                    </Box>

                    <Chip
                      icon={isOpen ? <Unlock size={12} /> : <Lock size={12} />}
                      label={isOpen ? "Aberto" : "Fechado"}
                      size="small"
                      sx={{
                        fontWeight: 700,
                        fontSize: "0.72rem",
                        height: 22,
                        bgcolor: isOpen ? "#DCFCE7" : "#F3F4F6",
                        color: isOpen ? "#166534" : "#4B5563",
                      }}
                    />
                  </Box>

                  <Box
                    sx={{
                      bgcolor: "#F8FAFC",
                      borderRadius: 1.75,
                      p: 1.25,
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      flexWrap: "wrap",
                      gap: 1,
                    }}
                  >
                    <Box>
                      <Typography variant="caption" color="text.secondary" fontWeight={500}>
                        Saldo Final
                      </Typography>
                      <Typography variant="body1" fontWeight={800} color="primary.main">
                        R$ {finalBalance.toFixed(2)}
                      </Typography>
                    </Box>

                    <Box sx={{ textAlign: "center" }}>
                      <Typography variant="caption" color="text.secondary" fontWeight={500}>
                        Vendas
                      </Typography>
                      <Typography variant="body2" fontWeight={700} color="success.main">
                        +R$ {item.total_sales_amount.toFixed(2)}
                      </Typography>
                    </Box>

                    <Box sx={{ textAlign: "right" }}>
                      <Typography variant="caption" color="text.secondary" fontWeight={500}>
                        Fundo Inicial
                      </Typography>
                      <Typography variant="body2" fontWeight={600} color="text.primary">
                        R$ {s.initial_amount.toFixed(2)}
                      </Typography>
                    </Box>
                  </Box>

                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      pt: 0.75,
                      borderTop: "1px dashed #E2E8F0",
                    }}
                  >
                    <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                      {!isOpen && (
                        diff === 0 ? (
                          <Chip
                            icon={<CheckCircle2 size={12} />}
                            label="Sem diferença"
                            size="small"
                            sx={{ height: 22, fontSize: "0.7rem", bgcolor: "#DCFCE7", color: "#166534", fontWeight: 700 }}
                          />
                        ) : (
                          <Chip
                            icon={<AlertTriangle size={12} />}
                            label={`Dif: R$ ${diff.toFixed(2)}`}
                            size="small"
                            sx={{
                              height: 22,
                              fontSize: "0.7rem",
                              bgcolor: diff < 0 ? "#FEE2E2" : "#FEF3C7",
                              color: diff < 0 ? "#991B1B" : "#92400E",
                              fontWeight: 700,
                            }}
                          />
                        )
                      )}
                    </Box>

                    <Box sx={{ display: "flex", gap: 1 }}>
                      <Button
                        size="small"
                        variant="outlined"
                        startIcon={<Eye size={14} />}
                        onClick={() => handleOpenDetail(s.id)}
                        sx={{ minHeight: 34, fontSize: "0.78rem", fontWeight: 600, borderRadius: 1.75 }}
                      >
                        Extrato
                      </Button>
                      <IconButton
                        size="small"
                        onClick={() => handleOpenPrint(s.id)}
                        sx={{ bgcolor: "#F3F4F6", borderRadius: 1.75 }}
                      >
                        <Printer size={15} />
                      </IconButton>
                    </Box>
                  </Box>
                </Paper>
              );
            })}
          </Box>
        ) : (
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ "& th": { bgcolor: "#F9FAFB", color: "#4B5563", fontWeight: 700, fontSize: "0.75rem", py: 1.5 } }}>
                  <TableCell>Sessão / Caixa</TableCell>
                  <TableCell>Abertura</TableCell>
                  <TableCell>Fechamento</TableCell>
                  <TableCell align="right">Fundo Inicial</TableCell>
                  <TableCell align="right">Total Vendas</TableCell>
                  <TableCell align="right">Suprimentos</TableCell>
                  <TableCell align="right">Sangrias</TableCell>
                  <TableCell align="right">Saldo Final</TableCell>
                  <TableCell align="center">Diferença</TableCell>
                  <TableCell align="center">Status</TableCell>
                  <TableCell align="center">Ações</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {sessions.map((item) => {
                  const s = item.session;
                  const isOpen = s.status === "open";
                  const diff = s.difference_amount ?? 0;

                  return (
                    <TableRow key={s.id} hover sx={{ "& td": { py: 1.5, borderColor: "#F3F4F6" } }}>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: 800, color: "#111827" }}>
                          Sessão #{s.id}
                        </Typography>
                        <Typography variant="caption" sx={{ color: "#6B7280" }}>
                          {item.cash_register.name}
                        </Typography>
                      </TableCell>

                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: 600, color: "#111827" }}>
                          {dayjs(s.opened_at).format("DD/MM/YY HH:mm")}
                        </Typography>
                        <Typography variant="caption" sx={{ color: "#6B7280" }}>
                          {s.opened_by_name || "-"}
                        </Typography>
                      </TableCell>

                      <TableCell>
                        {s.closed_at ? (
                          <>
                            <Typography variant="body2" sx={{ fontWeight: 600, color: "#111827" }}>
                              {dayjs(s.closed_at).format("DD/MM/YY HH:mm")}
                            </Typography>
                            <Typography variant="caption" sx={{ color: "#6B7280" }}>
                              {s.closed_by_name || "-"}
                            </Typography>
                          </>
                        ) : (
                          <Typography variant="caption" sx={{ color: "#16A34A", fontWeight: 700 }}>
                            Em andamento
                          </Typography>
                        )}
                      </TableCell>

                      <TableCell align="right">
                        <Typography variant="body2" sx={{ fontWeight: 600, color: "#111827" }}>
                          R$ {s.initial_amount.toFixed(2)}
                        </Typography>
                      </TableCell>

                      <TableCell align="right">
                        <Typography variant="body2" sx={{ fontWeight: 700, color: "#16A34A" }}>
                          R$ {item.total_sales_amount.toFixed(2)}
                        </Typography>
                      </TableCell>

                      <TableCell align="right">
                        <Typography variant="body2" sx={{ fontWeight: 600, color: "#16A34A" }}>
                          +R$ {item.total_supplies.toFixed(2)}
                        </Typography>
                      </TableCell>

                      <TableCell align="right">
                        <Typography variant="body2" sx={{ fontWeight: 600, color: "#DC2626" }}>
                          -R$ {item.total_bleeds.toFixed(2)}
                        </Typography>
                      </TableCell>

                      <TableCell align="right">
                        <Typography variant="body2" sx={{ fontWeight: 800, color: "#111827" }}>
                          R$ {(s.actual_closing_amount ?? item.current_balance).toFixed(2)}
                        </Typography>
                      </TableCell>

                      <TableCell align="center">
                        {isOpen ? (
                          <Typography variant="caption" sx={{ color: "#6B7280" }}>-</Typography>
                        ) : diff === 0 ? (
                          <Chip
                            icon={<CheckCircle2 size={12} />}
                            label="R$ 0,00"
                            size="small"
                            sx={{
                              bgcolor: "#DCFCE7",
                              color: "#166534",
                              fontWeight: 700,
                              fontSize: "0.7rem",
                              height: 20,
                            }}
                          />
                        ) : (
                          <Chip
                            icon={<AlertTriangle size={12} />}
                            label={`R$ ${diff.toFixed(2)}`}
                            size="small"
                            sx={{
                              bgcolor: diff < 0 ? "#FEE2E2" : "#FEF3C7",
                              color: diff < 0 ? "#991B1B" : "#92400E",
                              fontWeight: 700,
                              fontSize: "0.7rem",
                              height: 20,
                            }}
                          />
                        )}
                      </TableCell>

                      <TableCell align="center">
                        <Chip
                          icon={isOpen ? <Unlock size={12} /> : <Lock size={12} />}
                          label={isOpen ? "Aberto" : "Fechado"}
                          size="small"
                          sx={{
                            fontWeight: 700,
                            fontSize: "0.75rem",
                            bgcolor: isOpen ? "#DCFCE7" : "#F3F4F6",
                            color: isOpen ? "#166534" : "#4B5563",
                          }}
                        />
                      </TableCell>

                      <TableCell align="center">
                        <Box sx={{ display: "flex", justifyContent: "center", gap: 0.5 }}>
                          <IconButton
                            size="small"
                            onClick={() => handleOpenDetail(s.id)}
                            title="Ver Extrato"
                            sx={{ color: "#2563EB", "&:hover": { bgcolor: "rgba(37, 99, 235, 0.08)" } }}
                          >
                            <Eye size={16} />
                          </IconButton>
                          <IconButton
                            size="small"
                            onClick={() => handleOpenPrint(s.id)}
                            title="Imprimir Comprovante"
                            sx={{ color: "#4B5563", "&:hover": { bgcolor: "#F3F4F6" } }}
                          >
                            <Printer size={16} />
                          </IconButton>
                        </Box>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>

      {/* Statement Modal */}
      {selectedSessionData && (
        <CashStatementModal
          open={isStatementOpen}
          onClose={() => setIsStatementOpen(false)}
          sessionData={selectedSessionData}
          onOpenSupply={() => {}}
          onOpenBleed={() => {}}
          onOpenClose={() => {}}
          onOpenOpenModal={() => {}}
          onPrint={() => setIsPrintOpen(true)}
        />
      )}

      {/* Receipt Print Modal */}
      {selectedSessionData && (
        <CashReceiptPrintModal
          open={isPrintOpen}
          onClose={() => setIsPrintOpen(false)}
          sessionData={selectedSessionData}
        />
      )}
    </Box>
  );
}
