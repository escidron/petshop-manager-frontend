import { useMemo, useState } from "react";
import {
  Autocomplete,
  Box,
  Checkbox,
  Chip,
  FormControl,
  FormControlLabel,
  IconButton,
  MenuItem,
  Radio,
  RadioGroup,
  Select,
  Switch,
  TextField,
  Tooltip,
  Typography,
  alpha,
} from "@mui/material";
import { Button } from "../../components/Button/Button";
import { CalendarCheck, Plus, Trash2 } from "lucide-react";
import { Controller, type Control, type UseFormSetValue, useWatch } from "react-hook-form";
import type { Pet } from "../pets/types";
import type { Service } from "../tenant_services/types";
import type { AppointmentFormData } from "./types";
import { getServicesForPet } from "../../utils/serviceMatcher";
import { formatPrice, formatServiceLabel } from "../../utils/formatServiceLabel";
import type { ClientPackage } from "../client_packages/types";
import dayjs from "dayjs";
import theme from "../../theme";

type Props = {
  index: number;
  control: Control<AppointmentFormData>;
  errors: any;
  setValue: UseFormSetValue<AppointmentFormData>;
  watchedClientId: number | null | undefined;
  pets: Pet[];
  services: Service[];
  items: { pet_id: number; service_ids: number[]; recurrence?: any }[];
  clientPackages: ClientPackage[];
  onCreatePet?: (index: number, clientId: number) => void;
  onCreateService?: (index: number) => void;
  onRemove: () => void;
  isOnlyPet: boolean;
  scheduledDate?: dayjs.Dayjs | null;
  mode?: "create" | "edit";
  trigger?: any;
};

