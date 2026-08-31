import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
  Box,
  Radio,
  RadioGroup,
  FormControl,
  Divider,
  Paper,
  IconButton,
  alpha,
  Alert,
  Autocomplete,
  TextField,
} from "@mui/material";
import {
  ShoppingCart,
  Banknote,
  CreditCard,
  QrCode,
  X,
  AlertTriangle,
  Check,
} from "lucide-react";
import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createSale } from "../../api/services/sales";
import { getEmployees } from "../../api/services/employees";
import type { SaleItem, SaleCreate } from "./schemas";
import { useToast } from "../../hooks/useToast";
import { Button } from "../../components/Button/Button";
import type { Employee } from "../employees/types";

interface CheckoutModalProps {
  open: boolean;
  onClose: () => void;
  cart: SaleItem[];
  totalAmount: number;
  discountAmount?: number;
  clientId: number | null;
  appointmentId?: number | null;
  comandaId?: number | null;
  cashRegisterId?: number | null;
  onSuccess: () => void;
}

export default function CheckoutModal({
  open,
  onClose,
  cart,
  totalAmount,
  discountAmount = 0,
  clientId,
  appointmentId,
  comandaId,
  cashRegisterId,
  onSuccess,
}: CheckoutModalProps) {
  const [paymentMethod, setPaymentMethod] =
    useState<SaleCreate["payment_method"]>("credit_card");
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [employeeMap, setEmployeeMap] = useState<Record<number, number | null>>({});
  const [showNoEmployeeWarning, setShowNoEmployeeWarning] = useState(false);
  const [employeeLimit, setEmployeeLimit] = useState(20);
  const queryClient = useQueryClient();
  const toast = useToast();

  const serviceItems = cart
    .map((item, idx) => ({ item, idx }))
    .filter(({ item }) => item.item_type === "service");

  const serviceItemsWithoutEmployee = serviceItems.filter(
    ({ idx }) => !employeeMap[idx],
  );

  useEffect(() => {
    if (open) {
      getEmployees()
        .then((data) => setEmployees(data.filter((e) => e.is_active)))
        .catch(() => {});
      
      const initialMap: Record<number, number> = {};
      cart.forEach((item, idx) => {
        if (item.employee_id) {
          initialMap[idx] = item.employee_id;
        }
      });
      setEmployeeMap(initialMap);
      setShowNoEmployeeWarning(false);
    } else {
      setEmployeeMap({});
    }
  }, [cart, open]);

  const saleMutation = useMutation({
    mutationFn: createSale,
    onSuccess: () => {
      toast.success("Venda finalizada com sucesso!");
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["sales"] });
      queryClient.invalidateQueries({ queryKey: ["appointments"] });
      queryClient.invalidateQueries({ queryKey: ["clientPackages"] });
      queryClient.invalidateQueries({ queryKey: ["client-packages"] });
      queryClient.invalidateQueries({ queryKey: ["pos-startup"] });
      queryClient.invalidateQueries({ queryKey: ["pos-client"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-startup"] });
      queryClient.invalidateQueries({ queryKey: ["open-invoices"] });
      queryClient.invalidateQueries({ queryKey: ["open-comandas"] });
      queryClient.invalidateQueries({ queryKey: ["unpaid-packages"] });
      queryClient.invalidateQueries({ queryKey: ["cash-status"] });
      onSuccess();
      onClose();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || "Erro ao processar venda.");
    },
  });

  const doCheckout = () => {
    const itemsWithEmployee: SaleItem[] = cart.map((item, idx) => ({
      ...item,
      employee_id: item.item_type === "service" ? (employeeMap[idx] ?? null) : null,
    }));

    const payload: SaleCreate = {
      client_id: clientId,
      appointment_id: appointmentId,
      comanda_id: comandaId,
      total_amount: totalAmount,
      discount_amount: discountAmount,
      payment_method: paymentMethod,
      status: "completed",
      items: itemsWithEmployee,
      cash_register_id: cashRegisterId,
    };
    saleMutation.mutate(payload);
  };

  const handleCheckout = () => {
    if (serviceItemsWithoutEmployee.length > 0) {
      setShowNoEmployeeWarning(true);
      return;
    }
    doCheckout();
  };

  return (
    <>
      <Dialog
        open={open}
        onClose={onClose}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: { xs: 3, sm: 4 },
            overflow: "hidden",
            m: { xs: 1.5, sm: 3 },
            width: { xs: "calc(100% - 24px)", sm: "580px", md: "620px" },
            maxWidth: { xs: "100%", sm: "580px", md: "620px" },
            maxHeight: { xs: "94vh", sm: "90vh" },
            boxShadow: "0 24px 48px -12px rgba(0, 0, 0, 0.22)",
          },
        }}
      >
        <DialogTitle
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            bgcolor: "primary.main",
            color: "white",
            px: { xs: 2.5, sm: 3.5 },
            py: { xs: 2, sm: 2.25 },
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
            <Box
              sx={{
                p: 0.8,
                borderRadius: 2,
                bgcolor: "rgba(255, 255, 255, 0.15)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <ShoppingCart size={22} />
            </Box>
            <Typography
              variant="h6"
              sx={{
                fontWeight: 700,
                fontSize: { xs: "1.1rem", sm: "1.25rem" },
                letterSpacing: "-0.01em",
              }}
            >
              Finalizar Venda
            </Typography>
          </Box>
          <IconButton
            onClick={onClose}
            size="small"
            sx={{
              color: "white",
              bgcolor: "rgba(255, 255, 255, 0.1)",
              "&:hover": { bgcolor: "rgba(255, 255, 255, 0.2)" },
            }}
          >
            <X size={18} />
          </IconButton>
        </DialogTitle>

        <DialogContent sx={{ p: { xs: 2.5, sm: 3.5 } }}>
          <Box
            sx={{
              mb: 3,
              p: { xs: 2.5, sm: 3 },
              background: (theme) =>
                `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.05)} 0%, ${alpha(
                  theme.palette.primary.main,
                  0.12
                )} 100%)`,
              borderRadius: 3,
              textAlign: "center",
              border: "1px solid",
              borderColor: (theme) => alpha(theme.palette.primary.main, 0.15),
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Typography
              variant="caption"
              sx={{
                fontWeight: 700,
                letterSpacing: "0.08em",
                color: "text.primary",
                opacity: 0.75,
                textTransform: "uppercase",
                fontSize: "0.75rem",
                mb: 0.5,
              }}
            >
              Total a Receber
            </Typography>
            <Typography
              variant="h3"
              color="primary"
              sx={{
                fontWeight: 800,
                fontSize: { xs: "2.1rem", sm: "2.85rem" },
                lineHeight: 1.15,
                letterSpacing: "-0.02em",
              }}
            >
              R$ {totalAmount.toFixed(2)}
            </Typography>
            {discountAmount > 0 && (
              <Box
                sx={{
                  mt: 1.2,
                  px: 1.5,
                  py: 0.4,
                  bgcolor: (theme) => alpha(theme.palette.success.main, 0.12),
                  borderRadius: 2,
                  color: "success.main",
                  fontSize: "0.825rem",
                  fontWeight: 600,
                }}
              >
                Desconto aplicado: - R$ {discountAmount.toFixed(2)}
              </Box>
            )}
          </Box>

          {/* Employee assignment per service item */}
          {serviceItems.length > 0 && (
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle1" sx={{ mb: employees.length > 0 ? 1.5 : 0, fontWeight: 700, color: "text.primary" }}>
                Funcionário por Serviço
              </Typography>
              {employees.length > 0 ? (
                <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
                  {serviceItems.map(({ item, idx }) => (
                    <Box
                      key={idx}
                      sx={{
                        display: "flex",
                        flexDirection: { xs: "column", sm: "row" },
                        alignItems: { xs: "flex-start", sm: "center" },
                        justifyContent: "space-between",
                        p: 1.5,
                        borderRadius: 2,
                        bgcolor: alpha("#1976d2", 0.03),
                        border: "1px solid",
                        borderColor: alpha("#1976d2", 0.1),
                        gap: 1.5,
                      }}
                    >
                      <Typography variant="body2" sx={{ fontWeight: 600, color: "text.primary", flex: 1 }}>
                        {item.name}
                      </Typography>
                      <Autocomplete
                        options={employees}
                        filterOptions={(options, state) => {
                          const input = state.inputValue.toLowerCase();
                          return options.filter((option) =>
                            option.name.toLowerCase().includes(input)
                          ).slice(0, employeeLimit);
                        }}
                        onInputChange={(_, __, reason) => {
                          if (reason === "input") setEmployeeLimit(20);
                        }}
                        ListboxProps={{
                          onScroll: (event: React.SyntheticEvent) => {
                            const listboxNode = event.currentTarget;
                            if (listboxNode.scrollTop + listboxNode.clientHeight >= listboxNode.scrollHeight - 10) {
                              setEmployeeLimit((prev) => prev + 20);
                            }
                          }
                        }}
                        getOptionLabel={(option) => option.name}
                        renderOption={(props, option) => {
                          const { key, ...restProps } = props as any;
                          return (
                            <li key={option.id} {...restProps}>
                              {option.name}
                            </li>
                          );
                        }}
                        isOptionEqualToValue={(option, value) => String(option.id) === String(value.id)}
                        value={employees.find((emp) => String(emp.id) === String(employeeMap[idx])) || null}
                        onChange={(_, newValue) => {
                          setEmployeeMap((prev) => ({
                            ...prev,
                            [idx]: newValue ? newValue.id : null,
                          }));
                        }}
                        size="small"
                        sx={{ width: { xs: "100%", sm: 260 } }}
                        noOptionsText="Nenhum funcionário encontrado"
                        renderInput={(params) => (
                          <TextField {...params} placeholder="Selecione funcionário..." />
                        )}
                      />
                    </Box>
                  ))}
                </Box>
              ) : (
                <Alert severity="info" sx={{ mt: 1 }}>
                  Você não possui funcionários cadastrados/ativos. Cadastre sua equipe na página de <strong>Funcionários</strong> para poder atribuir os serviços e calcular comissões!
                </Alert>
              )}
            </Box>
          )}

          <FormControl component="fieldset" fullWidth>
            <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 700, color: "text.primary" }}>
              Selecione a Forma de Pagamento
            </Typography>
            <RadioGroup
              value={paymentMethod}
              onChange={(e) =>
                setPaymentMethod(e.target.value as SaleCreate["payment_method"])
              }
            >
              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: { xs: "1fr 1fr", sm: "1fr 1fr" },
                  gap: { xs: 1.5, sm: 2 },
                }}
              >
                <PaymentMethodCard
                  value="credit_card"
                  label="Cartão de Crédito"
                  icon={CreditCard}
                  color="#1976d2"
                  selectedPaymentMethod={paymentMethod}
                />
                <PaymentMethodCard
                  value="debit_card"
                  label="Cartão de Débito"
                  icon={CreditCard}
                  color="#0288d1"
                  selectedPaymentMethod={paymentMethod}
                />
                <PaymentMethodCard
                  value="pix"
                  label="PIX"
                  icon={QrCode}
                  color="#2e7d32"
                  selectedPaymentMethod={paymentMethod}
                />
                <PaymentMethodCard
                  value="money"
                  label="Dinheiro"
                  icon={Banknote}
                  color="#ed6c02"
                  selectedPaymentMethod={paymentMethod}
                />
              </Box>
            </RadioGroup>
          </FormControl>
        </DialogContent>

        <Divider />

        <DialogActions sx={{ px: { xs: 2.5, sm: 3.5 }, py: { xs: 2, sm: 2.5 }, gap: { xs: 1.5, sm: 2 } }}>
          <Button
            onClick={onClose}
            disabled={saleMutation.isPending}
            variant="outlined"
            sx={{
              borderRadius: 2.5,
              px: 3,
              py: 1.2,
              fontWeight: 600,
              minWidth: { xs: "100px", sm: "120px" },
            }}
          >
            Cancelar
          </Button>
          <Button
            variant="contained"
            color="success"
            size="large"
            fullWidth
            onClick={handleCheckout}
            disabled={saleMutation.isPending}
            sx={{
              borderRadius: 2.5,
              fontWeight: 700,
              py: 1.2,
              fontSize: { xs: "0.95rem", sm: "1rem" },
              boxShadow: "0 4px 14px 0 rgba(46, 125, 50, 0.39)",
            }}
          >
            {saleMutation.isPending ? "Processando..." : "Confirmar e Finalizar"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Warning dialog when service items have no employee */}
      <Dialog
        open={showNoEmployeeWarning}
        onClose={() => setShowNoEmployeeWarning(false)}
        maxWidth="xs"
        fullWidth
      >
        <DialogContent sx={{ pt: 3 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 2 }}>
            <AlertTriangle size={24} color="#ed6c02" />
            <Typography variant="h6" fontWeight={700}>
              Serviços sem funcionário
            </Typography>
          </Box>
          {employees.length === 0 ? (
            <Alert severity="warning" sx={{ mb: 2 }}>
              O sistema identificou serviços na venda, mas <strong>nenhum funcionário</strong> está cadastrado ainda. Com isso, nenhuma comissão será calculada em sua plataforma.
            </Alert>
          ) : (
            <Alert severity="warning" sx={{ mb: 2 }}>
              {serviceItemsWithoutEmployee.length}{" "}
              {serviceItemsWithoutEmployee.length === 1 ? "serviço" : "serviços"} sem funcionário
              atribuído. A comissão não será calculada para {serviceItemsWithoutEmployee.length === 1 ? "esse item" : "esses itens"}.
            </Alert>
          )}
          <Typography variant="body2" color="text.primary">
            {employees.length === 0 
              ? "Para evitar que essa mensagem apareça, acesse a guia Funcionários no menu principal e cadastre sua equipe."
              : "Você pode atribuir o funcionário retroativamente no histórico de vendas."}
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2, gap: 1 }}>
          <Button
            variant="outlined"
            onClick={() => setShowNoEmployeeWarning(false)}
          >
            Voltar e corrigir
          </Button>
          <Button
            variant="contained"
            onClick={() => {
              setShowNoEmployeeWarning(false);
              doCheckout();
            }}
          >
            Finalizar mesmo assim
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

