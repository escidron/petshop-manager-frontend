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
import type { Client, Pet } from "../../pages/ClientsPage";

type Props = {
  clients: Client[];
  pets: Pet[];
  setSelectedClient: (client: Client) => void;
  setSelectedPet: (pet: Pet) => void;
};

export default function AppointmentForm({
  clients,
  pets,
  setSelectedClient,
  setSelectedPet,
}: Props) {
  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
      <FormControl>
        <FormLabel sx={{ color: "text.primary", mb: 0.5 }}>
          Data e hora
        </FormLabel>
        <LocalizationProvider dateAdapter={AdapterDayjs}>
          <Box
            sx={{
              display: "flex",
              gap: 2,
              width: "100%",
              py: 1,
            }}
          >
            {/* DATE — 70% */}
            <Box sx={{ flex: 7 }}>
              <DatePicker
                slotProps={{
                  textField: {
                    size: "small",
                    fullWidth: true,
                    sx: {
                      "& .MuiInputBase-root": {
                        height: 30,
                      },
                    },
                  },
                }}
              />
            </Box>

            {/* TIME — 30% */}
            <Box sx={{ flex: 3 }}>
              <TimePicker
                ampm={false}
                slotProps={{
                  textField: {
                    size: "small",
                    fullWidth: true,
                    sx: {
                      "& .MuiInputBase-root": {
                        height: 30,
                      },
                    },
                  },
                }}
              />
            </Box>
          </Box>
        </LocalizationProvider>
      </FormControl>

      <FormControl>
        <FormLabel sx={{ color: "text.primary", mb: 0.5 }}>Cliente</FormLabel>
        <Autocomplete
          options={clients}
          size="small"
          getOptionLabel={(option) => option.name}
          sx={{ color: "text.primary" }}
          onChange={(_, value) => setSelectedClient(value as Client)}
          renderInput={(params) => (
            <TextField {...params} placeholder="Pesquisar cliente" />
          )}
        />
      </FormControl>

      <FormControl>
        <FormLabel sx={{ color: "text.primary", mb: 0.5 }}>Pet</FormLabel>
        <Autocomplete
          options={pets}
          size="small"
          getOptionLabel={(option) => option.name}
          sx={{ color: "text.primary" }}
          onChange={(_, value) => setSelectedPet(value as Pet)}
          renderInput={(params) => (
            <TextField {...params} placeholder="Pesquisar cliente" />
          )}
        />
      </FormControl>

      <FormControl>
        <FormLabel sx={{ color: "text.primary", mb: 0.5 }}>Serviços</FormLabel>
        {/* <FormGroup>
          <FormControlLabel
            control={<Checkbox sx={{ color: "text.primary" }} />}
            label="Label"
          />
          <FormControlLabel control={<Checkbox />} label="Required" />
          <FormControlLabel control={<Checkbox />} label="Disabled" />
        </FormGroup> */}
        <Box sx={{ display: "flex", gap: 1 }}>
          <Chip
            //   onClick={() => setFieldValue("species", "dog")}
            label="Banho"
            sx={{
              color: "text.primary",
              px: 1,
              cursor: "pointer",
              // bgcolor: pet.species === "dog" ? "secondary.main" : "transparent",
              bgcolor: "transparent",
              border: "1px solid",
              borderColor: "secondary.main",
              width: "fit-content",
            }}
          />
          <Chip
            //   onClick={() => setFieldValue("species", "dog")}
            label="Tosa"
            sx={{
              color: "text.primary",
              px: 1,
              cursor: "pointer",
              // bgcolor: pet.species === "dog" ? "secondary.main" : "transparent",
              bgcolor: "transparent",
              border: "1px solid",
              borderColor: "secondary.main",
              width: "fit-content",
            }}
          />
        </Box>
      </FormControl>

      <FormControl>
        <FormLabel sx={{ color: "text.primary", mb: 0.5 }}>
          Observações
        </FormLabel>
        <CustomTextField multiline rows={4} />
      </FormControl>
    </Box>
  );
}
