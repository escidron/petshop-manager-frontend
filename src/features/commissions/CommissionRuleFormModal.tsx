import {
  Autocomplete,
  Box,
  Checkbox,
  Chip,
  Dialog,
  DialogContent,
  DialogTitle,
  FormControl,
  FormLabel,
  InputAdornment,
  MenuItem,
  Select,
  Switch,
  TextField,
  Typography,
  alpha,
  Tooltip,
  IconButton,
  useTheme,
  useMediaQuery,
} from "@mui/material";
import { useEffect, useState, useMemo } from "react";
import { X, Percent, Briefcase, User, Scissors, Package } from "lucide-react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import CustomTextField from "../../components/Textfield/CustomTextfield";
import { Button } from "../../components/Button/Button";
import { useToast } from "../../hooks/useToast";
import { createCommissionRule, updateCommissionRule } from "../../api/services/commissions";
import { getEmployees as fetchEmployees } from "../../api/services/employees";
import { fetchServices } from "../../api/services/tenant_services";
import { fetchProducts } from "../../api/services/products";
import type { CommissionRule, CommissionRuleFormData } from "./types";
import type { Employee } from "../employees/types";
import type { Service } from "../tenant_services/types";
import type { Product } from "../products/types";
import { formatServiceLabel } from "../../utils/formatServiceLabel";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import dayjs from "dayjs";
import "dayjs/locale/pt-br";
import theme from "../../theme";
dayjs.locale("pt-br");

const schema = z.object({
  name: z.string().min(1, "Nome obrigatório"),
  commission_type: z.enum(["percentage", "fixed"]),
  value: z.coerce.number<number>().min(0.01, "Valor deve ser maior que zero"),
  applies_to: z.enum(["service", "product", "both"]),
  employee_id: z.number().nullable().optional(),
  employee_ids: z.array(z.number()),
  roles: z.array(z.string()).optional(),
  service_ids: z.array(z.number()),
  product_ids: z.array(z.number()).optional(),
  valid_from: z.string().nullable().optional(),
  valid_until: z.string().nullable().optional(),
  is_active: z.boolean(),
});

type TargetMode = "role" | "employee";

const ALL_ROLES_KEY = "__all_roles__";
const ALL_ROLES_OPTION = {
  role: ALL_ROLES_KEY,
  label: "Todos os cargos",
  count: 0,
};

const ALL_EMPLOYEES_ID = -1;
const ALL_EMPLOYEES_OPTION: Employee = {
  id: ALL_EMPLOYEES_ID,
  tenant_id: 0,
  name: "Todos os funcionários",
  role: "other",
  phone: "",
  is_active: true,
  created_at: "",
};

const ALL_SERVICES_ID = -1;
const ALL_SERVICES_OPTION: Service = {
  id: ALL_SERVICES_ID,
  tenant_id: 0,
  name: "Todos os serviços",
  price_cents: 0,
  is_active: true,
};

const ALL_PRODUCTS_ID = -1;
const ALL_PRODUCTS_OPTION: Product = {
  id: ALL_PRODUCTS_ID,
  name: "Todos os produtos",
  price_cents: 0,
  quantity: 0,
  min_stock: 0,
  is_active: true,
  is_internal_use: false,
};

const ROLE_LABELS: Record<string, string> = {
  bather: "Banhista",
  groomer: "Tosador(a)",
  vet: "Veterinário(a)",
  salesperson: "Vendedor(a)",
  receptionist: "Recepcionista",
  driver: "Entregador/Motorista",
  other: "Outro",
};

type Props = {
  open: boolean;
  mode: "create" | "edit";
  rule?: CommissionRule;
  onClose: () => void;
  onSuccess: () => void;
};