export default function AppointmentPetItem({
  index,
  control,
  errors,
  setValue,
  watchedClientId,
  pets,
  services,
  items,
  clientPackages,
  onCreatePet,
  onCreateService,
  onRemove,
  isOnlyPet,
  scheduledDate,
  mode = "create",
  trigger,
}: Props) {
  const [petListLimit, setPetListLimit] = useState(20);
  const [serviceListLimit, setServiceListLimit] = useState(20);
  const [showAllServices, setShowAllServices] = useState(false);
  const itemError = errors.items?.[index];

  // Watch the selected pet_id for this specific row using the items prop
  const currentPetId = items[index]?.pet_id;
  const currentPet = pets?.find((p) => p.id === currentPetId);

  // Recorrência individual por pet
  const itemRecurrence = useWatch({
    control,
    name: `items.${index}.recurrence` as any,
  });
  const isPetRecurrent = Boolean(itemRecurrence);
  const recurrenceFrequency = itemRecurrence?.frequency || "weekly";
  const recurrenceOccurrences = itemRecurrence?.occurrences || 4;

  const maxOccurrences =
    recurrenceFrequency === "weekly"
      ? 52
      : recurrenceFrequency === "biweekly"
      ? 26
      : 12;

  const [recurrenceEndType, setRecurrenceEndType] = useState<"occurrences" | "never">(
    itemRecurrence?.occurrences === maxOccurrences ? "never" : "occurrences"
  );

  const handleToggleRecurrence = (checked: boolean) => {
    if (checked) {
      setValue(`items.${index}.recurrence`, {
        frequency: "weekly",
        occurrences: 4,
      });
      setRecurrenceEndType("occurrences");
    } else {
      setValue(`items.${index}.recurrence`, undefined);
    }
  };

  const handleFrequencyChange = (newFreq: "weekly" | "biweekly" | "monthly") => {
    const max = newFreq === "weekly" ? 52 : newFreq === "biweekly" ? 26 : 12;
    const newOccurrences =
      recurrenceEndType === "never"
        ? max
        : Math.min(Number(recurrenceOccurrences) || 4, max);
    setValue(`items.${index}.recurrence`, {
      frequency: newFreq,
      occurrences: newOccurrences,
    });
    trigger?.(`items.${index}.recurrence.occurrences`);
  };

  const handleEndTypeChange = (type: "occurrences" | "never") => {
    setRecurrenceEndType(type);
    if (type === "never") {
      setValue(`items.${index}.recurrence.occurrences`, maxOccurrences);
    } else {
      setValue(
        `items.${index}.recurrence.occurrences`,
        Math.min(Number(recurrenceOccurrences) || 4, maxOccurrences)
      );
    }
    trigger?.(`items.${index}.recurrence.occurrences`);
  };

  const petSummaryDates = useMemo(() => {
    if (!isPetRecurrent || !scheduledDate) return null;
    const start = dayjs(scheduledDate);
    if (!start.isValid()) return null;

    const count = Number(recurrenceOccurrences) || 2;
    const dates = [];
    const computeCount = Math.min(count, 6);
    for (let i = 0; i < computeCount; i++) {
      if (recurrenceFrequency === "weekly") dates.push(start.add(i, "week"));
      else if (recurrenceFrequency === "biweekly") dates.push(start.add(i * 2, "week"));
      else if (recurrenceFrequency === "monthly") dates.push(start.add(i * 4, "week"));
    }
    return {
      dates: dates.map((d) => ({
        day: d.format("DD"),
        month: d.format("MMM").toLowerCase(),
      })),
      total: count,
      remaining: count > 6 ? count - 6 : 0,
    };
  }, [isPetRecurrent, scheduledDate, recurrenceFrequency, recurrenceOccurrences]);

  // Calculate available packages and credits dynamically
  const packageCreditsByServiceId = useMemo(() => {
    // 1. Initialize global available credits map: credit.id -> remaining_qty
    const globalCredits = new Map<number, number>();
    clientPackages.forEach((pkg) => {
      if (!pkg.is_active) return;
      pkg.credits.forEach((credit) => {
        if (credit.service_id && credit.remaining_qty > 0) {
          globalCredits.set(credit.id, credit.remaining_qty);
        }
      });
    });

    // 2. Simulate consumption for all pets EXCEPT this one, up to the current index
    for (let i = 0; i < index; i++) {
      const prevItem = items[i];
      if (!prevItem || !prevItem.pet_id) continue;
      
      const prevPetPkgs = clientPackages.filter((pkg) => pkg.is_active && pkg.pets.some((p) => p.id === prevItem.pet_id));
      const prevServices = prevItem.service_ids || [];
      
      prevServices.forEach((serviceId) => {
        for (const pkg of prevPetPkgs) {
          const credit = pkg.credits.find((c) => c.service_id === serviceId && globalCredits.has(c.id) && globalCredits.get(c.id)! > 0);
          if (credit) {
            globalCredits.set(credit.id, globalCredits.get(credit.id)! - 1);
            break; 
          }
        }
      });
    }

    // 3. Sum up what's available for THIS pet
    const map = new Map<number, number>();
    const thisPetPkgs = clientPackages.filter((pkg) => pkg.is_active && pkg.pets.some((p) => p.id === currentPetId));
    
    thisPetPkgs.forEach((pkg) => {
      pkg.credits.forEach((credit) => {
        if (credit.service_id) {
          const available = globalCredits.get(credit.id) || 0;
          if (available > 0) {
            const current = map.get(credit.service_id) || 0;
            map.set(credit.service_id, current + available);
          }
        }
      });
    });
    
    return map;
  }, [clientPackages, items, index, currentPetId]);

  // Derived filtered services (matching size/coat type + prioritizing packages)
  const sortedAndFilteredServices = useMemo(() => {
    let baseServices = (services ?? []).filter((s) => s.is_active);
    if (!showAllServices) {
      const selectedIds = items?.[index]?.service_ids ?? [];
      const compatibleServices = getServicesForPet(baseServices, currentPet);
      const selectedIncompatible = baseServices.filter(
        (s) => selectedIds.includes(s.id) && !compatibleServices.some((c) => c.id === s.id)
      );
      baseServices = [...compatibleServices, ...selectedIncompatible];
    }

    // Move package-covered services to the top
    const covered: Service[] = [];
    const notCovered: Service[] = [];

    baseServices.forEach((s) => {
      if (packageCreditsByServiceId.has(s.id)) {
        covered.push(s);
      } else {
        notCovered.push(s);
      }
    });

    return [...covered, ...notCovered];
  }, [services, currentPet, showAllServices, packageCreditsByServiceId, items, index]);

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        gap: 1.25,
        mb: 2,
        p: 2,
        border: "1px solid #E2E8F0",
        borderRadius: 2.5,
        bgcolor: "#FFFFFF",
      }}
    >
      {/* PET */}
      <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
        <Controller
          name={`items.${index}.pet_id`}
          control={control}
          render={({ field }) => {
            const selectedPetIds =
              items?.map((i) => i.pet_id).filter((id) => id && id !== field.value) ?? [];
            const availablePets =
              pets?.filter(
                (pet) =>
                  !selectedPetIds.includes(pet.id) &&
                  (!pet.is_deceased || pet.id === field.value)
              ) ?? [];
            return (
              <Autocomplete<Pet>
                sx={{ flex: 1 }}
                options={availablePets}
                filterOptions={(options, state) => {
                  const input = state.inputValue.toLowerCase();
                  return options
                    .filter((option) => option.name.toLowerCase().includes(input))
                    .slice(0, petListLimit);
                }}
                noOptionsText="Nenhum pet cadastrado"
                size="small"
                value={pets?.find((p) => p.id === field.value) ?? null}
                getOptionLabel={(option) => option.name}
                isOptionEqualToValue={(o, v) => o.id === v.id}
                onInputChange={(_, __, reason) => {
                  if (reason === 'input') setPetListLimit(20);
                }}
                ListboxProps={{
                  onScroll: (event: React.SyntheticEvent) => {
                    const listboxNode = event.currentTarget;
                    if (
                      listboxNode.scrollTop + listboxNode.clientHeight >=
                      listboxNode.scrollHeight - 10
                    ) {
                      setPetListLimit((prev) => prev + 20);
                    }
                  }
                }}
                renderOption={(props, option) => {
                  const sizeText = option.size ? `Porte ${option.size}` : null;
                  const details = [option.breed, sizeText].filter(Boolean).join(" - ");
                  
                  return (
                    <li {...props} key={option.id}>
                      <Box sx={{ display: "flex", flexDirection: "column" }}>
                        <Typography variant="body2" color="text.primary">{option.name}</Typography>
                        <Typography variant="caption" color="text.primary">
                          {details || "Sem raça"}
                        </Typography>
                      </Box>
                    </li>
                  );
                }}
                onChange={(_, value) => {
                  field.onChange(value?.id ?? 0);
                  setValue(`items.${index}.service_ids`, []);
                }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    placeholder={
                      watchedClientId ? "Selecionar pet" : "Selecione um cliente primeiro"
                    }
                  />
                )}
              />
            );
          }}
        />
        <Button
          variant="outlined"
          sx={{
            minWidth: { xs: "40px", sm: "120px" },
            width: { xs: "40px", sm: "auto" },
            height: "40px",
            p: { xs: 0, sm: "6px 16px" },
            flexShrink: 0,
          }}
          onClick={() => onCreatePet?.(index, watchedClientId ?? 0)}
          title="Criar Pet"
        >
          <Plus size={18} />
          <Box component="span" sx={{ display: { xs: "none", sm: "inline" }, ml: 0.5 }}>
            Criar Pet
          </Box>
        </Button>
      </Box>

      {/* SERVIÇOS */}
      <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
        <Controller
          name={`items.${index}.service_ids`}
          control={control}
          render={({ field }) => (
            <Autocomplete
              sx={{
                flex: 1,
                "& .MuiAutocomplete-tag": {
                  maxWidth: "150px",
                  textOverflow: "ellipsis",
                  overflow: "hidden",
                  whiteSpace: "nowrap",
                },
              }}
              disabled={!currentPet}
              noOptionsText="Nenhum serviço cadastrado"
              multiple
              options={sortedAndFilteredServices}
              filterOptions={(options, state) => {
                const input = state.inputValue.toLowerCase();
                return options.filter((option) =>
                  `${option.name} ${option.sizes?.join(" ") ?? ""} ${option.size ?? ""} ${option.coat_types?.join(" ") ?? ""} ${option.coat_type ?? ""}`
                    .toLowerCase()
                    .includes(input)
                ).slice(0, serviceListLimit);
              }}
              disableCloseOnSelect
              size="small"
              value={
                (services ?? []).filter((s) => field.value?.includes(s.id)) ?? []
              }
              getOptionLabel={(option) => formatServiceLabel(option)}
              isOptionEqualToValue={(option, value) => option.id === value.id}
              onInputChange={(_, __, reason) => {
                if (reason === 'input') setServiceListLimit(20);
              }}
              ListboxProps={{
                sx: {
                  maxHeight: "280px",
                },
                onScroll: (event: React.SyntheticEvent) => {
                  const listboxNode = event.currentTarget;
                  if (
                    listboxNode.scrollTop + listboxNode.clientHeight >=
                    listboxNode.scrollHeight - 10
                  ) {
                    setServiceListLimit((prev) => prev + 20);
                  }
                },
              }}
              slotProps={{
                paper: {
                  sx: {
                    borderRadius: 2,
                    boxShadow: "0 6px 24px rgba(0,0,0,0.12)",
                    overflow: "hidden",
                  },
                },
              }}
              onChange={(_, value) => field.onChange(value.map((v) => v.id))}
              renderOption={(props, option, { selected }) => {
                const { ...rest } = props;
                const remainingQty = packageCreditsByServiceId.get(option.id) || 0;
                const isPackageCovered = remainingQty > 0;

                return (
                  <li
                    {...rest}
                    key={option.id}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      width: "100%",
                      padding: "8px 12px",
                      backgroundColor: isPackageCovered
                        ? "rgba(46, 125, 50, 0.04)"
                        : "transparent",
                    }}
                  >
                    <Box
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        minWidth: 0,
                        flex: 1,
                        overflow: "hidden",
                      }}
                    >
                      <Checkbox
                        checked={selected}
                        disableRipple
                        sx={{ color: "primary.main", p: 0 }}
                      />
                      <Box sx={{ minWidth: 0, overflow: "hidden" }}>
                        <Typography
                          noWrap
                          sx={{
                            fontWeight: 500,
                            fontSize: { xs: "0.85rem", sm: "0.9rem" },
                            lineHeight: 1.2,
                          }}
                        >
                          {formatServiceLabel(option)}
                        </Typography>
                        {option.description && (
                          <Typography
                            variant="caption"
                            noWrap
                            sx={{
                              fontSize: "0.72rem",
                              color: "text.primary",
                              opacity: 0.6,
                              display: "block",
                            }}
                          >
                            {option.description}
                          </Typography>
                        )}
                      </Box>
                    </Box>
                    
                    {isPackageCovered ? (
                      <Box
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          color: "success.main",
                          fontWeight: 700,
                          fontSize: "0.75rem",
                          whiteSpace: "nowrap",
                          ml: 1,
                          flexShrink: 0,
                        }}
                      >
                        Pacote ({remainingQty}x)
                      </Box>
                    ) : (
                      <Box
                        sx={{
                          fontWeight: 700,
                          fontSize: { xs: "0.82rem", sm: "0.88rem" },
                          color: "text.primary",
                          whiteSpace: "nowrap",
                          ml: 1,
                          flexShrink: 0,
                        }}
                      >
                        {formatPrice(option.price_cents)}
                      </Box>
                    )}
                  </li>
                );
              }}
              renderInput={(params) => (
                <TextField
                  {...params}
                  placeholder={currentPet ? "Selecionar serviços" : "Selecione um pet primeiro"}
                  disabled={!currentPet}
                  error={!!itemError?.service_ids}
                  helperText={itemError?.service_ids?.message}
                />
              )}
            />
          )}
        />
        <Button
          variant="outlined"
          sx={{
            minWidth: { xs: "40px", sm: "130px" },
            width: { xs: "40px", sm: "auto" },
            height: "40px",
            p: { xs: 0, sm: "6px 16px" },
            flexShrink: 0,
          }}
          onClick={() => onCreateService?.(index)}
          title="Criar Serviço"
        >
          <Plus size={18} />
          <Box component="span" sx={{ display: { xs: "none", sm: "inline" }, ml: 0.5 }}>
            Criar Serviço
          </Box>
        </Button>
      </Box>

      {/* CHECKBOX MOSTRAR TODOS OS SERVIÇOS */}
      <FormControlLabel
        sx={{ width: "fit-content", my: 0 }}
        control={
          <Checkbox
            disableRipple
            size="small"
            sx={{ color: "primary.main", py: 0 }}
            checked={showAllServices}
            onChange={(e) => setShowAllServices(e.target.checked)}
          />
        }
        label="Mostrar todos os serviços"
        slotProps={{
          typography: {
            sx: {
              fontSize: { xs: "0.72rem", sm: "0.78rem" },
              color: "text.primary",
              opacity: 0.85,
              whiteSpace: "nowrap",
            },
          },
        }}
      />

      {/* LINHA DE REPETIÇÃO INDIVIDUAL DO PET + LIXEIRA NA DIREITA */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          pt: 1.25,
          borderTop: "1px dashed",
          borderColor: "divider",
          mt: 0.5,
        }}
      >
        {/* Esquerda: Switch e label fino */}
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <Switch
            size="small"
            checked={isPetRecurrent}
            onChange={(e) => handleToggleRecurrence(e.target.checked)}
            color="primary"
          />
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Typography
              variant="body2"
              fontWeight={600}
              color="text.primary"
              sx={{ fontSize: { xs: "0.82rem", sm: "0.88rem" } }}
            >
              Repetir agendamento
            </Typography>
            {mode === "edit" && isPetRecurrent && (
              <Chip
                size="small"
                label="Recorrência ativa"
                color="primary"
                variant="outlined"
                sx={{ fontSize: "0.7rem", height: 20 }}
              />
            )}
          </Box>
        </Box>

        {/* Direita: Apenas o ícone da lixeira */}
        {!isOnlyPet ? (
          <Tooltip title="Remover pet do agendamento">
            <IconButton
              size="small"
              onClick={onRemove}
              sx={{
                color: "error.main",
                p: 0.75,
                borderRadius: 1.5,
                border: "1px solid",
                borderColor: (theme) => alpha(theme.palette.error.main, 0.25),
                bgcolor: (theme) => alpha(theme.palette.error.main, 0.04),
                "&:hover": {
                  bgcolor: (theme) => alpha(theme.palette.error.main, 0.12),
                  borderColor: "error.main",
                },
              }}
            >
              <Trash2 size={16} />
            </IconButton>
          </Tooltip>
        ) : null}
      </Box>

      {/* BLOCO DE CONFIGURAÇÃO DE RECORRÊNCIA DO PET */}
      {isPetRecurrent && (
        <Box
          sx={{
            mt: 0.75,
            p: 1.5,
            borderRadius: 2,
            bgcolor: "#F8FAFC",
            border: "1px solid",
            borderColor: "divider",
            display: "flex",
            flexDirection: "column",
            gap: 1.5,
          }}
        >
          <Box
            sx={{
              display: "flex",
              flexWrap: "wrap",
              gap: 2,
              justifyContent: "space-between",
              alignItems: "flex-start",
            }}
          >
            {/* Repete (Frequência) */}
            <FormControl sx={{ minWidth: { xs: "100%", sm: "200px" }, flex: 1 }}>
              <Typography
                variant="caption"
                sx={{ color: "text.primary", mb: 0.75, fontWeight: 600, display: "block" }}
              >
                Repete
              </Typography>
              <Controller
                name={`items.${index}.recurrence.frequency` as any}
                control={control}
                render={({ field }) => (
                  <Select
                    {...field}
                    value={field.value || "weekly"}
                    size="small"
                    onChange={(e) => {
                      field.onChange(e);
                      handleFrequencyChange(e.target.value as any);
                    }}
                    sx={{
                      bgcolor: "white",
                      fontSize: "0.85rem",
                      ".MuiSelect-select": { display: "flex", alignItems: "center", gap: 1 },
                    }}
                  >
                    <MenuItem value="weekly">
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                        <CalendarCheck size={16} color={theme.palette.primary.main} />
                        Toda semana
                      </Box>
                    </MenuItem>
                    <MenuItem value="biweekly">
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                        <CalendarCheck size={16} color={theme.palette.primary.main} />
                        A cada 15 dias
                      </Box>
                    </MenuItem>
                    <MenuItem value="monthly">
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                        <CalendarCheck size={16} color={theme.palette.primary.main} />
                        Todo mês
                      </Box>
                    </MenuItem>
                  </Select>
                )}
              />
            </FormControl>

            {/* Termina */}
            <FormControl sx={{ minWidth: { xs: "100%", sm: "200px" } }}>
              <Typography
                variant="caption"
                sx={{ color: "text.primary", mb: 0.75, fontWeight: 600, display: "block" }}
              >
                Termina
              </Typography>
              <RadioGroup
                value={recurrenceEndType}
                onChange={(e) => handleEndTypeChange(e.target.value as any)}
              >
                <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}>
                  <Box sx={{ display: "flex", alignItems: "center" }}>
                    <FormControlLabel
                      value="occurrences"
                      control={
                        <Radio
                          size="small"
                          disableRipple
                          sx={{ color: theme.palette.primary.main, p: 0.5 }}
                        />
                      }
                      label={
                        <Typography variant="body2" sx={{ fontSize: "0.85rem" }}>
                          Após
                        </Typography>
                      }
                      sx={{ mr: 1, my: 0 }}
                    />
                    <Controller
                      name={`items.${index}.recurrence.occurrences` as any}
                      control={control}
                      render={({ field, fieldState }) => (
                        <Box sx={{ display: "flex", alignItems: "center" }}>
                          <TextField
                            {...field}
                            value={field.value ?? 4}
                            type="number"
                            size="small"
                            sx={{ bgcolor: "white", width: "70px", mr: 1 }}
                            inputProps={{
                              min: 2,
                              max: maxOccurrences,
                              maxLength: 3,
                              style: { padding: "4px 8px", fontSize: "0.85rem" },
                            }}
                            disabled={recurrenceEndType !== "occurrences"}
                            onChange={(e) => {
                              let val = e.target.value;
                              if (val.length > 3) val = val.slice(0, 3);
                              field.onChange(val);
                              trigger?.(`items.${index}.recurrence.occurrences`);
                            }}
                            error={!!fieldState.error}
                          />
                          <Typography
                            variant="body2"
                            color="text.primary"
                            sx={{ fontSize: "0.85rem" }}
                          >
                            agendamentos
                          </Typography>
                        </Box>
                      )}
                    />
                  </Box>

                  <FormControlLabel
                    value="never"
                    control={
                      <Radio
                        size="small"
                        disableRipple
                        sx={{ color: theme.palette.primary.main, p: 0.5 }}
                      />
                    }
                    label={
                      <Typography variant="body2" sx={{ fontSize: "0.85rem" }}>
                        Nunca
                      </Typography>
                    }
                    sx={{ my: 0 }}
                  />
                </Box>
              </RadioGroup>
            </FormControl>
          </Box>

          {/* Prévia de datas */}
          {petSummaryDates && petSummaryDates.dates.length > 0 && (
            <Box sx={{ mt: 0.5, pt: 1, borderTop: "1px dashed #e2e8f0" }}>
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ display: "block", mb: 0.75, fontSize: "0.8rem" }}
              >
                Serão criados <b>{petSummaryDates.total}</b> agendamentos para este pet, um por{" "}
                {recurrenceFrequency === "weekly"
                  ? "semana"
                  : recurrenceFrequency === "biweekly"
                  ? "quinzena"
                  : "mês"}
                :
              </Typography>
              <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.75 }}>
                {petSummaryDates.dates.map((d, i) => (
                  <Box
                    key={i}
                    sx={{
                      bgcolor: "white",
                      border: "1px solid",
                      borderColor: "divider",
                      color: "text.primary",
                      px: 1,
                      py: 0.25,
                      borderRadius: 1.5,
                      fontSize: "0.75rem",
                      fontWeight: 600,
                      textTransform: "capitalize",
                    }}
                  >
                    {d.day} {d.month}
                  </Box>
                ))}
                {petSummaryDates.remaining > 0 && (
                  <Box
                    sx={{
                      bgcolor: alpha(theme.palette.primary.main, 0.08),
                      color: "primary.main",
                      px: 1,
                      py: 0.25,
                      borderRadius: 1.5,
                      fontSize: "0.75rem",
                      fontWeight: 600,
                    }}
                  >
                    +{petSummaryDates.remaining} datas
                  </Box>
                )}
              </Box>
            </Box>
          )}
        </Box>
      )}
    </Box>
  );
}
