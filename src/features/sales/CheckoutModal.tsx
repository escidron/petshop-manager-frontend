import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
  Box,
  Divider,
  Paper,
  IconButton,
  alpha,
  Alert,
  Autocomplete,
  TextField,
  InputAdornment,
  Chip,
} from "@mui/material";
import {
  ShoppingCart,
  Banknote,
  CreditCard,
  QrCode,
  X,
  AlertTriangle,
  Check,
  Trash2,
  Clock,
  UserCheck,
} from "lucide-react";
import { useState, useEffect, useMemo } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createSale } from "../../api/services/sales";
import { getEmployees } from "../../api/services/employees";
import { useClients } from "../../hooks/useClients";
import type { SaleItem, SaleCreate, SalePayment, SaleResponse } from "./schemas";
import { useToast } from "../../hooks/useToast";
import { Button } from "../../components/Button/Button";
import type { Employee } from "../employees/types";
import { formatBRLFromCents } from "../../utils/masks";

const PAYMENT_METHODS = [
  { value: "credit_card" as const, label: "Cartão de Crédito", icon: CreditCard, color: "#1976d2" },
  { value: "debit_card" as const, label: "Cartão de Débito", icon: CreditCard, color: "#0288d1" },
  { value: "pix" as const, label: "PIX", icon: QrCode, color: "#2e7d32" },
  { value: "money" as const, label: "Dinheiro", icon: Banknote, color: "#ed6c02" },
];

interface CheckoutModalProps {
  open: boolean;
  onClose: () => void;
  cart: SaleItem[];
  totalAmount: number;
  discountAmount?: number;
  clientId: number | null;
  clientName?: string | null;
  clients?: Array<{ id: number; name: string; phone?: string; [key: string]: any }>;
  allPets?: Array<{ id: number; client_id: number; name: string; [key: string]: any }>;
  onSelectClient?: (clientId: number | null) => void;
  appointmentId?: number | null;
  comandaId?: number | null;
  cashRegisterId?: number | null;
  onSuccess: (sale?: SaleResponse) => void;
}

