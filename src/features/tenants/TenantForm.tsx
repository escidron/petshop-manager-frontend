import { useState } from "react";
import {
  Box,
  CircularProgress,
  Divider,
  FormControl,
  FormLabel,
  Stack,
  Typography,
} from "@mui/material";
import type { SxProps, Theme } from "@mui/material";
import CustomTextField from "../../components/Textfield/CustomTextfield";
import { Button } from "../../components/Button/Button";
import { Mail, Phone, Store, MapPin } from "lucide-react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { TenantFormData } from "./types";
import { tenantSchema } from "./schemas";
import { DEFAULT_TENANT_FORM } from "./constants";
import { maskPhone, maskDocument, maskCep } from "../../utils/masks";
import { getAddressByCep } from "../../api/services/address";
import { useToast } from "../../hooks/useToast";

type Props = {
  onSubmit: (data: TenantFormData) => void;
  defaultValues?: Partial<TenantFormData>;
  loading?: boolean;
  sx?: SxProps<Theme>;
};

const TenantCreateForm = ({ onSubmit, defaultValues, loading, sx }: Props) => {
  const [loadingCep, setLoadingCep] = useState(false);
  const toast = useToast();

  const {
    control,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<TenantFormData>({
    resolver: zodResolver(tenantSchema),
    defaultValues: { ...DEFAULT_TENANT_FORM, ...defaultValues },
  });

  const handleCepLookup = async (cepInput: string) => {
    const digits = (cepInput || "").replace(/\D/g, "");
    if (digits.length !== 8) return;
    setLoadingCep(true);
    try {
      try {
        const address = await getAddressByCep(digits);
        if (address && (address.street || address.neighborhood || address.city)) {
          if (address.street) setValue("street", address.street, { shouldValidate: true });
          if (address.neighborhood) setValue("neighborhood", address.neighborhood, { shouldValidate: true });
          if (address.city) setValue("city", address.city, { shouldValidate: true });
          if (address.state) setValue("state", address.state, { shouldValidate: true });
          return;
        }
      } catch {
        // Fallback direto ao ViaCEP caso o endpoint interno retorne erro
      }

      const resp = await fetch(`https://viacep.com.br/ws/${digits}/json/`);
      const data = await resp.json();
      if (!data.erro) {
        if (data.logradouro) setValue("street", data.logradouro, { shouldValidate: true });
        if (data.bairro) setValue("neighborhood", data.bairro, { shouldValidate: true });
        if (data.localidade) setValue("city", data.localidade, { shouldValidate: true });
        if (data.uf) setValue("state", data.uf, { shouldValidate: true });
      } else {
        toast.warning("CEP não encontrado. Preencha o endereço manualmente.");
      }
    } catch {
      // Ignora erro de busca
    } finally {
      setLoadingCep(false);
    }
  };

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 2, ...sx }}>
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

      {/* E-mail da petshop */}
      <FormControl error={!!errors.email}>
        <FormLabel sx={{ color: "text.primary", mb: 0.5 }}>
          <Stack direction="row" spacing={0.5} alignItems="center">
            <Mail size={16} />
            <Typography>E-mail do estabelecimento (Opcional)</Typography>
          </Stack>
        </FormLabel>

        <Controller
          name="email"
          control={control}
          render={({ field }) => (
            <CustomTextField
              {...field}
              value={field.value || ""}
              placeholder="ex: contato@meupetshop.com.br"
              error={!!errors.email}
              helperText={errors.email?.message}
            />
          )}
        />
      </FormControl>

      {/* CPF / CNPJ */}
      <FormControl error={!!errors.document}>
        <FormLabel sx={{ color: "text.primary", mb: 0.5 }}>
          <Stack direction="row" spacing={0.5} alignItems="center">
            <Typography>CPF / CNPJ da Empresa (Opcional)</Typography>
          </Stack>
        </FormLabel>

        <Controller
          name="document"
          control={control}
          render={({ field }) => (
            <CustomTextField
              {...field}
              value={field.value || ""}
              placeholder="000.000.000-00"
              onChange={(e) => field.onChange(maskDocument(e.target.value))}
              error={!!errors.document}
              helperText={errors.document?.message}
            />
          )}
        />
      </FormControl>

      {/* Divisor Endereço */}
      <Divider sx={{ my: 1 }}>
        <Stack direction="row" spacing={0.75} alignItems="center">
          <MapPin size={16} color="#64748B" />
          <Typography variant="caption" color="text.secondary" fontWeight={700}>
            Endereço do estabelecimento
          </Typography>
        </Stack>
      </Divider>

      {/* CEP */}
      <FormControl error={!!errors.cep} fullWidth>
        <FormLabel sx={{ color: "text.primary", mb: 0.5 }}>
          CEP (Opcional)
        </FormLabel>
        <Controller
          name="cep"
          control={control}
          render={({ field }) => (
            <CustomTextField
              {...field}
              value={field.value ? maskCep(field.value) : ""}
              error={!!errors.cep}
              helperText={errors.cep?.message || (loadingCep ? "Buscando dados do CEP..." : "")}
              placeholder="00000-000"
              disabled={loadingCep}
              slotProps={{
                input: {
                  endAdornment: loadingCep ? (
                    <CircularProgress size={18} sx={{ color: "text.secondary", mr: 1 }} />
                  ) : null,
                },
              }}
              onBlur={() => handleCepLookup(field.value || "")}
              onChange={(e) => {
                const masked = maskCep(e.target.value);
                field.onChange(masked);
                if (masked.replace(/\D/g, "").length === 8) {
                  handleCepLookup(masked);
                }
              }}
            />
          )}
        />
      </FormControl>

      {/* Logradouro (Rua / Avenida) */}
      <FormControl error={!!errors.street} fullWidth>
        <FormLabel sx={{ color: "text.primary", mb: 0.5 }}>
          Logradouro (Rua / Avenida)
        </FormLabel>
        <Controller
          name="street"
          control={control}
          render={({ field }) => (
            <CustomTextField
              {...field}
              value={field.value || ""}
              error={!!errors.street}
              helperText={errors.street?.message}
              placeholder="Ex: Rua Serra de Botucatu"
            />
          )}
        />
      </FormControl>

      {/* Número e Complemento */}
      <Box sx={{ display: "flex", gap: 2, flexDirection: { xs: "column", sm: "row" } }}>
        <FormControl error={!!errors.number} sx={{ flex: { sm: 1 } }}>
          <FormLabel sx={{ color: "text.primary", mb: 0.5 }}>
            Número
          </FormLabel>
          <Controller
            name="number"
            control={control}
            render={({ field }) => (
              <CustomTextField
                {...field}
                value={field.value || ""}
                error={!!errors.number}
                helperText={errors.number?.message}
                placeholder="123 ou S/N"
              />
            )}
          />
        </FormControl>

        <FormControl error={!!errors.complement} sx={{ flex: { sm: 2 } }}>
          <FormLabel sx={{ color: "text.primary", mb: 0.5 }}>
            Complemento (Opcional)
          </FormLabel>
          <Controller
            name="complement"
            control={control}
            render={({ field }) => (
              <CustomTextField
                {...field}
                value={field.value || ""}
                error={!!errors.complement}
                helperText={errors.complement?.message}
                placeholder="Sala, Bloco, etc."
              />
            )}
          />
        </FormControl>
      </Box>

      {/* Bairro */}
      <FormControl error={!!errors.neighborhood} fullWidth>
        <FormLabel sx={{ color: "text.primary", mb: 0.5 }}>
          Bairro
        </FormLabel>
        <Controller
          name="neighborhood"
          control={control}
          render={({ field }) => (
            <CustomTextField
              {...field}
              value={field.value || ""}
              error={!!errors.neighborhood}
              helperText={errors.neighborhood?.message}
              placeholder="Ex: Vila Gomes Cardim"
            />
          )}
        />
      </FormControl>

      {/* Cidade e UF */}
      <Box sx={{ display: "flex", gap: 2, flexDirection: { xs: "column", sm: "row" } }}>
        <FormControl error={!!errors.city} sx={{ flex: { sm: 3 } }}>
          <FormLabel sx={{ color: "text.primary", mb: 0.5 }}>
            Cidade
          </FormLabel>
          <Controller
            name="city"
            control={control}
            render={({ field }) => (
              <CustomTextField
                {...field}
                value={field.value || ""}
                error={!!errors.city}
                helperText={errors.city?.message}
                placeholder="Ex: São Paulo"
              />
            )}
          />
        </FormControl>

        <FormControl error={!!errors.state} sx={{ flex: { sm: 1 } }}>
          <FormLabel sx={{ color: "text.primary", mb: 0.5 }}>
            UF
          </FormLabel>
          <Controller
            name="state"
            control={control}
            render={({ field }) => (
              <CustomTextField
                {...field}
                value={field.value || ""}
                error={!!errors.state}
                helperText={errors.state?.message}
                placeholder="SP"
                inputProps={{ maxLength: 2, style: { textTransform: "uppercase" } }}
              />
            )}
          />
        </FormControl>
      </Box>

      <Button
        loading={loading}
        sx={{ marginTop: 2, fontWeight: 600, fontSize: "18px" }}
        onClick={handleSubmit((data: TenantFormData) => onSubmit(data))}
      >
        Continuar
      </Button>
    </Box>
  );
};

export default TenantCreateForm;