interface PaymentMethodCardProps {
  value: SaleCreate["payment_method"];
  label: string;
  icon: React.ElementType;
  color: string;
  selectedPaymentMethod: string;
}

const PaymentMethodCard = ({
  value,
  label,
  icon: Icon,
  color,
  selectedPaymentMethod,
}: PaymentMethodCardProps) => {
  const isSelected = selectedPaymentMethod === value;

  return (
    <Paper
      elevation={0}
      component="label"
      sx={{
        p: { xs: 1.5, sm: 2 },
        display: "flex",
        flexDirection: { xs: "column", sm: "row" },
        alignItems: "center",
        justifyContent: { xs: "center", sm: "flex-start" },
        cursor: "pointer",
        border: "2px solid",
        borderColor: isSelected ? color : "divider",
        bgcolor: isSelected ? alpha(color, 0.05) : "background.paper",
        borderRadius: 3,
        transition: "all 0.2s ease-in-out",
        gap: { xs: 1, sm: 1.75 },
        position: "relative",
        boxShadow: isSelected
          ? `0 4px 14px 0 ${alpha(color, 0.18)}`
          : "0 1px 3px rgba(0,0,0,0.03)",
        transform: isSelected ? "translateY(-1px)" : "none",
        "&:hover": {
          borderColor: isSelected ? color : alpha(color, 0.5),
          bgcolor: isSelected ? alpha(color, 0.07) : alpha(color, 0.02),
        },
      }}
    >
      <Radio
        value={value}
        checked={isSelected}
        sx={{
          display: "none",
        }}
      />
      <Box
        sx={{
          width: { xs: 40, sm: 46 },
          height: { xs: 40, sm: 46 },
          borderRadius: 2.5,
          bgcolor: isSelected ? alpha(color, 0.15) : alpha(color, 0.08),
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: color,
          flexShrink: 0,
          transition: "all 0.2s",
        }}
      >
        <Icon size={24} strokeWidth={2.2} />
      </Box>

      <Box sx={{ flex: 1, textAlign: { xs: "center", sm: "left" } }}>
        <Typography
          variant="body2"
          sx={{
            fontWeight: isSelected ? 700 : 600,
            color: isSelected ? color : "text.primary",
            fontSize: { xs: "0.85rem", sm: "0.95rem" },
            lineHeight: 1.25,
          }}
        >
          {label}
        </Typography>
      </Box>

      {/* Selected check badge on desktop */}
      <Box
        sx={{
          width: 22,
          height: 22,
          borderRadius: "50%",
          border: "2px solid",
          borderColor: isSelected ? color : "divider",
          bgcolor: isSelected ? color : "transparent",
          display: { xs: "none", sm: "flex" },
          alignItems: "center",
          justifyContent: "center",
          color: "white",
          flexShrink: 0,
          transition: "all 0.2s",
        }}
      >
        {isSelected && <Check size={14} strokeWidth={3} />}
      </Box>

      {/* Mobile top-right active indicator */}
      {isSelected && (
        <Box
          sx={{
            position: "absolute",
            top: 6,
            right: 6,
            display: { xs: "flex", sm: "none" },
            width: 18,
            height: 18,
            borderRadius: "50%",
            bgcolor: color,
            color: "white",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Check size={12} strokeWidth={3} />
        </Box>
      )}
    </Paper>
  );
};
