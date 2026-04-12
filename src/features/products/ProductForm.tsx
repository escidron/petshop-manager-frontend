import {
  Autocomplete,
  Box,
  CircularProgress,
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
import { useEffect, useState } from "react";
import { PRODUCT_CATEGORIES } from "./constants";
import { formatBRLFromCents } from "../../utils/masks";
import { useSuppliers } from "../../hooks/useSuppliers";
import SupplierFormModal from "../suppliers/SupplierFormModal";

type Props = {
  defaultValues?: Partial<ProductFormData>;
  onSubmit: (data: ProductFormData) => void;
  isSubmitting?: boolean;
  showAdditionalInfo: boolean;
  setShowAdditionalInfo: (value: boolean) => void;
};

const ProductForm = ({
  defaultValues,
  onSubmit,
  isSubmitting = false,
  showAdditionalInfo,
  setShowAdditionalInfo,
}: Props) => {
  const { suppliers, getSuppliers } = useSuppliers();
  const [supplierModalOpen, setSupplierModalOpen] = useState(false);
  const [supplierSearch, setSupplierSearch] = useState("");

  useEffect(() => {
    getSuppliers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const formObj = useForm<ProductFormData>({
    resolver: zodResolver(productSchema) as Resolver<ProductFormData>,
    defaultValues: {
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

              <Box sx={{ display: "flex", gap: 2 }}>
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
                          onInputChange={(_, value) => setSupplierSearch(value)}
                          noOptionsText={
                            <Button size="small" onClick={() => setSupplierModalOpen(true)}>
                              Cadastrar `{supplierSearch}`
                            </Button>
                          }
                          renderInput={(params) => <TextField {...params} placeholder="Pesquisar fornecedor" />}
                        />
                      </Box>
                    )}
                  />
                </FormControl>
              </Box>

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
              
              <Box sx={{ display: "flex", gap: 2 }}>
                <FormControl fullWidth>
                  <FormLabel sx={{ color: "text.primary", mb: 0.5 }}>Código de Barras</FormLabel>
                  <Controller
                    name="barcode"
                    control={control}
                    render={({ field }) => <CustomTextField {...field} value={field.value ?? ""} placeholder="Ex: 7891020304050" />}
                  />
                </FormControl>
                <FormControl fullWidth>
                  <FormLabel sx={{ color: "text.primary", mb: 0.5 }}>NCM</FormLabel>
                  <Controller
                    name="ncm"
                    control={control}
                    render={({ field }) => <CustomTextField {...field} value={field.value ?? ""} placeholder="0000.00.00" />}
                  />
                </FormControl>
              </Box>

              <Box sx={{ display: "flex", gap: 2 }}>
                <FormControl fullWidth>
                  <FormLabel sx={{ color: "text.primary", mb: 0.5 }}>CEST</FormLabel>
                  <Controller
                    name="cest"
                    control={control}
                    render={({ field }) => <CustomTextField {...field} value={field.value ?? ""} placeholder="00.000.00" />}
                  />
                </FormControl>
                <FormControl fullWidth>
                  <FormLabel sx={{ color: "text.primary", mb: 0.5 }}>CFOP / CSOSN</FormLabel>
                  <Box sx={{ display: "flex", gap: 1 }}>
                    <Controller
                      name="cfop"
                      control={control}
                      render={({ field }) => <CustomTextField {...field} value={field.value ?? ""} placeholder="CFOP" />}
                    />
                    <Controller
                      name="csosn"
                      control={control}
                      render={({ field }) => <CustomTextField {...field} value={field.value ?? ""} placeholder="CSOSN" />}
                    />
                  </Box>
                </FormControl>
              </Box>

              <Box sx={{ display: "flex", gap: 2 }}>
                <FormControl fullWidth>
                  <FormLabel sx={{ color: "text.primary", mb: 0.5 }}>CST PIS</FormLabel>
                  <Controller
                    name="cst_pis"
                    control={control}
                    render={({ field }) => <CustomTextField {...field} value={field.value ?? ""} placeholder="Ex: 01" />}
                  />
                </FormControl>
                <FormControl fullWidth>
                  <FormLabel sx={{ color: "text.primary", mb: 0.5 }}>CST COFINS</FormLabel>
                  <Controller
                    name="cst_cofins"
                    control={control}
                    render={({ field }) => <CustomTextField {...field} value={field.value ?? ""} placeholder="Ex: 01" />}
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
          <Button
            disabled={isSubmitting}
            startIcon={isSubmitting ? <CircularProgress size={16} color="inherit" /> : undefined}
            onClick={handleSubmit(onSubmitHandler)}
          >
            Salvar
          </Button>
        </Box>
      </Box>
    </Box>
    
    <SupplierFormModal
      open={supplierModalOpen}
      initialName={supplierSearch}
      onClose={() => setSupplierModalOpen(false)}
      onSuccess={(newSupplier) => {
        getSuppliers();
        formObj.setValue("supplier_id", newSupplier.id);
      }}
    />
    </>
  );
};

export default ProductForm;
