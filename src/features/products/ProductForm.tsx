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
import type { ProductFormData } from "./types";
import { Controller, useForm } from "react-hook-form";
import type { Resolver, SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "../../components/Button/Button";
import { Minus, Plus } from "lucide-react";
import { productSchema } from "./schemas";
import { useEffect } from "react";
import { PRODUCT_CATEGORIES } from "./constants";
import { formatBRLFromCents } from "../../utils/masks";

type Props = {
  defaultValues?: Partial<ProductFormData>;
  onSubmit: (data: ProductFormData) => void;
  showAdditionalInfo: boolean;
  setShowAdditionalInfo: (value: boolean) => void;
};

const ProductForm = ({
  defaultValues,
  onSubmit,
  showAdditionalInfo,
  setShowAdditionalInfo,
}: Props) => {
  const form = useForm<ProductFormData>({
    resolver: zodResolver(productSchema) as Resolver<ProductFormData>,
    defaultValues: {
      ...defaultValues,
    },
  });

  const { control, handleSubmit, reset } = form;

  const onSubmitHandler: SubmitHandler<ProductFormData> = (data) => {
    onSubmit(data);
  };

  useEffect(() => {
    if (defaultValues) {
      reset(defaultValues);
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
                Nome
              </FormLabel>
              <Controller
                name="name"
                control={control}
                render={({ field, fieldState }) => (
                  <CustomTextField
                    {...field}
                    error={!!fieldState.error}
                    helperText={fieldState.error?.message}
                    placeholder="ex: Ração Premium 10kg"
                  />
                )}
              />
            </FormControl>

            <Box sx={{ display: "flex", gap: 2 }}>
              <FormControl fullWidth>
                <FormLabel sx={{ color: "text.primary", mb: 0.5 }}>
                  Preço
                </FormLabel>
                <Controller
                  name="price_cents"
                  control={control}
                  render={({ field, fieldState }) => (
                    <TextField
                      {...field}
                      size="small"
                      error={!!fieldState.error}
                      helperText={fieldState.error?.message}
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
                        field.onChange(digits === "" ? "" : Number(digits));
                      }}
                      value={
                        (field.value as any) !== "" && field.value !== undefined
                          ? formatBRLFromCents(Number(field.value))
                          : ""
                      }
                    />
                  )}
                />
              </FormControl>

              <FormControl fullWidth>
                <FormLabel sx={{ color: "text.primary", mb: 0.5 }}>
                  Estoque Mínimo.
                </FormLabel>
                <Controller
                  name="min_stock"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      type="number"
                      size="small"
                      placeholder="0"
                      onChange={(e) => {
                        const val = e.target.value;
                        field.onChange(val === "" ? "" : Number(val));
                      }}
                      value={field.value ?? ""}
                    />
                  )}
                />
              </FormControl>
            </Box>

            <Button
              variant="text"
              startIcon={showAdditionalInfo ? <Minus /> : <Plus />}
              onClick={() => setShowAdditionalInfo(!showAdditionalInfo)}
            >
              {showAdditionalInfo ? "Ocultar" : "Mostrar"} Cadastro Completo
            </Button>
          </Box>

          {/* ================= ADICIONAL ================= */}
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
                  Categoria
                </FormLabel>
                <Controller
                  name="category"
                  control={control}
                  render={({ field }) => (
                    <Autocomplete
                      options={PRODUCT_CATEGORIES}
                      size="small"
                      value={field.value || null}
                      onChange={(_, value) => field.onChange(value || "")}
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          placeholder="Selecionar categoria"
                        />
                      )}
                    />
                  )}
                />
              </FormControl>

              <Box sx={{ display: "flex", gap: 2 }}>
                <FormControl fullWidth>
                  <FormLabel sx={{ color: "text.primary", mb: 0.5 }}>
                    Custo
                  </FormLabel>
                  <Controller
                    name="cost_cents"
                    control={control}
                    render={({ field }) => (
                      <TextField
                        {...field}
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
                          field.onChange(digits === "" ? "" : Number(digits));
                        }}
                        value={
                          (field.value as any) !== "" &&
                          field.value !== undefined
                            ? formatBRLFromCents(Number(field.value))
                            : ""
                        }
                      />
                    )}
                  />
                </FormControl>

                <FormControl fullWidth>
                  <FormLabel sx={{ color: "text.primary", mb: 0.5 }}>
                    SKU / Código
                  </FormLabel>
                  <Controller
                    name="sku"
                    control={control}
                    render={({ field }) => (
                      <CustomTextField {...field} placeholder="ex: RAC-001" />
                    )}
                  />
                </FormControl>
              </Box>

              <FormControl fullWidth>
                <FormLabel sx={{ color: "text.primary", mb: 0.5 }}>
                  Quantidade em Estoque
                </FormLabel>
                <Controller
                  name="quantity"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      type="number"
                      size="small"
                      placeholder="0"
                      onChange={(e) => {
                        const val = e.target.value;
                        field.onChange(val === "" ? "" : Number(val));
                      }}
                      value={field.value ?? ""}
                    />
                  )}
                />
              </FormControl>

              <FormControl fullWidth>
                <FormLabel sx={{ color: "text.primary", mb: 0.5 }}>
                  Descrição
                </FormLabel>
                <Controller
                  name="description"
                  control={control}
                  render={({ field }) => (
                    <CustomTextField
                      {...field}
                      multiline
                      rows={4}
                      placeholder="Detalhes do produto..."
                    />
                  )}
                />
              </FormControl>
            </Box>
          )}
        </Box>

        <Divider />
        <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 2 }}>
          <Button onClick={handleSubmit(onSubmitHandler)}>Salvar</Button>
        </Box>
      </Box>
    </form>
  );
};

export default ProductForm;
