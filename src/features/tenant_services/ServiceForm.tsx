import {
  Autocomplete,
  Box,
  Chip,
  Divider,
  FormControl,
  FormControlLabel,
  FormLabel,
  InputAdornment,
  Switch,
  TextField,
  Typography,
} from "@mui/material";
import CustomTextField from "../../components/Textfield/CustomTextfield";
import { useEffect } from "react";
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
  isSubmitting?: boolean;
  showAdditionalInfo: boolean;
  setShowAdditionalInfo: (value: boolean) => void;
};

const ServiceForm = ({
  defaultValues,
  onSubmit,
  isSubmitting = false,
  showAdditionalInfo,
  setShowAdditionalInfo,
}: Props) => {
  const form = useForm<ServiceFormData>({
    resolver: zodResolver(serviceSchema),
    defaultValues: {
      name: "",
      is_active: true,
      ...defaultValues,
    },
  });

  useEffect(() => {
    if (defaultValues) {
      form.reset({
        name: "",
        is_active: true,
        ...defaultValues,
      });
    }
  }, [defaultValues, form]);

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
          sx={{
            display: "flex",
            flexDirection: { xs: "column", md: "row" },
            justifyContent: "space-between",
            gap: { xs: 3, md: 3 },
          }}
        >
          {/* ================= BÁSICO ================= */}

          <Box
            className="block-1"
            sx={{
              display: "flex",
              gap: 2,
              flexDirection: "column",
              width: { xs: "100%", md: showAdditionalInfo ? "47%" : "100%" },
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
                    inputProps={{ maxLength: 80 }}
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

            <FormControl fullWidth>
              <FormLabel sx={{ color: "text.primary", mb: 0.5 }}>
                Status do Serviço
              </FormLabel>
              <Controller
                name="is_active"
                control={control}
                render={({ field }) => (
                  <FormControlLabel
                    control={
                      <Switch
                        checked={field.value}
                        onChange={(e) => field.onChange(e.target.checked)}
                      />
                    }
                    label={field.value ? "Ativo" : "Inativo"}
                    sx={{
                      "& .MuiFormControlLabel-label": {
                        fontSize: "14px",
                        fontWeight: 600,
                        color: field.value ? "success.main" : "text.disabled",
                      },
                    }}
                  />
                )}
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

          {/* ================= Informações adicionais ================= */}
          {showAdditionalInfo && (
            <>
              <Divider sx={{ display: { xs: "block", md: "none" } }} />
              <Box
                className="block-2"
                sx={{
                  display: "flex",
                  gap: 2,
                  flexDirection: "column",
                  width: { xs: "100%", md: "48%" },
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
                  Tipo de animal (Espécies)
                </FormLabel>
                <Controller
                  name="species"
                  control={control}
                  render={({ field, fieldState }) => (
                    <Autocomplete
                      multiple
                      options={PET_SPECIES ?? []}
                      size="small"
                      value={
                        (PET_SPECIES ?? []).filter((s) =>
                          (field.value ?? []).some(
                            (v) => String(v).trim().toLowerCase() === s.value.toLowerCase(),
                          ),
                        )
                      }
                      onChange={(_, selected) =>
                        field.onChange(selected.map((s) => s.value))
                      }
                      getOptionLabel={(option) => option.label}
                      isOptionEqualToValue={(option, value) =>
                        option.value.toLowerCase() === value.value.toLowerCase()
                      }
                      renderTags={(value, getTagProps) =>
                        value.map((option, index) => {
                          const { key, ...tagProps } = getTagProps({ index });
                          return (
                            <Chip
                              key={key}
                              label={option.label}
                              size="small"
                              {...tagProps}
                            />
                          );
                        })
                      }
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          placeholder={
                            field.value && field.value.length > 0
                              ? ""
                              : "Todas as espécies (padrão)"
                          }
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
                  name="sizes"
                  control={control}
                  render={({ field, fieldState }) => (
                    <Autocomplete
                      multiple
                      options={PET_SIZES}
                      size="small"
                      value={
                        PET_SIZES.filter((size) =>
                          (field.value ?? []).some(
                            (v) => String(v).trim().toLowerCase() === size.value.toLowerCase(),
                          ),
                        )
                      }
                      isOptionEqualToValue={(option, value) =>
                        option.value.toLowerCase() === value.value.toLowerCase()
                      }
                      getOptionLabel={(option) => option.label}
                      onChange={(_, selected) =>
                        field.onChange(selected.map((s) => s.value))
                      }
                      renderTags={(value, getTagProps) =>
                        value.map((option, index) => {
                          const { key, ...tagProps } = getTagProps({ index });
                          return (
                            <Chip
                              key={key}
                              label={option.label}
                              size="small"
                              {...tagProps}
                            />
                          );
                        })
                      }
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          placeholder={
                            field.value && field.value.length > 0
                              ? ""
                              : "Todos os portes (padrão)"
                          }
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
                  Tipo de pelagem
                </FormLabel>
                <Controller
                  name="coat_types"
                  control={control}
                  render={({ field, fieldState }) => (
                    <Autocomplete
                      multiple
                      options={COAT_TYPES ?? []}
                      size="small"
                      value={
                        (COAT_TYPES ?? []).filter((type) =>
                          (field.value ?? []).some(
                            (v) => String(v).trim().toLowerCase() === type.value.toLowerCase(),
                          ),
                        )
                      }
                      isOptionEqualToValue={(option, value) =>
                        option.value.toLowerCase() === value.value.toLowerCase()
                      }
                      getOptionLabel={(option) => option.label}
                      onChange={(_, selected) =>
                        field.onChange(selected.map((t) => t.value))
                      }
                      renderTags={(value, getTagProps) =>
                        value.map((option, index) => {
                          const { key, ...tagProps } = getTagProps({ index });
                          return (
                            <Chip
                              key={key}
                              label={option.label}
                              size="small"
                              {...tagProps}
                            />
                          );
                        })
                      }
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          placeholder={
                            field.value && field.value.length > 0
                              ? ""
                              : "Todas as pelagens (padrão)"
                          }
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
                  Tempo de duração do serviço
                </FormLabel>

                <Controller
                  name="duration_minutes"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      value={field.value ?? ""}
                      size="small"
                      placeholder="0"
                      slotProps={{
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
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                        const digits = e.target.value.replace(/\D/g, "");
                        field.onChange(
                          digits === "" ? null : Number(digits)
                        );
                      }}
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
                      inputProps={{ maxLength: 255 }}
                    />
                  )}
                />
              </FormControl>
            </Box>
            </>
          )}
        </Box>

        {/* ================= BOTÕES ================= */}
        <Divider />
        <Box
          sx={{
            display: "flex",
            justifyContent: { xs: "stretch", md: "flex-end" },
            gap: 2,
            width: "100%",
            pt: 0.5,
          }}
        >
          <Button
            loading={isSubmitting}
            onClick={handleSubmit((data: ServiceFormData) => onSubmit(data))}
            data-action="save"
            sx={{
              width: { xs: "100%", md: "auto" },
              minHeight: 44,
              px: 4,
            }}
          >
            Salvar
          </Button>
        </Box>
      </Box>
    </form>
  );
};

export default ServiceForm;
