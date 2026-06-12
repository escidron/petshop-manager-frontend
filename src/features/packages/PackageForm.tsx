import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Box,
  Typography,
  IconButton,
  MenuItem,
  Grid,
  FormControl,
  FormLabel,
  FormControlLabel,
  Switch,
  InputAdornment,
  Divider,
  Autocomplete,
  Chip,
  Stack,
} from "@mui/material";
import { getCoatTypeLabel } from "../../utils/formatCoatType";
import { formatPrice } from "../../utils/formatServiceLabel";
import type { CoatType } from "../pets/types";
import { Plus, X, Trash2 } from "lucide-react";
import { useForm, useFieldArray, Controller, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createPackage, updatePackage } from "../../api/services/packages";
import { fetchServices } from "../../api/services/tenant_services";
import { fetchProducts } from "../../api/services/products";
import type { Package } from "./types";
import { useEffect } from "react";
import type { Service } from "../tenant_services/types";
import type { Product } from "../products/types";
import { packageSchema, type PackageFormData } from "./schemas";
import { formatBRLFromCents } from "../../utils/masks";
import CustomTextField from "../../components/Textfield/CustomTextfield";
import { useToast } from "../../hooks/useToast";
import { Button } from "../../components/Button/Button";

interface PackageFormProps {
  open: boolean;
  onClose: () => void;
  editingPackage?: Package | null;
}

