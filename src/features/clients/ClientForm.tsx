import { Box, Button, FormControl, FormLabel } from "@mui/material";
import { useState } from "react";
import CustomTextField from "../../components/Textfield/CustomTextfield";

type ClientFormData = {
  name: string;
  email: string;
  phone: string;
};

type Props = {
  onSubmit: (data: ClientFormData) => void;
};

const ClientForm = ({ onSubmit }: Props) => {
  const [form, setForm] = useState<ClientFormData>({
    name: "",
    email: "",
    phone: "",
  });

  const handleChange =
    (field: keyof ClientFormData) =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setForm((prev) => ({
        ...prev,
        [field]: e.target.value,
      }));
    };

  return (
    <Box
      component="form"
      sx={{ display: "flex", flexDirection: "column", gap: 2 }}
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit(form);
      }}
    >
      <FormControl>
        <FormLabel sx={{color:'text.primary'}}>Nome completo</FormLabel>
        <CustomTextField
          placeholder="Ex: João da Silva"
          value={form.name}
          onChange={handleChange("name")}
          required
        />
      </FormControl>

      <FormControl>
        <FormLabel sx={{color:'text.primary'}}>E-mail</FormLabel>
        <CustomTextField
          placeholder="exemplo@email.com"
          value={form.email}
          onChange={handleChange("email")}
        />
      </FormControl>

      <FormControl>
        <FormLabel sx={{color:'text.primary'}}>Telefone</FormLabel>
        <CustomTextField
          placeholder="(11) 99999-9999"
          value={form.phone}
          onChange={handleChange("phone")}
        />
      </FormControl>

      <Button type="submit" variant="contained">
        Salvar
      </Button>
    </Box>
  );
};

export default ClientForm;
