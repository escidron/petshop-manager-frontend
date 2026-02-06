import { Box, FormControl, FormLabel } from "@mui/material";
import CustomTextField from "../../components/Textfield/CustomTextfield";

export type ServiceFormData = {
  name: string;
  description?: string;
  duration_minutes?: number;
  price_cents?: number;
  type: "BATH" | "GROOMING" | "BATH_GROOMING";
};

type Props = {
  service: ServiceFormData;
  onChange: (data: ServiceFormData) => void;
};

const ServiceForm = ({ service, onChange }: Props) => {
  const setFieldValue = <K extends keyof ServiceFormData>(
    field: K,
    value: ServiceFormData[K],
  ) => {
    onChange({
      ...service,
      [field]: value,
    });
  };

  const handleChange =
    (field: keyof ServiceFormData) =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setFieldValue(field, e.target.value);
    };

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
      <FormControl>
        <FormLabel sx={{ color: "text.primary", mb: 0.5 }}>Nome</FormLabel>

        <CustomTextField
          value={service.name}
          onChange={handleChange("name")}
          required
        />
      </FormControl>

      <FormControl>
        <FormLabel sx={{ color: "text.primary", mb: 0.5 }}>Descrição</FormLabel>

        <CustomTextField
          value={service.description}
          onChange={handleChange("description")}
          required
          multiline
          rows={4}
        />
      </FormControl>

      <FormControl>
        <FormLabel sx={{ color: "text.primary", mb: 0.5 }}>Preço</FormLabel>

        <CustomTextField
          value={service.price_cents}
          onChange={handleChange("name")}
          required
        />
      </FormControl>

      <FormControl>
        <FormLabel sx={{ color: "text.primary", mb: 0.5 }}>Duração</FormLabel>

        <CustomTextField
          value={service.duration_minutes}
          onChange={handleChange("description")}
          required
        />
      </FormControl>
    </Box>
  );
};

export default ServiceForm;
