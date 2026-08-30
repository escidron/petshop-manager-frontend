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
  CheckCircle,
  AlertTriangle,
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
      total_amount: totalAmount,
      discount_amount: discountAmount,
      payment_method: paymentMethod,
      status: "completed",
      items: itemsWithEmployee,
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
            m: { xs: 1, sm: 2 },
            width: { xs: "96vw", sm: "auto" },
            maxHeight: { xs: "92vh", sm: "90vh" },
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
            px: { xs: 2, sm: 3 },
            py: { xs: 1.5, sm: 2 },
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
            <ShoppingCart size={22} />
            <Typography variant="h6" sx={{ fontWeight: 700, fontSize: { xs: "1.1rem", sm: "1.25rem" } }}>
              Finalizar Venda
            </Typography>
          </Box>
          <IconButton onClick={onClose} size="small" sx={{ color: "white" }}>
            <X size={20} />
          </IconButton>
        </DialogTitle>

        <DialogContent sx={{ p: { xs: 2, sm: 4 } }}>
          <Box
            sx={{
              mb: 3,
              p: { xs: 2, sm: 3 },
              bgcolor: alpha("#1976d2", 0.05),
              borderRadius: 3,
              textAlign: "center",
              border: "1px solid",
              borderColor: alpha("#1976d2", 0.1),
            }}
          >
            <Typography variant="subtitle2" color="text.primary" sx={{ fontWeight: 600, mb: 0.5 }}>
              TOTAL A RECEBER
            </Typography>
            <Typography
              variant="h3"
              color="primary"
              sx={{ fontWeight: 900, fontSize: { xs: "1.8rem", sm: "2.75rem" } }}
            >
              R$ {totalAmount.toFixed(2)}
            </Typography>
          </Box>

          {/* Employee assignment per service item */}
          {serviceItems.length > 0 && (
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle1" sx={{ mb: employees.length > 0 ? 1.5 : 0, fontWeight: 700 }}>
                Funcionário por Serviço
              </Typography>
              {employees.length > 0 ? (
                <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
                  {serviceItems.map(({ item, idx }) => (
                    <Box key={idx} sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                      <Typography variant="body2" sx={{ flex: 1, color: "text.primary" }}>
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
                        sx={{ minWidth: 300 }}
                        noOptionsText="Nenhum funcionário encontrado"
                        renderInput={(params) => (
                          <TextField {...params} placeholder="Buscar..." />
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
              <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2 }}>
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

        <DialogActions sx={{ p: 3, gap: 2 }}>
          <Button
            onClick={onClose}
            disabled={saleMutation.isPending}
            variant="outlined"
            sx={{ borderRadius: 2, px: 3 }}
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
            sx={{ borderRadius: 2, fontWeight: 600, boxShadow: "0 4px 14px 0 rgba(46, 125, 50, 0.39)" }}
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
        p: 2,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        cursor: "pointer",
        border: "2px solid",
        borderColor: isSelected ? color : "divider",
        bgcolor: isSelected ? alpha(color, 0.04) : "background.paper",
        borderRadius: 3,
        transition: "all 0.2s",
        gap: 1,
        position: "relative",
        "&:hover": {
          borderColor: isSelected ? color : alpha(color, 0.5),
          bgcolor: alpha(color, 0.02),
        },
      }}
    >
      <Radio
        value={value}
        sx={{ position: "absolute", top: 8, right: 8, p: 0 }}
        checked={isSelected}
      />
      <Icon size={32} color={color} />
      <Typography variant="body2" sx={{ fontWeight: 700, textAlign: "center" }}>
        {label}
      </Typography>
      {isSelected && (
        <Box
          sx={{
            position: "absolute",
            bottom: -10,
            bgcolor: "white",
            borderRadius: "50%",
            color: color,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <CheckCircle size={20} strokeWidth={3} />
        </Box>
      )}
    </Paper>
  );
};
