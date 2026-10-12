import {
  Autocomplete,
  Box,
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
import type { ProductFormData } from "./types";
import { Controller, useForm } from "react-hook-form";
import type { Resolver, SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "../../components/Button/Button";
import { Minus, Plus } from "lucide-react";
import { productSchema } from "./schemas";
import { useEffect } from "react";
import { PRODUCT_CATEGORIES, PRODUCT_UNITS } from "./constants";
import { formatBRLFromCents } from "../../utils/masks";
import { useSuppliers } from "../../hooks/useSuppliers";
import ProductPhotoUploader from "./ProductPhotoUploader";
import type { ProductPhoto } from "./types";

type Props = {
  defaultValues?: Partial<ProductFormData>;
  onSubmit: (data: ProductFormData) => void;
  isSubmitting?: boolean;
  showAdditionalInfo: boolean;
  setShowAdditionalInfo: (value: boolean) => void;
  productId?: number;
  existingPhotos?: ProductPhoto[];
  onExistingPhotosChange?: (photos: ProductPhoto[]) => void;
  pendingFiles?: File[];
  onPendingFilesChange?: (files: File[]) => void;
};

const ProductForm = ({
  defaultValues,
  onSubmit,
  isSubmitting = false,
  showAdditionalInfo,
  setShowAdditionalInfo,
  productId,
  existingPhotos = [],
  onExistingPhotosChange = () => {},
  pendingFiles = [],
  onPendingFilesChange = () => {},
}: Props) => {
  const { suppliers, getSuppliers } = useSuppliers();

  useEffect(() => {
    getSuppliers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const formObj = useForm<ProductFormData>({
    resolver: zodResolver(productSchema) as Resolver<ProductFormData>,
    defaultValues: {
      is_active: true,
      is_internal_use: false,
      ncm: "",
      barcode: "",
      quantity: "" as any,
      min_stock: "" as any,
      ...defaultValues,
    },
  });

  const { control, handleSubmit, reset } = formObj;

  const onSubmitHandler: SubmitHandler<ProductFormData> = (data) => {
    onSubmit(data);
  };

  useEffect(() => {
    if (defaultValues) {
      reset(defaultValues);
    }
  }, [defaultValues, reset]);

  return (
    <>
    <Box component="form" width="100%">
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
              width: { xs: "100%", md: showAdditionalInfo ? "48%" : "100%" },
            }}
          >
            <Box>
              <Typography variant="h6">Cadastro Básico</Typography>
              <Typography fontSize="12px" color="text.disabled">
                Campos obrigatórios
              </Typography>
            </Box>

            <ProductPhotoUploader
              productId={productId}
              existingPhotos={existingPhotos}
              onExistingPhotosChange={onExistingPhotosChange}
              pendingFiles={pendingFiles}
              onPendingFilesChange={onPendingFilesChange}
              disabled={isSubmitting}
            />

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
                    inputProps={{ maxLength: 80 }}
                  />
                )}
              />
            </FormControl>

            <Box sx={{ display: "flex", flexDirection: { xs: "column", sm: "row" }, gap: 2 }}>
              <FormControl fullWidth>
                <FormLabel sx={{ color: "text.primary", mb: 0.5 }}>
                  Preço de Venda
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
                  Unidade de Medida
                </FormLabel>
                <Controller
                  name="unit"
                  control={control}
                  render={({ field }) => (
                    <Autocomplete
                      options={PRODUCT_UNITS}
                      size="small"
                      value={
                        PRODUCT_UNITS.find((u) => u.value === field.value) ||
                        PRODUCT_UNITS.find((u) => u.value === "UN") ||
                        null
                      }
                      isOptionEqualToValue={(option, value) => option.value === value.value}
                      getOptionLabel={(option) => option.label}
                      onChange={(_, value) => field.onChange(value?.value || "UN")}
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          placeholder="Selecionar unidade"
                        />
                      )}
                    />
                  )}
                />
              </FormControl>
            </Box>

            <Box sx={{ display: "flex", flexDirection: { xs: "column", sm: "row" }, gap: 2 }}>
              <FormControl fullWidth>
                <FormLabel sx={{ color: "text.primary", mb: 0.5 }}>
                  Quantidade em Estoque
                </FormLabel>
                <Controller
                  name="quantity"
                  control={control}
                  render={({ field, fieldState }) => (
                    <TextField
                      {...field}
                      size="small"
                      error={!!fieldState.error}
                      helperText={fieldState.error?.message}
                      placeholder="0"
                      inputMode="decimal"
                      onChange={(e) => {
                        const val = e.target.value.trim();
                        if (/^[0-9]*[.,]?[0-9]*$/.test(val) || val === "") {
                          field.onChange(val);
                        }
                      }}
                      value={field.value ?? ""}
                    />
                  )}
                />
              </FormControl>

              <FormControl fullWidth>
                <FormLabel sx={{ color: "text.primary", mb: 0.5 }}>
                  Estoque Mínimo
                </FormLabel>
                <Controller
                  name="min_stock"
                  control={control}
                  render={({ field, fieldState }) => (
                    <TextField
                      {...field}
                      size="small"
                      error={!!fieldState.error}
                      helperText={fieldState.error?.message}
                      placeholder="0"
                      inputMode="decimal"
                      onChange={(e) => {
                        const val = e.target.value.trim();
                        if (/^[0-9]*[.,]?[0-9]*$/.test(val) || val === "") {
                          field.onChange(val);
                        }
                      }}
                      value={field.value ?? ""}
                    />
                  )}
                />
              </FormControl>
            </Box>

            <Box sx={{ display: "flex", flexDirection: { xs: "column", sm: "row" }, gap: 2 }}>
              <FormControl fullWidth>
                <FormLabel sx={{ color: "text.primary", mb: 0.5 }}>
                  Status do Produto
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

              <FormControl fullWidth>
                <FormLabel sx={{ color: "text.primary", mb: 0.5 }}>
                  Uso Interno
                </FormLabel>
                <Controller
                  name="is_internal_use"
                  control={control}
                  render={({ field }) => (
                    <FormControlLabel
                      control={
                        <Switch
                          checked={field.value}
                          onChange={(e) => field.onChange(e.target.checked)}
                        />
                      }
                      label={field.value ? "Sim (Oculto no PDV)" : "Não"}
                      sx={{
                        "& .MuiFormControlLabel-label": {
                          fontSize: "14px",
                          fontWeight: 600,
                          color: field.value ? "primary.main" : "text.disabled",
                        },
                      }}
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

          {showAdditionalInfo && (
            <Divider sx={{ display: { xs: "block", md: "none" } }} />
          )}

          {/* ================= ADICIONAL ================= */}
          {showAdditionalInfo && (
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

              <Box sx={{ display: "flex", flexDirection: { xs: "column", sm: "row" }, gap: 2 }}>
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
                
                <FormControl fullWidth>
                  <FormLabel sx={{ color: "text.primary", mb: 0.5 }}>Fornecedor</FormLabel>
                  <Controller
                    name="supplier_id"
                    control={control}
                    render={({ field }) => (
                      <Box sx={{ display: "flex", gap: 1 }}>
                        <Autocomplete
                          options={suppliers}
                          sx={{ flex: 1 }}
                          size="small"
                          getOptionLabel={(option) => option.name}
                          isOptionEqualToValue={(o, v) => o.id === v.id}
                          value={suppliers.find((s) => s.id === field.value) || null}
                          onChange={(_, value) => field.onChange(value?.id ?? null)}
                          noOptionsText="Nenhum fornecedor encontrado"
                          renderInput={(params) => <TextField {...params} placeholder="Pesquisar fornecedor" />}
                        />
                      </Box>
                    )}
                  />
                </FormControl>
              </Box>

              <Box sx={{ display: "flex", flexDirection: { xs: "column", sm: "row" }, gap: 2 }}>
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
                      <CustomTextField {...field} placeholder="ex: RAC-001" inputProps={{ maxLength: 50 }} />
                    )}
                  />
                </FormControl>
              </Box>
              
              <Box sx={{ display: "flex", flexDirection: { xs: "column", sm: "row" }, gap: 2 }}>
                <FormControl fullWidth>
                  <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                    <FormLabel sx={{ color: "text.primary", mb: 0.5 }}>Código de Barras</FormLabel>
                    <Typography 
                      variant="caption" 
                      color="primary" 
                      sx={{ cursor: "pointer", "&:hover": { textDecoration: "underline" } }}
                      onClick={() => formObj.setValue("barcode", "SEM GTIN", { shouldValidate: true })}
                    >
                      Não possui?
                    </Typography>
                  </Box>
                  <Controller
                    name="barcode"
                    control={control}
                    render={({ field, fieldState }) => <CustomTextField {...field} value={field.value ?? ""} placeholder="Ex: 7891020304050" inputProps={{ maxLength: 100 }} error={!!fieldState.error} helperText={fieldState.error?.message} />}
                  />
                </FormControl>
                <FormControl fullWidth>
                  <FormLabel sx={{ color: "text.primary", mb: 0.5 }}>NCM</FormLabel>
                  <Controller
                    name="ncm"
                    control={control}
                    render={({ field, fieldState }) => <CustomTextField {...field} value={field.value ?? ""} placeholder="00000000" inputProps={{ maxLength: 8 }} error={!!fieldState.error} helperText={fieldState.error?.message} />}
                  />
                </FormControl>
              </Box>
              <Box sx={{ display: "flex", flexDirection: { xs: "column", sm: "row" }, gap: 2 }}>
                <FormControl fullWidth>
                  <FormLabel sx={{ color: "text.primary", mb: 0.5 }}>CEST</FormLabel>
                  <Controller
                    name="cest"
                    control={control}
                    render={({ field }) => <CustomTextField {...field} value={field.value ?? ""} placeholder="00.000.00" inputProps={{ maxLength: 20 }} />}
                  />
                </FormControl>
                <FormControl fullWidth>
                  <FormLabel sx={{ color: "text.primary", mb: 0.5 }}>CFOP / CSOSN</FormLabel>
                  <Box sx={{ display: "flex", gap: 1 }}>
                    <Controller
                      name="cfop"
                      control={control}
                      render={({ field }) => <CustomTextField {...field} value={field.value ?? ""} placeholder="CFOP" inputProps={{ maxLength: 20 }} />}
                    />
                    <Controller
                      name="csosn"
                      control={control}
                      render={({ field }) => <CustomTextField {...field} value={field.value ?? ""} placeholder="CSOSN" inputProps={{ maxLength: 20 }} />}
                    />
                  </Box>
                </FormControl>
              </Box>

              <Box sx={{ display: "flex", flexDirection: { xs: "column", sm: "row" }, gap: 2 }}>
                <FormControl fullWidth>
                  <FormLabel sx={{ color: "text.primary", mb: 0.5 }}>CST PIS</FormLabel>
                  <Controller
                    name="cst_pis"
                    control={control}
                    render={({ field }) => <CustomTextField {...field} value={field.value ?? ""} placeholder="Ex: 01" inputProps={{ maxLength: 20 }} />}
                  />
                </FormControl>
                <FormControl fullWidth>
                  <FormLabel sx={{ color: "text.primary", mb: 0.5 }}>CST COFINS</FormLabel>
                  <Controller
                    name="cst_cofins"
                    control={control}
                    render={({ field }) => <CustomTextField {...field} value={field.value ?? ""} placeholder="Ex: 01" inputProps={{ maxLength: 20 }} />}
                  />
                </FormControl>
              </Box>

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
                      inputProps={{ maxLength: 500 }}
                    />
                  )}
                />
              </FormControl>
            </Box>
          )}
        </Box>

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
          <Button
            loading={isSubmitting}
            onClick={handleSubmit(onSubmitHandler)}
            sx={{
              width: { xs: "100%", sm: "auto" },
              minHeight: 44,
              borderRadius: 2,
              fontWeight: 700,
            }}
          >
            Salvar
          </Button>
        </Box>
      </Box>
    </Box>
    </>
  );
};

export default ProductForm;
