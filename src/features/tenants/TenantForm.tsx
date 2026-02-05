import { Box, FormControl, FormLabel, Stack, Typography } from "@mui/material";
import CustomTextField from "../../components/Textfield/CustomTextfield";
import { Button } from "../../components/Button/Button";
import { Phone, Store } from "lucide-react";

export type TenantForm = {
  name: string;
  phone: string;
};

type Props = {
  tenant: TenantForm;
  onChange: (value: TenantForm) => void;
  handleSubmit: () => void;
};
const TenantCreateForm = ({ tenant, onChange, handleSubmit }: Props) => {
  const handleChange =
    (field: keyof TenantForm) => (e: React.ChangeEvent<HTMLInputElement>) => {
      onChange({
        ...tenant,
        [field]: e.target.value,
      });
    };
  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 4 }}>
      <FormControl>
        <FormLabel sx={{ color: "text.primary", mb: 0.5 }}>
          <Stack direction="row" spacing={0.5} alignItems="center">
            <Store size={18} />
            <Typography>Nome do estabelecimento</Typography>
          </Stack>
        </FormLabel>

        <CustomTextField
          value={tenant.name}
          required
          placeholder="ex: Meu Petshop"
          onChange={handleChange("name")}
        />
      </FormControl>
      <FormControl>
        <FormLabel sx={{ color: "text.primary", mb: 0.5 }}>
          <Stack direction="row" spacing={0.5} alignItems="center">
            <Phone size={16} />
            <Typography>Telefone</Typography>
          </Stack>
        </FormLabel>
        <CustomTextField
          value={tenant.phone}
          required
          placeholder="ex: (00) 00000-0000"
          onChange={handleChange("phone")}
        />
      </FormControl>

      <Button
        sx={{ marginTop: 2, fontWeight: 600, fontSize: "18px" }}
        onClick={handleSubmit}
      >
        Continuar
      </Button>
    </Box>
  );
};

export default TenantCreateForm;