export default function CheckoutModal({
  open,
  onClose,
  cart,
  totalAmount,
  discountAmount = 0,
  clientId,
  clientName,
  clients,
  allPets,
  onSelectClient,
  appointmentId,
  comandaId,
  cashRegisterId,
  onSuccess,
}: CheckoutModalProps) {
  const { clients: hookClients } = useClients();
  const availableClients = clients && clients.length > 0 ? clients : hookClients;

  const [selectedClientInternal, setSelectedClientInternal] = useState<number | null>(clientId);
  const [clientSearchLimit, setClientSearchLimit] = useState(20);

  useEffect(() => {
    setSelectedClientInternal(clientId);
  }, [clientId, open]);

  const effectiveClientId = selectedClientInternal ?? clientId;
  const currentClientObj = availableClients.find((c) => c.id === effectiveClientId);
  const effectiveClientName =
    clientName || currentClientObj?.name || (effectiveClientId ? `Cliente #${effectiveClientId}` : null);
  const [selectedMethods, setSelectedMethods] = useState<SalePayment["payment_method"][]>([
    "credit_card",
  ]);
  const [methodAmounts, setMethodAmounts] = useState<Record<string, number | undefined>>({});

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
      setSelectedMethods(["credit_card"]);
      const totalCents = Math.round(totalAmount * 100);
      setMethodAmounts({ credit_card: totalCents });

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
  }, [cart, open, totalAmount]);

  const totalCents = Math.round(totalAmount * 100);

  const totalDistributedCents = useMemo(() => {
    return selectedMethods.reduce(
      (acc, m) => acc + (methodAmounts[m] || 0),
      0,
    );
  }, [selectedMethods, methodAmounts]);

  const totalDistributed = totalDistributedCents / 100;
  const differenceCents = totalCents - totalDistributedCents;
  const difference = differenceCents / 100;
  const isDifferenceZero = differenceCents === 0;

  const handleCardClick = (value: SalePayment["payment_method"]) => {
    // 1. If method is already selected:
    if (selectedMethods.includes(value)) {
      if (selectedMethods.length > 1) {
        handleRemoveMethod(value);
      }
      return;
    }

    // 2. If only 1 method is selected and it has 100% of the value (no difference):
    // Just switch the method for the sale
    if (selectedMethods.length === 1 && differenceCents === 0) {
      setSelectedMethods([value]);
      setMethodAmounts({ [value]: totalCents });
      return;
    }

    // 3. Otherwise (there is a remaining difference or already multiple methods):
    // Add this method to the distribution, prefilled with the remaining amount!
    const updated = [...selectedMethods, value];
    setSelectedMethods(updated);

    const currentSumCents = selectedMethods.reduce(
      (acc, m) => acc + (methodAmounts[m] || 0),
      0,
    );
    const remainderCents = Math.max(0, totalCents - currentSumCents);

    setMethodAmounts((prev) => ({
      ...prev,
      [value]: remainderCents > 0 ? remainderCents : undefined,
    }));
  };

  const handleRemoveMethod = (method: SalePayment["payment_method"]) => {
    if (selectedMethods.length <= 1) return;
    setSelectedMethods((prev) => prev.filter((m) => m !== method));
    setMethodAmounts((prev) => {
      const next = { ...prev };
      delete next[method];
      return next;
    });
  };

  const handleAmountChange = (method: string, rawVal: string) => {
    const digits = rawVal.replace(/\D/g, "").slice(0, 9);
    setMethodAmounts((prev) => ({
      ...prev,
      [method]: digits === "" ? undefined : Number(digits),
    }));
  };

  const handleFillRemainder = (method: string) => {
    const otherSumCents = selectedMethods
      .filter((m) => m !== method)
      .reduce((acc, m) => acc + (methodAmounts[m] || 0), 0);
    const remainderCents = Math.max(0, totalCents - otherSumCents);
    setMethodAmounts((prev) => ({
      ...prev,
      [method]: remainderCents,
    }));
  };

  const isPositiveDistributed = totalDistributedCents > 0;
  const isNotExceeded = differenceCents >= 0;
  const canLeaveInComanda = differenceCents === 0 || !!effectiveClientId;

  const isCheckoutValid =
    totalCents === 0
      ? true
      : selectedMethods.length >= 1 &&
        selectedMethods.every((m) => (methodAmounts[m] || 0) > 0) &&
        isPositiveDistributed &&
        isNotExceeded &&
        canLeaveInComanda;

  const saleMutation = useMutation({
    mutationFn: createSale,
    onSuccess: (data: SaleResponse) => {
      if (differenceCents > 0) {
        toast.success(
          `Venda de R$ ${totalDistributed.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} finalizada! R$ ${difference.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} permaneceram em aberto na comanda${effectiveClientName ? ` de ${effectiveClientName}` : ""}.`
        );
      } else {
        toast.success("Venda finalizada com sucesso!");
      }
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

      const finalSaleData: SaleResponse = {
        ...data,
        client: data.client || (currentClientObj ? { id: currentClientObj.id, name: currentClientObj.name, phone: currentClientObj.phone } : undefined),
        items: data.items && data.items.length > 0 ? data.items : (cart as any),
      };

      onSuccess(finalSaleData);
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

    const isPartial = differenceCents > 0;
    const finalTotalAmount = isPartial ? totalDistributed : totalAmount;

    const isMultiple = selectedMethods.length > 1;
    const finalPaymentMethod: SaleCreate["payment_method"] = isMultiple
      ? "multiple"
      : selectedMethods[0];

    const paymentsPayload: SalePayment[] =
      totalCents === 0
        ? [{ payment_method: selectedMethods[0] || "other", amount: 0 }]
        : selectedMethods.map((m) => ({
            payment_method: m,
            amount: Number(((methodAmounts[m] || 0) / 100).toFixed(2)),
          }));

    const payload: SaleCreate = {
      client_id: effectiveClientId,
      appointment_id: appointmentId,
      comanda_id: comandaId,
      total_amount: Number(finalTotalAmount.toFixed(2)),
      discount_amount: discountAmount,
      payment_method: finalPaymentMethod,
      status: "completed",
      items: itemsWithEmployee,
      payments: paymentsPayload,
      cash_register_id: cashRegisterId,
      unpaid_remainder: isPartial ? Number(difference.toFixed(2)) : undefined,
    };
    saleMutation.mutate(payload);
  };

  const handleCheckout = () => {
    if (serviceItemsWithoutEmployee.length > 0) {
      setShowNoEmployeeWarning(true);
      return;
    }
    if (differenceCents < 0) {
      toast.error(
        `O valor informado excede o total em R$ ${Math.abs(difference).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}.`
      );
      return;
    }
    if (differenceCents > 0 && !effectiveClientId) {
      toast.error("Para deixar saldo em aberto na comanda, é obrigatório vincular um cliente à venda.");
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
              R$ {totalAmount.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
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
                Desconto aplicado: - R$ {discountAmount.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
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

          <Box sx={{ width: "100%" }}>
            <Box sx={{ mb: 1.5 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 700, color: "text.primary" }}>
                Forma de Pagamento
              </Typography>
              <Typography variant="caption" sx={{ color: "text.secondary", display: "block" }}>
                {selectedMethods.length > 1
                  ? "Formas ativas na distribuição. Clique em uma forma para adicionar ou remover."
                  : "Para dividir o pagamento, altere o valor abaixo e selecione outra forma."}
              </Typography>
            </Box>

            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: { xs: "1fr 1fr", sm: "1fr 1fr" },
                gap: { xs: 1.5, sm: 2 },
              }}
            >
              {PAYMENT_METHODS.map((pm) => {
                const isSelected = selectedMethods.includes(pm.value);
                return (
                  <PaymentMethodCard
                    key={pm.value}
                    value={pm.value}
                    label={pm.label}
                    icon={pm.icon}
                    color={pm.color}
                    isSelected={isSelected}
                    assignedAmountCents={methodAmounts[pm.value]}
                    showAmountSubtitle={selectedMethods.length > 1}
                    hintAddCents={differenceCents > 0 && !isSelected ? differenceCents : undefined}
                    onClick={() => handleCardClick(pm.value)}
                  />
                );
              })}
            </Box>

            {/* Painel de distribuição dos valores (SEMPRE VISÍVEL) */}
            <Paper
              elevation={0}
              sx={{
                mt: 2.5,
                p: { xs: 2, sm: 2.5 },
                bgcolor: "#F8FAFC",
                borderRadius: 3,
                border: "1.5px solid #E2E8F0",
              }}
            >
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
                <Typography
                  variant="subtitle2"
                  sx={{
                    fontWeight: 800,
                    color: "#1E293B",
                    fontSize: "0.8rem",
                    textTransform: "uppercase",
                    letterSpacing: 0.5,
                  }}
                >
                  Distribuição dos Valores
                </Typography>
                <Typography variant="caption" sx={{ color: "text.secondary", fontWeight: 600 }}>
                  {selectedMethods.length} {selectedMethods.length === 1 ? "forma selecionada" : "formas selecionadas"}
                </Typography>
              </Box>

              <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
                {selectedMethods.map((method) => {
                  const methodInfo = PAYMENT_METHODS.find((p) => p.value === method) || {
                    label: method,
                    icon: CreditCard,
                    color: "#1976d2",
                  };
                  const MethodIcon = methodInfo.icon;
                  return (
                    <Box
                      key={method}
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        bgcolor: "#FFFFFF",
                        p: 1.5,
                        borderRadius: 2.5,
                        border: "1px solid #E2E8F0",
                        gap: 1.5,
                      }}
                    >
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1.25, minWidth: { xs: 120, sm: 160 } }}>
                        <Box
                          sx={{
                            width: 32,
                            height: 32,
                            borderRadius: 1.5,
                            bgcolor: alpha(methodInfo.color, 0.1),
                            color: methodInfo.color,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          <MethodIcon size={18} />
                        </Box>
                        <Typography variant="body2" sx={{ fontWeight: 700, color: "#1E293B" }}>
                          {methodInfo.label}
                        </Typography>
                      </Box>

                      <Box sx={{ display: "flex", alignItems: "center", gap: 1, flex: 1, justifyContent: "flex-end" }}>
                        <TextField
                          size="small"
                          value={
                            methodAmounts[method] !== undefined
                              ? formatBRLFromCents(methodAmounts[method])
                              : ""
                          }
                          onChange={(e) => handleAmountChange(method, e.target.value)}
                          placeholder="0,00"
                          inputProps={{ inputMode: "numeric" }}
                          InputProps={{
                            startAdornment: (
                              <InputAdornment position="start">
                                <Typography variant="caption" sx={{ fontWeight: 700, color: "text.secondary" }}>
                                  R$
                                </Typography>
                              </InputAdornment>
                            ),
                          }}
                          sx={{
                            width: { xs: 110, sm: 140 },
                            "& .MuiOutlinedInput-root": {
                              borderRadius: 2,
                              fontWeight: 700,
                            },
                          }}
                        />
                        <Button
                          variant="outlined"
                          size="small"
                          onClick={() => handleFillRemainder(method)}
                          title="Preencher com o saldo restante"
                          sx={{
                            minWidth: { xs: "auto", sm: 80 },
                            px: { xs: 1, sm: 1.5 },
                            py: 0.6,
                            fontSize: "0.75rem",
                            fontWeight: 700,
                            borderRadius: 2,
                            whiteSpace: "nowrap",
                          }}
                        >
                          Restante
                        </Button>
                        {selectedMethods.length > 1 && (
                          <IconButton
                            size="small"
                            onClick={() => handleRemoveMethod(method)}
                            title={`Remover ${methodInfo.label}`}
                            sx={{
                              color: "text.disabled",
                              "&:hover": { color: "error.main", bgcolor: "rgba(211, 47, 47, 0.08)" },
                              p: 0.75,
                            }}
                          >
                            <Trash2 size={16} />
                          </IconButton>
                        )}
                      </Box>
                    </Box>
                  );
                })}
              </Box>

              {/* Live summary and difference check */}
              <Box sx={{ mt: 2, pt: 1.5, borderTop: "1px dashed #CBD5E1" }}>
                <Box sx={{ display: "flex", justifyContent: "space-between", mb: 0.75 }}>
                  <Typography variant="body2" sx={{ color: "text.secondary", fontWeight: 600 }}>
                    Total da Venda:
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 700, color: "#1E293B" }}>
                    R$ {totalAmount.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </Typography>
                </Box>
                <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1.5 }}>
                  <Typography variant="body2" sx={{ color: "text.secondary", fontWeight: 600 }}>
                    Total Informado:
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{
                      fontWeight: 800,
                      color: isDifferenceZero ? "#16A34A" : "#DC2626",
                    }}
                  >
                    R$ {totalDistributed.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </Typography>
                </Box>

                {isDifferenceZero ? (
                  <Alert
                    severity="success"
                    icon={<Check size={18} />}
                    sx={{
                      borderRadius: 2,
                      fontWeight: 600,
                      fontSize: "0.825rem",
                      "& .MuiAlert-message": { py: 0.25 },
                    }}
                  >
                    {selectedMethods.length === 1
                      ? `Valor integral (R$ ${totalAmount.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}) pronto para finalizar!`
                      : `Total de R$ ${totalAmount.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} distribuído corretamente!`}
                  </Alert>
                ) : differenceCents > 0 ? (
                  effectiveClientId ? (
                    <Alert
                      severity="warning"
                      icon={<Clock size={20} />}
                      sx={{
                        borderRadius: 2,
                        fontWeight: 600,
                        fontSize: "0.825rem",
                        "& .MuiAlert-message": { py: 0.5, width: "100%" },
                      }}
                    >
                      <Box sx={{ display: "flex", flexDirection: "column", gap: 0.6 }}>
                        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 1 }}>
                          <Typography variant="body2" sx={{ fontWeight: 700, color: "#b45309" }}>
                            Saldo a deixar na comanda: R$ {difference.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </Typography>
                          <Chip
                            icon={<UserCheck size={14} />}
                            label={effectiveClientName}
                            size="small"
                            color="warning"
                            variant="outlined"
                            onDelete={() => {
                              setSelectedClientInternal(null);
                              onSelectClient?.(null);
                            }}
                            deleteIcon={<X size={14} />}
                            sx={{ fontWeight: 600, fontSize: "0.75rem" }}
                          />
                        </Box>
                        <Typography variant="caption" sx={{ color: "#92400e", lineHeight: 1.35 }}>
                          R$ {totalDistributed.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} serão pagos agora.
                          O valor restante de R$ {difference.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} permanecerá em aberto na comanda de {effectiveClientName}.
                        </Typography>
                      </Box>
                    </Alert>
                  ) : (
                    <Alert
                      severity="warning"
                      icon={<AlertTriangle size={20} />}
                      sx={{
                        borderRadius: 2,
                        fontWeight: 600,
                        fontSize: "0.825rem",
                        "& .MuiAlert-message": { py: 0.5, width: "100%" },
                      }}
                    >
                      <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                        <Box>
                          <Typography variant="body2" sx={{ fontWeight: 700, color: "#b45309" }}>
                            Faltam distribuir R$ {difference.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </Typography>
                          <Typography variant="caption" sx={{ color: "#92400e", lineHeight: 1.35, display: "block" }}>
                            Para deixar esse saldo restante em aberto na comanda, vincule o cliente abaixo ou adicione outra forma de pagamento:
                          </Typography>
                        </Box>
                        <Autocomplete
                          size="small"
                          options={availableClients}
                          filterOptions={(options, state) => {
                            const input = state.inputValue.toLowerCase();
                            return options
                              .filter((option) => {
                                const matchName = option.name.toLowerCase().includes(input);
                                const matchPhone = option.phone?.toLowerCase().includes(input);
                                const clientPets = allPets?.filter((p: any) => p.client_id === option.id) || [];
                                const matchPet = clientPets.some((p: any) => p.name.toLowerCase().includes(input));
                                return matchName || matchPhone || matchPet;
                              })
                              .slice(0, clientSearchLimit);
                          }}
                          getOptionLabel={(option) => option.name}
                          isOptionEqualToValue={(option, value) => option.id === value?.id}
                          renderOption={(props, option) => {
                            const clientPets = allPets?.filter((p: any) => p.client_id === option.id) || [];
                            const petsText = clientPets.length > 0 ? clientPets.map((p: any) => p.name).join(", ") : "";
                            return (
                              <li {...props} key={option.id}>
                                <Box sx={{ display: "flex", flexDirection: "column", py: 0.25 }}>
                                  <Typography variant="body2" sx={{ fontWeight: 600 }}>{option.name}</Typography>
                                  {petsText && (
                                    <Typography variant="caption" color="text.secondary">
                                      Pets: {petsText}
                                    </Typography>
                                  )}
                                </Box>
                              </li>
                            );
                          }}
                          value={null}
                          onChange={(_, newValue) => {
                            if (newValue) {
                              setSelectedClientInternal(newValue.id);
                              onSelectClient?.(newValue.id);
                            }
                          }}
                          onInputChange={(_, __, reason) => {
                            if (reason === "input") setClientSearchLimit(20);
                          }}
                          renderInput={(params) => (
                            <TextField
                              {...params}
                              placeholder="Buscar cliente da comanda por nome ou pet..."
                              variant="outlined"
                              size="small"
                              sx={{
                                bgcolor: "background.paper",
                                borderRadius: 1.5,
                                "& .MuiOutlinedInput-root": { fontSize: "0.85rem" },
                              }}
                            />
                          )}
                        />
                      </Box>
                    </Alert>
                  )
                ) : (
                  <Alert
                    severity="error"
                    icon={<AlertTriangle size={20} />}
                    sx={{
                      borderRadius: 2,
                      fontWeight: 600,
                      fontSize: "0.825rem",
                      "& .MuiAlert-message": { py: 0.5 },
                    }}
                  >
                    <Box sx={{ display: "flex", flexDirection: "column", gap: 0.4 }}>
                      <Typography variant="body2" sx={{ fontWeight: 700, color: "#b91c1c" }}>
                        Valor informado excede o total em R$ {Math.abs(difference).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </Typography>
                      <Typography variant="caption" sx={{ color: "#991b1b", lineHeight: 1.35 }}>
                        Ajuste os valores para que a soma não ultrapasse o total a receber de R$ {totalAmount.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}.
                      </Typography>
                    </Box>
                  </Alert>
                )}
              </Box>
            </Paper>
          </Box>
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
            color={differenceCents > 0 ? "primary" : "success"}
            size="large"
            fullWidth
            onClick={handleCheckout}
            disabled={saleMutation.isPending || !isCheckoutValid}
            sx={{
              borderRadius: 2.5,
              fontWeight: 700,
              py: 1.2,
              fontSize: { xs: "0.95rem", sm: "1rem" },
              ...(differenceCents > 0 && {
                bgcolor: "#d97706",
                "&:hover": { bgcolor: "#b45309" },
                boxShadow: "0 4px 14px 0 rgba(217, 119, 6, 0.35)",
              }),
              ...(differenceCents === 0 && {
                boxShadow: "0 4px 14px 0 rgba(46, 125, 50, 0.39)",
              }),
            }}
          >
            {saleMutation.isPending
              ? "Processando..."
              : differenceCents < 0
              ? "Valor excede o total da venda"
              : selectedMethods.some((m) => !(methodAmounts[m] && methodAmounts[m]! > 0))
              ? "Preencha os valores de pagamento"
              : differenceCents > 0
              ? !effectiveClientId
                ? "Vincule um cliente para deixar na comanda"
                : `Confirmar e Deixar R$ ${difference.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} na Comanda`
              : "Confirmar e Finalizar"}
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
  value: SalePayment["payment_method"];
  label: string;
  icon: React.ElementType;
  color: string;
  isSelected: boolean;
  assignedAmountCents?: number;
  showAmountSubtitle?: boolean;
  hintAddCents?: number;
  onClick: () => void;
}

const PaymentMethodCard = ({
  label,
  icon: Icon,
  color,
  isSelected,
  assignedAmountCents,
  showAmountSubtitle,
  hintAddCents,
  onClick,
}: PaymentMethodCardProps) => {
  return (
    <Paper
      elevation={0}
      component="div"
      onClick={onClick}
      sx={{
        p: { xs: 1.5, sm: 2 },
        display: "flex",
        flexDirection: { xs: "column", sm: "row" },
        alignItems: "center",
        justifyContent: { xs: "center", sm: "flex-start" },
        cursor: "pointer",
        border: "2px solid",
        borderColor: isSelected ? color : "divider",
        bgcolor: isSelected ? alpha(color, 0.06) : "background.paper",
        borderRadius: 3,
        transition: "all 0.2s ease-in-out",
        gap: { xs: 1, sm: 1.5 },
        position: "relative",
        boxShadow: isSelected
          ? `0 4px 14px 0 ${alpha(color, 0.18)}`
          : "0 1px 3px rgba(0,0,0,0.03)",
        transform: isSelected ? "translateY(-1px)" : "none",
        userSelect: "none",
        "&:hover": {
          borderColor: isSelected ? color : alpha(color, 0.5),
          bgcolor: isSelected ? alpha(color, 0.08) : alpha(color, 0.02),
        },
      }}
    >
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
        {isSelected && showAmountSubtitle && assignedAmountCents !== undefined && (
          <Typography
            variant="caption"
            sx={{
              fontWeight: 700,
              color: color,
              fontSize: "0.78rem",
              display: "block",
              mt: 0.25,
            }}
          >
            R$ {formatBRLFromCents(assignedAmountCents)}
          </Typography>
        )}
        {!isSelected && hintAddCents !== undefined && hintAddCents > 0 && (
          <Typography
            variant="caption"
            sx={{
              fontWeight: 700,
              color: "text.secondary",
              fontSize: "0.75rem",
              display: "block",
              mt: 0.25,
            }}
          >
            + R$ {formatBRLFromCents(hintAddCents)}
          </Typography>
        )}
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
