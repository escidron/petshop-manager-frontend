import {
  Autocomplete,
  Box,
  Checkbox,
  Divider,
  FormControl,
  FormControlLabel,
  FormLabel,
  TextField,
  Typography,
} from "@mui/material";
import CustomTextField from "../../components/Textfield/CustomTextfield";
import type { PetFormData } from "./types";
import { petSchema } from "./schemas";
import { Controller, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState } from "react";
import { maskBirthDate } from "../../utils/masks";
import { Button } from "../../components/Button/Button";
import type { Client } from "../clients/types";
import { Minus, Plus } from "lucide-react";
import {
  AGE_UNIT_OPTIONS,
  CAT_BREEDS,
  COAT_COLORS,
  COAT_TYPES,
  DOG_BREEDS,
  PET_GENDERS,
  PET_SIZES,
  PET_SPECIES,
} from "./constants";

type Props = {
  open?: boolean;
  defaultValues?: Partial<PetFormData>;
  onSubmit: (data: PetFormData) => void;
  isSubmitting?: boolean;
  showAdditionalInfo: boolean;
  setShowAdditionalInfo: (value: boolean) => void;
  clients?: Client[];
  selectedClient?: Client;
};

const PetForm = ({
  open,
  defaultValues,
  onSubmit,
  isSubmitting = false,
  showAdditionalInfo,
  setShowAdditionalInfo,
  clients,
  selectedClient,
}: Props) => {
  const form = useForm<PetFormData>({
    resolver: zodResolver(petSchema),
    defaultValues: {
      is_active: true,
      ...defaultValues,
    },
  });

  const {
    control,
    handleSubmit,
    reset,
    setValue,
  } = form;
  const species = useWatch({ control, name: "species" });
  const [showAgeField, setShowAgeField] = useState(false);

  const applyMasksOnEdit = (data?: Partial<PetFormData>) => {
    if (!data) return data;
    return {
      ...data,
      birth_date: data.birth_date ? maskBirthDate(data.birth_date) : "",
    };
  };

  useEffect(() => {
    if (open === false || !defaultValues) return;
    if(defaultValues.age && defaultValues.age_unit) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setShowAgeField(true)
    }
    reset({
      is_active: true,
      ...applyMasksOnEdit(defaultValues),
    });
  }, [open, defaultValues, reset, selectedClient]);

  useEffect(() => {
    if (selectedClient) {
      form.setValue("client_id", selectedClient.id);
    }
  }, [form, selectedClient]);

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
            <FormControl fullWidth>
              <FormLabel sx={{ color: "text.primary", mb: 0.5 }}>
                Tutor
              </FormLabel>
              <Controller
                name="client_id"
                control={control}
                render={({ field, fieldState }) => (
                  <Autocomplete<Client>
                    disabled={selectedClient !== undefined}
                    options={clients ?? []}
                    noOptionsText="Nenhum cliente cadastrado"
                    size="small"
                    value={
                      selectedClient ??
                      clients?.find((c) => c.id === field.value) ??
                      null
                    }
                    getOptionLabel={(option) => option.name}
                    isOptionEqualToValue={(option, value) =>
                      option.id === value.id
                    }
                    onChange={(_, value) => field.onChange(value?.id)}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        placeholder="Pesquisar cliente"
                        error={!!fieldState.error}
                        helperText={fieldState.error?.message}
                      />
                    )}
                  />
                )}
              />
            </FormControl>

            <FormControl fullWidth sx={{ color: "text.primary" }}>
              <FormLabel sx={{ color: "text.primary", mb: 0.5 }}>
                Nome do pet
              </FormLabel>
              <Controller
                name="name"
                control={control}
                render={({ field, fieldState }) => (
                  <CustomTextField
                    {...field}
                    error={!!fieldState.error}
                    helperText={fieldState.error?.message}
                    placeholder="ex: Thor"
                    inputProps={{ maxLength: 50 }}
                  />
                )}
              />
            </FormControl>
            <FormControl fullWidth>
              <FormLabel sx={{ color: "text.primary", mb: 0.5 }}>
                Espécie
              </FormLabel>
              <Controller
                name="species"
                control={control}
                render={({ field, fieldState }) => (
                  <Autocomplete
                    options={PET_SPECIES ?? []}
                    size="small"
                    value={
                      PET_SPECIES?.find((s) => s.value === field.value) ?? null
                    }
                    onChange={(_, value) => field.onChange(value?.value ?? "")}
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
              <Box sx={{ display: "flex", gap: 2 }}>
                <FormControl fullWidth>
                  <FormLabel sx={{ color: "text.primary", mb: 0.5 }}>
                    Raça
                  </FormLabel>
                  <Controller
                    name="breed"
                    control={control}
                    render={({ field }) => {
                      const isCanine = species === "Canino";
                      const isFeline = species === "Felino";

                      const options = isCanine
                        ? DOG_BREEDS
                        : isFeline
                          ? CAT_BREEDS
                          : ["SRD"];

                      return (
                        <Autocomplete<string>
                          options={options}
                          value={field.value || null}
                          disabled={!species}
                          size="small"
                          onChange={(_, value) => field.onChange(value ?? "")}
                          renderInput={(params) => (
                            <TextField
                              {...params}
                              placeholder={
                                !species
                                  ? "Selecione a espécie primeiro"
                                  : isCanine || isFeline
                                    ? "Pesquisar raça"
                                    : "Raça indefinida"
                              }
                            />
                          )}
                        />
                      );
                    }}
                  />
                </FormControl>
                <FormControl fullWidth>
                  <FormLabel sx={{ color: "text.primary", mb: 0.5 }}>
                    Porte
                  </FormLabel>
                  <Controller
                    name="size"
                    control={control}
                    render={({ field }) => (
                      <Autocomplete
                        options={PET_SIZES}
                        size="small"
                        value={
                          PET_SIZES.find(
                            (size) => size.value === field.value,
                          ) ?? null
                        }
                        isOptionEqualToValue={(option, value) =>
                          option.value === value.value
                        }
                        getOptionLabel={(option) => option.label}
                        onChange={(_, value) =>
                          field.onChange(value?.value ?? "")
                        }
                        renderInput={(params) => (
                          <TextField
                            {...params}
                            placeholder="Selecionar Porte"
                          />
                        )}
                      />
                    )}
                  />
                </FormControl>
              </Box>

              <Box sx={{ display: "flex", gap: 2 }}>
                <FormControl fullWidth>
                  <FormLabel sx={{ color: "text.primary", mb: 0.5 }}>
                    Cor da pelagem
                  </FormLabel>
                  <Controller
                    name="coat_color"
                    control={control}
                    render={({ field }) => (
                      <Autocomplete
                        options={COAT_COLORS ?? []}
                        size="small"
                        value={
                          COAT_COLORS?.find((color) => color === field.value) ??
                          null
                        }
                        onChange={(_, value) => field.onChange(value ?? "")}
                        renderInput={(params) => (
                          <TextField {...params} placeholder="Pesquisar Cor" />
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
                    render={({ field }) => (
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
                        onChange={(_, value) =>
                          field.onChange(value?.value ?? "")
                        }
                        renderInput={(params) => (
                          <TextField {...params} placeholder="Pesquisar Tipo" />
                        )}
                      />
                    )}
                  />
                </FormControl>
              </Box>

              <Box sx={{ display: "flex", gap: 2 }}>
                <FormControl fullWidth>
                  <FormLabel sx={{ color: "text.primary", mb: 0.5 }}>
                    Gênero
                  </FormLabel>

                  <Controller
                    name="gender"
                    control={control}
                    render={({ field, fieldState }) => (
                      <Autocomplete
                        options={PET_GENDERS}
                        size="small"
                        value={
                          PET_GENDERS.find((g) => g.value === field.value) ??
                          null
                        }
                        isOptionEqualToValue={(option, value) =>
                          option.value === value.value
                        }
                        getOptionLabel={(option) => option.label}
                        onChange={(_, value) => field.onChange(value?.value)}
                        renderInput={(params) => (
                          <TextField
                            {...params}
                            placeholder="Selecionar gênero"
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
                    Castrado?
                  </FormLabel>

                  <Controller
                    name="is_neutered"
                    control={control}
                    render={({ field }) => (
                      <Autocomplete
                        options={[
                          { value: true, label: "Sim" },
                          { value: false, label: "Não" },
                        ]}
                        size="small"
                        value={
                          field.value === true
                            ? { value: true, label: "Sim" }
                            : field.value === false
                              ? { value: false, label: "Não" }
                              : null
                        }
                        isOptionEqualToValue={(option, value) =>
                          option.value === value.value
                        }
                        getOptionLabel={(option) => option.label}
                        onChange={(_, value) => field.onChange(value ? value.value : null)}
                        renderInput={(params) => (
                          <TextField
                            {...params}
                            placeholder="Selecionar..."
                          />
                        )}
                      />
                    )}
                  />
                </FormControl>
              </Box>

              <Box sx={{ display: "flex", gap: 2 }}>
                <Box sx={{ width: "50%" }}>
                  <FormControl fullWidth>
                    <FormLabel sx={{ color: "text.primary", mb: 0.5 }}>
                      Data de nascimento
                    </FormLabel>
                    <Controller
                      disabled={showAgeField}
                      name="birth_date"
                      control={control}
                      render={({ field }) => (
                        <CustomTextField
                          {...field}
                          placeholder="DD/MM/AAAA"
                          onChange={(e) =>
                            field.onChange(maskBirthDate(e.target.value))
                          }
                        />
                      )}
                    />
                  </FormControl>

                  <Box sx={{ display: "flex", alignItems: "center" }}>
                    <FormControlLabel
                      sx={{
                        "& .MuiFormControlLabel-label": {
                          fontSize: "12px",
                          color: "text.disabled",
                        },
                      }}
                      control={
                        <Checkbox
                          disableRipple
                          sx={{ color: "primary.main" }}
                          checked={showAgeField}
                          onChange={(e) => {
                            const checked = e.target.checked;
                            setShowAgeField(checked);

                            if (checked) {
                              setValue("birth_date", "");
                            }
                          }}
                        />
                      }
                      label="Não sabe a data de nascimento?"
                    />
                  </Box>
                </Box>
              </Box>

              {showAgeField && (
                <Box sx={{ display: "flex", gap: 2 }}>
                  {/* Idade */}
                  <FormControl fullWidth>
                    <FormLabel sx={{ color: "text.primary", mb: 0.5 }}>
                      Idade aproximada
                    </FormLabel>
                    <Box sx={{ display: "flex", gap: 1, width: "50%" }}>
                      <Controller
                        name="age"
                        control={control}
                        render={({ field }) => (
                          <TextField
                            {...field}
                            size="small"
                            type="number"
                            sx={{ width: "35%" }}
                            placeholder="Ex: 3"
                            slotProps={{
                              htmlInput: {
                                min: 0,
                              },
                            }}
                            onChange={(
                              e: React.ChangeEvent<HTMLInputElement>,
                            ) => field.onChange(e.currentTarget.valueAsNumber)}
                          />
                        )}
                      />
                      <Controller
                        name="age_unit"
                        control={control}
                        render={({ field }) => (
                          <Autocomplete
                            size="small"
                            options={AGE_UNIT_OPTIONS}
                            value={
                              AGE_UNIT_OPTIONS.find(
                                (option) => option.value === field.value,
                              ) ?? null
                            }
                            isOptionEqualToValue={(option, value) =>
                              option.value === value.value
                            }
                            getOptionLabel={(option) => option.label}
                            onChange={(_, option) =>
                              field.onChange(option?.value ?? null)
                            }
                            sx={{ width: "65%" }}
                            renderInput={(params) => (
                              <TextField
                                {...params}
                                placeholder="Ex: dias, anos"
                              />
                            )}
                          />
                        )}
                      />
                    </Box>
                  </FormControl>

                  {/* Unidade
                  <FormControl fullWidth>
                    <FormLabel sx={{ color: "text.primary", mb: 0.5 }}>
                      Unidade
                    </FormLabel>

                    <Controller
                      name="age_unit"
                      control={control}
                      render={({ field }) => (
                        <Autocomplete
                          size="small"
                          options={AGE_UNIT_OPTIONS}
                          value={
                            AGE_UNIT_OPTIONS.find(
                              (option) => option.value === field.value,
                            ) ?? null
                          }
                          isOptionEqualToValue={(option, value) =>
                            option.value === value.value
                          }
                          getOptionLabel={(option) => option.label}
                          onChange={(_, option) =>
                            field.onChange(option?.value ?? null)
                          }
                          renderInput={(params) => (
                            <TextField
                              {...params}
                              placeholder="Ex: meses, dias, anos"
                            />
                          )}
                        />
                      )}
                    />
                  </FormControl> */}
                </Box>
              )}
              <FormControl fullWidth>
                <FormLabel sx={{ color: "text.primary", mb: 0.5 }}>
                  Observações
                </FormLabel>

                <Controller
                  name="notes"
                  control={control}
                  render={({ field }) => (
                    <CustomTextField
                      {...field}
                      multiline
                      rows={4}
                      placeholder="ex: Adicionais, comportamento, alergias, etc."
                      inputProps={{ maxLength: 1000 }}
                    />
                  )}
                />
              </FormControl>
            </Box>
          )}

          {/* ================= Endereco =================
          {showAdditionalInfo && (
            <Box
              className="block-3"
              sx={{
                display: "flex",
                gap: 2,
                flexDirection: "column",
                width: "30%",
              }}
            >
              <Box>
                <Typography variant="h6">Endereço</Typography>
                <Typography fontSize="12px" color="text.disabled">
                  Campos não obrigatórios
                </Typography>
              </Box>
              <FormControl>
                <FormLabel sx={{ color: "text.primary", mb: 0.5 }}>
                  E-mail
                </FormLabel>
                <Controller
                  name="notes"
                  control={control}
                  render={({ field }) => <CustomTextField {...field} />}
                />
              </FormControl>
            </Box>
          )} */}
        </Box>

        {/* ================= BOTÕES ================= */}
        <Divider />
        <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 2 }}>
          <Button
            loading={isSubmitting}
            onClick={handleSubmit((data: PetFormData) => onSubmit(data))}
            data-action="save"
          >
            Salvar
          </Button>
        </Box>
      </Box>
    </form>
  );
};

export default PetForm;
