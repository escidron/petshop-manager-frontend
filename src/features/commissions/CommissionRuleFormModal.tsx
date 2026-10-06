import {
  Autocomplete,
  Box,
  Checkbox,
  Chip,
  Dialog,
  DialogContent,
  DialogTitle,
  Divider,
  FormControl,
  FormControlLabel,
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
import { X } from "lucide-react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import CustomTextField from "../../components/Textfield/CustomTextfield";
import { Button } from "../../components/Button/Button";
import { useToast } from "../../hooks/useToast";
import { createCommissionRule, updateCommissionRule } from "../../api/services/commissions";
import { getEmployees as fetchEmployees } from "../../api/services/employees";
import { fetchServices } from "../../api/services/tenant_services";
import type { CommissionRule, CommissionRuleFormData } from "./types";
import type { Employee } from "../employees/types";
import type { Service } from "../tenant_services/types";
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
  service_ids: z.array(z.number()),
  valid_from: z.string().nullable().optional(),
  valid_until: z.string().nullable().optional(),
  is_active: z.boolean(),
});

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
  open, mode, rule, onClose, onSuccess,
}: Props) {
  const toast = useToast();
  const currentTheme = useTheme();
  const isMobile = useMediaQuery(currentTheme.breakpoints.down("md"));
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
  const [loadingOptions, setLoadingOptions] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [employeeLimit, setEmployeeLimit] = useState(20);
  const [serviceLimit, setServiceLimit] = useState(20);

  const { control, handleSubmit, reset, watch, setValue } = useForm<CommissionRuleFormData>({
    resolver: zodResolver(schema) as any,
    defaultValues: {
      name: "",
      commission_type: "percentage",
      value: "" as unknown as number,
      applies_to: "service",
      employee_id: null,
      employee_ids: [],
      service_ids: [],
      valid_from: null,
      valid_until: null,
      is_active: true,
    },
  });

  const commissionType = watch("commission_type");

  const availableRoles = useMemo(() => {
    const activeEmps = employees.filter((e) => e.is_active);
    const roleCounts: Record<string, number> = {};
    activeEmps.forEach((e) => {
      const roleKey = e.role || "other";
      roleCounts[roleKey] = (roleCounts[roleKey] || 0) + 1;
    });

    return Object.entries(roleCounts)
      .map(([role, count]) => ({
        role,
        label: ROLE_LABELS[role] || role,
        count,
      }))
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [employees]);

  const handleRolesChange = (newRoles: string[]) => {
    const activeEmps = employees.filter((e) => e.is_active);
    const currentEmpIds = watch("employee_ids") || [];

    const addedRoles = newRoles.filter((r) => !selectedRoles.includes(r));
    const removedRoles = selectedRoles.filter((r) => !newRoles.includes(r));

    let updatedEmpIds = [...currentEmpIds];

    if (addedRoles.length > 0) {
      const toAdd = activeEmps
        .filter((e) => addedRoles.includes(e.role))
        .map((e) => e.id);
      updatedEmpIds = Array.from(new Set([...updatedEmpIds, ...toAdd]));
    }

    if (removedRoles.length > 0) {
      const toRemove = new Set(
        activeEmps
          .filter((e) => removedRoles.includes(e.role))
          .map((e) => e.id)
      );
      updatedEmpIds = updatedEmpIds.filter((id) => !toRemove.has(id));
    }

    setSelectedRoles(newRoles);
    setValue("employee_ids", updatedEmpIds, {
      shouldValidate: true,
      shouldDirty: true,
    });
  };

  useEffect(() => {
    if (open) {
      let isMounted = true;
      setLoadingOptions(true);
      const initialEmpIds = rule?.employee_ids ?? (rule?.employees?.map((e) => e.id) ?? (rule?.employee_id ? [rule.employee_id] : []));

      Promise.all([fetchEmployees(), fetchServices()])
        .then(([empData, svcData]) => {
          if (isMounted) {
            setEmployees(empData);
            setServices(svcData);

            if (initialEmpIds.length > 0) {
              const activeEmps = empData.filter((e) => e.is_active);
              const distinctRoles = Array.from(new Set(activeEmps.map((e) => e.role)));
              const matched = distinctRoles.filter((r) => {
                const empsInRole = activeEmps.filter((e) => e.role === r);
                return (
                  empsInRole.length > 0 &&
                  empsInRole.every((e) => initialEmpIds.includes(e.id))
                );
              });
              setSelectedRoles(matched);
            } else {
              setSelectedRoles([]);
            }
          }
        })
        .catch(() => {
          toast.error("Erro ao carregar funcionários e serviços.");
        })
        .finally(() => {
          if (isMounted) setLoadingOptions(false);
        });

      reset({
        name: rule?.name ?? "",
        commission_type: rule?.commission_type ?? "percentage",
        value: rule?.value ?? ("" as unknown as number),
        applies_to: rule?.applies_to ?? "service",
        employee_id: initialEmpIds[0] ?? null,
        employee_ids: initialEmpIds,
        service_ids: rule?.service_ids ?? (rule?.services?.map((s) => s.id) ?? []),
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
      const cleanEmpIds = (data.employee_ids || []).filter((id) => id > 0);
      const cleanSvcIds = (data.service_ids || []).filter((id) => id > 0);
      const payload = {
        ...data,
        employee_id: cleanEmpIds[0] ?? null,
        employee_ids: cleanEmpIds,
        service_ids: cleanSvcIds,
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
    width: { xs: "100%", md: "48%" },
  };

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
            width: { xs: "100%", md: "780px" },
            maxWidth: { xs: "100%", md: "780px" },
            m: { xs: 0, md: 2 },
            borderRadius: { xs: 0, md: 3 },
            maxHeight: { xs: "100dvh", md: "90vh" },
            height: { xs: "100dvh", md: "auto" },
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
        <Typography variant="h6" fontWeight={700}>
          {mode === "create" ? "Nova Regra de Comissão" : "Editar Regra"}
        </Typography>
        <IconButton size="small" onClick={onClose} sx={{ color: "text.secondary" }}>
          <X size={20} />
        </IconButton>
      </DialogTitle>

      <DialogContent
        sx={{
          p: { xs: 2, sm: 3 },
          pb: { xs: "calc(20px + env(safe-area-inset-bottom, 0px))", sm: 3 },
        }}
      >
        <Box component="form" sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <Box
            sx={{
              display: "flex",
              flexDirection: { xs: "column", md: "row" },
              justifyContent: "space-between",
              gap: { xs: 3, md: 3 },
            }}
          >
            {/* ── ESQUERDA — Campos obrigatórios ────────────────────── */}
            <Box sx={colStyle}>
              <Box>
                <Typography variant="h6">Configuração</Typography>
                <Typography fontSize="12px" color="text.disabled">
                  Campos obrigatórios
                </Typography>
              </Box>

              <FormControl fullWidth>
                <FormLabel sx={{ color: "text.primary", mb: 0.5 }}>
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
                      placeholder='Ex: "Tosa grande — João"'
                    />
                  )}
                />
              </FormControl>

              <FormControl fullWidth>
                <FormLabel sx={{ color: "text.primary", mb: 0.5 }}>
                  Tipo de comissão
                </FormLabel>
                <Controller
                  name="commission_type"
                  control={control}
                  render={({ field }) => (
                    <Select {...field} size="small">
                      <MenuItem value="percentage">Percentual (%)</MenuItem>
                      <MenuItem value="fixed">Valor fixo (R$)</MenuItem>
                    </Select>
                  )}
                />
              </FormControl>

              <FormControl fullWidth>
                <FormLabel sx={{ color: "text.primary", mb: 0.5 }}>
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
                          field.onChange(
                            digits === "" ? undefined : Number(digits) / 100,
                          );
                        }}
                      />
                    );
                  }}
                />
              </FormControl>

              <FormControl fullWidth>
                <FormLabel sx={{ color: "text.primary", mb: 0.5 }}>
                  Aplica-se a
                </FormLabel>
                <Controller
                  name="applies_to"
                  control={control}
                  render={({ field }) => (
                    <Select {...field} size="small">
                      <MenuItem value="service">Serviços</MenuItem>
                      <MenuItem value="product">Produtos</MenuItem>
                      <MenuItem value="both">Ambos</MenuItem>
                    </Select>
                  )}
                />
              </FormControl>
            </Box>

            {/* ── DIREITA — Filtros e vigência (opcionais) ──────────── */}
            <Box sx={colStyle}>
              <Box>
                <Typography variant="h6">Filtros e Vigência</Typography>
                <Typography fontSize="12px" color="text.disabled">
                  Deixe em "Todos" para aplicar a toda a equipe ou catálogo
                </Typography>
              </Box>

              {/* ── SELEÇÃO RÁPIDA POR CARGO / ÁREA ──────────── */}
              <FormControl fullWidth>
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    mb: 0.5,
                  }}
                >
                  <FormLabel sx={{ color: "text.primary", mb: 0 }}>
                    Filtrar por Área / Cargo
                  </FormLabel>
                  {selectedRoles.length > 0 && (
                    <Typography
                      variant="caption"
                      sx={{
                        color: "primary.main",
                        cursor: "pointer",
                        fontWeight: 600,
                        fontSize: "0.75rem",
                        "&:hover": { textDecoration: "underline" },
                      }}
                      onClick={() => handleRolesChange([])}
                    >
                      Limpar cargos
                    </Typography>
                  )}
                </Box>
                <Autocomplete
                  multiple
                  size="small"
                  options={availableRoles}
                  value={availableRoles.filter((r) =>
                    selectedRoles.includes(r.role)
                  )}
                  getOptionLabel={(o) => `${o.label} (${o.count})`}
                  isOptionEqualToValue={(o, v) => o.role === v.role}
                  onChange={(_, newValues) => {
                    handleRolesChange(newValues.map((v) => v.role));
                  }}
                  renderInput={(params) => {
                    const hasSelected = selectedRoles.length > 0;
                    return (
                      <TextField
                        {...params}
                        placeholder={
                          !hasSelected
                            ? "Ex: Banhista, Tosador..."
                            : "Adicionar outro cargo..."
                        }
                        sx={{
                          "& .MuiInputBase-root": {
                            display: "flex",
                            flexWrap: "wrap",
                            alignItems: "center",
                            gap: 0.5,
                            p: hasSelected ? "6px 8px !important" : undefined,
                          },
                          "& .MuiAutocomplete-input": {
                            ...(hasSelected
                              ? {
                                  minWidth: "100% !important",
                                  width: "100% !important",
                                  flexBasis: "100% !important",
                                  mt: "4px",
                                  pt: "2px",
                                  pb: "2px",
                                }
                              : {}),
                          },
                          "& .MuiAutocomplete-endAdornment": {
                            ...(hasSelected
                              ? {
                                  top: "auto",
                                  bottom: "7px",
                                }
                              : {}),
                          },
                        }}
                      />
                    );
                  }}
                  renderTags={(tagValue, getTagProps) => {
                    const MAX_ROLES = 2;
                    const visible = tagValue.slice(0, MAX_ROLES);
                    const remaining = tagValue.length - MAX_ROLES;

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
                              label={`${option.label} (${option.count})`}
                              {...tagProps}
                              sx={{
                                height: "22px",
                                fontSize: "0.72rem",
                                fontWeight: 600,
                                m: 0.25,
                              }}
                            />
                          );
                        })}
                        {remaining > 0 && (
                          <Tooltip
                            title={tagValue
                              .slice(MAX_ROLES)
                              .map((o) => `${o.label} (${o.count})`)
                              .join(", ")}
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
                  noOptionsText={
                    loadingOptions
                      ? "Carregando..."
                      : "Nenhum cargo encontrado"
                  }
                />
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ mt: 0.5, display: "block", fontSize: "0.75rem" }}
                >
                  {selectedRoles.length === 0
                    ? "Dica: selecione cargos para marcar em lote os colaboradores abaixo."
                    : `✓ Marcando colaboradores de: ${selectedRoles
                        .map((r) => ROLE_LABELS[r] || r)
                        .join(", ")}`}
                </Typography>
              </FormControl>

              <FormControl fullWidth>
                <FormLabel sx={{ color: "text.primary", mb: 0.5 }}>
                  Funcionários
                </FormLabel>
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
                                const roleLabel = option.role ? (ROLE_LABELS[option.role] || option.role).toLowerCase() : "";
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
                              setSelectedRoles([]);
                              field.onChange([]);
                              return;
                            }

                            const specificEmployees = selected.filter(
                              (e) => e.id !== ALL_EMPLOYEES_ID
                            );

                            const nextEmpIds = specificEmployees.map((e) => e.id);
                            field.onChange(nextEmpIds);

                            // Atualiza os cargos selecionados caso funcionários sejam alterados manualmente
                            if (selectedRoles.length > 0) {
                              const activeEmps = employees.filter((e) => e.is_active);
                              const stillFullRoles = selectedRoles.filter((r) => {
                                const empsInRole = activeEmps.filter((e) => e.role === r);
                                return (
                                  empsInRole.length > 0 &&
                                  empsInRole.every((e) => nextEmpIds.includes(e.id))
                                );
                              });
                              if (stillFullRoles.length !== selectedRoles.length) {
                                setSelectedRoles(stillFullRoles);
                              }
                            }
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
                                  backgroundColor: isAll && isChecked
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
                                      "&.Mui-checked": {
                                        color: "primary.main",
                                      },
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
                            if (isAllEmployees) {
                              return null;
                            }
                            const MAX_TAGS = 3;
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
                                      sx={{
                                        maxWidth: "140px",
                                        height: "22px",
                                        fontSize: "0.72rem",
                                        m: 0.25,
                                      }}
                                    />
                                  );
                                })}
                                {remaining > 0 && (
                                  <Tooltip
                                    title={value
                                      .slice(MAX_TAGS)
                                      .map((o) => o.name)
                                      .join(", ")}
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
                          renderInput={(params) => {
                            const hasSelected = !isAllEmployees && (field.value ?? []).length > 0;
                            return (
                              <TextField
                                {...params}
                                placeholder={
                                  isAllEmployees
                                    ? "Todos os funcionários"
                                    : "Adicionar outro funcionário..."
                                }
                                sx={{
                                  "& .MuiInputBase-root": {
                                    display: "flex",
                                    flexWrap: "wrap",
                                    alignItems: "center",
                                    gap: 0.5,
                                    p: hasSelected ? "6px 8px !important" : undefined,
                                  },
                                  "& .MuiAutocomplete-input": {
                                    ...(hasSelected
                                      ? {
                                          minWidth: "100% !important",
                                          width: "100% !important",
                                          flexBasis: "100% !important",
                                          mt: "4px",
                                          pt: "2px",
                                          pb: "2px",
                                        }
                                      : {}),
                                  },
                                  "& .MuiAutocomplete-endAdornment": {
                                    ...(hasSelected
                                      ? {
                                          top: "auto",
                                          bottom: "7px",
                                        }
                                      : {}),
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
                            );
                          }}
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
                            ? "✓ Regra válida para todos os funcionários"
                            : `✓ Regra aplicada a ${(field.value ?? []).length} funcionário(s) selecionado(s)`}
                        </Typography>
                      </>
                    );
                  }}
                />
              </FormControl>

              <FormControl fullWidth>
                <FormLabel sx={{ color: "text.primary", mb: 0.5 }}>
                  Serviços
                </FormLabel>
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
                            o.id === ALL_SERVICES_ID
                              ? "Todos os serviços"
                              : formatServiceLabel(o)
                          }
                          isOptionEqualToValue={(o, v) => o.id === v.id}
                          onChange={(_, newValues) => {
                            const selected = newValues as Service[];
                            const clickedAll = selected.some((s) => s.id === ALL_SERVICES_ID);
                            const previouslyHadAll = isAllServices;

                            if (clickedAll && !previouslyHadAll) {
                              // User clicked "Todos os serviços" -> reset to []
                              field.onChange([]);
                              return;
                            }

                            // Filter out ALL_SERVICES_ID to get specific services
                            const specificServices = selected.filter(
                              (s) => s.id !== ALL_SERVICES_ID
                            );

                            if (previouslyHadAll && specificServices.length > 0) {
                              // User was on "Todos" and picked specific service(s)
                              field.onChange(specificServices.map((s) => s.id));
                              return;
                            }

                            // If specificServices is empty, it reverts to Todos ([])
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
                                  gap: 8,
                                  padding: "6px 12px",
                                  backgroundColor: isAll && isChecked
                                    ? alpha(theme.palette.primary.main, 0.08)
                                    : undefined,
                                }}
                              >
                                <Checkbox
                                  size="small"
                                  checked={isChecked}
                                  disableRipple
                                  sx={{
                                    color: "primary.main",
                                    p: 0,
                                    "&.Mui-checked": {
                                      color: "primary.main",
                                    },
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
                              </li>
                            );
                          }}
                          renderTags={(value, getTagProps) => {
                            if (isAllServices) {
                              return null;
                            }
                            const MAX_TAGS = 3;
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
                                      sx={{
                                        maxWidth: "150px",
                                        height: "22px",
                                        fontSize: "0.72rem",
                                        m: 0.25,
                                      }}
                                    />
                                  );
                                })}
                                {remaining > 0 && (
                                  <Tooltip
                                    title={value
                                      .slice(MAX_TAGS)
                                      .map((o) => formatServiceLabel(o))
                                      .join(", ")}
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
                          renderInput={(params) => {
                            const hasSelected = !isAllServices && (field.value ?? []).length > 0;
                            return (
                              <TextField
                                {...params}
                                placeholder={
                                  isAllServices
                                    ? "Todos os serviços"
                                    : "Adicionar outro serviço..."
                                }
                                sx={{
                                  "& .MuiInputBase-root": {
                                    display: "flex",
                                    flexWrap: "wrap",
                                    alignItems: "center",
                                    gap: 0.5,
                                    p: hasSelected ? "6px 8px !important" : undefined,
                                  },
                                  "& .MuiAutocomplete-input": {
                                    ...(hasSelected
                                      ? {
                                          minWidth: "100% !important",
                                          width: "100% !important",
                                          flexBasis: "100% !important",
                                          mt: "4px",
                                          pt: "2px",
                                          pb: "2px",
                                        }
                                      : {}),
                                  },
                                  "& .MuiAutocomplete-endAdornment": {
                                    ...(hasSelected
                                      ? {
                                          top: "auto",
                                          bottom: "7px",
                                        }
                                      : {}),
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
                            );
                          }}
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
                            ? "✓ Regra válida para todos os serviços cadastrados"
                            : `✓ Regra aplicada a ${(field.value ?? []).length} serviço(s) selecionado(s)`}
                        </Typography>
                      </>
                    );
                  }}
                />
              </FormControl>

              <Box sx={{ display: "flex", gap: 2 }}>
                <FormControl fullWidth>
                  <FormLabel sx={{ color: "text.primary", mb: 0.5 }}>
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
                          dayOfWeekFormatter={(day: dayjs.Dayjs) => {
                            const days = ["dom", "seg", "ter", "qua", "qui", "sex", "sab"];
                            return days[day.day()];
                          }}
                          slotProps={{
                            popper: {
                              sx: {
                                "& .MuiDayCalendar-weekDayLabel": {
                                  color: "#3d4048 !important",
                                  fontWeight: 700,
                                  fontSize: "0.75rem",
                                },
                                "& .MuiPickersDay-root": {
                                  color: "#3d4048 !important",
                                  "&.Mui-selected": {
                                    color: "white !important",
                                  },
                                },
                                "& .MuiPickersCalendarHeader-label": {
                                  color: "#3d4048 !important",
                                },
                                "& .MuiPickersArrowSwitcher-button": {
                                  color: "#3d4048 !important",
                                },
                              },
                            },
                            textField: {
                              size: "small",
                              fullWidth: true,
                              error: !!fieldState.error,
                              helperText: fieldState.error?.message,
                              placeholder: "DD/MM/AAAA",
                              inputMode: "numeric",
                              sx: { backgroundColor: theme.palette.common.white },
                            },
                            actionBar: { actions: [] },
                          }}
                        />
                      </LocalizationProvider>
                    )}
                  />
                </FormControl>

                <FormControl fullWidth>
                  <FormLabel sx={{ color: "text.primary", mb: 0.5 }}>
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
                          dayOfWeekFormatter={(day: dayjs.Dayjs) => {
                            const days = ["dom", "seg", "ter", "qua", "qui", "sex", "sab"];
                            return days[day.day()];
                          }}
                          slotProps={{
                            popper: {
                              sx: {
                                "& .MuiDayCalendar-weekDayLabel": {
                                  color: "#3d4048 !important",
                                  fontWeight: 700,
                                  fontSize: "0.75rem",
                                },
                                "& .MuiPickersDay-root": {
                                  color: "#3d4048 !important",
                                  "&.Mui-selected": {
                                    color: "white !important",
                                  },
                                },
                                "& .MuiPickersCalendarHeader-label": {
                                  color: "#3d4048 !important",
                                },
                                "& .MuiPickersArrowSwitcher-button": {
                                  color: "#3d4048 !important",
                                },
                              },
                            },
                            textField: {
                              size: "small",
                              fullWidth: true,
                              error: !!fieldState.error,
                              helperText: fieldState.error?.message,
                              placeholder: "DD/MM/AAAA",
                              inputMode: "numeric",
                              sx: { backgroundColor: theme.palette.common.white },
                            },
                            actionBar: { actions: [] },
                          }}
                        />
                      </LocalizationProvider>
                    )}
                  />
                </FormControl>
              </Box>

              <Controller
                name="is_active"
                control={control}
                render={({ field }) => (
                  <FormControlLabel
                    control={<Switch checked={field.value} onChange={field.onChange} />}
                    label="Regra ativa"
                  />
                )}
              />
            </Box>
          </Box>

          <Divider sx={{ mt: 1 }} />
          <Box
            sx={{
              display: "flex",
              flexDirection: { xs: "column-reverse", sm: "row" },
              justifyContent: "flex-end",
              gap: 1.5,
              "& > button": {
                width: { xs: "100%", sm: "auto" },
                minHeight: 44,
                borderRadius: 2,
              },
            }}
          >
            <Button variant="outlined" onClick={onClose} disabled={isSubmitting}>
              Cancelar
            </Button>
            <Button disabled={isSubmitting} onClick={handleSubmit(onSubmit)} sx={{ fontWeight: 700 }}>
              Salvar
            </Button>
          </Box>
        </Box>
      </DialogContent>
    </Dialog>
  );
}
