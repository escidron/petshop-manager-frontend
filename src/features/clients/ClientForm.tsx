import {
  Autocomplete,
  Box,
  ButtonGroup,
  CircularProgress,
  Divider,
  FormControl,
  FormLabel,
  InputAdornment,
  Skeleton,
  TextField,
  Typography,
} from "@mui/material";
import { Controller, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState } from "react";

import CustomTextField from "../../components/Textfield/CustomTextfield";
import { Button } from "../../components/Button/Button";
import { useToast } from "../../hooks/useToast";

import { Info, Minus, Plus, Search } from "lucide-react";
import theme from "../../theme";
import type { ClientFormData } from "./types";
import { clientSchema } from "./schemas";
import {
  maskBirthDate,
  maskCep,
  maskCnpj,
  maskCpf,
  maskOnlyNumbers,
  maskPhone,
} from "../../utils/masks";
import { BRAZIL_STATES } from "../../utils/countryStatesList";
import { getAddressByCep } from "../../api/services/address";

type Props = {
  open?: boolean;
  mode: "create" | "edit";
  defaultValues?: Partial<ClientFormData>;
  showAdditionalInfo: boolean;
  createPetMandatory?: boolean;
  onSubmit: (data: ClientFormData, action?: "addPet") => void;
  isSubmitting?: boolean;
  setShowAdditionalInfo: (value: boolean) => void;
};

