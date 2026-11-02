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
import { useEffect } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Minus, Plus } from "lucide-react";

import { Button } from "../../components/Button/Button";
import CustomTextField from "../../components/Textfield/CustomTextfield";
import { PET_SIZES, PET_SPECIES } from "../pets/constants";
import { formatBRLFromCents } from "../../utils/masks";

export const daycareModalitySchema = z.object({
  name: z
    .string()
    .min(1, "Nome é obrigatório")
    .min(2, "Nome deve ter no mínimo 2 caracteres")
    .max(120, "Nome pode ter no máximo 120 caracteres"),
  price_cents: z
    .number()
    .int("Preço deve ser inteiro")
    .min(0, "Preço não pode ser negativo"),
  is_active: z.boolean(),
  species: z.array(z.string()).nullable().optional(),
  sizes: z.array(z.string()).nullable().optional(),
  max_hours: z
    .number()
    .int("Duração deve ser um número inteiro")
    .positive("Duração deve ser maior que zero")
    .nullable()
    .optional(),
  description: z
    .string()
    .max(255, "Descrição pode ter no máximo 255 caracteres")
    .nullable()
    .optional(),
});

export type DaycareModalityFormValues = z.infer<typeof daycareModalitySchema>;

type Props = {
  defaultValues?: Partial<DaycareModalityFormValues>;
  onSubmit: (data: DaycareModalityFormValues) => void;
  isSubmitting?: boolean;
  showAdditionalInfo: boolean;
  setShowAdditionalInfo: (value: boolean) => void;
};

const DEFAULT_FORM_VALUES: DaycareModalityFormValues = {
  name: "",
  price_cents: 0,
  is_active: true,
  max_hours: null,
  species: [],
  sizes: [],
  description: "",
};

export default function DaycareServiceForm({
  defaultValues,
  onSubmit,
  isSubmitting = false,
  showAdditionalInfo,
  setShowAdditionalInfo,
}: Props) {
  const form = useForm<DaycareModalityFormValues>({
    resolver: zodResolver(daycareModalitySchema),
    defaultValues: {
      ...DEFAULT_FORM_VALUES,
      ...defaultValues,
    },
  });

  const { control, handleSubmit, reset } = form;

  useEffect(() => {
    if (defaultValues) {
      reset({
        ...DEFAULT_FORM_VALUES,
        ...defaultValues,
      });
    }
  }, [defaultValues, reset]);

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
                    placeholder="ex: Diária GG, Meio Período..."
                    inputProps={{ maxLength: 120 }}
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
                          digits === "" ? 0 : Number(digits),
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
                              (v) =>
                                String(v).trim().toLowerCase() === size.value.toLowerCase() ||
                                String(v).trim().toLowerCase() === size.label.toLowerCase(),
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
                    Tempo de duração do serviço
                  </FormLabel>
                  <Controller
                    name="max_hours"
                    control={control}
                    render={({ field, fieldState }) => (
                      <TextField
                        {...field}
                        value={field.value ?? ""}
                        size="small"
                        placeholder="0"
                        error={!!fieldState.error}
                        helperText={fieldState.error?.message}
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
                                  horas
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
                        value={field.value ?? ""}
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
            onClick={handleSubmit((data: DaycareModalityFormValues) => onSubmit(data))}
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
}