export default function CommissionRuleFormModal({
  open,
  mode,
  rule,
  onClose,
  onSuccess,
}: Props) {
  const toast = useToast();
  const currentTheme = useTheme();
  const isMobile = useMediaQuery(currentTheme.breakpoints.down("md"));

  const [employees, setEmployees] = useState<Employee[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [products, setProducts] = useState<Product[]>([]);

  const [targetMode, setTargetMode] = useState<TargetMode>("role");
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);

  const [loadingOptions, setLoadingOptions] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [employeeLimit, setEmployeeLimit] = useState(20);
  const [serviceLimit, setServiceLimit] = useState(20);
  const [productLimit, setProductLimit] = useState(20);

  const { control, handleSubmit, reset, watch, setValue } = useForm<CommissionRuleFormData>({
    resolver: zodResolver(schema) as any,
    defaultValues: {
      name: "",
      commission_type: "percentage",
      value: "" as unknown as number,
      applies_to: "service",
      employee_id: null,
      employee_ids: [],
      roles: [],
      service_ids: [],
      product_ids: [],
      valid_from: null,
      valid_until: null,
      is_active: true,
    },
  });

  const commissionType = watch("commission_type");
  const appliesTo = watch("applies_to");

  const availableRoles = useMemo(() => {
    const activeEmps = employees.filter((e) => e.is_active);
    const roleCounts: Record<string, number> = {};
    activeEmps.forEach((e) => {
      const roleKey = e.role || "other";
      roleCounts[roleKey] = (roleCounts[roleKey] || 0) + 1;
    });

    return Object.entries(ROLE_LABELS)
      .map(([role, label]) => ({
        role,
        label,
        count: roleCounts[role] || 0,
      }))
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [employees]);

  const roleOptions = useMemo(() => [ALL_ROLES_OPTION, ...availableRoles], [availableRoles]);

  const handleRolesChange = (newRoles: string[]) => {
    setSelectedRoles(newRoles);
    setValue("roles", newRoles, {
      shouldValidate: true,
      shouldDirty: true,
    });
  };

  const handleTargetModeChange = (newMode: TargetMode) => {
    setTargetMode(newMode);
    if (newMode === "role") {
      setValue("employee_ids", []);
      setValue("employee_id", null);
    } else {
      setSelectedRoles([]);
      setValue("roles", []);
    }
  };

  useEffect(() => {
    if (open) {
      let isMounted = true;
      setLoadingOptions(true);
      const initialEmpIds =
        rule?.employee_ids ??
        (rule?.employees?.map((e) => e.id) ?? (rule?.employee_id ? [rule.employee_id] : []));

      const hasRuleRoles = Boolean(rule?.roles && rule.roles.length > 0);
      const hasSpecificEmps = !hasRuleRoles && initialEmpIds.length > 0;

      if (hasRuleRoles) {
        setTargetMode("role");
        setSelectedRoles(rule!.roles!);
      } else if (hasSpecificEmps) {
        setTargetMode("employee");
        setSelectedRoles([]);
      } else {
        setTargetMode("role");
        setSelectedRoles([]);
      }

      Promise.all([fetchEmployees(), fetchServices(), fetchProducts()])
        .then(([empData, svcData, prodData]) => {
          if (isMounted) {
            setEmployees(empData || []);
            setServices(svcData || []);
            setProducts(prodData || []);
          }
        })
        .catch(() => {
          toast.error("Erro ao carregar dados do catálogo e equipe.");
        })
        .finally(() => {
          if (isMounted) setLoadingOptions(false);
        });

      const cleanInitialEmpIds = hasRuleRoles ? [] : initialEmpIds;

      reset({
        name: rule?.name ?? "",
        commission_type: rule?.commission_type ?? "percentage",
        value: rule?.value ?? ("" as unknown as number),
        applies_to: rule?.applies_to ?? "service",
        employee_id: cleanInitialEmpIds[0] ?? null,
        employee_ids: cleanInitialEmpIds,
        roles: hasRuleRoles ? rule!.roles! : [],
        service_ids: rule?.service_ids ?? (rule?.services?.map((s) => s.id) ?? []),
        product_ids: rule?.product_ids ?? [],
        valid_from: rule?.valid_from ?? null,
        valid_until: rule?.valid_until ?? null,
        is_active: rule?.is_active ?? true,
      });

      return () => {
        isMounted = false;
      };
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, rule, reset]);

  const onSubmit = async (data: CommissionRuleFormData) => {
    if (isSubmitting) return;

    setIsSubmitting(true);
    try {
      const cleanEmpIds = targetMode === "employee" ? (data.employee_ids || []).filter((id) => id > 0) : [];
      const cleanRoles =
        targetMode === "role"
          ? (selectedRoles || []).filter((r) => r && r !== ALL_ROLES_KEY)
          : [];
      const cleanSvcIds =
        data.applies_to === "service" || data.applies_to === "both"
          ? (data.service_ids || []).filter((id) => id > 0)
          : [];
      const cleanProdIds =
        data.applies_to === "product" || data.applies_to === "both"
          ? (data.product_ids || []).filter((id) => id > 0)
          : [];

      const payload = {
        ...data,
        employee_id: cleanEmpIds[0] ?? null,
        employee_ids: cleanEmpIds,
        roles: cleanRoles,
        service_ids: cleanSvcIds,
        product_ids: cleanProdIds,
        valid_from: data.valid_from || null,
        valid_until: data.valid_until || null,
      };

      if (mode === "create") {
        await createCommissionRule(payload);
        toast.success("Regra de comissão criada com sucesso");
      } else {
        await updateCommissionRule(rule!.id, payload);
        toast.success("Regra atualizada com sucesso");
      }
      onSuccess();
      onClose();
    } catch {
      toast.error(mode === "create" ? "Erro ao criar regra." : "Erro ao atualizar regra.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const colStyle = {
    display: "flex",
    flexDirection: "column" as const,
    gap: 2,
    flex: 1,
    minWidth: 0,
  };

  const isAllRoles = selectedRoles.length === 0;
  const selectedRolesValue = isAllRoles
    ? [ALL_ROLES_OPTION]
    : availableRoles.filter((r) => selectedRoles.includes(r.role));

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullScreen={isMobile}
      maxWidth="md"
      fullWidth
      slotProps={{
        paper: {
          sx: {
            width: { xs: "100%", md: "840px" },
            maxWidth: { xs: "100%", md: "840px" },
            m: { xs: 0, md: 2 },
            borderRadius: { xs: 0, md: 3 },
            maxHeight: { xs: "100dvh", md: "92vh" },
            height: { xs: "100dvh", md: "auto" },
            display: "flex",
            flexDirection: "column",
          },
        },
      }}
    >
      <DialogTitle
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          px: { xs: 2, sm: 3 },
          py: 2,
          borderBottom: "1px solid",
          borderColor: "divider",
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.25 }}>
          <Box
            sx={{
              width: 36,
              height: 36,
              borderRadius: 2,
              bgcolor: alpha(theme.palette.primary.main, 0.1),
              color: "primary.main",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Percent size={20} />
          </Box>
          <Box>
            <Typography variant="h6" fontWeight={700} sx={{ lineHeight: 1.2 }}>
              {mode === "create" ? "Nova Regra de Comissão" : "Editar Regra de Comissão"}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Configure as taxas, quem tem direito e em quais produtos ou serviços
            </Typography>
          </Box>
        </Box>
        <IconButton size="small" onClick={onClose} sx={{ color: "text.secondary" }}>
          <X size={20} />
        </IconButton>
      </DialogTitle>

      <DialogContent
        sx={{
          p: { xs: 2, sm: 3 },
          pb: { xs: "calc(20px + env(safe-area-inset-bottom, 0px))", sm: 3 },
          overflowY: "auto",
        }}
      >
        <Box component="form" sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
          <Box
            sx={{
              display: "flex",
              flexDirection: { xs: "column", md: "row" },
              justifyContent: "space-between",
              gap: { xs: 2.5, md: 3 },
            }}
          >
            {/* ── COLUNA ESQUERDA — Parâmetros & Vigência ────────────────────── */}
            <Box sx={colStyle}>
              <Box sx={{ pb: 0.5 }}>
                <Typography variant="subtitle1" fontWeight={700} color="text.primary">
                  Regra e Parâmetros
                </Typography>
                <Typography fontSize="12px" color="text.secondary">
                  Nome, valor da comissão e validade
                </Typography>
              </Box>

              <FormControl fullWidth>
                <FormLabel sx={{ color: "text.primary", mb: 0.5, fontWeight: 500, fontSize: "0.875rem" }}>
                  Nome da regra
                </FormLabel>
                <Controller
                  name="name"
                  control={control}
                  render={({ field, fieldState }) => (
                    <CustomTextField
                      {...field}
                      fullWidth
                      error={!!fieldState.error}
                      helperText={fieldState.error?.message}
                      placeholder='Ex: "Comissão Banhistas — 10%"'
                    />
                  )}
                />
              </FormControl>

              <Box sx={{ display: "flex", gap: 1.5 }}>
                <FormControl sx={{ flex: 1 }}>
                  <FormLabel sx={{ color: "text.primary", mb: 0.5, fontWeight: 500, fontSize: "0.875rem" }}>
                    Tipo
                  </FormLabel>
                  <Controller
                    name="commission_type"
                    control={control}
                    render={({ field }) => (
                      <Select {...field} size="small" fullWidth>
                        <MenuItem value="percentage">Percentual (%)</MenuItem>
                        <MenuItem value="fixed">Valor fixo (R$)</MenuItem>
                      </Select>
                    )}
                  />
                </FormControl>

                <FormControl sx={{ flex: 1 }}>
                  <FormLabel sx={{ color: "text.primary", mb: 0.5, fontWeight: 500, fontSize: "0.875rem" }}>
                    Valor
                  </FormLabel>
                  <Controller
                    name="value"
                    control={control}
                    render={({ field, fieldState }) => {
                      const numValue =
                        field.value !== undefined && field.value !== null && String(field.value) !== ""
                          ? Number(field.value)
                          : undefined;

                      const formattedValue =
                        numValue !== undefined
                          ? numValue.toLocaleString("pt-BR", {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })
                          : "";

                      return (
                        <TextField
                          value={formattedValue}
                          size="small"
                          fullWidth
                          error={!!fieldState.error}
                          helperText={fieldState.error?.message}
                          placeholder="0,00"
                          slotProps={{
                            input: {
                              endAdornment: (
                                <InputAdornment position="end">
                                  {commissionType === "percentage" ? "%" : "R$"}
                                </InputAdornment>
                              ),
                            },
                          }}
                          onChange={(e) => {
                            const digits = e.target.value.replace(/\D/g, "");
                            field.onChange(digits === "" ? undefined : Number(digits) / 100);
                          }}
                        />
                      );
                    }}
                  />
                </FormControl>
              </Box>

              <FormControl fullWidth>
                <FormLabel sx={{ color: "text.primary", mb: 0.5, fontWeight: 500, fontSize: "0.875rem" }}>
                  Aplica-se a
                </FormLabel>
                <Controller
                  name="applies_to"
                  control={control}
                  render={({ field }) => (
                    <Select {...field} size="small" fullWidth>
                      <MenuItem value="service">Serviços</MenuItem>
                      <MenuItem value="product">Produtos</MenuItem>
                      <MenuItem value="both">Ambos (Serviços e Produtos)</MenuItem>
                    </Select>
                  )}
                />
              </FormControl>

              <Box sx={{ display: "flex", gap: 1.5 }}>
                <FormControl sx={{ flex: 1 }}>
                  <FormLabel sx={{ color: "text.primary", mb: 0.5, fontWeight: 500, fontSize: "0.875rem" }}>
                    Válido de
                  </FormLabel>
                  <Controller
                    name="valid_from"
                    control={control}
                    render={({ field, fieldState }) => (
                      <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="pt-br">
                        <DatePicker
                          format="DD/MM/YYYY"
                          value={field.value ? dayjs(field.value) : null}
                          onChange={(newDate) => {
                            if (newDate && newDate.isValid()) {
                              field.onChange(newDate.format("YYYY-MM-DD"));
                            } else {
                              field.onChange("");
                            }
                          }}
                          slotProps={{
                            textField: {
                              size: "small",
                              fullWidth: true,
                              error: !!fieldState.error,
                              helperText: fieldState.error?.message,
                              placeholder: "DD/MM/AAAA",
                            },
                            actionBar: { actions: [] },
                          }}
                        />
                      </LocalizationProvider>
                    )}
                  />
                </FormControl>

                <FormControl sx={{ flex: 1 }}>
                  <FormLabel sx={{ color: "text.primary", mb: 0.5, fontWeight: 500, fontSize: "0.875rem" }}>
                    Válido até
                  </FormLabel>
                  <Controller
                    name="valid_until"
                    control={control}
                    render={({ field, fieldState }) => (
                      <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="pt-br">
                        <DatePicker
                          format="DD/MM/YYYY"
                          value={field.value ? dayjs(field.value) : null}
                          onChange={(newDate) => {
                            if (newDate && newDate.isValid()) {
                              field.onChange(newDate.format("YYYY-MM-DD"));
                            } else {
                              field.onChange("");
                            }
                          }}
                          slotProps={{
                            textField: {
                              size: "small",
                              fullWidth: true,
                              error: !!fieldState.error,
                              helperText: fieldState.error?.message,
                              placeholder: "DD/MM/AAAA",
                            },
                            actionBar: { actions: [] },
                          }}
                        />
                      </LocalizationProvider>
                    )}
                  />
                </FormControl>
              </Box>

              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  p: 1.25,
                  px: 2,
                  mt: 0.5,
                  borderRadius: 2,
                  border: "1px solid",
                  borderColor: "divider",
                  bgcolor: "#F8FAFC",
                }}
              >
                <Box>
                  <Typography variant="body2" fontWeight={600} color="text.primary">
                    Regra ativa
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Regras inativas são ignoradas nos cálculos
                  </Typography>
                </Box>
                <Controller
                  name="is_active"
                  control={control}
                  render={({ field }) => (
                    <Switch checked={field.value} onChange={field.onChange} color="primary" />
                  )}
                />
              </Box>
            </Box>

            {/* ── COLUNA DIREITA — Destinatários & Catálogo Elegível ──────────── */}
            <Box sx={colStyle}>
              <Box sx={{ pb: 0.5 }}>
                <Typography variant="subtitle1" fontWeight={700} color="text.primary">
                  Destinatários e Catálogo
                </Typography>
                <Typography fontSize="12px" color="text.secondary">
                  Selecione quem recebe e os itens participantes
                </Typography>
              </Box>

              {/* SEÇÃO DESTINATÁRIOS */}
              <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                <FormLabel sx={{ color: "text.primary", fontWeight: 600, fontSize: "0.875rem" }}>
                  A quem se aplica esta regra?
                </FormLabel>

                {/* Segmented Control 50% / 50% */}
                <Box
                  sx={{
                    display: "flex",
                    p: 0.5,
                    borderRadius: 2,
                    bgcolor: alpha(theme.palette.primary.main, 0.05),
                    border: `1px solid ${alpha(theme.palette.primary.main, 0.15)}`,
                    gap: 0.75,
                  }}
                >
                  <Box
                    onClick={() => handleTargetModeChange("role")}
                    sx={{
                      flex: 1,
                      py: 0.85,
                      px: 1.5,
                      borderRadius: 1.5,
                      cursor: "pointer",
                      textAlign: "center",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 0.75,
                      bgcolor: targetMode === "role" ? "white" : "transparent",
                      boxShadow: targetMode === "role" ? "0 2px 6px rgba(0,0,0,0.08)" : "none",
                      border: targetMode === "role" ? `1px solid ${theme.palette.primary.main}` : "1px solid transparent",
                      color: targetMode === "role" ? "primary.main" : "text.secondary",
                      fontWeight: targetMode === "role" ? 700 : 500,
                      fontSize: "0.85rem",
                      transition: "all 0.2s ease",
                      userSelect: "none",
                      "&:hover": { color: "primary.main" },
                    }}
                  >
                    <Briefcase size={16} />
                    Por Cargo
                  </Box>

                  <Box
                    onClick={() => handleTargetModeChange("employee")}
                    sx={{
                      flex: 1,
                      py: 0.85,
                      px: 1.5,
                      borderRadius: 1.5,
                      cursor: "pointer",
                      textAlign: "center",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 0.75,
                      bgcolor: targetMode === "employee" ? "white" : "transparent",
                      boxShadow: targetMode === "employee" ? "0 2px 6px rgba(0,0,0,0.08)" : "none",
                      border: targetMode === "employee" ? `1px solid ${theme.palette.primary.main}` : "1px solid transparent",
                      color: targetMode === "employee" ? "primary.main" : "text.secondary",
                      fontWeight: targetMode === "employee" ? 700 : 500,
                      fontSize: "0.85rem",
                      transition: "all 0.2s ease",
                      userSelect: "none",
                      "&:hover": { color: "primary.main" },
                    }}
                  >
                    <User size={16} />
                    Por Colaborador
                  </Box>
                </Box>

                {/* Seletor Por Cargo */}
                {targetMode === "role" && (
                  <FormControl fullWidth sx={{ mt: 0.5 }}>
                    <Autocomplete
                      multiple
                      disableCloseOnSelect
                      size="small"
                      options={roleOptions}
                      value={selectedRolesValue}
                      getOptionLabel={(o) => o.label}
                      isOptionEqualToValue={(o, v) => o.role === v.role}
                      onChange={(_, newValues) => {
                        const selected = newValues as { role: string; label: string }[];
                        const clickedAll = selected.some((r) => r.role === ALL_ROLES_KEY);
                        const previouslyHadAll = isAllRoles;

                        if (clickedAll && !previouslyHadAll) {
                          handleRolesChange([]);
                          return;
                        }

                        const specificRoles = selected
                          .filter((r) => r.role !== ALL_ROLES_KEY)
                          .map((r) => r.role);

                        handleRolesChange(specificRoles);
                      }}
                      renderOption={(props, option) => {
                        const isAll = option.role === ALL_ROLES_KEY;
                        const isChecked = isAll ? isAllRoles : selectedRoles.includes(option.role);

                        return (
                          <li
                            {...props}
                            key={option.role}
                            style={{
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "space-between",
                              gap: 8,
                              padding: "6px 12px",
                              backgroundColor: isAll && isChecked ? alpha(theme.palette.primary.main, 0.08) : undefined,
                            }}
                          >
                            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                              <Checkbox
                                size="small"
                                checked={isChecked}
                                disableRipple
                                sx={{
                                  color: "primary.main",
                                  p: 0,
                                  "&.Mui-checked": { color: "primary.main" },
                                }}
                              />
                              <Typography
                                variant="body2"
                                sx={{
                                  fontWeight: isAll ? 600 : 400,
                                  color: isAll ? "primary.main" : "text.primary",
                                }}
                              >
                                {option.label}
                              </Typography>
                            </Box>
                            {!isAll && (
                              <Chip
                                size="small"
                                label={`${option.count} colaborador(es)`}
                                sx={{
                                  height: 18,
                                  fontSize: "0.68rem",
                                  fontWeight: 500,
                                  bgcolor: alpha(theme.palette.primary.main, 0.08),
                                  color: "primary.main",
                                  borderRadius: 1,
                                }}
                              />
                            )}
                          </li>
                        );
                      }}
                      renderTags={(value, getTagProps) => {
                        if (isAllRoles) return null;
                        const MAX_ROLES = 2;
                        const visible = value.slice(0, MAX_ROLES);
                        const remaining = value.length - MAX_ROLES;

                        return (
                          <>
                            {visible.map((option, index) => {
                              const { key, ...tagProps } = getTagProps({ index });
                              return (
                                <Chip
                                  key={key || option.role}
                                  size="small"
                                  color="primary"
                                  variant="outlined"
                                  label={option.label}
                                  {...tagProps}
                                  sx={{ height: "22px", fontSize: "0.72rem", fontWeight: 600, m: 0.25 }}
                                />
                              );
                            })}
                            {remaining > 0 && (
                              <Tooltip title={value.slice(MAX_ROLES).map((o) => o.label).join(", ")} arrow>
                                <Chip
                                  size="small"
                                  label={`+${remaining}`}
                                  sx={{
                                    height: "22px",
                                    fontSize: "0.72rem",
                                    fontWeight: 700,
                                    bgcolor: alpha(theme.palette.primary.main, 0.12),
                                    color: "primary.main",
                                    m: 0.25,
                                    cursor: "pointer",
                                  }}
                                />
                              </Tooltip>
                            )}
                          </>
                        );
                      }}
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          placeholder={isAllRoles ? "Todos os cargos" : ""}
                          sx={{
                            "& .MuiInputBase-root": {
                              display: "flex",
                              flexWrap: "wrap",
                              alignItems: "center",
                              gap: 0.5,
                              pr: "38px !important",
                              p: !isAllRoles && selectedRoles.length > 0 ? "6px 8px !important" : undefined,
                            },
                            "& .MuiInputBase-input": {
                              minWidth: isAllRoles ? "100%" : "30px !important",
                            },
                            ...(isAllRoles
                              ? {
                                  "& .MuiInputBase-input::placeholder": {
                                    color: "text.primary",
                                    opacity: 1,
                                    fontWeight: 500,
                                  },
                                }
                              : {}),
                          }}
                        />
                      )}
                      noOptionsText={loadingOptions ? "Carregando..." : "Nenhum cargo encontrado"}
                    />
                    <Typography
                      variant="caption"
                      sx={{
                        mt: 0.5,
                        display: "block",
                        fontSize: "0.75rem",
                        fontWeight: 500,
                        color: isAllRoles ? "text.secondary" : "primary.main",
                      }}
                    >
                      {isAllRoles
                        ? "✓ Válida para todos os cargos (toda a equipe atual e futuros contratados)."
                        : `✓ Regra restrita exclusivamente ao cargo: ${selectedRoles
                            .map((r) => ROLE_LABELS[r] || r)
                            .join(", ")} (atuais e novos).`}
                    </Typography>
                  </FormControl>
                )}

                {/* Seletor Por Colaborador */}
                {targetMode === "employee" && (
                  <FormControl fullWidth sx={{ mt: 0.5 }}>
                    <Controller
                      name="employee_ids"
                      control={control}
                      render={({ field }) => {
                        const isAllEmployees = !field.value || field.value.length === 0;
                        const activeEmployees = employees.filter((e) => e.is_active);
                        const employeeOptions = [ALL_EMPLOYEES_OPTION, ...activeEmployees];
                        const selectedValue = isAllEmployees
                          ? [ALL_EMPLOYEES_OPTION]
                          : activeEmployees.filter((e) => (field.value ?? []).includes(e.id));

                        return (
                          <>
                            <Autocomplete<Employee, true>
                              multiple
                              disableCloseOnSelect
                              loading={loadingOptions}
                              options={employeeOptions}
                              filterOptions={(options, state) => {
                                const input = state.inputValue.toLowerCase();
                                return options
                                  .filter((option) => {
                                    if (option.id === ALL_EMPLOYEES_ID) {
                                      return "todos os funcionários".includes(input);
                                    }
                                    const roleLabel = option.role
                                      ? (ROLE_LABELS[option.role] || option.role).toLowerCase()
                                      : "";
                                    return option.name.toLowerCase().includes(input) || roleLabel.includes(input);
                                  })
                                  .slice(0, employeeLimit);
                              }}
                              onInputChange={(_, __, reason) => {
                                if (reason === "input") setEmployeeLimit(20);
                              }}
                              ListboxProps={{
                                onScroll: (event: React.SyntheticEvent) => {
                                  const listboxNode = event.currentTarget;
                                  if (
                                    listboxNode.scrollTop + listboxNode.clientHeight >=
                                    listboxNode.scrollHeight - 10
                                  ) {
                                    setEmployeeLimit((prev) => prev + 20);
                                  }
                                },
                              }}
                              size="small"
                              value={selectedValue}
                              getOptionLabel={(o) => o.name}
                              isOptionEqualToValue={(o, v) => o.id === v.id}
                              onChange={(_, newValues) => {
                                const selected = newValues as Employee[];
                                const clickedAll = selected.some((e) => e.id === ALL_EMPLOYEES_ID);
                                const previouslyHadAll = isAllEmployees;

                                if (clickedAll && !previouslyHadAll) {
                                  field.onChange([]);
                                  return;
                                }

                                const specificEmployees = selected.filter((e) => e.id !== ALL_EMPLOYEES_ID);
                                field.onChange(specificEmployees.map((e) => e.id));
                              }}
                              noOptionsText={loadingOptions ? "Carregando..." : "Nenhum funcionário cadastrado"}
                              renderOption={(props, option) => {
                                const isAll = option.id === ALL_EMPLOYEES_ID;
                                const isChecked = isAll
                                  ? isAllEmployees
                                  : (field.value ?? []).includes(option.id);

                                return (
                                  <li
                                    {...props}
                                    key={option.id}
                                    style={{
                                      display: "flex",
                                      alignItems: "center",
                                      justifyContent: "space-between",
                                      gap: 8,
                                      padding: "6px 12px",
                                      backgroundColor:
                                        isAll && isChecked
                                          ? alpha(theme.palette.primary.main, 0.08)
                                          : undefined,
                                    }}
                                  >
                                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                      <Checkbox
                                        size="small"
                                        checked={isChecked}
                                        disableRipple
                                        sx={{
                                          color: "primary.main",
                                          p: 0,
                                          "&.Mui-checked": { color: "primary.main" },
                                        }}
                                      />
                                      <Typography
                                        variant="body2"
                                        sx={{
                                          fontWeight: isAll ? 600 : 400,
                                          color: isAll ? "primary.main" : "text.primary",
                                        }}
                                      >
                                        {option.name}
                                      </Typography>
                                    </Box>
                                    {!isAll && option.role && (
                                      <Chip
                                        size="small"
                                        label={ROLE_LABELS[option.role] || option.role}
                                        sx={{
                                          height: 18,
                                          fontSize: "0.68rem",
                                          fontWeight: 500,
                                          bgcolor: alpha(theme.palette.primary.main, 0.08),
                                          color: "primary.main",
                                          borderRadius: 1,
                                        }}
                                      />
                                    )}
                                  </li>
                                );
                              }}
                              renderTags={(value, getTagProps) => {
                                if (isAllEmployees) return null;
                                const MAX_TAGS = 2;
                                const visible = value.slice(0, MAX_TAGS);
                                const remaining = value.length - MAX_TAGS;

                                return (
                                  <>
                                    {visible.map((option, index) => {
                                      const { key, ...tagProps } = getTagProps({ index });
                                      return (
                                        <Chip
                                          key={key || option.id}
                                          size="small"
                                          label={option.name}
                                          {...tagProps}
                                          sx={{ maxWidth: "140px", height: "22px", fontSize: "0.72rem", m: 0.25 }}
                                        />
                                      );
                                    })}
                                    {remaining > 0 && (
                                      <Tooltip title={value.slice(MAX_TAGS).map((o) => o.name).join(", ")} arrow>
                                        <Chip
                                          size="small"
                                          label={`+${remaining}`}
                                          sx={{
                                            height: "22px",
                                            fontSize: "0.72rem",
                                            fontWeight: 700,
                                            bgcolor: alpha(theme.palette.primary.main, 0.12),
                                            color: "primary.main",
                                            m: 0.25,
                                            cursor: "pointer",
                                          }}
                                        />
                                      </Tooltip>
                                    )}
                                  </>
                                );
                              }}
                              renderInput={(params) => (
                                <TextField
                                  {...params}
                                  placeholder={isAllEmployees ? "Todos os funcionários" : ""}
                                  sx={{
                                    "& .MuiInputBase-root": {
                                      display: "flex",
                                      flexWrap: "wrap",
                                      alignItems: "center",
                                      gap: 0.5,
                                      pr: "38px !important",
                                      p: !isAllEmployees && (field.value ?? []).length > 0 ? "6px 8px !important" : undefined,
                                    },
                                    "& .MuiInputBase-input": {
                                      minWidth: isAllEmployees ? "100%" : "30px !important",
                                    },
                                    ...(isAllEmployees
                                      ? {
                                          "& .MuiInputBase-input::placeholder": {
                                            color: "text.primary",
                                            opacity: 1,
                                            fontWeight: 500,
                                          },
                                        }
                                      : {}),
                                  }}
                                />
                              )}
                            />
                            <Typography
                              variant="caption"
                              sx={{
                                mt: 0.5,
                                display: "block",
                                fontSize: "0.75rem",
                                fontWeight: 500,
                                color: isAllEmployees ? "text.secondary" : "primary.main",
                              }}
                            >
                              {isAllEmployees
                                ? "✓ Regra válida para todos os funcionários da empresa."
                                : `✓ Regra restrita a ${(field.value ?? []).length} funcionário(s) específico(s).`}
                            </Typography>
                          </>
                        );
                      }}
                    />
                  </FormControl>
                )}
              </Box>

              {/* SEÇÃO CATÁLOGO: SERVIÇOS (se applies_to == service ou both) */}
              {(appliesTo === "service" || appliesTo === "both") && (
                <FormControl fullWidth>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 0.75, mb: 0.5 }}>
                    <Scissors size={15} color={theme.palette.primary.main} />
                    <FormLabel sx={{ color: "text.primary", fontWeight: 600, fontSize: "0.875rem" }}>
                      Serviços Elegíveis
                    </FormLabel>
                  </Box>
                  <Controller
                    name="service_ids"
                    control={control}
                    render={({ field }) => {
                      const isAllServices = !field.value || field.value.length === 0;
                      const serviceOptions = [ALL_SERVICES_OPTION, ...services];
                      const selectedValue = isAllServices
                        ? [ALL_SERVICES_OPTION]
                        : (services ?? []).filter((s) => (field.value ?? []).includes(s.id));

                      return (
                        <>
                          <Autocomplete<Service, true>
                            multiple
                            disableCloseOnSelect
                            loading={loadingOptions}
                            options={serviceOptions}
                            filterOptions={(options, state) => {
                              const input = state.inputValue.toLowerCase();
                              return options
                                .filter((option) => {
                                  if (option.id === ALL_SERVICES_ID) {
                                    return "todos os serviços".includes(input);
                                  }
                                  return `${option.name} ${option.size ?? ""} ${option.coat_type ?? ""}`
                                    .toLowerCase()
                                    .includes(input);
                                })
                                .slice(0, serviceLimit);
                            }}
                            onInputChange={(_, __, reason) => {
                              if (reason === "input") setServiceLimit(20);
                            }}
                            ListboxProps={{
                              onScroll: (event: React.SyntheticEvent) => {
                                const listboxNode = event.currentTarget;
                                if (
                                  listboxNode.scrollTop + listboxNode.clientHeight >=
                                  listboxNode.scrollHeight - 10
                                ) {
                                  setServiceLimit((prev) => prev + 20);
                                }
                              },
                            }}
                            size="small"
                            value={selectedValue}
                            getOptionLabel={(o) =>
                              o.id === ALL_SERVICES_ID ? "Todos os serviços" : formatServiceLabel(o)
                            }
                            isOptionEqualToValue={(o, v) => o.id === v.id}
                            onChange={(_, newValues) => {
                              const selected = newValues as Service[];
                              const clickedAll = selected.some((s) => s.id === ALL_SERVICES_ID);
                              const previouslyHadAll = isAllServices;

                              if (clickedAll && !previouslyHadAll) {
                                field.onChange([]);
                                return;
                              }

                              const specificServices = selected.filter((s) => s.id !== ALL_SERVICES_ID);
                              field.onChange(specificServices.map((s) => s.id));
                            }}
                            noOptionsText={loadingOptions ? "Carregando..." : "Nenhum serviço cadastrado"}
                            renderOption={(props, option) => {
                              const isAll = option.id === ALL_SERVICES_ID;
                              const isChecked = isAll
                                ? isAllServices
                                : (field.value ?? []).includes(option.id);

                              return (
                                <li
                                  {...props}
                                  key={option.id}
                                  style={{
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "space-between",
                                    gap: 8,
                                    padding: "6px 12px",
                                    backgroundColor:
                                      isAll && isChecked
                                        ? alpha(theme.palette.primary.main, 0.08)
                                        : undefined,
                                  }}
                                >
                                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                    <Checkbox
                                      size="small"
                                      checked={isChecked}
                                      disableRipple
                                      sx={{
                                        color: "primary.main",
                                        p: 0,
                                        "&.Mui-checked": { color: "primary.main" },
                                      }}
                                    />
                                    <Typography
                                      variant="body2"
                                      sx={{
                                        fontWeight: isAll ? 600 : 400,
                                        color: isAll ? "primary.main" : "text.primary",
                                      }}
                                    >
                                      {isAll ? "Todos os serviços" : formatServiceLabel(option)}
                                    </Typography>
                                  </Box>
                                </li>
                              );
                            }}
                            renderTags={(value, getTagProps) => {
                              if (isAllServices) return null;
                              const MAX_TAGS = 2;
                              const visible = value.slice(0, MAX_TAGS);
                              const remaining = value.length - MAX_TAGS;

                              return (
                                <>
                                  {visible.map((option, index) => {
                                    const { key, ...tagProps } = getTagProps({ index });
                                    return (
                                      <Chip
                                        key={key || option.id}
                                        size="small"
                                        label={formatServiceLabel(option)}
                                        {...tagProps}
                                        sx={{ maxWidth: "150px", height: "22px", fontSize: "0.72rem", m: 0.25 }}
                                      />
                                    );
                                  })}
                                  {remaining > 0 && (
                                    <Tooltip
                                      title={value.slice(MAX_TAGS).map((o) => formatServiceLabel(o)).join(", ")}
                                      arrow
                                    >
                                      <Chip
                                        size="small"
                                        label={`+${remaining}`}
                                        sx={{
                                          height: "22px",
                                          fontSize: "0.72rem",
                                          fontWeight: 700,
                                          bgcolor: alpha(theme.palette.primary.main, 0.12),
                                          color: "primary.main",
                                          m: 0.25,
                                          cursor: "pointer",
                                        }}
                                      />
                                    </Tooltip>
                                  )}
                                </>
                              );
                            }}
                            renderInput={(params) => (
                              <TextField
                                {...params}
                                placeholder={isAllServices ? "Todos os serviços" : ""}
                                sx={{
                                  "& .MuiInputBase-root": {
                                    display: "flex",
                                    flexWrap: "wrap",
                                    alignItems: "center",
                                    gap: 0.5,
                                    pr: "38px !important",
                                    p: !isAllServices && (field.value ?? []).length > 0 ? "6px 8px !important" : undefined,
                                  },
                                  "& .MuiInputBase-input": {
                                    minWidth: isAllServices ? "100%" : "30px !important",
                                  },
                                  ...(isAllServices
                                    ? {
                                        "& .MuiInputBase-input::placeholder": {
                                          color: "text.primary",
                                          opacity: 1,
                                          fontWeight: 500,
                                        },
                                      }
                                    : {}),
                                }}
                              />
                            )}
                          />
                          <Typography
                            variant="caption"
                            sx={{
                              mt: 0.5,
                              display: "block",
                              fontSize: "0.75rem",
                              fontWeight: 500,
                              color: isAllServices ? "text.secondary" : "primary.main",
                            }}
                          >
                            {isAllServices
                              ? "✓ Regra válida para todos os serviços cadastrados."
                              : `✓ Regra aplicada a ${(field.value ?? []).length} serviço(s) selecionado(s).`}
                          </Typography>
                        </>
                      );
                    }}
                  />
                </FormControl>
              )}

              {/* SEÇÃO CATÁLOGO: PRODUTOS (se applies_to == product ou both) */}
              {(appliesTo === "product" || appliesTo === "both") && (
                <FormControl fullWidth>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 0.75, mb: 0.5 }}>
                    <Package size={15} color={theme.palette.primary.main} />
                    <FormLabel sx={{ color: "text.primary", fontWeight: 600, fontSize: "0.875rem" }}>
                      Produtos Elegíveis
                    </FormLabel>
                  </Box>
                  <Controller
                    name="product_ids"
                    control={control}
                    render={({ field }) => {
                      const isAllProducts = !field.value || field.value.length === 0;
                      const productOptions = [ALL_PRODUCTS_OPTION, ...products];
                      const selectedValue = isAllProducts
                        ? [ALL_PRODUCTS_OPTION]
                        : (products ?? []).filter((p) => (field.value ?? []).includes(p.id));

                      return (
                        <>
                          <Autocomplete<Product, true>
                            multiple
                            disableCloseOnSelect
                            loading={loadingOptions}
                            options={productOptions}
                            filterOptions={(options, state) => {
                              const input = state.inputValue.toLowerCase();
                              return options
                                .filter((option) => {
                                  if (option.id === ALL_PRODUCTS_ID) {
                                    return "todos os produtos".includes(input);
                                  }
                                  return `${option.name} ${option.category ?? ""} ${option.sku ?? ""}`
                                    .toLowerCase()
                                    .includes(input);
                                })
                                .slice(0, productLimit);
                            }}
                            onInputChange={(_, __, reason) => {
                              if (reason === "input") setProductLimit(20);
                            }}
                            ListboxProps={{
                              onScroll: (event: React.SyntheticEvent) => {
                                const listboxNode = event.currentTarget;
                                if (
                                  listboxNode.scrollTop + listboxNode.clientHeight >=
                                  listboxNode.scrollHeight - 10
                                ) {
                                  setProductLimit((prev) => prev + 20);
                                }
                              },
                            }}
                            size="small"
                            value={selectedValue}
                            getOptionLabel={(o) => o.name}
                            isOptionEqualToValue={(o, v) => o.id === v.id}
                            onChange={(_, newValues) => {
                              const selected = newValues as Product[];
                              const clickedAll = selected.some((p) => p.id === ALL_PRODUCTS_ID);
                              const previouslyHadAll = isAllProducts;

                              if (clickedAll && !previouslyHadAll) {
                                field.onChange([]);
                                return;
                              }

                              const specificProducts = selected.filter((p) => p.id !== ALL_PRODUCTS_ID);
                              field.onChange(specificProducts.map((p) => p.id));
                            }}
                            noOptionsText={loadingOptions ? "Carregando..." : "Nenhum produto cadastrado"}
                            renderOption={(props, option) => {
                              const isAll = option.id === ALL_PRODUCTS_ID;
                              const isChecked = isAll
                                ? isAllProducts
                                : (field.value ?? []).includes(option.id);

                              return (
                                <li
                                  {...props}
                                  key={option.id}
                                  style={{
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "space-between",
                                    gap: 8,
                                    padding: "6px 12px",
                                    backgroundColor:
                                      isAll && isChecked
                                        ? alpha(theme.palette.primary.main, 0.08)
                                        : undefined,
                                  }}
                                >
                                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                    <Checkbox
                                      size="small"
                                      checked={isChecked}
                                      disableRipple
                                      sx={{
                                        color: "primary.main",
                                        p: 0,
                                        "&.Mui-checked": { color: "primary.main" },
                                      }}
                                    />
                                    <Typography
                                      variant="body2"
                                      sx={{
                                        fontWeight: isAll ? 600 : 400,
                                        color: isAll ? "primary.main" : "text.primary",
                                      }}
                                    >
                                      {option.name}
                                    </Typography>
                                  </Box>
                                  {!isAll && option.category && (
                                    <Chip
                                      size="small"
                                      label={option.category}
                                      sx={{
                                        height: 18,
                                        fontSize: "0.68rem",
                                        fontWeight: 500,
                                        bgcolor: alpha(theme.palette.primary.main, 0.08),
                                        color: "primary.main",
                                        borderRadius: 1,
                                      }}
                                    />
                                  )}
                                </li>
                              );
                            }}
                            renderTags={(value, getTagProps) => {
                              if (isAllProducts) return null;
                              const MAX_TAGS = 2;
                              const visible = value.slice(0, MAX_TAGS);
                              const remaining = value.length - MAX_TAGS;

                              return (
                                <>
                                  {visible.map((option, index) => {
                                    const { key, ...tagProps } = getTagProps({ index });
                                    return (
                                      <Chip
                                        key={key || option.id}
                                        size="small"
                                        label={option.name}
                                        {...tagProps}
                                        sx={{ maxWidth: "150px", height: "22px", fontSize: "0.72rem", m: 0.25 }}
                                      />
                                    );
                                  })}
                                  {remaining > 0 && (
                                    <Tooltip
                                      title={value.slice(MAX_TAGS).map((o) => o.name).join(", ")}
                                      arrow
                                    >
                                      <Chip
                                        size="small"
                                        label={`+${remaining}`}
                                        sx={{
                                          height: "22px",
                                          fontSize: "0.72rem",
                                          fontWeight: 700,
                                          bgcolor: alpha(theme.palette.primary.main, 0.12),
                                          color: "primary.main",
                                          m: 0.25,
                                          cursor: "pointer",
                                        }}
                                      />
                                    </Tooltip>
                                  )}
                                </>
                              );
                            }}
                            renderInput={(params) => (
                              <TextField
                                {...params}
                                placeholder={isAllProducts ? "Todos os produtos" : ""}
                                sx={{
                                  "& .MuiInputBase-root": {
                                    display: "flex",
                                    flexWrap: "wrap",
                                    alignItems: "center",
                                    gap: 0.5,
                                    pr: "38px !important",
                                    p: !isAllProducts && (field.value ?? []).length > 0 ? "6px 8px !important" : undefined,
                                  },
                                  "& .MuiInputBase-input": {
                                    minWidth: isAllProducts ? "100%" : "30px !important",
                                  },
                                  ...(isAllProducts
                                    ? {
                                        "& .MuiInputBase-input::placeholder": {
                                          color: "text.primary",
                                          opacity: 1,
                                          fontWeight: 500,
                                        },
                                      }
                                    : {}),
                                }}
                              />
                            )}
                          />
                          <Typography
                            variant="caption"
                            sx={{
                              mt: 0.5,
                              display: "block",
                              fontSize: "0.75rem",
                              fontWeight: 500,
                              color: isAllProducts ? "text.secondary" : "primary.main",
                            }}
                          >
                            {isAllProducts
                              ? "✓ Regra válida para todos os produtos cadastrados."
                              : `✓ Regra aplicada a ${(field.value ?? []).length} produto(s) selecionado(s).`}
                          </Typography>
                        </>
                      );
                    }}
                  />
                </FormControl>
              )}
            </Box>
          </Box>

          <Box
            sx={{
              display: "flex",
              flexDirection: { xs: "column-reverse", sm: "row" },
              justifyContent: "flex-end",
              gap: 1.5,
              pt: 2,
              borderTop: "1px solid",
              borderColor: "divider",
              "& > button": {
                minWidth: 120,
                minHeight: 42,
                borderRadius: 2,
                fontWeight: 700,
              },
            }}
          >
            <Button variant="outlined" onClick={onClose} disabled={isSubmitting}>
              Cancelar
            </Button>
            <Button disabled={isSubmitting} onClick={handleSubmit(onSubmit)}>
              {isSubmitting ? "Salvando..." : mode === "create" ? "Criar Regra" : "Salvar Alterações"}
            </Button>
          </Box>
        </Box>
      </DialogContent>
    </Dialog>
  );
}
