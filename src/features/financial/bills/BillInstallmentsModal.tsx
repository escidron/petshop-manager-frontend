import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  Typography,
  IconButton,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  LinearProgress,
  Paper,
  CircularProgress,
  alpha,
} from "@mui/material";
import { X, Split, CheckCircle2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import dayjs from "dayjs";
import { getBillInstallments, type FinancialBill } from "../../../api/services/financialBills";

const fmtBRL = (val: number = 0) =>
  val.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

interface Props {
  open: boolean;
  onClose: () => void;
  bill: FinancialBill | null;
  onSettleBill: (bill: FinancialBill) => void;
}

export default function BillInstallmentsModal({
  open,
  onClose,
  bill,
  onSettleBill,
}: Props) {
  const { data: installments = [], isLoading } = useQuery({
    queryKey: ["bill-installments", bill?.id],
    queryFn: () => (bill ? getBillInstallments(bill.id) : Promise.resolve([])),
    enabled: Boolean(open && bill),
    staleTime: 30 * 1000,
  });

  if (!bill) return null;

  const totalInstallments = installments.length || bill.total_installments || 1;
  const paidInstallments = installments.filter((i) => i.status === "paid");
  const paidCount = paidInstallments.length;
  const progressPct = totalInstallments > 0 ? (paidCount / totalInstallments) * 100 : 0;

  const totalAmount = installments.reduce((acc, i) => acc + (i.amount || 0), 0);
  const totalPaidAmount = installments.reduce(
    (acc, i) => acc + (i.status === "paid" ? i.paid_amount || i.amount || 0 : 0),
    0
  );
  const remainingAmount = Math.max(0, totalAmount - totalPaidAmount);

  const cleanDescription = bill.description.replace(/\s*\(\d+\/\d+\)\s*$/, "");

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          pb: 1.5,
          borderBottom: "1px solid",
          borderColor: "divider",
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
          <Box
            sx={{
              p: 0.75,
              borderRadius: 2,
              bgcolor: "rgba(49, 52, 133, 0.08)",
              color: "primary.main",
              display: "flex",
              alignItems: "center",
            }}
          >
            <Split size={20} />
          </Box>
          <Box>
            <Typography variant="h6" fontWeight={800} sx={{ lineHeight: 1.2 }}>
              Parcelas do Título
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {cleanDescription}
            </Typography>
          </Box>
        </Box>
        <IconButton size="small" onClick={onClose}>
          <X size={18} />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ pt: 2.5, display: "flex", flexDirection: "column", gap: 2.5 }}>
        {/* Card de Progresso do Parcelamento */}
        <Paper
          elevation={0}
          sx={{
            p: 2,
            borderRadius: 2.5,
            border: "1px solid",
            borderColor: "divider",
            bgcolor: "grey.50",
          }}
        >
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1 }}>
            <Box>
              <Typography variant="caption" color="text.secondary" fontWeight={700} textTransform="uppercase">
                Progresso de Pagamento
              </Typography>
              <Typography variant="body2" fontWeight={800} color="text.primary">
                {paidCount} de {totalInstallments} parcelas pagas ({Math.round(progressPct)}%)
              </Typography>
            </Box>
            <Box sx={{ textAlign: "right" }}>
              <Typography variant="caption" color="text.secondary">
                Restante a pagar
              </Typography>
              <Typography variant="body1" fontWeight={800} color={remainingAmount > 0 ? "error.main" : "success.main"}>
                {fmtBRL(remainingAmount)}
              </Typography>
            </Box>
          </Box>

          <LinearProgress
            variant="determinate"
            value={progressPct}
            sx={{
              height: 8,
              borderRadius: 4,
              bgcolor: "grey.200",
              "& .MuiLinearProgress-bar": {
                bgcolor: progressPct === 100 ? "#10B981" : "#313485",
                borderRadius: 4,
              },
            }}
          />
        </Paper>

        {/* Tabela de Parcelas */}
        {isLoading ? (
          <Box sx={{ py: 6, display: "flex", justifyContent: "center" }}>
            <CircularProgress size={32} />
          </Box>
        ) : (
          <TableContainer
            component={Paper}
            elevation={0}
            sx={{
              border: "1px solid",
              borderColor: "divider",
              borderRadius: 2,
              maxHeight: 340,
            }}
          >
            <Table size="small" stickyHeader>
              <TableHead>
                <TableRow sx={{ bgcolor: "grey.100" }}>
                  <TableCell sx={{ fontWeight: 800, fontSize: "0.75rem" }}>PARCELA</TableCell>
                  <TableCell sx={{ fontWeight: 800, fontSize: "0.75rem" }}>VENCIMENTO</TableCell>
                  <TableCell sx={{ fontWeight: 800, fontSize: "0.75rem" }} align="right">VALOR</TableCell>
                  <TableCell sx={{ fontWeight: 800, fontSize: "0.75rem" }} align="center">STATUS</TableCell>
                  <TableCell sx={{ fontWeight: 800, fontSize: "0.75rem" }} align="center">PAGAMENTO</TableCell>
                  <TableCell sx={{ fontWeight: 800, fontSize: "0.75rem" }} align="center">AÇÕES</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {installments.map((inst) => {
                  const isPaid = inst.status === "paid";
                  const isOverdue = inst.status === "overdue";
                  const isCurrentTarget = inst.id === bill.id;

                  return (
                    <TableRow
                      key={inst.id}
                      hover
                      sx={{
                        bgcolor: isCurrentTarget ? "rgba(49, 52, 133, 0.04)" : "inherit",
                      }}
                    >
                      <TableCell>
                        <Typography variant="body2" fontWeight={700}>
                          {inst.installment_number}/{inst.total_installments}
                        </Typography>
                      </TableCell>

                      <TableCell>
                        <Typography variant="body2" fontWeight={600} color={isOverdue ? "error.main" : "text.primary"}>
                          {dayjs(inst.due_date).format("DD/MM/YYYY")}
                        </Typography>
                      </TableCell>

                      <TableCell align="right">
                        <Typography variant="body2" fontWeight={700} color={isPaid ? "text.secondary" : "text.primary"}>
                          {fmtBRL(inst.amount)}
                        </Typography>
                      </TableCell>

                      <TableCell align="center">
                        {isPaid ? (
                          <Chip
                            label="Liquidado"
                            size="small"
                            sx={{
                              height: 20,
                              fontSize: "0.68rem",
                              fontWeight: 700,
                              bgcolor: alpha("#10B981", 0.12),
                              color: "#059669",
                            }}
                          />
                        ) : isOverdue ? (
                          <Chip
                            label="Vencido"
                            size="small"
                            sx={{
                              height: 20,
                              fontSize: "0.68rem",
                              fontWeight: 700,
                              bgcolor: alpha("#EF4444", 0.12),
                              color: "#DC2626",
                            }}
                          />
                        ) : (
                          <Chip
                            label="A Vencer"
                            size="small"
                            sx={{
                              height: 20,
                              fontSize: "0.68rem",
                              fontWeight: 700,
                              bgcolor: alpha("#F59E0B", 0.12),
                              color: "#D97706",
                            }}
                          />
                        )}
                      </TableCell>

                      <TableCell align="center">
                        {isPaid ? (
                          <Typography variant="caption" color="text.secondary">
                            {inst.payment_date ? dayjs(inst.payment_date).format("DD/MM/YYYY") : "Pago"}
                          </Typography>
                        ) : (
                          <Typography variant="caption" color="text.disabled">
                            -
                          </Typography>
                        )}
                      </TableCell>

                      <TableCell align="center">
                        {!isPaid && inst.status !== "canceled" ? (
                          <Button
                            size="small"
                            variant="contained"
                            color="success"
                            onClick={() => {
                              onClose();
                              onSettleBill(inst);
                            }}
                            startIcon={<CheckCircle2 size={14} />}
                            sx={{
                              py: 0.25,
                              px: 1,
                              fontSize: "0.72rem",
                              fontWeight: 700,
                              textTransform: "none",
                              borderRadius: 1.5,
                            }}
                          >
                            Dar Baixa
                          </Button>
                        ) : (
                          <Typography variant="caption" color="success.main" fontWeight={700}>
                            ✓ Concluída
                          </Typography>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 1.5, borderTop: "1px solid", borderColor: "divider" }}>
        <Button onClick={onClose} variant="outlined" sx={{ textTransform: "none", fontWeight: 600 }}>
          Fechar
        </Button>
      </DialogActions>
    </Dialog>
  );
}
