import { Box, FormControl, FormLabel, Stack, Typography } from "@mui/material";
import CustomTextField from "../../components/Textfield/CustomTextfield";
import { Button } from "../../components/Button/Button";
import { Phone, Store } from "lucide-react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { TenantFormData } from "./types";
import { tenantSchema } from "./schemas";
import { DEFAULT_TENANT_FORM } from "./constants";
import { maskPhone } from "../../utils/masks";
import { useEffect } from "react";

type Props = {
  onSubmit: (data: TenantFormData) => void;
};

const TenantCreateForm = ({ onSubmit }: Props) => {
  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<TenantFormData>({
    resolver: zodResolver(tenantSchema),
    defaultValues: { ...DEFAULT_TENANT_FORM },
  });
  useEffect(() => {
    console.log("FORM ERRORS 👉", errors);
  }, [errors]);
  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 4 }}>
      {/* Nome */}
      <FormControl error={!!errors.name}>
        <FormLabel sx={{ color: "text.primary", mb: 0.5 }}>
          <Stack direction="row" spacing={0.5} alignItems="center">
            <Store size={18} />
            <Typography>Nome do estabelecimento</Typography>
          </Stack>
        </FormLabel>

        <Controller
          name="name"
          control={control}
          render={({ field }) => (
            <CustomTextField
              {...field}
              required
              placeholder="ex: Meu Petshop"
              error={!!errors.name}
              helperText={errors.name?.message}
            />
          )}
        />
      </FormControl>

      {/* Telefone */}
      <FormControl error={!!errors.phone}>
        <FormLabel sx={{ color: "text.primary", mb: 0.5 }}>
          <Stack direction="row" spacing={0.5} alignItems="center">
            <Phone size={16} />
            <Typography>Telefone</Typography>
          </Stack>
        </FormLabel>

        <Controller
          name="phone"
          control={control}
          render={({ field }) => (
            <CustomTextField
              {...field}
              required
              placeholder="(00) 00000-0000"
              onChange={(e) => field.onChange(maskPhone(e.target.value))}
              error={!!errors.phone}
              helperText={errors.phone?.message}
            />
          )}
        />
      </FormControl>

      <Button
        sx={{ marginTop: 2, fontWeight: 600, fontSize: "18px" }}
        onClick={handleSubmit((data: TenantFormData) => onSubmit(data))}
      >
        Continuar
      </Button>
    </Box>
  );
};

export default TenantCreateForm;
