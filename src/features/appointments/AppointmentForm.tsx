import {
  Autocomplete,
  Box,
  Divider,
  FormControl,
  FormLabel,
  TextField,
} from "@mui/material";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { TimePicker } from "@mui/x-date-pickers/TimePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import CustomTextField from "../../components/Textfield/CustomTextfield";
import { Button } from "../../components/Button/Button";
import { Plus } from "lucide-react";
import type { Client } from "../clients/types";
import type { Pet } from "../pets/types";
import type { Service } from "../tenant_services/types";
import type { AppointmentFormData } from "./types";
import { Controller, useFieldArray, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { appointmentSchema } from "./schemas";
import { useEffect, useRef, useState } from "react";
import dayjs from "dayjs";
import "dayjs/locale/pt-br";
import theme from "../../theme";
import AppointmentPetItem from "./AppointmentPetItem";
import { useAuth } from "../../hooks/useAuth";
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
}: Props) {
  const { tenant } = useAuth();
  const workingHours = tenant?.working_hours ?? null;

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

  const form = useForm<AppointmentFormData>({
    resolver: zodResolver(appointmentSchema),
    defaultValues: {
      ...defaultValues,
      scheduled_at: defaultValues?.scheduled_at || "",
    },
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
            onCreatePet={onCreatePet}
            onCreateService={onCreateService}
            onRemove={() => remove(index)}
            isOnlyPet={fields.length <= 1}
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
          loading={isSubmitting}
          onClick={handleSubmit((data: AppointmentFormData) => onSubmit(data))}
        >
          {mode === "create" ? "Criar Agendamento" : "Salvar Alterações"}
        </Button>
      </Box>
    </Box>
  );
}
