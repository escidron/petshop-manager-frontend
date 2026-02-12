import {
  Autocomplete,
  Box,
  Chip,
  FormControl,
  FormLabel,
  TextField,
} from "@mui/material";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { TimePicker } from "@mui/x-date-pickers/TimePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import CustomTextField from "../../components/Textfield/CustomTextfield";
import type { Dayjs } from "dayjs";
import { Button } from "../../components/Button/Button";
import { Plus } from "lucide-react";
import type { Service } from "../../pages/ServicesPage";
import type { Client } from "../clients/types";
import type { Pet } from "../pets/types";

type Props = {
  clients: Client[];
  pets: Pet[];
  services: Service[];
  selectedServices: number[];
  selectedClient: Client | null;
  selectedPet: Pet | null;
  date?: Dayjs;
  time?: Dayjs;
  notes?: string;
  onClientChange: (client?: Client) => void;
  onPetChange: (pet?: Pet) => void;
  onServiceToggle: (id: number) => void;
  onDateChange: (date: Dayjs | null) => void;
  onTimeChange: (time: Dayjs | null) => void;
  onNotesChange: (notes: string) => void;
  onCreateClient: () => void;
  onCreatePet: () => void;
};

export default function AppointmentForm({
  clients,
  pets,
  services,
  selectedServices,
  selectedClient,
  selectedPet,
  date,
  time,
  notes,
  onClientChange,
  onPetChange,
  onServiceToggle,
  onDateChange,
  onTimeChange,
  onNotesChange,
  onCreateClient,
  onCreatePet,
}: Props) {
  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
      <FormControl>
        <FormLabel sx={{ color: "text.primary", mb: 0.5 }}>
          Data e hora
        </FormLabel>
        <LocalizationProvider dateAdapter={AdapterDayjs}>
          <Box sx={{ display: "flex", gap: 2, width: "100%", py: 1 }}>
            <Box sx={{ flex: 7 }}>
              <DatePicker
                value={date}
                onChange={(value) => onDateChange(value)}
                slotProps={{
                  textField: {
                    size: "small",
                    fullWidth: true,
                    sx: { "& .MuiInputBase-root": { height: 30 } },
                  },
                }}
              />
            </Box>

            <Box sx={{ flex: 3 }}>
              <TimePicker
                value={time}
                ampm={false}
                onChange={onTimeChange}
                slotProps={{
                  textField: {
                    size: "small",
                    fullWidth: true,
                    sx: { "& .MuiInputBase-root": { height: 30 } },
                  },
                }}
              />
            </Box>
          </Box>
        </LocalizationProvider>
      </FormControl>

      <FormControl>
        <FormLabel sx={{ color: "text.primary", mb: 0.5 }}>Cliente</FormLabel>
        <Box sx={{ display: "flex", gap: 1 }}>
          <Autocomplete
            value={selectedClient}
            sx={{ width: "70%" }}
            options={clients}
            size="small"
            getOptionLabel={(option) => option.name}
            isOptionEqualToValue={(option, value) => option.id === value.id}
            getOptionKey={(option) => option.id}
            onChange={(_, value) => onClientChange(value || undefined)}
            renderInput={(params) => (
              <TextField {...params} placeholder="Pesquisar cliente" />
            )}
          />

          <Button
            sx={{ width: "30%", minWidth: '160px' }}
            startIcon={<Plus size={18} />}
            variant="outlined"
            onClick={onCreateClient}
          >
            Novo Cliente
          </Button>
        </Box>
      </FormControl>

      <FormControl>
        <FormLabel sx={{ color: "text.primary", mb: 0.5 }}>Pet</FormLabel>
        <Box sx={{ display: "flex", gap: 1 }}>
          <Autocomplete
            value={selectedPet}
            sx={{ width: "70%" }}
            options={pets}
            size="small"
            getOptionLabel={(option) => option.name}
            onChange={(_, value) => onPetChange(value || undefined)}
            renderInput={(params) => (
              <TextField {...params} placeholder="Pesquisar pet" />
            )}
          />

          <Button
            sx={{ width: "30%", minWidth: '160px' }}
            startIcon={<Plus size={18} />}
            variant="outlined"
            onClick={onCreatePet}
          >
            Novo Pet
          </Button>
        </Box>
      </FormControl>

      <FormControl>
        <FormLabel sx={{ color: "text.primary", mb: 0.5 }}>Serviços</FormLabel>
        <Box sx={{ display: "flex", gap: 1 }}>
          {services.map((service) => (
            <Chip
              key={service.id}
              label={service.name}
              onClick={() => onServiceToggle(service.id)}
              sx={{
                cursor: "pointer",
                bgcolor: selectedServices.includes(service.id)
                  ? "secondary.main"
                  : "transparent",
                border: "1px solid",
                borderColor: "secondary.main",
              }}
            />
          ))}
        </Box>
      </FormControl>

      <FormControl>
        <FormLabel sx={{ color: "text.primary", mb: 0.5 }}>
          Observações
        </FormLabel>
        <CustomTextField
          value={notes}
          multiline
          rows={4}
          onChange={(e) => onNotesChange(e.target.value)}
        />
      </FormControl>
    </Box>
  );
}
