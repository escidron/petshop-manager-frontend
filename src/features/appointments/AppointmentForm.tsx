import {
  Autocomplete,
  Box,
  Checkbox,
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
import { Plus, Trash } from "lucide-react";
import type { Client } from "../clients/types";
import type { Pet } from "../pets/types";
import type { Service } from "../tenant_services/types";
import type { AppointmentFormData } from "./types";
import { Controller, useFieldArray, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { appointmentSchema } from "./schemas";
import { useEffect } from "react";
import dayjs from "dayjs";
import { useClient } from "../../hooks/useClient";

type Props = {
  defaultValues?: Partial<AppointmentFormData>;
  onSubmit: (data: AppointmentFormData) => void;
  clients?: Client[];
  services?: Service[];
  selectedClient?: Client;
  selectedPet?: Pet;
};

export default function AppointmentForm({
  defaultValues,
  onSubmit,
  clients,
  services,
  selectedClient,
}: Props) {
  const { pets, setClientId } = useClient();

  const form = useForm<AppointmentFormData>({
    resolver: zodResolver(appointmentSchema),
    defaultValues,
  });

  const {
    control,
    handleSubmit,
    resetField,
    formState: { errors },
  } = form;
  const items = useWatch({ control, name: "items" });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "items",
  });

  useEffect(() => {
    console.log("FORM ERRORS 👉", errors);
  }, [errors]);

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
              <LocalizationProvider dateAdapter={AdapterDayjs}>
                <Box sx={{ display: "flex", gap: 2 }}>
                  <DatePicker
                    value={scheduledValue}
                    onChange={(newDate) => {
                      if (!newDate) return;

                      const current = scheduledValue ?? dayjs();

                      const updated = newDate
                        .hour(current.hour())
                        .minute(current.minute())
                        .second(0)
                        .toISOString();

                      field.onChange(updated);
                    }}
                    slotProps={{
                      textField: {
                        size: "small",
                        fullWidth: true,
                        error: !!fieldState.error,
                        helperText: fieldState.error?.message,
                      },
                    }}
                  />

                  {/* TIME */}
                  <TimePicker
                    value={scheduledValue}
                    ampm={false}
                    onChange={(newTime) => {
                      if (!newTime) return;

                      const current = scheduledValue ?? dayjs();

                      const updated = current
                        .hour(newTime.hour())
                        .minute(newTime.minute())
                        .second(0)
                        .toISOString();

                      field.onChange(updated);
                    }}
                    slotProps={{
                      textField: {
                        size: "small",
                        fullWidth: true,
                        error: !!fieldState.error,
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
            sx={{ width: "30%", minWidth: "160px" }}
            startIcon={<Plus size={18} />}
            variant="outlined"
            // onClick={onCreateClient}
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
                      onChange={(_, value) => field.onChange(value?.id ?? 0)}
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
                render={({ field }) => (
                  <Autocomplete
                    multiple
                    options={services ?? []}
                    disableCloseOnSelect
                    size="small"
                    value={
                      services?.filter((s) => field.value?.includes(s.id)) ?? []
                    }
                    getOptionLabel={(option) => option.name}
                    isOptionEqualToValue={(o, v) => o.id === v.id}
                    onChange={(_, value) =>
                      field.onChange(value.map((v) => v.id))
                    }
                    renderOption={(props, option, { selected }) => (
                      <li {...props}>
                        <Checkbox
                          checked={selected}
                          disableRipple
                          sx={{
                            color: "primary.main",
                          }}
                        />
                        {option.name}
                      </li>
                    )}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        placeholder="Selecionar serviços"
                        error={!!itemError?.service_ids}
                        helperText={itemError?.service_ids?.message}
                      />
                    )}
                  />
                )}
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
        sx={{width:'150px',display:'flex',mx:'auto'}}
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
