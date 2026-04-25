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
import { X, Receipt, ShoppingCart, User, Calendar } from "lucide-react";
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
                <Box>
                  <Typography variant="caption" color="text.disabled" fontWeight={600}>STATUS / PAGAMENTO</Typography>
                  <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
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
                  {sale.items.map((item) => (
                    <TableRow key={item.id} hover>
                      <TableCell>
                        <Box>
                          <Typography variant="subtitle2" fontWeight={600}>{item.name}</Typography>
                        </Box>
                      </TableCell>
                      <TableCell align="center">{item.quantity}</TableCell>
                      <TableCell align="right">{formatCurrency(item.unit_price * 100)}</TableCell>
                      <TableCell align="right">{formatCurrency(item.subtotal * 100)}</TableCell>
                    </TableRow>
                  ))}
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
