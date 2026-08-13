import {
  Autocomplete,
  Box,
  Divider,
  FormControl,
  FormLabel,
  TextField,
  Switch,
  FormControlLabel,
  Select,
  MenuItem,
  Typography,
  Radio,
  RadioGroup,
} from "@mui/material";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { TimePicker } from "@mui/x-date-pickers/TimePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import CustomTextField from "../../components/Textfield/CustomTextfield";
import { Button } from "../../components/Button/Button";
import { Plus, CalendarCheck } from "lucide-react";
import type { Client } from "../clients/types";
import type { Pet } from "../pets/types";
import type { Service } from "../tenant_services/types";
import type { AppointmentFormData } from "./types";
import { Controller, useFieldArray, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { appointmentSchema } from "./schemas";
import { useEffect, useRef, useState, useMemo } from "react";
import dayjs from "dayjs";
import "dayjs/locale/pt-br";
import theme from "../../theme";
import AppointmentPetItem from "./AppointmentPetItem";
import { useAuth } from "../../hooks/useAuth";
import { usePets } from "../../hooks/usePets";
import { useQuery } from "@tanstack/react-query";
import { listClientPackagesByClient } from "../../api/services/client_packages";
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
  initialDate?: string;
  loadedClientId?: number;
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
  initialDate,
  loadedClientId,
}: Props) {
  const { tenant } = useAuth();
  const { pets: allPets } = usePets();
  const workingHours = tenant?.working_hours ?? null;


  const [clientListLimit, setClientListLimit] = useState(20);

  const [scheduledDate, setScheduledDate] = useState<dayjs.Dayjs | null>(
    defaultValues?.scheduled_at
      ? dayjs(defaultValues.scheduled_at)
      : initialDate
        ? dayjs(initialDate)
        : null,
  );
  const [scheduledTime, setScheduledTime] = useState<dayjs.Dayjs | null>(
    defaultValues?.scheduled_at ? dayjs(defaultValues.scheduled_at) : null,
  );
  const [timePickerOpen, setTimePickerOpen] = useState(false);
  const pendingTimeCloseRef = useRef(false);

  const [isRecurrent, setIsRecurrent] = useState(false);
  const [recurrenceEndType, setRecurrenceEndType] = useState<"occurrences" | "date" | "never">("occurrences");
  const form = useForm<AppointmentFormData>({
    resolver: zodResolver(appointmentSchema) as any,
    defaultValues: {
      ...defaultValues,
      scheduled_at: defaultValues?.scheduled_at || "",
      recurrence: defaultValues?.recurrence || { frequency: "weekly", occurrences: 4 }
    },
  });

  const {
    control,
    handleSubmit,
    resetField,
    setValue,
    getValues,
    trigger,
    formState: { errors },
  } = form;

  const items = useWatch({ control, name: "items" });
  const watchedClientId = useWatch({ control, name: "client_id" });
  const { fields, append, remove, replace } = useFieldArray({ control, name: "items" });

  const { data: clientPackages = [] } = useQuery({
    queryKey: ["clientPackages", "client", watchedClientId],
    queryFn: () => listClientPackagesByClient(watchedClientId!),
    enabled: !!watchedClientId,
  });

  const populatedClientIdRef = useRef<number | undefined>(defaultValues?.client_id);

  useEffect(() => {
    // Only populate if we have actually finished loading the pets for THIS client
    if (watchedClientId && watchedClientId !== populatedClientIdRef.current && watchedClientId === loadedClientId) {
      populatedClientIdRef.current = watchedClientId;
      if (mode === "create") {
        const clientPets = pets?.filter(p => p.client_id === watchedClientId) || [];
        
        if (autoSelectPet) {
          const selectedPetIndex = clientPets.findIndex(p => p.id === autoSelectPet.id);
          if (selectedPetIndex > 0) {
            const selectedPet = clientPets[selectedPetIndex];
            clientPets.splice(selectedPetIndex, 1);
            clientPets.unshift(selectedPet);
          }
        }

        if (clientPets.length > 0) {
          replace(clientPets.map(p => ({ pet_id: p.id, service_ids: [] as any })));
        } else {
          replace([{ pet_id: "" as any, service_ids: [] }]);
        }
      }
    }
  }, [watchedClientId, pets, mode, replace, autoSelectPet, loadedClientId]);

  useEffect(() => {
    if (watchedClientId) {
      setClientId(watchedClientId);
    }
  }, [watchedClientId, setClientId]);

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
    const currentServices = getValues(`items.${autoSelectService.index}.service_ids`) || [];
    if (!currentServices.includes(autoSelectService.id)) {
      setValue(`items.${autoSelectService.index}.service_ids`, [
        ...currentServices,
        autoSelectService.id,
      ]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoSelectService]);

  const recurrenceFrequency = useWatch({ control, name: "recurrence.frequency" }) || "weekly";
  const recurrenceOccurrences = useWatch({ control, name: "recurrence.occurrences" }) || 2;

  const maxOccurrences = recurrenceFrequency === "weekly" ? 52 : recurrenceFrequency === "biweekly" ? 26 : 12;

  useEffect(() => {
    if (!isRecurrent) return;

    if (recurrenceEndType === "never") {
      setValue("recurrence.occurrences", maxOccurrences);
      trigger("recurrence.occurrences");
    } else {
      trigger("recurrence.occurrences");
    }
  }, [recurrenceEndType, recurrenceFrequency, maxOccurrences, isRecurrent, setValue, trigger]);

  const summaryDates = useMemo(() => {
    if (!isRecurrent || !scheduledDate) return null;
    const start = dayjs(scheduledDate);
    if (!start.isValid()) return null;
    
    const count = Number(recurrenceOccurrences) || 2;
    const dates = [];
    const computeCount = Math.min(count, 6);
    for (let i = 0; i < computeCount; i++) {
      if (recurrenceFrequency === "weekly") dates.push(start.add(i, "week"));
      else if (recurrenceFrequency === "biweekly") dates.push(start.add(i * 2, "week"));
      else if (recurrenceFrequency === "monthly") dates.push(start.add(i, "month"));
    }
    return {
      dates: dates.map(d => ({
        day: d.format("DD"),
        month: d.format("MMM").toLowerCase()
      })),
      total: count,
      remaining: count > 6 ? count - 6 : 0
    };
  }, [isRecurrent, scheduledDate, recurrenceFrequency, recurrenceOccurrences]);

  return (
    <Box
        component="form"
        onSubmit={handleSubmit((data: any) => {
          if (!isRecurrent) {
            delete data.recurrence;
          }
          onSubmit(data as AppointmentFormData);
        })}
        sx={{ display: "flex", flexDirection: "column", gap: 3 }}
      >{/* DATA E HORA */}
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
                  shouldDisableDate={(date) => {
                    if (!workingHours) return false;
                    return workingHours[String(date.day())]?.is_open === false;
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
                          "&.Mui-disabled": {
                            color: "#b8bbc2 !important",
                            opacity: 0.4,
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
                <TimePicker
                  value={scheduledTime}
                  ampm={false}
                  referenceDate={dayjs().hour(8).minute(0)}
                  minutesStep={5}
                  minTime={(() => {
                    if (!workingHours || !scheduledDate?.isValid()) return undefined;
                    const s = workingHours[String(scheduledDate.day())];
                    if (!s?.is_open) return undefined;
                    const [h, m] = s.open.split(":").map(Number);
                    return dayjs().hour(h).minute(m).second(0);
                  })()}
                  maxTime={(() => {
                    if (!workingHours || !scheduledDate?.isValid()) return undefined;
                    const s = workingHours[String(scheduledDate.day())];
                    if (!s?.is_open) return undefined;
                    const [h, m] = s.close.split(":").map(Number);
                    return dayjs().hour(h).minute(m).second(0);
                  })()}
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
                      setTimeout(() => {
                        pendingTimeCloseRef.current = true;
                      }, 10);
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
                    // Mudança: Se ja estamos em minutos (pendingTimeCloseRef), fechamos
                    if (pendingTimeCloseRef.current) {
                      setTimePickerOpen(false);
                    }
                  }}
                  onAccept={() => {
                    // onAccept costuma ser disparado no clique final no desktop
                    setTimePickerOpen(false);
                    pendingTimeCloseRef.current = false;
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
                      onClick: () => {
                        if (pendingTimeCloseRef.current) {
                          setTimePickerOpen(false);
                          pendingTimeCloseRef.current = false;
                        }
                      },
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
                filterOptions={(options, state) => {
                  const input = state.inputValue.toLowerCase();
                  return options
                    .filter((option) => {
                      const clientPets = allPets?.filter(p => p.client_id === option.id) || [];
                      const matchName = option.name.toLowerCase().includes(input);
                      const matchPet = clientPets.some(p => p.name.toLowerCase().includes(input));
                      return matchName || matchPet;
                    })
                    .slice(0, clientListLimit);
                }}
                noOptionsText="Nenhum cliente cadastrado"
                size="small"
                value={
                  selectedClient ??
                  clients?.find((c) => c.id === field.value) ??
                  null
                }
                getOptionLabel={(option) => option.name}
                isOptionEqualToValue={(option, value) => option.id === value.id}
                onInputChange={(_, __, reason) => {
                  if (reason === 'input') setClientListLimit(20);
                }}
                ListboxProps={{
                  onScroll: (event: React.SyntheticEvent) => {
                    const listboxNode = event.currentTarget;
                    if (
                      listboxNode.scrollTop + listboxNode.clientHeight >=
                      listboxNode.scrollHeight - 10
                    ) {
                      setClientListLimit((prev) => prev + 20);
                    }
                  }
                }}
                renderOption={(props, option) => {
                  const clientPets = allPets?.filter(p => p.client_id === option.id) || [];
                  const petsText = clientPets.length > 0 ? clientPets.map(p => p.name).join(", ") : "Sem pets cadastrados";
                  return (
                    <li {...props} key={option.id}>
                      <Box sx={{ display: "flex", flexDirection: "column" }}>
                        <Typography variant="body2">{option.name}</Typography>
                        <Typography variant="caption" color="text.primary">
                          Pets: {petsText}
                        </Typography>
                      </Box>
                    </li>
                  );
                }}
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

        {fields.map((item, index) => (
          <AppointmentPetItem
            key={item.id}
            index={index}
            control={control}
            errors={errors}
            setValue={setValue}
            watchedClientId={watchedClientId}
            pets={pets ?? []}
            services={services ?? []}
            items={items}
            clientPackages={clientPackages}
            onCreatePet={onCreatePet}
            onCreateService={onCreateService}
            onRemove={() => remove(index)}
            isOnlyPet={fields.length === 1}
          />
        ))}

        <Button
          sx={{ display: "flex", mx: "auto" }}
          startIcon={<Plus size={18} />}
          variant="outlined"
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
      <FormControl fullWidth error={!!errors.notes}>
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
              error={!!errors.notes}
              helperText={errors.notes?.message}
            />
          )}
        />
      </FormControl>

      {/* RECORRÊNCIA (APENAS NA CRIAÇÃO) */}
      {mode === "create" && (
        <Box sx={{ border: `1px solid ${theme.palette.divider}`, borderRadius: 2, p: 3, display: "flex", flexDirection: "column", gap: 3, mt: 2, bgcolor: "white" }}>
          <Box sx={{ display: "flex", alignItems: "flex-start", gap: 2 }}>
            <Switch 
              checked={isRecurrent} 
              onChange={(e) => setIsRecurrent(e.target.checked)} 
              color="primary"
            />
            <Box>
              <Typography variant="body1" fontWeight="600" color="text.primary">
                Repetir agendamento
              </Typography>
              <Typography variant="body2" color="text.primary">
                Crie uma série de agendamentos automaticamente.
              </Typography>
            </Box>
          </Box>

          {isRecurrent && (
            <Box sx={{ display: "flex", flexDirection: "column" }}>
              <Box sx={{ display: "flex", justifyContent: "space-between" , flexWrap: "wrap", ml: 1 }}>
                <FormControl sx={{ minWidth: "240px" }}>
                  <FormLabel sx={{ color: "text.primary", mb: 1.5, fontSize: "0.9rem", fontWeight: 600 }}>Repete</FormLabel>
                  <Controller
                    name="recurrence.frequency"
                    control={control}
                    render={({ field }) => (
                      <Select 
                        {...field} 
                        size="small" 
                        sx={{ bgcolor: "white", ".MuiSelect-select": { display: "flex", alignItems: "center", gap: 1.5 } }}
                      >
                        <MenuItem value="weekly"><Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}><CalendarCheck size={18} color={theme.palette.primary.main} /> Toda semana</Box></MenuItem>
                        <MenuItem value="biweekly"><Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}><CalendarCheck size={18} color={theme.palette.primary.main} /> A cada 15 dias</Box></MenuItem>
                        <MenuItem value="monthly"><Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}><CalendarCheck size={18} color={theme.palette.primary.main} /> Todo mês</Box></MenuItem>
                      </Select>
                    )}
                  />
                </FormControl>
                
                <FormControl>
                  <FormLabel sx={{ color: "text.primary", mb: 1.5, fontSize: "0.9rem", fontWeight: 600 }}>Termina</FormLabel>
                  <RadioGroup
                    value={recurrenceEndType}
                    onChange={(e) => setRecurrenceEndType(e.target.value as any)}
                  >
                    <Box sx={{ display: "flex", flexDirection: "column" }}>
                      <Controller
                        name="recurrence.occurrences"
                        control={control}
                        render={({ field, fieldState }) => (
                          <Box sx={{ display: "flex", flexDirection: "column" }}>
                            <Box sx={{ display: "flex", alignItems: "center" }}>
                              <FormControlLabel value="occurrences" control={<Radio size="small" disableRipple sx={{ color: theme.palette.primary.main }} />} label={<Typography variant="body2">Após</Typography>} sx={{ mr: 1 }} />
                              <TextField 
                                {...field} 
                                type="number"
                                size="small"
                                sx={{ bgcolor: "white", width: "80px", mr: 2 }}
                                inputProps={{ min: 2, max: maxOccurrences, maxLength: 3 }}
                                disabled={recurrenceEndType !== "occurrences"}
                                onChange={(e) => {
                                  let val = e.target.value;
                                  if (val.length > 3) val = val.slice(0, 3);
                                  field.onChange(val);
                                  trigger("recurrence.occurrences");
                                }}
                                error={!!fieldState.error}
                              />
                              <Typography variant="body2" color="text.primary">agendamentos</Typography>
                            </Box>
                            {fieldState.error && (
                              <Typography color="error" variant="caption" sx={{ ml: 4, mt: 0.5 }}>
                                {fieldState.error.message}
                              </Typography>
                            )}
                          </Box>
                        )}
                      />

                      <FormControlLabel value="never" control={<Radio size="small" disableRipple sx={{ color: theme.palette.primary.main }} />} label={<Typography variant="body2">Nunca</Typography>} />
                    </Box>
                  </RadioGroup>
                </FormControl>
              </Box>

              {summaryDates && summaryDates.dates.length > 0 && (
                <Box sx={{ 
                  borderRadius: 3, 
                  p: 1, 
                  display: "flex",
                  flexDirection: "column",
                  gap: 2
                }}>
                  <Typography variant="body2" color="text.primary" sx={{ lineHeight: 1.5, width: "100%" }}>
                    Serão criados <b>{summaryDates.total}</b> agendamentos, um por {recurrenceFrequency === "weekly" ? "semana" : recurrenceFrequency === "biweekly" ? "quinzena" : "mês"}.
                  </Typography>
                  
                  <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
                    {summaryDates.dates.map((d, i) => (
                      <Box key={i} sx={{ 
                        bgcolor: "white", 
                        border: "1px solid",
                        borderColor: theme.palette.divider,
                        color: theme.palette.text.primary, 
                        px: 1.5, 
                        py: 0.5, 
                        borderRadius: 2, 
                        fontSize: "0.85rem", 
                        fontWeight: 600,
                        textTransform: "capitalize"
                      }}>
                        {d.day} {d.month}
                      </Box>
                    ))}
                    {summaryDates.remaining > 0 && (
                      <Box sx={{ 
                        bgcolor: theme.palette.action.disabledBackground, 
                        border: "1px solid",
                        borderColor: "transparent",
                        color: theme.palette.text.primary, 
                        px: 1.5, 
                        py: 0.5, 
                        borderRadius: 2, 
                        fontSize: "0.85rem", 
                        fontWeight: 600
                      }}>
                        +{summaryDates.remaining} datas
                      </Box>
                    )}
                  </Box>
                </Box>
              )}
            </Box>
          )}
        </Box>
      )}

      <Divider />
      <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
        <Button
          loading={isSubmitting}
          onClick={handleSubmit((data: any) => {
            if (!isRecurrent) {
              delete data.recurrence;
            }
            onSubmit(data as AppointmentFormData);
          })}
        >
          {mode === "create" ? "Criar Agendamento" : "Salvar Alterações"}
        </Button>
      </Box>
    </Box>
  );
}
