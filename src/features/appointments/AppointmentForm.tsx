import {
  Autocomplete,
  Box,
  Checkbox,
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
import { useEffect, useMemo, useState } from "react";
import dayjs from "dayjs";
import { useClient } from "../../hooks/useClient";
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
  selectedClient?: Client;
  selectedPet?: Pet;
  onSubmit: (data: AppointmentFormData) => void;
  onCreateClient?: () => void;
};

export default function AppointmentForm({
  defaultValues,
  clients,
  services,
  selectedClient,
  selectedPet,
  onSubmit,
  onCreateClient,
}: Props) {
  const { pets, setClientId } = useClient();
  const [showAllBySection, setShowAllBySection] = useState<
    Record<number, boolean>
  >({});
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

  const { fields, append, remove } = useFieldArray({
    control,
    name: "items",
  });

  useEffect(() => {
    setClientId(selectedClient?.id || defaultValues?.client_id);
  }, [defaultValues?.client_id, selectedClient, setClientId]);

  useEffect(() => {
    if (selectedPet && fields.length > 0) {
      const firstPet = getValues("items.0.pet_id");

      if (!firstPet) {
        setValue("items.0.pet_id", selectedPet.id);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedPet]);
  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
      <FormControl>
        <FormLabel sx={{ color: "text.primary", mb: 0.5 }}>
          Data e hora
        </FormLabel>
        <Controller
          name="scheduled_at"
          control={control}
          render={({ field, fieldState }) => {
            const scheduledValue = field.value ? dayjs(field.value) : null;

            return (
              <LocalizationProvider
                dateAdapter={AdapterDayjs}
                adapterLocale="pt-br"
              >
                <Box sx={{ display: "flex", gap: 2 }}>
                  <DatePicker
                    format="DD/MM/YYYY"
                    value={scheduledValue}
                    onAccept={(newDate) => {
                      if (!newDate || !newDate.isValid()) return;

                      const current = scheduledValue ?? dayjs();

                      const updated = newDate
                        .hour(current.hour())
                        .minute(current.minute())
                        .second(0)
                        .millisecond(0)
                        .toISOString();

                      field.onChange(updated);
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
                    }}
                  />

                  {/* TIME */}
                  <TimePicker
                    value={scheduledValue}
                    ampm={false}
                    referenceDate={dayjs().hour(8).minute(0)}
                    minutesStep={15}
                    onChange={(newTime) => {
                      if (!newTime || !newTime.isValid()) return;

                      const current = scheduledValue ?? dayjs();

                      const updated = current
                        .hour(newTime.hour())
                        .minute(newTime.minute())
                        .second(0)
                        .millisecond(0)
                        .toISOString();

                      field.onChange(updated);
                    }}
                    slotProps={{
                      textField: {
                        size: "small",
                        fullWidth: true,
                        error: !!fieldState.error,
                        sx: { backgroundColor: theme.palette.common.white },
                      },
                      popper: {
                        sx: {
                          "& .MuiMultiSectionDigitalClock-root": {
                            minHeight: 700, // altura total do clock
                          },
                          "& .MuiMultiSectionDigitalClockSection-root": {
                            minHeight: 700, // altura da coluna (horas/minutos)
                          },
                        },
                      },
                    }}
                  />
                </Box>
              </LocalizationProvider>
            );
          }}
        />
      </FormControl>

      <FormControl>
        <FormLabel sx={{ color: "text.primary", mb: 0.5 }}>Cliente</FormLabel>
        <Box sx={{ display: "flex", gap: 1 }}>
          <Controller
            name="client_id"
            control={control}
            render={({ field, fieldState }) => (
              <Autocomplete<Client>
                sx={{ width: "70%" }}
                options={clients ?? []}
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

                  // 🔥 AQUI está o segredo
                  setClientId(clientId);

                  // 🔥 IMPORTANTE: limpar pets já selecionados
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
            sx={{ width: "30%", minWidth: "160px", maxHeight: "40px" }}
            startIcon={<Plus size={18} />}
            variant="outlined"
            onClick={onCreateClient}
          >
            Criar Cliente
          </Button>
        </Box>
      </FormControl>

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
              <Controller
                name={`items.${index}.pet_id`}
                control={control}
                render={({ field }) => {
                  const selectedPetIds =
                    items
                      ?.map((item) => item.pet_id)
                      .filter((id) => id && id !== field.value) ?? [];
                  const availablePets =
                    pets?.filter((pet) => !selectedPetIds.includes(pet.id)) ??
                    [];
                  return (
                    <Autocomplete<Pet>
                      options={availablePets}
                      size="small"
                      value={pets?.find((p) => p.id === field.value) ?? null}
                      getOptionLabel={(option) => option.name}
                      isOptionEqualToValue={(o, v) => o.id === v.id}
                      onChange={(_, value) => {
                        field.onChange(value?.id ?? 0);
                        setValue(`items.${index}.service_ids`, []);
                      }}
                      renderInput={(params) => (
                        <TextField {...params} placeholder="Selecionar pet" />
                      )}
                    />
                  );
                }}
              />

              {/* SERVIÇOS */}
              <Controller
                name={`items.${index}.service_ids`}
                control={control}
                render={({ field }) => {
                  // 🐶 pega o pet selecionado neste item
                  const selectedPetId = items?.[index]?.pet_id;
                  const selectedPet = pets?.find((p) => p.id === selectedPetId);

                  // eslint-disable-next-line react-hooks/rules-of-hooks
                  const filteredServices = useMemo(() => {
                    if (showAllBySection[index]) {
                      return services ?? [];
                    }

                    return getServicesForPet(services ?? [], selectedPet);
                    // eslint-disable-next-line react-hooks/exhaustive-deps
                  }, [services, selectedPet, showAllBySection[index]]);

                  return (
                    <Autocomplete
                      disabled={!selectedPet}
                      multiple
                      options={filteredServices}
                      filterOptions={(options, state) => {
                        const input = state.inputValue.toLowerCase();
                        const result = options.filter((option) =>
                          `${option.name} ${option.size ?? ""} ${option.coat_type ?? ""}`
                            .toLowerCase()
                            .includes(input),
                        );
                        return result;
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
                            key={option.id} // 🔥 usa id único
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
                                sx={{ color: "primary.main" }}
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
                            selectedPet
                              ? "Selecionar serviços"
                              : "Selecione um pet primeiro"
                          }
                          disabled={!selectedPet}
                          error={!!itemError?.service_ids}
                          helperText={itemError?.service_ids?.message}
                        />
                      )}
                    />
                  );
                }}
              />
              <FormControlLabel
                control={
                  <Checkbox
                    disableRipple
                    size="small"
                    sx={{ color: "primary.main" }}
                    checked={!!showAllBySection[index]}
                    onChange={(e) =>
                      setShowAllBySection((prev) => ({
                        ...prev,
                        [index]: e.target.checked,
                      }))
                    }
                  />
                }
                label="Mostrar todos os serviços (ignora porte e pelagem do pet)"
                slotProps={{
                  typography: {
                    sx: { fontSize: 12 },
                  },
                }}
              />
              {/* BOTÃO REMOVER */}
              {fields.length > 1 && (
                <Button
                  startIcon={<Trash size={15} />}
                  variant="text"
                  color="error"
                  onClick={() => remove(index)}
                >
                  Remover Pet
                </Button>
              )}
            </Box>
          );
        })}

        {/* BOTÃO ADICIONAR */}
        <Button
          sx={{ width: "150px", display: "flex", mx: "auto" }}
          startIcon={<Plus size={18} />}
          variant="text"
          onClick={() =>
            append({
              pet_id: 0,
              service_ids: [],
            })
          }
        >
          Adicionar Pet
        </Button>

        {errors.items && typeof errors.items?.message === "string" && (
          <Box sx={{ color: "error.main", fontSize: 12 }}>
            {errors.items.message}
          </Box>
        )}
      </FormControl>

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
      {/* ================= BOTÕES ================= */}
      <Divider />
      <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 2 }}>
        <Button
          onClick={handleSubmit((data: AppointmentFormData) => onSubmit(data))}
          data-action="save"
        >
          Salvar
        </Button>
      </Box>
    </Box>
  );
}
