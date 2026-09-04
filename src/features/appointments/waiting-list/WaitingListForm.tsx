import { useState } from "react";
import {
  Autocomplete,
  Box,
  CircularProgress,
  FormControl,
  FormLabel,
  TextField,
  MenuItem,
  Select,
  Typography,
} from "@mui/material";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { Controller, useForm, useFieldArray, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus } from "lucide-react";
import dayjs from "dayjs";
import { Button } from "../../../components/Button/Button";
import CustomTextField from "../../../components/Textfield/CustomTextfield";
import { waitingListSchema, type WaitingListFormData } from "./schemas";
import type { Client } from "../../clients/types";
import type { Pet } from "../../pets/types";
import type { Service } from "../../tenant_services/types";
import type { WaitingListEntry, WaitingListPeriod } from "./types";
import WaitingListPetItem from "./WaitingListPetItem";
import { useAuth } from "../../../hooks/useAuth";
import { usePets } from "../../../hooks/usePets";

type Props = {
  initialData?: WaitingListEntry;
  clients: Client[];
  services: Service[];
  pets: Pet[];
  onClientIdChange: (id: number) => void;
  onSubmit: (data: WaitingListFormData) => void;
  isSubmitting: boolean;
};

export default function WaitingListForm({
  initialData,
  clients,
  services,
  pets,
  onClientIdChange,
  onSubmit,
  isSubmitting,
}: Props) {
  const { tenant } = useAuth();
  const [clientListLimit, setClientListLimit] = useState(20);
  const { pets: allPets } = usePets();
  const workingHours = tenant?.working_hours ?? null;
  const {
    control,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<any>({
    resolver: zodResolver(waitingListSchema),
    defaultValues: {
      client_id: initialData?.client_id || 0,
      items: initialData?.items.map(item => ({
        pet_id: item.pet_id,
        service_ids: item.services.map(s => s.id)
      })) || [{ pet_id: 0, service_ids: [] }],
      preferred_date: initialData?.preferred_date || null,
      preferred_period: (initialData?.preferred_period as WaitingListPeriod) || "any",
      notes: initialData?.notes || "",
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "items"
  });

  const watchedItems = useWatch({ control, name: "items" }) ?? [];

  return (
    <Box component="form" sx={{ display: "flex", flexDirection: "column", gap: 2.5, pt: 1 }}>
      {/* CLIENTE */}
      <FormControl fullWidth>
        <FormLabel sx={{ color: "text.primary", mb: 0.5 }}>Cliente</FormLabel>
        <Box sx={{ display: "flex", gap: 1 }}>
          <Controller
            name="client_id"
            control={control}
            render={({ field, fieldState }) => (
              <Autocomplete<Client>
                sx={{ flex: 1 }}
                options={clients}
                filterOptions={(options, state) => {
                  const input = state.inputValue.toLowerCase();
                  return options
                    .filter((option) => {
                      const clientPets = allPets?.filter(p => p.client_id === option.id && !p.is_deceased) || [];
                      const matchName = option.name.toLowerCase().includes(input);
                      const matchPet = clientPets.some(p => p.name.toLowerCase().includes(input));
                      return matchName || matchPet;
                    })
                    .slice(0, clientListLimit);
                }}
                size="small"
                noOptionsText="Nenhum cliente cadastrado"
                value={clients.find((c) => c.id === field.value) || null}
                getOptionLabel={(option) => option.name}
                isOptionEqualToValue={(option, value) => option.id === value?.id}
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
                  const clientPets = allPets?.filter(p => p.client_id === option.id && !p.is_deceased) || [];
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
                  const id = value?.id || 0;
                  field.onChange(id);
                  onClientIdChange(id);
                  // Reset items when client changes if desired, or keep them
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
        </Box>
      </FormControl>

      {/* PETS E SERVIÇOS */}
      <FormControl fullWidth>
        <FormLabel sx={{ color: "text.primary", mb: 1 }}>Pets e Serviços</FormLabel>
        
        {fields.map((field, index) => (
          <WaitingListPetItem
            key={field.id}
            index={index}
            control={control as any}
            setValue={setValue as any}
            pets={pets}
            services={services}
            items={watchedItems}
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
          Adicionar outro Pet à lista
        </Button>
      </FormControl>

      <Box sx={{ display: "flex", gap: { xs: 1, sm: 2 }, width: "100%" }}>
        {/* DATA PREFERENCIAL */}
        <FormControl sx={{ flex: { xs: "1 1 55%", sm: 1 }, minWidth: 0 }}>
          <FormLabel sx={{ color: "text.primary", mb: 0.5 }}>Data Preferencial</FormLabel>
          <Controller
            name="preferred_date"
            control={control}
            render={({ field }) => (
              <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="pt-br">
                <DatePicker
                  format="DD/MM/YYYY"
                  value={field.value ? dayjs(field.value) : null}
                  onChange={(val) => field.onChange(val?.toISOString() || null)}
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
                      placeholder: "DD/MM/AAAA",
                      inputMode: "numeric",
                    },
                  }}
                />
              </LocalizationProvider>
            )}
          />
        </FormControl>

        {/* PERÍODO */}
        <FormControl sx={{ flex: { xs: "1 1 45%", sm: "0 0 140px" }, minWidth: 0 }}>
          <FormLabel sx={{ color: "text.primary", mb: 0.5 }}>Período</FormLabel>
          <Controller
            name="preferred_period"
            control={control}
            render={({ field }) => (
              <Select {...field} size="small" fullWidth>
                <MenuItem value="any">Qualquer</MenuItem>
                <MenuItem value="morning">Manhã</MenuItem>
                <MenuItem value="afternoon">Tarde</MenuItem>
                <MenuItem value="evening">Noite</MenuItem>
              </Select>
            )}
          />
        </FormControl>
      </Box>

      {/* OBSERVAÇÕES */}
      <FormControl fullWidth error={!!errors.notes}>
        <FormLabel sx={{ color: "text.primary", mb: 0.5 }}>Observações</FormLabel>
        <Controller
          name="notes"
          control={control}
          render={({ field }) => (
            <CustomTextField 
              {...field} 
              multiline 
              rows={3} 
              placeholder="ex: Adicionais, comportamento, alergias, etc." 
              error={!!errors.notes}
              helperText={errors.notes?.message as string}
            />
          )}
        />
      </FormControl>

      <Box sx={{ display: "flex", justifyContent: "flex-end", mt: 1 }}>
        <Button
          disabled={isSubmitting}
          startIcon={isSubmitting ? <CircularProgress size={16} color="inherit" /> : undefined}
          onClick={handleSubmit((data: WaitingListFormData) => {
            const validItems = data.items.filter(
              (item) => item.pet_id && item.service_ids && item.service_ids.length > 0
            );
            onSubmit({
              ...data,
              items: validItems,
            });
          })}
        >
          {initialData ? "Salvar Alterações" : "Adicionar à Lista"}
        </Button>
      </Box>
    </Box>
  );
}
