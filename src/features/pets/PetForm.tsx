import {
  Autocomplete,
  Box,
  Chip,
  FormControl,
  FormLabel,
  MenuItem,
  Select,
  TextField,
} from "@mui/material";
import CustomTextField from "../../components/Textfield/CustomTextfield";
import { Mars, Venus } from "lucide-react";
import { CAT_BREEDS, DOG_BREEDS } from "./constants";
import type { Client } from "../../pages/ClientsPage";

export type PetFormData = {
  name: string;
  species: "dog" | "cat" | "other" | undefined;
  gender: "male" | "female" | undefined;
  breed: string;
  age: number;
  ageUnit: "year" | "month" | "day";
  owner_name?: string;
  client_id?: number;
};

type Props = {
  pet: PetFormData;
  onChange: (data: PetFormData) => void;
  clients: Client[];
  selectedClient: Client | null;
  setSelectedClient: (client: Client | null) => void;
};

const PetForm = ({
  pet,
  onChange,
  clients,
  selectedClient,
  setSelectedClient,
}: Props) => {
  const setFieldValue = <K extends keyof PetFormData>(
    field: K,
    value: PetFormData[K],
  ) => {
    onChange({
      ...pet,
      [field]: value,
    });
  };

  const handleChange =
    (field: keyof PetFormData) => (e: React.ChangeEvent<HTMLInputElement>) => {
      setFieldValue(field, e.target.value);
    };

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
      {/* DONO */}
      <FormControl>
        <FormLabel sx={{ color: "text.primary", mb: 0.5 }}>Dono</FormLabel>

        <Autocomplete<Client>
          value={selectedClient}
          options={clients}
          size="small"
          getOptionLabel={(option) => option.name}
          isOptionEqualToValue={(option, value) => option.id === value.id}
          onChange={(_, value) => setSelectedClient(value)}
          renderInput={(params) => (
            <TextField {...params} placeholder="Pesquisar cliente" />
          )}
        />
      </FormControl>

      {/* NOME */}
      <FormControl>
        <FormLabel sx={{ color: "text.primary", mb: 0.5 }}>Nome</FormLabel>
        <CustomTextField
          value={pet.name}
          onChange={handleChange("name")}
          required
          placeholder="ex: Thor"
        />
      </FormControl>

      {/* ESPÉCIE + GÊNERO */}
      <Box sx={{ display: "flex", justifyContent: "space-between" }}>
        <FormControl>
          <FormLabel sx={{ color: "text.primary", mb: 0.5 }}>Espécie</FormLabel>
          <Box sx={{ display: "flex", gap: 1 }}>
            <Chip
              onClick={() => setFieldValue("species", "dog")}
              label="Cachorro"
              sx={{
                cursor: "pointer",
                bgcolor:
                  pet.species === "dog" ? "secondary.main" : "transparent",
                border: "1px solid",
                borderColor: "secondary.main",
              }}
            />
            <Chip
              onClick={() => setFieldValue("species", "cat")}
              label="Gato"
              sx={{
                cursor: "pointer",
                bgcolor:
                  pet.species === "cat" ? "secondary.main" : "transparent",
                border: "1px solid",
                borderColor: "secondary.main",
              }}
            />
          </Box>
        </FormControl>

        <FormControl>
          <FormLabel sx={{ color: "text.primary", mb: 0.5 }}>Gênero</FormLabel>
          <Box sx={{ display: "flex", gap: 1 }}>
            <Chip
              onClick={() => setFieldValue("gender", "male")}
              label="Macho"
              icon={<Mars size={16} />}
              sx={{
                cursor: "pointer",
                bgcolor:
                  pet.gender === "male" ? "secondary.main" : "transparent",
                border: "1px solid",
                borderColor: "secondary.main",
              }}
            />
            <Chip
              onClick={() => setFieldValue("gender", "female")}
              label="Fêmea"
              icon={<Venus size={16} />}
              sx={{
                cursor: "pointer",
                bgcolor:
                  pet.gender === "female" ? "secondary.main" : "transparent",
                border: "1px solid",
                borderColor: "secondary.main",
              }}
            />
          </Box>
        </FormControl>
      </Box>

      {/* RAÇA + IDADE */}
      <Box sx={{ display: "flex", justifyContent: "space-between" }}>
        <FormControl>
          <FormLabel sx={{ color: "text.primary", mb: 0.5 }}>Raça</FormLabel>
          <Autocomplete
            value={pet.breed}
            disabled={!pet.species}
            options={pet.species === "dog" ? DOG_BREEDS : CAT_BREEDS}
            size="small"
            sx={{ width: 300, color: "text.primary", maxWidth: "80%" }}
            onChange={(_, value) => setFieldValue("breed", value ?? "")}
            renderInput={(params) => (
              <TextField {...params} placeholder="Pesquisar raça" />
            )}
          />
        </FormControl>

        <FormControl>
          <FormLabel sx={{ color: "text.primary", mb: 0.5 }}>Idade</FormLabel>
          <Box sx={{ display: "flex", gap: 1 }}>
            <CustomTextField
              type="number"
              value={pet.age}
              onChange={handleChange("age")}
              required
              sx={{ width: 70 }}
            />
            <Select
              value={pet.ageUnit}
              onChange={(e) => setFieldValue("ageUnit", e.target.value)}
              size="small"
              sx={{ width: 140 }}
            >
              <MenuItem value="day">Dias</MenuItem>
              <MenuItem value="month">Meses</MenuItem>
              <MenuItem value="year">Anos</MenuItem>
            </Select>
          </Box>
        </FormControl>
      </Box>
    </Box>
  );
};

export default PetForm;