export default function PackageForm({
  open,
  onClose,
  editingPackage,
}: PackageFormProps) {
  const queryClient = useQueryClient();
  const toast = useToast();

  const {
    control,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<PackageFormData>({
    resolver: zodResolver(packageSchema) as Resolver<PackageFormData>,
    defaultValues: {
      name: "",
      description: "",
      price_cents: 0,
      validity_days: null,
      is_active: true,
      items: [
        { type: "service", service_id: null, product_id: null, quantity: 1 },
      ],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "items",
  });

  const { data: services = [] } = useQuery<Service[]>({
    queryKey: ["services"],
    queryFn: fetchServices,
  });
  const { data: products = [] } = useQuery<Product[]>({
    queryKey: ["products"],
    queryFn: fetchProducts,
  });

  useEffect(() => {
    if (editingPackage) {
      reset({
        name: editingPackage.name,
        description: editingPackage.description,
        price_cents: editingPackage.price_cents,
        validity_days: editingPackage.validity_days,
        is_active: editingPackage.is_active,
        items: editingPackage.items.map((item) => ({
          type: (item.service_id ? "service" : "product") as
            | "service"
            | "product",
          service_id: item.service_id,
          product_id: item.product_id,
          quantity: item.quantity,
        })),
      });
    } else if (open) {
      reset({
        name: "",
        description: "",
        price_cents: 0,
        validity_days: null,
        is_active: true,
        items: [
          { type: "service", service_id: null, product_id: null, quantity: 1 },
        ],
      });
    }
  }, [editingPackage, reset, open]);

  const mutation = useMutation({
    mutationFn: (data: PackageFormData) =>
      editingPackage
        ? updatePackage(editingPackage.id, data)
        : createPackage(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["packages"] });
      toast.success(
        editingPackage
          ? "Pacote atualizado com sucesso!"
          : "Pacote criado com sucesso!",
      );
      onClose();
    },
    onError: (error: { response?: { data?: { detail?: string } } }) => {
      const message =
        error.response?.data?.detail || "Erro ao salvar o pacote.";
      toast.error(message);
    },
  });

  const onSubmit = (data: PackageFormData) => {
    const validItems = data.items.filter(
      (item) =>
        (item.type === "service" && item.service_id) ||
        (item.type === "product" && item.product_id),
    );
    if (validItems.length === 0) {
      toast.warning(
        "Adicione pelo menos um item válido (serviço ou produto) ao pacote.",
      );
      return;
    }
    mutation.mutate({ ...data, items: validItems });
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <Typography variant="h6" fontWeight="bold" color="text.primary">
          {editingPackage ? "Editar Pacote / Combo" : "Novo Pacote / Combo"}
        </Typography>
        <IconButton onClick={onClose} size="small">
          <X />
        </IconButton>
      </DialogTitle>
      <Divider />
      <form onSubmit={handleSubmit(onSubmit)}>
        <DialogContent sx={{ py: 3 }}>
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, sm: 8 }}>
              <FormControl fullWidth>
                <FormLabel
                  sx={{ color: "text.primary", mb: 0.5, fontWeight: 500 }}
                >
                  Nome do Pacote *
                </FormLabel>
                <Controller
                  name="name"
                  control={control}
                  render={({ field }) => (
                    <CustomTextField
                      {...field}
                      error={!!errors.name}
                      helperText={errors.name?.message}
                      placeholder="ex: Combo Banho + Tosa Pet"
                      fullWidth
                    />
                  )}
                />
              </FormControl>
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <FormControl fullWidth>
                <FormLabel
                  sx={{ color: "text.primary", mb: 0.5, fontWeight: 500 }}
                >
                  Preço do Combo *
                </FormLabel>
                <Controller
                  name="price_cents"
                  control={control}
                  render={({ field, fieldState }) => {
                    const formattedValue = field.value
                      ? formatBRLFromCents(field.value)
                      : "";

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
            </Grid>

            <Grid size={{ xs: 12, sm: 4 }}>
              <FormControl fullWidth>
                <FormLabel
                  sx={{ color: "text.primary", mb: 0.5, fontWeight: 500 }}
                >
                  Validade (dias)
                </FormLabel>
                <Controller
                  name="validity_days"
                  control={control}
                  render={({ field, fieldState }) => (
                    <TextField
                      {...field}
                      value={field.value ?? ""}
                      type="number"
                      error={!!fieldState.error}
                      helperText={
                        fieldState.error?.message ||
                        "Deixe vazio para validade infinita"
                      }
                      slotProps={{
                        formHelperText: {
                          sx: {
                            color: fieldState.error
                              ? "error.main"
                              : "text.primary",
                          },
                        },
                      }}
                      size="small"
                      placeholder="ex: 30"
                      fullWidth
                    />
                  )}
                />
              </FormControl>
            </Grid>

            {/* Status do Pacote */}
            <Grid size={{ xs: 12, sm: 4 }}>
              <FormControl fullWidth>
                <FormLabel
                  sx={{ color: "text.primary", mb: 0.5, fontWeight: 500 }}
                >
                  Status do Pacote
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
            </Grid>
            <Grid size={{ xs: 12 }}>
              <FormControl fullWidth>
                <FormLabel
                  sx={{ color: "text.primary", mb: 0.5, fontWeight: 500 }}
                >
                  Descrição
                </FormLabel>
                <Controller
                  name="description"
                  control={control}
                  render={({ field }) => (
                    <CustomTextField
                      {...field}
                      multiline
                      rows={2}
                      placeholder="Descreva o que está incluso neste pacote..."
                      fullWidth
                    />
                  )}
                />
              </FormControl>
            </Grid>
          </Grid>

          <Box sx={{ mt: 3 }}>
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                mb: 1.5,
              }}
            >
              <Typography
                variant="subtitle2"
                sx={{
                  fontWeight: "bold",
                  color: "text.primary",
                  textTransform: "uppercase",
                  letterSpacing: "0.5px",
                }}
              >
                Itens Inclusos
              </Typography>
              <Button
                startIcon={<Plus size={18} />}
                onClick={() =>
                  append({
                    type: "service",
                    service_id: null,
                    product_id: null,
                    quantity: 1,
                  })
                }
                variant="text"
                size="small"
                sx={{ fontWeight: "bold" }}
              >
                Adicionar Item
              </Button>
            </Box>

            <Divider sx={{ mb: 1.5 }} />

            {fields.map((field, index) => (
              <Box
                key={field.id}
                sx={{
                  display: "flex",
                  gap: 1.5,
                  alignItems: "flex-end",
                  mb: 1.5,
                  p: 1.5,
                  borderRadius: 1.5,
                  backgroundColor: "grey.50", // Standard light background
                  border: "1px solid",
                  borderColor: "divider",
                }}
              >
                <FormControl sx={{ minWidth: 120 }}>
                  <FormLabel
                    sx={{
                      fontSize: "12px",
                      mb: 0.5,
                      fontWeight: 600,
                      color: "text.primary",
                    }}
                  >
                    Tipo
                  </FormLabel>
                  <Controller
                    name={`items.${index}.type`}
                    control={control}
                    render={({ field: typeField }) => (
                      <TextField
                        select
                        {...typeField}
                        size="small"
                        onChange={(e) => {
                          const newType = e.target.value as
                            | "service"
                            | "product";
                          typeField.onChange(newType);
                          setValue(`items.${index}.service_id`, null);
                          setValue(`items.${index}.product_id`, null);
                        }}
                      >
                        <MenuItem value="service">Serviço</MenuItem>
                        <MenuItem value="product">Produto</MenuItem>
                      </TextField>
                    )}
                  />
                </FormControl>

                <Controller
                  name={`items.${index}.type`}
                  control={control}
                  render={({ field: typeField }) => (
                    <FormControl fullWidth>
                      <FormLabel
                        sx={{
                          fontSize: "12px",
                          mb: 0.5,
                          fontWeight: 600,
                          color: "text.primary",
                        }}
                      >
                        {typeField.value === "service" ? "Serviço" : "Produto"}
                      </FormLabel>
                      {typeField.value === "service" ? (
                        <Controller
                          name={`items.${index}.service_id`}
                          control={control}
                          render={({ field: serviceField }) => (
                            <Autocomplete
                              options={services}
                              size="small"
                              value={
                                services.find(
                                  (s) => s.id === serviceField.value,
                                ) || null
                              }
                              onChange={(_, val) =>
                                serviceField.onChange(val?.id || null)
                              }
                              getOptionLabel={(option) => {
                                const details = [];
                                if (option.species) details.push(option.species);
                                if (option.size) details.push(option.size);
                                if (option.coat_type)
                                  details.push(
                                    getCoatTypeLabel(
                                      option.coat_type as CoatType,
                                    ) || option.coat_type,
                                  );
                                return details.length > 0
                                  ? `${option.name} (${details.join(", ")})`
                                  : option.name;
                              }}
                              isOptionEqualToValue={(option, value) =>
                                option.id === value.id
                              }
                              renderOption={(props, option) => (
                                <Box
                                  component="li"
                                  {...props}
                                  key={option.id}
                                  sx={{
                                    py: 1,
                                    px: 2,
                                    borderBottom: "1px solid",
                                    borderColor: "divider",
                                    "&:last-child": { borderBottom: 0 },
                                  }}
                                >
                                  <Box
                                    sx={{
                                      display: "flex",
                                      justifyContent: "space-between",
                                      alignItems: "flex-start",
                                      width: "100%",
                                    }}
                                  >
                                    <Box
                                      sx={{
                                        display: "flex",
                                        flexDirection: "column",
                                        gap: 0.5,
                                      }}
                                    >
                                      <Typography
                                        variant="body2"
                                        fontWeight="700"
                                        color="primary.main"
                                      >
                                        {option.name}
                                      </Typography>
                                      <Stack
                                        direction="row"
                                        spacing={0.5}
                                        flexWrap="wrap"
                                        useFlexGap
                                      >
                                        {option.species && (
                                          <Chip
                                            label={option.species}
                                            size="small"
                                            variant="outlined"
                                            sx={{
                                              fontSize: "11px",
                                              height: "22px",
                                            }}
                                          />
                                        )}
                                        {option.size && (
                                          <Chip
                                            label={option.size}
                                            size="small"
                                            color="secondary"
                                            sx={{
                                              fontSize: "11px",
                                              height: "22px",
                                              fontWeight: 600,
                                            }}
                                          />
                                        )}
                                        {option.coat_type && (
                                          <Chip
                                            label={`Pelagem: ${
                                              getCoatTypeLabel(
                                                option.coat_type as CoatType,
                                              ) || option.coat_type
                                            }`}
                                            size="small"
                                            variant="outlined"
                                            sx={{
                                              fontSize: "11px",
                                              height: "22px",
                                            }}
                                          />
                                        )}
                                        {!option.species &&
                                          !option.size &&
                                          !option.coat_type && (
                                            <Typography
                                              variant="caption"
                                              color="text.disabled"
                                            >
                                              Geral
                                            </Typography>
                                          )}
                                      </Stack>
                                    </Box>
                                    <Typography
                                      variant="subtitle2"
                                      fontWeight="bold"
                                      sx={{ color: "success.main", mt: 0.5 }}
                                    >
                                      {formatPrice(option.price_cents)}
                                    </Typography>
                                  </Box>
                                </Box>
                              )}
                              renderInput={(params) => (
                                <TextField
                                  {...params}
                                  placeholder="Pesquisar serviço..."
                                  error={!!errors.items?.[index]?.service_id || !!errors.items?.[index]?.quantity}
                                  helperText={
                                    errors.items?.[index]?.service_id?.message ||
                                    errors.items?.[index]?.quantity?.message
                                  }
                                  sx={{ backgroundColor: "#fff" }}
                                />
                              )}
                            />
                          )}
                        />
                      ) : (
                        <Controller
                          name={`items.${index}.product_id`}
                          control={control}
                          render={({ field: productField }) => (
                            <Autocomplete
                              options={products}
                              size="small"
                              value={
                                products.find(
                                  (p) => p.id === productField.value,
                                ) || null
                              }
                              onChange={(_, val) =>
                                productField.onChange(val?.id || null)
                              }
                              getOptionLabel={(option) => option.name}
                              isOptionEqualToValue={(option, value) =>
                                option.id === value.id
                              }
                              renderOption={(props, option) => (
                                <Box
                                  component="li"
                                  {...props}
                                  key={option.id}
                                  sx={{
                                    py: 1,
                                    px: 2,
                                    borderBottom: "1px solid",
                                    borderColor: "divider",
                                    "&:last-child": { borderBottom: 0 },
                                  }}
                                >
                                  <Box
                                    sx={{
                                      display: "flex",
                                      justifyContent: "space-between",
                                      alignItems: "flex-start",
                                      width: "100%",
                                    }}
                                  >
                                    <Box
                                      sx={{
                                        display: "flex",
                                        flexDirection: "column",
                                        gap: 0.5,
                                      }}
                                    >
                                      <Typography
                                        variant="body2"
                                        fontWeight="700"
                                        color="primary.main"
                                      >
                                        {option.name}
                                      </Typography>
                                    </Box>
                                    <Typography
                                      variant="subtitle2"
                                      fontWeight="bold"
                                      sx={{ color: "success.main", mt: 0.5 }}
                                    >
                                      {formatPrice(option.price_cents)}
                                    </Typography>
                                  </Box>
                                </Box>
                              )}
                              renderInput={(params) => (
                                <TextField
                                  {...params}
                                  placeholder="Pesquisar produto..."
                                  error={!!errors.items?.[index]?.product_id || !!errors.items?.[index]?.quantity}
                                  helperText={
                                    errors.items?.[index]?.product_id?.message ||
                                    errors.items?.[index]?.quantity?.message
                                  }
                                  sx={{ backgroundColor: "#fff" }}
                                />
                              )}
                            />
                          )}
                        />
                      )}
                    </FormControl>
                  )}
                />

                <FormControl sx={{ width: 100 }}>
                  <FormLabel
                    sx={{
                      fontSize: "12px",
                      mb: 0.5,
                      fontWeight: 600,
                      color: "text.primary",
                    }}
                  >
                    Qtd
                  </FormLabel>
                  <Controller
                    name={`items.${index}.quantity`}
                    control={control}
                    render={({ field, fieldState }) => (
                      <TextField
                        {...field}
                        type="number"
                        size="small"
                        error={!!fieldState.error}
                        sx={{
                          backgroundColor: "#fff",
                          "& input::-webkit-outer-spin-button, & input::-webkit-inner-spin-button":
                            {
                              display: "block",
                              opacity: 1,
                            },
                        }}
                      />
                    )}
                  />
                </FormControl>

                <Box>
                  <IconButton
                    onClick={() => remove(index)}
                    color="error"
                    size="small"
                    sx={{ mb: 0.5 }}
                  >
                    <Trash2 size={16} />
                  </IconButton>
                </Box>
              </Box>
            ))}

            {errors.items?.root && (
              <Typography
                color="error"
                variant="caption"
                sx={{ display: "block", mt: 1 }}
              >
                {errors.items.root.message}
              </Typography>
            )}
          </Box>
        </DialogContent>
        <Divider />
        <DialogActions sx={{ p: 2, gap: 1 }}>
          <Button onClick={onClose} variant="text">
            Cancelar
          </Button>
          <Button
            type="submit"
            variant="contained"
            loading={mutation.isPending}
            sx={{ px: 4 }}
          >
            {editingPackage ? "Atualizar" : "Salvar"}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