export default function ClientForm({
  open,
  mode,
  defaultValues,
  showAdditionalInfo,
  createPetMandatory,
  onSubmit,
  isSubmitting = false,
  setShowAdditionalInfo,
}: Props) {
  const [loadingCep, setLoadingCep] = useState(false);
  const toast = useToast();
  const form = useForm<ClientFormData>({
    resolver: zodResolver(clientSchema),
    defaultValues: {
      is_active: true,
      ...defaultValues,
    },
  });

  const {
    control,
    handleSubmit,
    setValue,
    resetField,
    reset,
  } = form;
  const cepValue = useWatch({ control, name: "cep" });
  const documentType = useWatch({ control, name: "document_type" });

  const handleCepLookup = async (cep: string) => {
    try {
      setLoadingCep(true);
      const address = await getAddressByCep(cep);

      setValue("street", address.street || "");
      setValue("neighborhood", address.neighborhood || "");
      setValue("city", address.city || "");
      setValue("state", address.state || "");
    } catch {
      toast.warning("CEP não encontrado. Preencha o endereço manualmente.");
    } finally {
      setLoadingCep(false);
    }
  };

  const applyMasksOnEdit = (data?: Partial<ClientFormData>) => {
    if (!data) return data;

    return {
      ...data,
      phone: data.phone ? maskPhone(data.phone) : "",
      phone_secondary: data.phone_secondary
        ? maskPhone(data.phone_secondary)
        : "",
      phone_tertiary: data.phone_tertiary ? maskPhone(data.phone_tertiary) : "",
      cep: data.cep ? maskCep(data.cep) : "",
      document:
        data.document && data.document_type === "CPF"
          ? maskCpf(data.document)
          : data.document && data.document_type === "CNPJ"
            ? maskCnpj(data.document)
            : "",
      birth_date: data.birth_date
        ? maskBirthDate(data.birth_date) // DD/MM/YYYY
        : "",
    };
  };

  useEffect(() => {
    if (open === false || !defaultValues) return;

    reset({
      is_active: true,
      ...applyMasksOnEdit(defaultValues),
    });
  }, [open, defaultValues, reset]);

  useEffect(() => {
    const cleanCep = cepValue?.replace(/\D/g, "");

    if (cleanCep?.length !== 8) return;

    handleCepLookup(cleanCep);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cepValue]);

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
            gap: { xs: 3, md: 2.5 },
          }}
        >
          {/* ================= BÁSICO ================= */}

          <Box
            className="block-1"
            sx={{
              display: "flex",
              gap: 2,
              flexDirection: "column",
              width: { xs: "100%", md: showAdditionalInfo ? "31%" : "100%" },
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
                Nome completo do Tutor
              </FormLabel>
              <Controller
                name="name"
                control={control}
                render={({ field, fieldState }) => (
                  <CustomTextField
                    {...field}
                    error={!!fieldState.error}
                    helperText={fieldState.error?.message}
                    placeholder="ex: Pedro da Silva"
                    inputProps={{ maxLength: 80 }}
                  />
                )}
              />
            </FormControl>

            <FormControl fullWidth>
              <FormLabel sx={{ color: "text.primary", mb: 0.5 }}>
                Telefone Principal
              </FormLabel>
              <Controller
                name="phone"
                control={control}
                render={({ field, fieldState }) => (
                  <CustomTextField
                    {...field}
                    error={!!fieldState.error}
                    helperText={fieldState.error?.message}
                    placeholder="(00) 00000-0000"
                    onChange={(e) => field.onChange(maskPhone(e.target.value))}
                  />
                )}
              />
            </FormControl>

            <Box sx={{ mt: 1 }}>
              <Typography variant="overline" color="text.disabled" fontWeight={600}>
                Contatos Adicionais (Opcional)
              </Typography>
              <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5, mt: 1 }}>
                <Box sx={{ display: "flex", gap: 1.5 }}>
                  <Controller
                    name="phone_secondary"
                    control={control}
                    render={({ field }) => (
                      <CustomTextField
                        {...field}
                        placeholder="(00) 00000-0000"
                        sx={{ flex: 1.5 }}
                        onChange={(e) => field.onChange(maskPhone(e.target.value))}
                      />
                    )}
                  />
                  <Controller
                    name="phone_secondary_name"
                    control={control}
                    render={({ field }) => (
                      <CustomTextField {...field} placeholder="Nome/Tipo" sx={{ flex: 1 }} inputProps={{ maxLength: 30 }} />
                    )}
                  />
                </Box>
                <Box sx={{ display: "flex", gap: 1.5 }}>
                  <Controller
                    name="phone_tertiary"
                    control={control}
                    render={({ field }) => (
                      <CustomTextField
                        {...field}
                        placeholder="(00) 00000-0000"
                        sx={{ flex: 1.5 }}
                        onChange={(e) => field.onChange(maskPhone(e.target.value))}
                      />
                    )}
                  />
                  <Controller
                    name="phone_tertiary_name"
                    control={control}
                    render={({ field }) => (
                      <CustomTextField {...field} placeholder="Nome/Tipo" sx={{ flex: 1 }} inputProps={{ maxLength: 30 }} />
                    )}
                  />
                </Box>
              </Box>
            </Box>

            <Button
              variant="text"
              startIcon={showAdditionalInfo ? <Minus /> : <Plus />}
              onClick={() => setShowAdditionalInfo(!showAdditionalInfo)}
              sx={{ alignSelf: "center", mt: 1 }}
            >
              {showAdditionalInfo ? "Ocultar" : "Mostrar"} Cadastro Completo
            </Button>
          </Box>

          {showAdditionalInfo && (
            <Divider sx={{ display: { xs: "block", md: "none" } }} />
          )}

          {/* ================= Informacoes adicionais ================= */}
          {showAdditionalInfo && (
            <Box
              className="block-2"
              sx={{
                display: "flex",
                gap: 2,
                flexDirection: "column",
                width: { xs: "100%", md: "31%" },
              }}
            >
              <Box>
                <Typography variant="h6">Informações Adicionais</Typography>
                <Typography fontSize="12px" color="text.disabled">
                  Campos não obrigatórios
                </Typography>
              </Box>

              <FormControl>
                <FormLabel sx={{ color: "text.primary", mb: 0.5 }}>
                  E-mail
                </FormLabel>
                <Controller
                  name="email"
                  control={control}
                  render={({ field }) => (
                    <CustomTextField
                      {...field}
                      placeholder="email@exemplo.com"
                      inputProps={{ maxLength: 80 }}
                    />
                  )}
                />
              </FormControl>

              {/* Documento */}

              <FormControl>
                <FormLabel sx={{ color: "text.primary", mb: 0.5 }}>
                  Documento
                </FormLabel>
                <Box sx={{ display: "flex", gap: 2, flexDirection: "row" }}>
                  <ButtonGroup disableElevation variant="contained">
                    <Button
                      variant={
                        documentType === "CPF" ? "contained" : "outlined"
                      }
                      onClick={() => {
                        resetField("document");
                        setValue("document_type", "CPF");
                      }}
                    >
                      CPF
                    </Button>
                    <Button
                      variant={
                        documentType === "CPF" ? "outlined" : "contained"
                      }
                      onClick={() => {
                        resetField("document");
                        setValue("document_type", "CNPJ");
                      }}
                    >
                      CNPJ
                    </Button>
                  </ButtonGroup>
                  <Controller
                    name="document"
                    control={control}
                    render={({ field }) => (
                      <CustomTextField
                        {...field}
                        sx={{ width: "100%" }}
                        placeholder={
                          documentType === "CPF"
                            ? "000.000.000-00"
                            : "00.000.000/0000-00"
                        }
                        onChange={(e) =>
                          field.onChange(
                            documentType === "CPF"
                              ? maskCpf(e.target.value)
                              : maskCnpj(e.target.value),
                          )
                        }
                      />
                    )}
                  />
                </Box>
              </FormControl>
              <FormControl>
                <FormLabel sx={{ color: "text.primary", mb: 0.5 }}>
                  Data de nascimento
                </FormLabel>
                <Controller
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
              <FormControl>
                <FormLabel sx={{ color: "text.primary", mb: 0.5 }}>
                  Redes sociais
                </FormLabel>
                <Box sx={{ display: "flex", gap: 1 }}>
                  <Controller
                    name="instagram"
                    control={control}
                    render={({ field }) => (
                      <CustomTextField
                        {...field}
                        placeholder="Instagram"
                        inputProps={{ maxLength: 50 }}
                        slotProps={{
                          input: {
                            startAdornment: (
                              <InputAdornment position="start">
                                <Box
                                  component="img"
                                  src="/instagram.png"
                                  sx={{ width: 24 }}
                                />
                              </InputAdornment>
                            ),
                          },
                        }}
                      />
                    )}
                  />
                  <Controller
                    name="facebook"
                    control={control}
                    render={({ field }) => (
                      <CustomTextField
                        {...field}
                        placeholder="Facebook"
                        inputProps={{ maxLength: 50 }}
                        slotProps={{
                          input: {
                            startAdornment: (
                              <InputAdornment position="start">
                                <Box
                                  component="img"
                                  src="/facebook.png"
                                  sx={{ width: 24 }}
                                />
                              </InputAdornment>
                            ),
                          },
                        }}
                      />
                    )}
                  />
                </Box>
              </FormControl>
            </Box>
          )}

          {showAdditionalInfo && (
            <Divider sx={{ display: { xs: "block", md: "none" } }} />
          )}

          {/* ================= Endereco ================= */}
          {showAdditionalInfo && (
            <Box
              className="block-3"
              sx={{
                display: "flex",
                gap: 2,
                flexDirection: "column",
                width: { xs: "100%", md: "31%" },
              }}
            >
              <Box>
                <Typography variant="h6">Endereço</Typography>
                <Typography fontSize="12px" color="text.disabled">
                  Campos não obrigatórios
                </Typography>
              </Box>

              {/* ================= EXTRA ================= */}
              <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                {/* CEP + Endereço */}
                <Box sx={{ display: "flex", gap: 1.5 }}>
                  <FormControl sx={{ width: "48%", minWidth: "125px" }}>
                    <FormLabel sx={{ color: "text.primary", mb: 0.5 }}>
                      CEP
                    </FormLabel>
                    <Controller
                      name="cep"
                      control={control}
                      render={({ field }) => (
                        <CustomTextField
                          {...field}
                          placeholder="00000-000"
                          iconPosition="start"
                          icon={
                            loadingCep ? (
                              <CircularProgress size={16} />
                            ) : (
                              <Search size={16} />
                            )
                          }
                          slotProps={{
                            input: {
                              sx: {
                                "& .MuiInputAdornment-root": { mr: 0.5 },
                                "& input": { pr: 1, fontSize: "0.85rem" },
                              },
                            },
                          }}
                          onBlur={() => handleCepLookup(field.value || "")}
                          onChange={(e) =>
                            field.onChange(maskCep(e.target.value))
                          }
                        />
                      )}
                    />
                  </FormControl>

                  <FormControl sx={{ width: "52%", flex: 1 }}>
                    <FormLabel sx={{ color: "text.primary", mb: 0.5 }}>
                      Logradouro
                    </FormLabel>
                    {loadingCep ? (
                      <Skeleton variant="rectangular" height={40} />
                    ) : (
                      <Controller
                        name="street"
                        control={control}
                        render={({ field }) => <CustomTextField {...field} inputProps={{ maxLength: 100 }} />}
                      />
                    )}
                  </FormControl>
                </Box>

                {/* Numero + Complemento */}
                <Box sx={{ display: "flex", gap: 2 }}>
                  <FormControl sx={{ width: "40%" }}>
                    <FormLabel sx={{ color: "text.primary", mb: 0.5 }}>
                      Número
                    </FormLabel>
                    <Controller
                      name="number"
                      control={control}
                      render={({ field }) => (
                        <CustomTextField
                          {...field}
                          placeholder="Ex: 123"
                          inputProps={{ maxLength: 10 }}
                          onChange={(e) =>
                            field.onChange(maskOnlyNumbers(e.target.value))
                          }
                        />
                      )}
                    />
                  </FormControl>

                  <FormControl sx={{ width: "60%" }}>
                    <FormLabel sx={{ color: "text.primary", mb: 0.5 }}>
                      Complemento
                    </FormLabel>
                    <Controller
                      name="complement"
                      control={control}
                      render={({ field }) => <CustomTextField {...field} inputProps={{ maxLength: 50 }} />}
                    />
                  </FormControl>
                </Box>
                <Box
                  sx={{
                    display: "flex",
                    gap: 2,
                    justifyContent: "space-between",
                  }}
                >
                  <FormControl sx={{ width: "40%" }}>
                    <FormLabel sx={{ color: "text.primary", mb: 0.5 }}>
                      Bairro
                    </FormLabel>
                    {loadingCep ? (
                      <Skeleton variant="rectangular" height={40} />
                    ) : (
                      <Controller
                        name="neighborhood"
                        control={control}
                        render={({ field }) => (
                          <CustomTextField {...field} placeholder="" inputProps={{ maxLength: 50 }} />
                        )}
                      />
                    )}
                  </FormControl>
                  <FormControl sx={{ width: "60%" }}>
                    <FormLabel sx={{ color: "text.primary", mb: 0.5 }}>
                      Cidade
                    </FormLabel>
                    {loadingCep ? (
                      <Skeleton variant="rectangular" height={40} />
                    ) : (
                      <Controller
                        name="city"
                        control={control}
                        render={({ field }) => (
                          <CustomTextField {...field} placeholder="" inputProps={{ maxLength: 50 }} />
                        )}
                      />
                    )}
                  </FormControl>
                </Box>
                <FormControl sx={{ width: "100%" }}>
                  <FormLabel sx={{ color: "text.primary", mb: 0.5 }}>
                    UF
                  </FormLabel>
                  {loadingCep ? (
                    <Skeleton variant="rectangular" height={40} />
                  ) : (
                    <Controller
                      name="state"
                      control={control}
                      render={({ field }) => (
                        <Autocomplete
                          options={BRAZIL_STATES}
                          size="small"
                          getOptionLabel={(option) =>
                            `${option.name} (${option.uf})`
                          }
                          isOptionEqualToValue={(opt, val) => opt.uf === val.uf}
                          value={
                            BRAZIL_STATES.find((s) => s.uf === field.value) ||
                            null
                          }
                          onChange={(_, value) =>
                            field.onChange(value?.uf ?? "")
                          }
                          renderInput={(params) => (
                            <TextField {...params} sx={{ fontSize: "12px" }} />
                          )}
                        />
                      )}
                    />
                  )}
                </FormControl>
                <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
                  <Info size={16} color={theme.palette.text.disabled} />
                  <Typography fontSize="13px" color="text.disabled">
                    O endereço ajuda no transporte do pet, quando necessário.
                  </Typography>
                </Box>
              </Box>
            </Box>
          )}
        </Box>

        {/* ================= BOTÕES ================= */}
        <Divider />
        <Box
          sx={{
            display: "flex",
            flexDirection: { xs: "column-reverse", sm: "row" },
            justifyContent: "flex-end",
            gap: 1.5,
            pt: 0.5,
          }}
        >
          {!createPetMandatory && (
            <Button
              variant="outlined"
              disabled={isSubmitting}
              startIcon={isSubmitting ? <CircularProgress size={16} color="inherit" /> : undefined}
              onClick={handleSubmit((data: ClientFormData) => onSubmit(data))}
              data-action="save"
              sx={{ width: { xs: "100%", sm: "auto" }, minHeight: 44, borderRadius: 2 }}
            >
              Salvar
            </Button>
          )}

          {mode === "create" && (
            <Button
              disabled={isSubmitting}
              startIcon={isSubmitting ? <CircularProgress size={16} color="inherit" /> : undefined}
              onClick={handleSubmit((data: ClientFormData) =>
                onSubmit(data, "addPet"),
              )}
              data-action="addPet"
              sx={{ width: { xs: "100%", sm: "auto" }, minHeight: 44, borderRadius: 2, fontWeight: 700 }}
            >
              Salvar e cadastrar pet
            </Button>
          )}
        </Box>
      </Box>
    </form>
  );
}
