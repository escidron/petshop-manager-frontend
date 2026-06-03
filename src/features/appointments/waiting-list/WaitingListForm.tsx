import {
  Autocomplete,
  Box,
  CircularProgress,
  FormControl,
  FormLabel,
  TextField,
  MenuItem,
  Select,
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

type Props = {
  initialData?: WaitingListEntry;
  clients: Client[];
  services: Service[];
  pets: Pet[];
  onClientIdChange: (id: number) => void;
  onSubmit: (data: WaitingListFormData) => void;
  isSubmitting: boolean;
  onCreateClient: () => void;
  onCreatePet: () => void;
  onCreateService: () => void;
};

export default function WaitingListForm({
  initialData,
  clients,
  services,
  pets,
  onClientIdChange,
  onSubmit,
  isSubmitting,
  onCreateClient,
  onCreatePet,
  onCreateService,
}: Props) {
  const {
    control,
    handleSubmit,
    setValue,
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
                size="small"
                noOptionsText="Nenhum cliente cadastrado"
                value={clients.find((c) => c.id === field.value) || null}
                getOptionLabel={(option) => option.name}
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
          <Button 
            variant="outlined" 
            startIcon={<Plus size={16} />} 
            onClick={onCreateClient} 
            sx={{ minWidth: "140px", height: "40px" }}
          >
            Criar Cliente
          </Button>
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
            onCreatePet={onCreatePet}
            onCreateService={onCreateService}
            onRemove={() => remove(index)}
            isOnlyPet={fields.length <= 1}
          />
        ))}

        <Button
          sx={{ display: "flex", mx: "auto" }}
          startIcon={<Plus size={18} />}
          variant="text"
          onClick={() => append({ pet_id: 0, service_ids: [] })}
        >
          Adicionar outro Pet à lista
        </Button>
      </FormControl>

      <Box sx={{ display: "flex", gap: 2 }}>
        {/* DATA PREFERENCIAL */}
        <FormControl sx={{ flex: 1 }}>
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
                  slotProps={{ textField: { size: "small", fullWidth: true } }}
                />
              </LocalizationProvider>
            )}
          />
        </FormControl>

        {/* PERÍODO */}
        <FormControl sx={{ width: 140 }}>
          <FormLabel sx={{ color: "text.primary", mb: 0.5 }}>Período</FormLabel>
          <Controller
            name="preferred_period"
            control={control}
            render={({ field }) => (
              <Select {...field} size="small">
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
      <FormControl fullWidth>
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
            />
          )}
        />
      </FormControl>

      <Box sx={{ display: "flex", justifyContent: "flex-end", mt: 1 }}>
        <Button
          disabled={isSubmitting}
          startIcon={isSubmitting ? <CircularProgress size={16} color="inherit" /> : undefined}
          onClick={handleSubmit(onSubmit)}
        >
          {initialData ? "Salvar Alterações" : "Adicionar à Lista"}
        </Button>
      </Box>
    </Box>
  );
}
