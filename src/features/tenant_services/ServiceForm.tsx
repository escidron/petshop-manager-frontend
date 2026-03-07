import {
  Autocomplete,
  Box,
  Divider,
  FormControl,
  FormLabel,
  InputAdornment,
  TextField,
  Typography,
} from "@mui/material";
import CustomTextField from "../../components/Textfield/CustomTextfield";
import type { ServiceFormData } from "./types";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "../../components/Button/Button";
import { Minus, Plus } from "lucide-react";
import { serviceSchema } from "./schemas";
import { COAT_TYPES, PET_SIZES, PET_SPECIES } from "../pets/constants";
import { formatBRLFromCents } from "../../utils/masks";

type Props = {
  defaultValues?: Partial<ServiceFormData>;
  onSubmit: (data: ServiceFormData) => void;
  showAdditionalInfo: boolean;
  setShowAdditionalInfo: (value: boolean) => void;
};

const ServiceForm = ({
  defaultValues,
  onSubmit,
  showAdditionalInfo,
  setShowAdditionalInfo,
}: Props) => {
  const form = useForm<ServiceFormData>({
    resolver: zodResolver(serviceSchema),
    defaultValues: {
      is_active: true,
      ...defaultValues,
    },
  });
  const {
    control,
    handleSubmit,
  } = form;

  return (
    <form>
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          gap: 2,
        }}
      >
        <Divider />
        <Box
          className="wrapper"
          sx={{ display: "flex", justifyContent: "space-between" }}
        >
          {/* ================= BÁSICO ================= */}

          <Box
            className="block-1"
            sx={{
              display: "flex",
              gap: 2,
              flexDirection: "column",
              width: showAdditionalInfo ? "45%" : "100%",
            }}
          >
            <Box>
              <Typography variant="h6">Cadastro Básico</Typography>
              <Typography fontSize="12px" color="text.disabled">
                Campos obrigatórios
              </Typography>
            </Box>
            <FormControl fullWidth sx={{ color: "text.primary" }}>
              <FormLabel sx={{ color: "text.primary", mb: 0.5 }}>
                Nome do Serviço
              </FormLabel>
              <Controller
                name="name"
                control={control}
                render={({ field, fieldState }) => (
                  <CustomTextField
                    {...field}
                    error={!!fieldState.error}
                    helperText={fieldState.error?.message}
                    placeholder="ex: Banho e tosa"
                  />
                )}
              />
            </FormControl>
            <FormControl fullWidth>
              <FormLabel sx={{ color: "text.primary", mb: 0.5 }}>
                Preço do Serviço
              </FormLabel>

              <Controller
                name="price_cents"
                control={control}
                render={({ field, fieldState }) => {
                  const formattedValue = formatBRLFromCents(field.value);

                  return (
                    <TextField
                      value={formattedValue}
                      error={!!fieldState.error}
                      helperText={fieldState.error?.message}
                      size="small"
                      placeholder="0,00"
                      slotProps={{
                        input: {
                          startAdornment: (
                            <InputAdornment position="start">
                              <Typography
                                sx={{
                                  color: "text.disabled",
                                  fontWeight: 500,
                                  mt: "2px",
                                }}
                              >
                                R$
                              </Typography>
                            </InputAdornment>
                          ),
                        },
                      }}
                      onChange={(e) => {
                        const digits = e.target.value.replace(/\D/g, "");
                        field.onChange(
                          digits === "" ? undefined : Number(digits),
                        );
                      }}
                    />
                  );
                }}
              />
            </FormControl>
            <Button
              variant="text"
              startIcon={showAdditionalInfo ? <Minus /> : <Plus />}
              onClick={() => setShowAdditionalInfo(!showAdditionalInfo)}
            >
              {showAdditionalInfo ? "Ocultar" : "Mostrar"} Cadastro Completo
            </Button>
          </Box>

          {/* ================= Informacoes adicionais ================= */}
          {showAdditionalInfo && (
            <Box
              className="block-2"
              sx={{
                display: "flex",
                gap: 2,
                flexDirection: "column",
                width: "45%",
              }}
            >
              <Box>
                <Typography variant="h6">Informações Adicionais</Typography>
                <Typography fontSize="12px" color="text.disabled">
                  Campos não obrigatórios
                </Typography>
              </Box>

              <FormControl fullWidth>
                <FormLabel sx={{ color: "text.primary", mb: 0.5 }}>
                  Tipo de animal
                </FormLabel>
                <Controller
                  name="species"
                  control={control}
                  render={({ field, fieldState }) => (
                    <Autocomplete
                      options={PET_SPECIES ?? []}
                      size="small"
                      value={
                        PET_SPECIES?.find((s) => s.value === field.value) ??
                        null
                      }
                      onChange={(_, specie) =>
                        field.onChange(specie?.value ?? "")
                      }
                      getOptionLabel={(option) => option.label}
                      isOptionEqualToValue={(option, value) =>
                        option.value === value.value
                      }
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          placeholder="Pesquisar Espécie"
                          error={!!fieldState.error}
                          helperText={fieldState.error?.message}
                        />
                      )}
                    />
                  )}
                />
              </FormControl>

              <FormControl fullWidth>
                <FormLabel sx={{ color: "text.primary", mb: 0.5 }}>
                  Porte do animal
                </FormLabel>
                <Controller
                  name="size"
                  control={control}
                  render={({ field }) => (
                    <Autocomplete
                      options={PET_SIZES}
                      size="small"
                      value={
                        PET_SIZES.find((size) => size.value === field.value) ??
                        null
                      }
                      isOptionEqualToValue={(option, value) =>
                        option.value === value.value
                      }
                      getOptionLabel={(option) => option.label}
                      onChange={(_, value) =>
                        field.onChange(value?.value ?? "")
                      }
                      renderInput={(params) => (
                        <TextField {...params} placeholder="Selecionar Porte" />
                      )}
                    />
                  )}
                />
              </FormControl>

              <FormControl fullWidth>
                <FormLabel sx={{ color: "text.primary", mb: 0.5 }}>
                  Tipo de pelagem
                </FormLabel>
                <Controller
                  name="coat_type"
                  control={control}
                  render={({ field, fieldState }) => (
                    <Autocomplete
                      options={COAT_TYPES ?? []}
                      size="small"
                      value={
                        COAT_TYPES?.find(
                          (type) => type.value === field.value,
                        ) ?? null
                      }
                      isOptionEqualToValue={(option, value) =>
                        option.value === value.value
                      }
                      getOptionLabel={(option) => option.label}
                      onChange={(_, type) => field.onChange(type?.value ?? "")}
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          placeholder="Pesquisar Tipo"
                          error={!!fieldState.error}
                          helperText={fieldState.error?.message}
                        />
                      )}
                    />
                  )}
                />
              </FormControl>

              <FormControl fullWidth>
                <FormLabel sx={{ color: "text.primary", mb: 0.5 }}>
                  Tiempo de duração do serviço
                </FormLabel>

                <Controller
                  name="duration_minutes"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      sx={{
                        "& input[type=number]": {
                          MozAppearance: "textfield", // Firefox
                        },
                        "& input[type=number]::-webkit-outer-spin-button": {
                          WebkitAppearance: "none",
                          margin: 0,
                        },
                        "& input[type=number]::-webkit-inner-spin-button": {
                          WebkitAppearance: "none",
                          margin: 0,
                        },
                      }}
                      size="small"
                      type="number"
                      placeholder="0"
                      slotProps={{
                        htmlInput: {
                          min: 0,
                        },
                        input: {
                          endAdornment: (
                            <InputAdornment position="end">
                              <Typography
                                sx={{
                                  color: "text.disabled",
                                  fontWeight: 500,
                                  paddingRight: 1,
                                }}
                              >
                                minutos
                              </Typography>
                            </InputAdornment>
                          ),
                        },
                      }}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        field.onChange(
                          e.currentTarget.value === ""
                            ? undefined
                            : e.currentTarget.valueAsNumber,
                        )
                      }
                    />
                  )}
                />
              </FormControl>

              <FormControl fullWidth>
                <FormLabel sx={{ color: "text.primary", mb: 0.5 }}>
                  Descrição do serviço
                </FormLabel>

                <Controller
                  name="description"
                  control={control}
                  render={({ field }) => (
                    <CustomTextField
                      {...field}
                      multiline
                      rows={4}
                      placeholder="Descrição do serviço ou informações Adicionais."
                    />
                  )}
                />
              </FormControl>
            </Box>
          )}
        </Box>

        {/* ================= BOTÕES ================= */}
        <Divider />
        <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 2 }}>
          <Button
            onClick={handleSubmit((data: ServiceFormData) => onSubmit(data))}
            data-action="save"
          >
            Salvar
          </Button>
        </Box>
      </Box>
    </form>
  );
};

export default ServiceForm;
