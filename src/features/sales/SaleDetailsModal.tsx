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
  Alert,
  Tooltip,
  TextField,
} from "@mui/material";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import dayjs from "dayjs";
import {
  X,
  Receipt,
  ShoppingCart,
  User,
  Calendar,
  Package,
  Printer,
  XCircle,
  RotateCcw,
  AlertTriangle,
} from "lucide-react";
import { getSale, cancelSale, cancelSaleItem } from "../../api/services/sales";
import { Button } from "../../components/Button/Button";
import { formatPaymentMethod } from "../../utils/formatPaymentMethod";
import SaleReceiptModal from "./SaleReceiptModal";
import { useToast } from "../../hooks/useToast";
import { useAuth } from "../../hooks/useAuth";

type Props = {
  open: boolean;
  saleId: number | null;
  onClose: () => void;
};

export default function SaleDetailsModal({ open, saleId, onClose }: Props) {
  const { user } = useAuth();
  const isOwnerOrAdmin = user?.role === "owner" || user?.role === "admin";

  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);
  const [isCancelSaleOpen, setIsCancelSaleOpen] = useState(false);
  const [cancelSaleReason, setCancelSaleReason] = useState("");
  const [itemToCancel, setItemToCancel] = useState<any | null>(null);
  const [cancelItemReason, setCancelItemReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const toast = useToast();
  const queryClient = useQueryClient();

  const { data: sale, isLoading } = useQuery({
    queryKey: ["sale", saleId],
    queryFn: () => getSale(saleId!),
    enabled: !!saleId && open,
  });

  const formattedDate = sale?.created_at
    ? dayjs(sale.created_at).format("DD/MM/YYYY [às] HH:mm")
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

  const handleConfirmCancelSale = async () => {
    if (!sale) return;
    setIsSubmitting(true);
    try {
      await cancelSale(sale.id, cancelSaleReason.trim() || undefined);
      toast.success("Venda cancelada com sucesso!");
      queryClient.invalidateQueries({ queryKey: ["sale", sale.id] });
      queryClient.invalidateQueries({ queryKey: ["sales"] });
      queryClient.invalidateQueries({ queryKey: ["day-sales"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-startup"] });
      queryClient.invalidateQueries({ queryKey: ["cash-status"] });
      queryClient.invalidateQueries({ queryKey: ["cash-register"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["appointments"] });
      queryClient.invalidateQueries({ queryKey: ["clientPackages"] });
      queryClient.invalidateQueries({ queryKey: ["open-comandas"] });
      queryClient.invalidateQueries({ queryKey: ["open-invoices"] });
      queryClient.invalidateQueries({ queryKey: ["pos-startup"] });
      queryClient.invalidateQueries({ queryKey: ["pos-client"] });
      queryClient.invalidateQueries({ queryKey: ["commissions"] });
      queryClient.invalidateQueries({ queryKey: ["financial-bills"] });
      queryClient.invalidateQueries({ queryKey: ["dre-report"] });
      setIsCancelSaleOpen(false);
      setCancelSaleReason("");
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || "Erro ao cancelar venda.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmCancelItem = async () => {
    if (!sale || !itemToCancel) return;
    setIsSubmitting(true);
    try {
      await cancelSaleItem(sale.id, itemToCancel.id, cancelItemReason.trim() || undefined);
      toast.success(`Item "${itemToCancel.name}" cancelado/estornado com sucesso!`);
      queryClient.invalidateQueries({ queryKey: ["sale", sale.id] });
      queryClient.invalidateQueries({ queryKey: ["sales"] });
      queryClient.invalidateQueries({ queryKey: ["day-sales"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-startup"] });
      queryClient.invalidateQueries({ queryKey: ["cash-status"] });
      queryClient.invalidateQueries({ queryKey: ["cash-register"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["appointments"] });
      queryClient.invalidateQueries({ queryKey: ["clientPackages"] });
      queryClient.invalidateQueries({ queryKey: ["open-comandas"] });
      queryClient.invalidateQueries({ queryKey: ["open-invoices"] });
      queryClient.invalidateQueries({ queryKey: ["pos-startup"] });
      queryClient.invalidateQueries({ queryKey: ["pos-client"] });
      queryClient.invalidateQueries({ queryKey: ["commissions"] });
      queryClient.invalidateQueries({ queryKey: ["financial-bills"] });
      queryClient.invalidateQueries({ queryKey: ["dre-report"] });
      setItemToCancel(null);
      setCancelItemReason("");
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || "Erro ao estornar item.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const hasActiveItems = useMemo(() => {
    if (!sale) return false;
    return sale.items.some((i: any) => (i.status ?? "active") !== "canceled");
  }, [sale]);

  return (
    <>
      <Dialog
        open={open}
        onClose={onClose}
        fullWidth
        maxWidth="md"
        PaperProps={{ sx: { minHeight: 400, borderRadius: 2.5 } }}
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
              {/* Canceled banner if sale is canceled */}
              {sale.status === "canceled" && (
                <Alert
                  severity="error"
                  icon={<AlertTriangle size={20} />}
                  sx={{ mb: 2.5, fontWeight: 600 }}
                >
                  <Typography variant="subtitle2" fontWeight={800}>
                    Esta venda está cancelada.
                  </Typography>
                  {sale.canceled_at && (
                    <Typography variant="caption" display="block">
                      Data do cancelamento: {dayjs(sale.canceled_at).format("DD/MM/YYYY [às] HH:mm")}
                    </Typography>
                  )}
                  {sale.cancel_reason && (
                    <Typography variant="caption" display="block">
                      Motivo: {sale.cancel_reason}
                    </Typography>
                  )}
                </Alert>
              )}

              {/* Header Info */}
              <Box sx={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 2, mb: 3 }}>
                <Paper sx={{ p: 2, display: "flex", alignItems: "center", gap: 1.5, borderRadius: 2 }}>
                  <User size={20} color="gray" />
                  <Box>
                    <Typography variant="caption" color="text.disabled" fontWeight={600}>CLIENTE</Typography>
                    <Typography variant="body1" fontWeight={600}>
                      {sale.client?.name || sale.appointment?.client?.name || "Consumidor (Sem cadastro)"}
                    </Typography>
                  </Box>
                </Paper>
                <Paper sx={{ p: 2, display: "flex", alignItems: "center", gap: 1.5, borderRadius: 2 }}>
                  <Calendar size={20} color="gray" />
                  <Box>
                    <Typography variant="caption" color="text.disabled" fontWeight={600}>DATA</Typography>
                    <Typography variant="body1" fontWeight={600}>{formattedDate}</Typography>
                  </Box>
                </Paper>
                <Paper sx={{ p: 2, display: "flex", alignItems: "center", gap: 1.5, borderRadius: 2 }}>
                  <ShoppingCart size={20} color="gray" />
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="caption" color="text.disabled" fontWeight={600}>STATUS / PAGAMENTO</Typography>
                    <Box sx={{ display: "flex", gap: 1, alignItems: "center", flexWrap: "wrap" }}>
                      <Chip
                        label={sale.status === "completed" ? "Finalizada" : "Cancelada"}
                        color={sale.status === "completed" ? "success" : "error"}
                        size="small"
                        sx={{ fontWeight: 700, height: 20 }}
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

              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1.5 }}>
                <Typography variant="h6" fontWeight={700}>
                  Itens da Venda
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {sale.items.length} {sale.items.length === 1 ? "item registrado" : "itens registrados"}
                </Typography>
              </Box>

              <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2 }}>
                <Table size="small">
                  <TableHead sx={{ bgcolor: "background.default" }}>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 700 }}>Descrição</TableCell>
                      <TableCell align="center" sx={{ fontWeight: 700 }}>Tipo</TableCell>
                      <TableCell align="center" sx={{ fontWeight: 700 }}>Qtd</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700 }}>Preço Unit.</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700 }}>Subtotal</TableCell>
                      <TableCell align="center" sx={{ fontWeight: 700 }}>Status</TableCell>
                      {isOwnerOrAdmin && <TableCell align="center" sx={{ fontWeight: 700 }}>Ação</TableCell>}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {sale.items.map((item: any) => {
                      const isPackageSale = sale.payment_method === "package";
                      const isCanceled = item.status === "canceled" || sale.status === "canceled";
                      const realPriceCents = isPackageSale
                        ? (item.unit_price > 0 ? item.unit_price * 100 : (appointmentServicePriceMap[item.item_id] ?? 0))
                        : null;

                      return (
                        <TableRow
                          key={item.id}
                          hover
                          sx={{
                            bgcolor: isCanceled ? "rgba(239, 68, 68, 0.04)" : "inherit",
                          }}
                        >
                          <TableCell>
                            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                              <Typography
                                variant="subtitle2"
                                fontWeight={600}
                                sx={{
                                  textDecoration: isCanceled ? "line-through" : "none",
                                  color: isCanceled ? "text.secondary" : "text.primary",
                                }}
                              >
                                {item.name}
                              </Typography>
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
                            {item.cancel_reason && (
                              <Typography variant="caption" color="error.main" display="block">
                                Motivo: {item.cancel_reason}
                              </Typography>
                            )}
                          </TableCell>
                          <TableCell align="center">
                            {(() => {
                              const isItemPackageCovered =
                                item.subtotal === 0 &&
                                (item.item_type === "service" || item.name.toLowerCase().includes("pacote"));

                              return (
                                <Chip
                                  label={
                                    isItemPackageCovered
                                      ? "Serviço (Pacote)"
                                      : item.item_type === "product"
                                      ? "Produto"
                                      : item.item_type === "service"
                                      ? "Serviço"
                                      : "Pacote"
                                  }
                                  size="small"
                                  color={isItemPackageCovered ? "info" : "default"}
                                  variant="outlined"
                                  sx={{ fontSize: "0.68rem", height: 20, fontWeight: isItemPackageCovered ? 700 : 500 }}
                                />
                              );
                            })()}
                          </TableCell>
                          <TableCell align="center" sx={{ color: isCanceled ? "text.secondary" : "inherit" }}>
                            {typeof item.quantity === "number"
                              ? (Number.isInteger(item.quantity)
                                  ? item.quantity
                                  : Number(item.quantity.toFixed(3)).toLocaleString("pt-BR"))
                              : item.quantity}
                          </TableCell>
                          <TableCell align="right">
                            {(() => {
                              const isItemPackageCovered =
                                item.subtotal === 0 &&
                                (item.item_type === "service" || item.name.toLowerCase().includes("pacote"));

                              if ((isPackageSale && realPriceCents) || (isItemPackageCovered && item.unit_price > 0)) {
                                return (
                                  <Typography variant="body2" sx={{ textDecoration: "line-through", color: "text.disabled" }}>
                                    {formatCurrency(isPackageSale && realPriceCents ? realPriceCents : item.unit_price * 100)}
                                  </Typography>
                                );
                              }
                              return (
                                <Typography
                                  variant="body2"
                                  sx={{
                                    textDecoration: isCanceled ? "line-through" : "none",
                                    color: isCanceled ? "text.secondary" : "inherit",
                                  }}
                                >
                                  {formatCurrency(item.unit_price * 100)}
                                </Typography>
                              );
                            })()}
                          </TableCell>
                          <TableCell align="right">
                            {(() => {
                              const isItemPackageCovered =
                                item.subtotal === 0 &&
                                (item.item_type === "service" || item.name.toLowerCase().includes("pacote"));

                              if (isPackageSale || isItemPackageCovered) {
                                return (
                                  <Typography variant="body2" color="success.main" fontWeight={700}>
                                    R$ 0,00
                                  </Typography>
                                );
                              }
                              return (
                                <Typography
                                  variant="body2"
                                  fontWeight={600}
                                  sx={{
                                    textDecoration: isCanceled ? "line-through" : "none",
                                    color: isCanceled ? "error.main" : "text.primary",
                                  }}
                                >
                                  {formatCurrency(item.subtotal * 100)}
                                </Typography>
                              );
                            })()}
                          </TableCell>
                          <TableCell align="center">
                            {isCanceled ? (
                              <Tooltip title={item.cancel_reason || "Item cancelado / estornado"}>
                                <Chip
                                  label="Cancelado"
                                  size="small"
                                  color="error"
                                  variant="filled"
                                  sx={{ height: 20, fontSize: "0.68rem", fontWeight: 700 }}
                                />
                              </Tooltip>
                            ) : (
                              <Chip
                                label="Ativo"
                                size="small"
                                color="success"
                                variant="outlined"
                                sx={{ height: 20, fontSize: "0.68rem", fontWeight: 700 }}
                              />
                            )}
                          </TableCell>
                          {isOwnerOrAdmin && (
                            <TableCell align="center">
                              {!isCanceled && sale.status !== "canceled" ? (
                                <Tooltip title={item.item_type === "product" ? "Devolver produto e estornar" : "Cancelar item e estornar"}>
                                  <Button
                                    variant="outlined"
                                    size="small"
                                    color="error"
                                    startIcon={<RotateCcw size={13} />}
                                    onClick={() => setItemToCancel(item)}
                                    sx={{
                                      fontSize: "0.72rem",
                                      py: 0.25,
                                      px: 1,
                                      whiteSpace: "nowrap",
                                    }}
                                  >
                                    {item.item_type === "product" ? "Devolver" : "Cancelar"}
                                  </Button>
                                </Tooltip>
                              ) : (
                                <Typography variant="caption" color="text.disabled">—</Typography>
                              )}
                            </TableCell>
                          )}
                        </TableRow>
                      );
                    })}
                    <TableRow sx={{ bgcolor: "background.default" }}>
                      <TableCell colSpan={4} align="right">
                        <Box sx={{ display: "flex", flexDirection: "column", alignItems: "flex-end" }}>
                          <Typography variant="h6" fontWeight={700}>Total da Venda</Typography>
                          {sale.items.some((i: any) => i.status === "canceled") && sale.status !== "canceled" && (
                            <Typography variant="caption" color="text.secondary" fontWeight={500}>
                              (ajustado após estornos)
                            </Typography>
                          )}
                        </Box>
                      </TableCell>
                      <TableCell align="right" colSpan={isOwnerOrAdmin ? 3 : 2}>
                        <Typography
                          variant="h5"
                          color={sale.status === "canceled" ? "text.secondary" : "primary.main"}
                          fontWeight={800}
                          sx={{ textDecoration: sale.status === "canceled" ? "line-through" : "none" }}
                        >
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

        <DialogActions sx={{ p: 2, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <Box sx={{ display: "flex", gap: 1.5, alignItems: "center" }}>
            <Button
              variant="contained"
              startIcon={<Printer size={16} />}
              onClick={() => setIsReceiptModalOpen(true)}
              disabled={!sale}
              sx={{
                bgcolor: "#2563EB",
                color: "#ffffff",
                fontWeight: 700,
                "&:hover": { bgcolor: "#1D4ED8" },
              }}
            >
              Comprovante
            </Button>

            {isOwnerOrAdmin && sale && sale.status !== "canceled" && hasActiveItems && (
              <Button
                variant="outlined"
                color="error"
                startIcon={<XCircle size={16} />}
                onClick={() => setIsCancelSaleOpen(true)}
                sx={{
                  fontWeight: 700,
                  fontSize: "0.82rem",
                  borderColor: "error.main",
                  "&:hover": { bgcolor: "error.light", color: "error.contrastText" },
                }}
              >
                Cancelar Venda Inteira
              </Button>
            )}
          </Box>

          <Button variant="outlined" onClick={onClose}>
            Fechar
          </Button>
        </DialogActions>
      </Dialog>

      {/* Modal de Comprovante */}
      {isReceiptModalOpen && sale && (
        <SaleReceiptModal
          open={isReceiptModalOpen}
          onClose={() => setIsReceiptModalOpen(false)}
          sale={sale}
          clientName={sale.client?.name || sale.appointment?.client?.name}
          clientPhone={sale.client?.phone || sale.appointment?.client?.phone}
        />
      )}

      {/* Modal de Confirmação de Cancelamento de Item */}
      <Dialog
        open={Boolean(itemToCancel)}
        onClose={() => !isSubmitting && setItemToCancel(null)}
        maxWidth="xs"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3, p: 1 } }}
      >
        <DialogTitle sx={{ display: "flex", alignItems: "center", gap: 1, color: "error.main" }}>
          <AlertTriangle size={22} />
          <Typography variant="h6" fontWeight={700}>
            {itemToCancel?.item_type === "product" ? "Devolver Produto" : "Cancelar Item"}
          </Typography>
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ mb: 2 }}>
            Você está prestes a estornar <strong>{itemToCancel?.name}</strong> (R$ {itemToCancel ? itemToCancel.subtotal.toFixed(2) : "0,00"}).
          </Typography>
          {itemToCancel?.item_type === "product" && (
            <Alert severity="info" sx={{ mb: 2, fontSize: "0.82rem" }}>
              <strong>Estoque:</strong> A quantidade ({itemToCancel.quantity} {itemToCancel.unit || "un"}) será devolvida automaticamente ao estoque.
            </Alert>
          )}
          <TextField
            label="Motivo do cancelamento/devolução (opcional)"
            placeholder="Ex: Cliente devolveu, defeito, etc."
            fullWidth
            size="small"
            multiline
            rows={2}
            value={cancelItemReason}
            onChange={(e) => setCancelItemReason(e.target.value)}
          />
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button variant="outlined" onClick={() => setItemToCancel(null)} disabled={isSubmitting}>
            Voltar
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={handleConfirmCancelItem}
            loading={isSubmitting}
            sx={{ fontWeight: 700 }}
          >
            Confirmar Estorno
          </Button>
        </DialogActions>
      </Dialog>

      {/* Modal de Confirmação de Cancelamento da Venda Inteira */}
      <Dialog
        open={isCancelSaleOpen}
        onClose={() => !isSubmitting && setIsCancelSaleOpen(false)}
        maxWidth="xs"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3, p: 1 } }}
      >
        <DialogTitle sx={{ display: "flex", alignItems: "center", gap: 1, color: "error.main" }}>
          <AlertTriangle size={22} />
          <Typography variant="h6" fontWeight={700}>
            Cancelar Venda #{sale?.id}?
          </Typography>
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ mb: 2 }}>
            Tem certeza que deseja cancelar toda a venda no valor de <strong>R$ {sale ? sale.total_amount.toFixed(2) : "0,00"}</strong>?
          </Typography>
          <Alert severity="warning" sx={{ mb: 2, fontSize: "0.82rem" }}>
            Todos os produtos ativos desta venda serão devolvidos ao estoque e o valor recebido em dinheiro será estornado no caixa.
          </Alert>
          <TextField
            label="Motivo do cancelamento (opcional)"
            placeholder="Ex: Cliente desistiu da compra"
            fullWidth
            size="small"
            multiline
            rows={2}
            value={cancelSaleReason}
            onChange={(e) => setCancelSaleReason(e.target.value)}
          />
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button variant="outlined" onClick={() => setIsCancelSaleOpen(false)} disabled={isSubmitting}>
            Voltar
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={handleConfirmCancelSale}
            loading={isSubmitting}
            sx={{ fontWeight: 700 }}
          >
            Confirmar Cancelamento
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
