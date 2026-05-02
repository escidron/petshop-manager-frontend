import {
  Autocomplete,
  Box,
  Checkbox,
  CircularProgress,
  Divider,
  FormControl,
  FormControlLabel,
  FormLabel,
  TextField,
} from "@mui/material";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { TimePicker } from "@mui/x-date-pickers/TimePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import CustomTextField from "../../components/Textfield/CustomTextfield";
import { Button } from "../../components/Button/Button";
import { Plus, Trash } from "lucide-react";
import type { Client } from "../clients/types";
import type { Pet } from "../pets/types";
import type { Service } from "../tenant_services/types";
import type { AppointmentFormData } from "./types";
import { Controller, useFieldArray, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { appointmentSchema } from "./schemas";
import { useEffect, useMemo, useRef, useState } from "react";
import dayjs from "dayjs";
import { getServicesForPet } from "../../utils/serviceMatcher";
import {
  formatPrice,
  formatServiceLabel,
} from "../../utils/formatServiceLabel";
import "dayjs/locale/pt-br";
import theme from "../../theme";
dayjs.locale("pt-br");

type Props = {
  defaultValues?: Partial<AppointmentFormData>;
  clients?: Client[];
  services?: Service[];
  pets?: Pet[];
  setClientId: (id: number) => void;
  selectedClient?: Client;
  selectedPet?: Pet;
  onSubmit: (data: AppointmentFormData) => void;
  mode?: "create" | "edit";
  isSubmitting?: boolean;
  onCreateClient?: () => void;
  onCreatePet?: (index: number, clientId: number) => void;
  onCreateService?: (index: number) => void;
  autoSelectClientId?: number;
  autoSelectPet?: { index: number; id: number };
  autoSelectService?: { index: number; id: number };
};

export default function AppointmentForm({
  defaultValues,
  clients,
  services,
  pets,
  setClientId,
  selectedClient,
  selectedPet,
  onSubmit,
  mode = "create",
  isSubmitting = false,
  onCreateClient,
  onCreatePet,
  onCreateService,
  autoSelectClientId,
  autoSelectPet,
  autoSelectService,
}: Props) {
  const [showAllBySection, setShowAllBySection] = useState<
    Record<number, boolean>
  >({});
  const [scheduledDate, setScheduledDate] = useState<dayjs.Dayjs | null>(
    defaultValues?.scheduled_at ? dayjs(defaultValues.scheduled_at) : null,
  );
  const [scheduledTime, setScheduledTime] = useState<dayjs.Dayjs | null>(
    defaultValues?.scheduled_at ? dayjs(defaultValues.scheduled_at) : null,
  );
  const [timePickerOpen, setTimePickerOpen] = useState(false);
  const pendingTimeCloseRef = useRef(false);

  const form = useForm<AppointmentFormData>({
    resolver: zodResolver(appointmentSchema),
    defaultValues,
  });

  const {
    control,
    handleSubmit,
    resetField,
    setValue,
    getValues,
    formState: { errors },
  } = form;

  const items = useWatch({ control, name: "items" });
  const watchedClientId = useWatch({ control, name: "client_id" });
  const { fields, append, remove } = useFieldArray({ control, name: "items" });

  useEffect(() => {
    setClientId(selectedClient?.id || defaultValues?.client_id || 0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [defaultValues?.client_id, selectedClient]);

  useEffect(() => {
    if (selectedPet && fields.length > 0 && !getValues("items.0.pet_id")) {
      setValue("items.0.pet_id", selectedPet.id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedPet]);

  useEffect(() => {
    if (selectedClient && fields.length > 0 && !getValues("client_id")) {
      setValue("client_id", selectedClient.id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedClient]);

  // Auto-select after quick-create
  useEffect(() => {
    if (!autoSelectClientId) return;
    setValue("client_id", autoSelectClientId);
    setClientId(autoSelectClientId);
    resetField("items");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoSelectClientId]);

  useEffect(() => {
    if (!autoSelectPet) return;
    setValue(`items.${autoSelectPet.index}.pet_id`, autoSelectPet.id);
    setValue(`items.${autoSelectPet.index}.service_ids`, []);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoSelectPet]);

  useEffect(() => {
    if (!autoSelectService) return;
    const current =
      getValues(`items.${autoSelectService.index}.service_ids`) || [];
    if (!current.includes(autoSelectService.id)) {
      setValue(`items.${autoSelectService.index}.service_ids`, [
        ...current,
        autoSelectService.id,
      ]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoSelectService]);

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
      {/* DATA E HORA */}
      <FormControl>
        <FormLabel sx={{ color: "text.primary", mb: 0.5 }}>
          Data e hora
        </FormLabel>
        <Controller
          name="scheduled_at"
          control={control}
          render={({ field, fieldState }) => (
            <LocalizationProvider
              dateAdapter={AdapterDayjs}
              adapterLocale="pt-br"
            >
              <Box sx={{ display: "flex", gap: 2 }}>
                <DatePicker
                  format="DD/MM/YYYY"
                  value={scheduledDate}
                  onChange={(newDate) => {
                    setScheduledDate(newDate);
                    if (newDate?.isValid() && scheduledTime?.isValid()) {
                      field.onChange(
                        newDate
                          .hour(scheduledTime.hour())
                          .minute(scheduledTime.minute())
                          .second(0)
                          .millisecond(0)
                          .toISOString(),
                      );
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
                      inputMode: "numeric",
                      sx: { backgroundColor: theme.palette.common.white },
                    },
                    actionBar: { actions: [] },
                  }}
                />
                <TimePicker
                  value={scheduledTime}
                  ampm={false}
                  referenceDate={dayjs().hour(8).minute(0)}
                  minutesStep={5}
                  open={timePickerOpen}
                  onOpen={() => {
                    pendingTimeCloseRef.current = false;
                    setTimePickerOpen(true);
                  }}
                  onClose={() => setTimePickerOpen(false)}
                  onViewChange={(view) => {
                    // MUI auto-avança para 'minutes' após clicar na hora.
                    // Marcamos pendingClose=true aqui para que o PRÓXIMO
                    // onChange (clique explícito do usuário nos minutos) feche.
                    if (view === "minutes") {
                      pendingTimeCloseRef.current = true;
                    }
                  }}
                  onChange={(newTime) => {
                    setScheduledTime(newTime);
                    if (scheduledDate?.isValid() && newTime?.isValid()) {
                      field.onChange(
                        scheduledDate
                          .hour(newTime.hour())
                          .minute(newTime.minute())
                          .second(0)
                          .millisecond(0)
                          .toISOString(),
                      );
                    } else {
                      field.onChange("");
                    }
                    if (pendingTimeCloseRef.current) {
                      setTimePickerOpen(false);
                    }
                  }}
                  slotProps={{
                    textField: {
                      size: "small",
                      fullWidth: false,
                      error: !!fieldState.error,
                      sx: {
                        backgroundColor: theme.palette.common.white,
                        width: "160px",
                      },
                    },
                    actionBar: { actions: [] },
                    popper: {
                      sx: {
                        "& .MuiMultiSectionDigitalClock-root": {
                          maxHeight: 260,
                        },
                        "& .MuiMultiSectionDigitalClockSection-root": {
                          maxHeight: 260,
                          scrollbarWidth: "none",
                          msOverflowStyle: "none",
                          "&::-webkit-scrollbar": { display: "none" },
                        },
                        "& .MuiMultiSectionDigitalClockSection-item": {
                          minHeight: "unset",
                          py: "4px",
                          fontSize: "0.85rem",
                        },
                        "& .MuiPaper-root": { maxHeight: 300 },
                      },
                    },
                    mobilePaper: {
                      sx: { maxHeight: "90vh" },
                    },
                  }}
                />
              </Box>
            </LocalizationProvider>
          )}
        />
      </FormControl>

      {/* CLIENTE */}
      <FormControl>
        <FormLabel sx={{ color: "text.primary", mb: 0.5 }}>Cliente</FormLabel>
        <Box sx={{ display: "flex", gap: 1 }}>
          <Controller
            name="client_id"
            control={control}
            render={({ field, fieldState }) => (
              <Autocomplete<Client>
                sx={{ flex: 1 }}
                options={clients ?? []}
                noOptionsText="Nenhum cliente cadastrado"
                size="small"
                value={
                  selectedClient ??
                  clients?.find((c) => c.id === field.value) ??
                  null
                }
                getOptionLabel={(option) => option.name}
                isOptionEqualToValue={(option, value) => option.id === value.id}
                onChange={(_, value) => {
                  const clientId = value?.id ?? 0;
                  field.onChange(clientId);
                  setClientId(clientId);
                  resetField("items");
                }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    placeholder="Pesquisar cliente"
                    error={!!fieldState.error}
                    helperText={fieldState.error?.message}
                  />
                )}
              />
            )}
          />
          <Button
            sx={{ minWidth: "140px", maxHeight: "40px" }}
            startIcon={<Plus size={16} />}
            variant="outlined"
            onClick={() => onCreateClient?.()}
          >
            Criar Cliente
          </Button>
        </Box>
      </FormControl>

      {/* PETS E SERVIÇOS */}
      <FormControl>
        <FormLabel sx={{ color: "text.primary", mb: 1 }}>
          Pets e Serviços
        </FormLabel>

        {fields.map((item, index) => {
          const itemError = errors.items?.[index];

          return (
            <Box
              key={item.id}
              sx={{
                display: "flex",
                flexDirection: "column",
                gap: 1,
                mb: 2,
                p: 2,
                border: "1px solid #eee",
                borderRadius: 2,
              }}
            >
              {/* PET */}
              <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
                <Controller
                  name={`items.${index}.pet_id`}
                  control={control}
                  render={({ field }) => {
                    const selectedPetIds =
                      items
                        ?.map((i) => i.pet_id)
                        .filter((id) => id && id !== field.value) ?? [];
                    const availablePets =
                      pets?.filter((pet) => !selectedPetIds.includes(pet.id)) ??
                      [];
                    return (
                      <Autocomplete<Pet>
                        sx={{ flex: 1 }}
                        options={availablePets}
                        noOptionsText="Nenhum pet cadastrado"
                        size="small"
                        value={pets?.find((p) => p.id === field.value) ?? null}
                        getOptionLabel={(option) => option.name}
                        isOptionEqualToValue={(o, v) => o.id === v.id}
                        onChange={(_, value) => {
                          field.onChange(value?.id ?? 0);
                          setValue(`items.${index}.service_ids`, []);
                        }}
                        renderInput={(params) => (
                          <TextField
                            {...params}
                            placeholder={
                              watchedClientId
                                ? "Selecionar pet"
                                : "Selecione um cliente primeiro"
                            }
                          />
                        )}
                      />
                    );
                  }}
                />
                <Button
                  variant="outlined"
                  sx={{ width: "150px", height: "40px", flexShrink: 0 }}
                  startIcon={<Plus size={14} />}
                  onClick={() => onCreatePet?.(index, watchedClientId ?? 0)}
                >
                  Criar Pet
                </Button>
              </Box>

              {/* SERVIÇOS */}
              <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
                <Controller
                  name={`items.${index}.service_ids`}
                  control={control}
                  render={({ field }) => {
                    const selectedPetId = items?.[index]?.pet_id;
                    const currentPet = pets?.find(
                      (p) => p.id === selectedPetId,
                    );

                    // eslint-disable-next-line react-hooks/rules-of-hooks
                    const filteredServices = useMemo(() => {
                      if (showAllBySection[index]) return services ?? [];
                      return getServicesForPet(services ?? [], currentPet);
                      // eslint-disable-next-line react-hooks/exhaustive-deps
                    }, [services, currentPet, showAllBySection[index]]);

                    return (
                      <Autocomplete
                        sx={{ flex: 1 }}
                        disabled={!currentPet}
                        noOptionsText="Nenhum serviço cadastrado"
                        multiple
                        options={filteredServices}
                        filterOptions={(options, state) => {
                          const input = state.inputValue.toLowerCase();
                          return options.filter((option) =>
                            `${option.name} ${option.size ?? ""} ${option.coat_type ?? ""}`
                              .toLowerCase()
                              .includes(input),
                          );
                        }}
                        disableCloseOnSelect
                        size="small"
                        value={
                          filteredServices.filter((s) =>
                            field.value?.includes(s.id),
                          ) ?? []
                        }
                        getOptionLabel={(option) => formatServiceLabel(option)}
                        isOptionEqualToValue={(option, value) =>
                          option.id === value.id
                        }
                        onChange={(_, value) =>
                          field.onChange(value.map((v) => v.id))
                        }
                        renderOption={(props, option, { selected }) => {
                          const { ...rest } = props;
                          return (
                            <li
                              {...rest}
                              key={option.id}
                              style={{
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "space-between",
                                width: "100%",
                              }}
                            >
                              <Box
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: 8,
                                }}
                              >
                                <Checkbox
                                  checked={selected}
                                  disableRipple
                                  sx={{ color: "primary.main", py: 0 }}
                                />
                                <Box>
                                  <Box style={{ fontWeight: 500 }}>
                                    {formatServiceLabel(option)}
                                  </Box>
                                  {option.description && (
                                    <div style={{ fontSize: 12, opacity: 0.6 }}>
                                      {option.description}
                                    </div>
                                  )}
                                </Box>
                              </Box>
                              <Box style={{ fontWeight: 600 }}>
                                {formatPrice(option.price_cents)}
                              </Box>
                            </li>
                          );
                        }}
                        renderInput={(params) => (
                          <TextField
                            {...params}
                            placeholder={
                              currentPet
                                ? "Selecionar serviços"
                                : "Selecione um pet primeiro"
                            }
                            disabled={!currentPet}
                            error={!!itemError?.service_ids}
                            helperText={itemError?.service_ids?.message}
                          />
                        )}
                      />
                    );
                  }}
                />
                <Button
                  variant="outlined"
                  sx={{ width: "150px", height: "40px", flexShrink: 0 }}
                  startIcon={<Plus size={14} />}
                  onClick={() => onCreateService?.(index)}
                >
                  Criar Serviço
                </Button>
              </Box>

              <FormControlLabel
                sx={{ width: "fit-content" }}
                control={
                  <Checkbox
                    disableRipple
                    size="small"
                    sx={{ color: "primary.main", py: 0 }}
                    checked={!!showAllBySection[index]}
                    onChange={(e) =>
                      setShowAllBySection((prev) => ({
                        ...prev,
                        [index]: e.target.checked,
                      }))
                    }
                  />
                }
                label="Mostrar todos os serviços (ignorar porte e pelagem)"
                slotProps={{ typography: { sx: { fontSize: 12 } } }}
              />

              {fields.length > 1 && (
                <Button
                  startIcon={<Trash size={15} />}
                  variant="text"
                  color="error"
                  sx={{ width: "fit-content", mx: "auto" }}
                  onClick={() => remove(index)}
                >
                  Remover Pet
                </Button>
              )}
            </Box>
          );
        })}

        <Button
          sx={{ display: "flex", mx: "auto" }}
          startIcon={<Plus size={18} />}
          variant="text"
          onClick={() => append({ pet_id: 0, service_ids: [] })}
        >
          Adicionar outro Pet ao agendamento
        </Button>

        {errors.items && typeof errors.items?.message === "string" && (
          <Box sx={{ color: "error.main", fontSize: 12 }}>
            {errors.items.message}
          </Box>
        )}
      </FormControl>

      {/* OBSERVAÇÕES */}
      <FormControl fullWidth>
        <FormLabel sx={{ color: "text.primary", mb: 0.5 }}>
          Observações
        </FormLabel>
        <Controller
          name="notes"
          control={control}
          render={({ field }) => (
            <CustomTextField
              {...field}
              multiline
              rows={4}
              placeholder="ex: Adicionais, comportamento, alergias, etc."
            />
          )}
        />
      </FormControl>

      <Divider />
      <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
        <Button
          disabled={isSubmitting}
          startIcon={
            isSubmitting ? (
              <CircularProgress size={16} color="inherit" />
            ) : undefined
          }
          onClick={handleSubmit((data: AppointmentFormData) => onSubmit(data))}
        >
          {mode === "create" ? "Criar Agendamento" : "Salvar Alterações"}
        </Button>
      </Box>
    </Box>
  );
}
