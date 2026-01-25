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
import theme from "../../theme";
import { CAT_BREEDS, DOG_BREEDS } from "./constants";

export type PetFormData = {
  name: string;
  species: "dog" | "cat" | "other" | undefined;
  gender: "male" | "female" | undefined;
  breed: string;
  age: number;
  ageUnit: "year" | "month" | "day";
};

type Props = {
  pet: PetFormData;
  onChange: (data: PetFormData) => void;
};

const PetForm = ({ pet, onChange }: Props) => {
  const setFieldValue = (field: keyof PetFormData, value: string) => {
    onChange({
      ...pet,
      [field]: value,
    });
  };

  const handleChange =
    (field: keyof PetFormData) => (e: React.ChangeEvent<HTMLInputElement>) => {
      setFieldValue(field, e.target.value);
    };

    console.log('asdasd',pet.breed)
  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
      <FormControl>
        <FormLabel sx={{ color: "text.primary", mb: 0.5 }}>Nome</FormLabel>
        <CustomTextField
          value={pet.name}
          onChange={handleChange("name")}
          required
          placeholder="ex: Thor"
        />
      </FormControl>

      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <FormControl>
          <FormLabel sx={{ color: "text.primary", mb: 0.5 }}>Espécie</FormLabel>
          <Box sx={{ display: "flex", gap: 1 }}>
            <Chip
              onClick={() => setFieldValue("species", "dog")}
              label="Cachorro"
              sx={{
                color: "text.primary",
                px: 1,
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
                color: "text.primary",
                px: 1,
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
              icon={<Mars color={theme.palette.text.primary} size={16} />}
              sx={{
                color: "text.primary",
                px: 1,
                cursor: "pointer",
                bgcolor:
                  pet.gender === "male" ? "secondary.main" : "transparent",
                border: "1px solid",
                borderColor: "secondary.main",
              }}
            />
            <Chip
              onClick={() => setFieldValue("gender", "female")}
              label="Fêmea"
              icon={<Venus color={theme.palette.text.primary} size={16} />}
              sx={{
                color: "text.primary",
                px: 1,
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

      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignContent: "center",
        }}
      >
        <FormControl>
          <FormLabel sx={{ color: "text.primary", mb: 0.5 }}>Raça</FormLabel>
          <Autocomplete
            value={pet.breed}
            disabled={!pet.species}
            options={pet.species === "dog" ? DOG_BREEDS : CAT_BREEDS}
            size="small"
            onChange={(_, value) => setFieldValue("breed", value ?? "")}
            sx={{ width: 300, color: "text.primary", maxWidth: "80%" }}
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
              defaultValue={1}
            />
            <Select
              labelId="demo-select-small-label"
              id="demo-select-small"
              value={pet.ageUnit}
              onChange={(e) => setFieldValue("ageUnit", e.target.value)}
              size="small"
              sx={{ width: 140 }}
            >
              <MenuItem value={"day"}>Dias</MenuItem>
              <MenuItem value={"month"}>Meses</MenuItem>
              <MenuItem value={"year"}>Anos</MenuItem>
            </Select>
          </Box>
        </FormControl>
      </Box>
    </Box>
  );
};

export default PetForm;
