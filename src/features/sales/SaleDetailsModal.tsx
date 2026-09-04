import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
  Box,
  Divider,
  Paper,
  TableContainer,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  CircularProgress,
  Chip,
} from "@mui/material";
import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { X, Receipt, ShoppingCart, User, Calendar, Package } from "lucide-react";
import { getSale } from "../../api/services/sales";
import { Button } from "../../components/Button/Button";
import { formatPaymentMethod } from "../../utils/formatPaymentMethod";

type Props = {
  open: boolean;
  saleId: number | null;
  onClose: () => void;
};

export default function SaleDetailsModal({ open, saleId, onClose }: Props) {
  const { data: sale, isLoading } = useQuery({
    queryKey: ["sale", saleId],
    queryFn: () => getSale(saleId!),
    enabled: !!saleId && open,
  });

  const formattedDate = sale
    ? new Date(sale.created_at).toLocaleString("pt-BR")
    : "";

  // Mapa serviceId → price_cents vindo do agendamento linkado (para vendas de pacote)
  const appointmentServicePriceMap = useMemo<Record<number, number>>(() => {
    if (!sale?.appointment?.items) return {};
    const map: Record<number, number> = {};
    for (const apptItem of sale.appointment.items) {
      for (const svc of apptItem.services) {
        map[svc.id] = svc.price_cents;
      }
    }
    return map;
  }, [sale]);

  const formatCurrency = (cents: number) =>
    (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="md"
      PaperProps={{ sx: { minHeight: 400 } }}
    >
      <DialogTitle sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <Receipt size={24} />
          <Typography variant="h5" fontWeight={700}>
            Detalhes da Venda #{saleId}
          </Typography>
        </Box>
        <Box sx={{ cursor: "pointer" }} onClick={onClose}>
          <X />
        </Box>
      </DialogTitle>
      
      <Divider />
      
      <DialogContent>
        {isLoading ? (
          <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", height: 300 }}>
            <CircularProgress />
          </Box>
        ) : !sale ? (
          <Box sx={{ p: 4, textAlign: "center" }}>
            <Typography color="text.secondary">Venda não encontrada.</Typography>
          </Box>
        ) : (
          <Box>
            {/* Header Info */}
            <Box sx={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 2, mb: 4 }}>
              <Paper sx={{ p: 2, display: "flex", alignItems: "center", gap: 1.5 }}>
                <User size={20} color="gray" />
                <Box>
                  <Typography variant="caption" color="text.disabled" fontWeight={600}>CLIENTE</Typography>
                  <Typography variant="body1" fontWeight={600}>
                    {sale.client?.name || sale.appointment?.client?.name || "Consumidor (Sem cadastro)"}
                  </Typography>
                </Box>
              </Paper>
              <Paper sx={{ p: 2, display: "flex", alignItems: "center", gap: 1.5 }}>
                <Calendar size={20} color="gray" />
                <Box>
                  <Typography variant="caption" color="text.disabled" fontWeight={600}>DATA</Typography>
                  <Typography variant="body1" fontWeight={600}>{formattedDate}</Typography>
                </Box>
              </Paper>
              <Paper sx={{ p: 2, display: "flex", alignItems: "center", gap: 1.5 }}>
                <ShoppingCart size={20} color="gray" />
                <Box sx={{ flex: 1 }}>
                  <Typography variant="caption" color="text.disabled" fontWeight={600}>STATUS / PAGAMENTO</Typography>
                  <Box sx={{ display: "flex", gap: 1, alignItems: "center", flexWrap: "wrap" }}>
                    <Chip
                      label={sale.status === "completed" ? "Finalizada" : "Cancelada"}
                      color={sale.status === "completed" ? "success" : "error"}
                      size="small"
                      sx={{ fontWeight: 600, height: 20 }}
                    />
                    <Typography variant="body2" fontWeight={600}>
                      ({formatPaymentMethod(sale.payment_method)})
                    </Typography>
                  </Box>
                  {sale.payments && sale.payments.length > 1 && (
                    <Box sx={{ mt: 0.75, display: "flex", flexWrap: "wrap", gap: 0.5 }}>
                      {sale.payments.map((p) => (
                        <Chip
                          key={p.id ?? p.payment_method}
                          size="small"
                          variant="outlined"
                          label={`${formatPaymentMethod(p.payment_method)}: R$ ${p.amount.toFixed(2)}`}
                          sx={{ fontSize: "0.72rem", height: 20, fontWeight: 600 }}
                        />
                      ))}
                    </Box>
                  )}
                </Box>
              </Paper>
            </Box>

            <Typography variant="h6" fontWeight={700} mb={2}>
              Itens da Venda
            </Typography>

            <TableContainer component={Paper} variant="outlined">
              <Table size="small">
                <TableHead sx={{ bgcolor: "background.default" }}>
                  <TableRow>
                    <TableCell>Descrição</TableCell>
                    <TableCell align="center">Qtd</TableCell>
                    <TableCell align="right">Preço Unit.</TableCell>
                    <TableCell align="right">Subtotal</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {sale.items.map((item) => {
                    const isPackageSale = sale.payment_method === "package";
                    // Preço real: do unit_price (novos) ou do agendamento (dados antigos)
                    const realPriceCents = isPackageSale
                      ? (item.unit_price > 0 ? item.unit_price * 100 : (appointmentServicePriceMap[item.item_id] ?? 0))
                      : null;
                    return (
                      <TableRow key={item.id} hover>
                        <TableCell>
                          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                            <Typography variant="subtitle2" fontWeight={600}>{item.name}</Typography>
                            {isPackageSale && (
                              <Chip
                                label="Pacote"
                                size="small"
                                color="success"
                                variant="outlined"
                                icon={<Package size={10} />}
                                sx={{ height: 18, fontSize: 10 }}
                              />
                            )}
                          </Box>
                        </TableCell>
                        <TableCell align="center">{item.quantity}</TableCell>
                        <TableCell align="right">
                          {isPackageSale && realPriceCents ? (
                            <Typography variant="body2" sx={{ textDecoration: "line-through", color: "text.disabled" }}>
                              {formatCurrency(realPriceCents)}
                            </Typography>
                          ) : (
                            formatCurrency(item.unit_price * 100)
                          )}
                        </TableCell>
                        <TableCell align="right">
                          {isPackageSale ? (
                            <Typography variant="body2" color="success.main" fontWeight={600}>
                              R$ 0,00
                            </Typography>
                          ) : (
                            formatCurrency(item.subtotal * 100)
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  <TableRow sx={{ bgcolor: "background.default" }}>
                    <TableCell colSpan={3} align="right">
                      <Typography variant="h6" fontWeight={700}>Total Pago</Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="h5" color="primary.main" fontWeight={800}>
                        {formatCurrency(sale.total_amount * 100)}
                      </Typography>
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        )}
      </DialogContent>
      
      <Divider />
      
      <DialogActions sx={{ p: 2 }}>
        <Button variant="outlined" onClick={onClose}>
          Fechar
        </Button>
      </DialogActions>
    </Dialog>
  );
}
