import { Box, FormControl, FormLabel } from "@mui/material";

import CustomTextField from "../../components/Textfield/CustomTextfield";

export type ClientFormData = {
  name: string;
  email?: string;
  phone?: string;
};

type Props = {
  client: ClientFormData;
  onChange: (data: ClientFormData) => void;
};

export default function ClientForm({ client, onChange }: Props) {
  
  const handleChange =
    (field: keyof ClientFormData) =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
      onChange({
        ...client,
        [field]: e.target.value,
      });
    };

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
      <FormControl>
        <FormLabel sx={{ color: "text.primary" }}>Nome completo</FormLabel>
        <CustomTextField
          value={client.name}
          onChange={handleChange("name")}
          required
          placeholder="ex: Pedro da Silva"
        />
      </FormControl>

      <FormControl>
        <FormLabel sx={{ color: "text.primary" }}>E-mail</FormLabel>
        <CustomTextField
          value={client.email}
          onChange={handleChange("email")}
          placeholder="ex: email@exemplo.com"
        />
      </FormControl>

      <FormControl>
        <FormLabel sx={{ color: "text.primary" }}>Telefone</FormLabel>
        <CustomTextField
          value={client.phone}
          onChange={handleChange("phone")}
          placeholder="ex: (11) 99999-9999"
        />
      </FormControl>
    </Box>
  );
}
