import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  Typography,
  IconButton,
  MenuItem,
  Grid,
  FormControl,
  FormLabel,
  InputAdornment,
  Divider,
} from "@mui/material";
import { Add, Delete, Close } from "@mui/icons-material";
import { useForm, useFieldArray, Controller } from "react-hook-form";
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

  const {
    register,
    control,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<PackageFormData>({
    resolver: zodResolver(packageSchema),
    defaultValues: {
      name: "",
      description: "",
      price_cents: 0,
      is_active: true,
      items: [{ service_id: null, product_id: null, quantity: 1 }],
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
        is_active: editingPackage.is_active,
        items: editingPackage.items.map((item) => ({
          service_id: item.service_id,
          product_id: item.product_id,
          quantity: item.quantity,
        })),
      });
    } else {
      reset();
    }
  }, [editingPackage, reset]);

  const mutation = useMutation({
    mutationFn: (data: PackageFormData) =>
      editingPackage
        ? updatePackage(editingPackage.id, data)
        : createPackage(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["packages"] });
      onClose();
    },
  });

  const onSubmit = (data: PackageFormData) => {
    // Filter out items that have neither service nor product
    const validItems = data.items.filter(
      (item) => item.service_id || item.product_id,
    );
    if (validItems.length === 0) {
      alert(
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
        <Typography variant="h6" fontWeight="bold">
          {editingPackage ? "Editar Pacote / Combo" : "Novo Pacote / Combo"}
        </Typography>
        <IconButton onClick={onClose} size="small">
          <Close />
        </IconButton>
      </DialogTitle>
      <Divider />
      <form onSubmit={handleSubmit(onSubmit)}>
        <DialogContent sx={{ py: 3 }}>
          <Grid container spacing={3}>
            <Grid size={{ xs: 12, sm: 8 }}>
              <FormControl fullWidth>
                <FormLabel
                  sx={{ color: "text.primary", mb: 0.5, fontWeight: 500 }}
                >
                  Nome do Pacote
                </FormLabel>
                <CustomTextField
                  {...register("name")}
                  error={!!errors.name}
                  helperText={errors.name?.message}
                  placeholder="ex: Combo Banho + Tosa Pet"
                  fullWidth
                />
              </FormControl>
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <FormControl fullWidth>
                <FormLabel
                  sx={{ color: "text.primary", mb: 0.5, fontWeight: 500 }}
                >
                  Preço do Combo
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
                          field.onChange(digits === "" ? 0 : Number(digits));
                        }}
                      />
                    );
                  }}
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
                <CustomTextField
                  {...register("description")}
                  multiline
                  rows={2}
                  placeholder="Descreva o que está incluso neste pacote..."
                  fullWidth
                />
              </FormControl>
            </Grid>
          </Grid>

          <Box sx={{ mt: 4 }}>
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                mb: 2,
              }}
            >
              <Typography
                variant="subtitle1"
                sx={{ fontWeight: "bold", color: "primary.main" }}
              >
                Itens Inclusos no Pacote
              </Typography>
              <Button
                startIcon={<Add />}
                onClick={() =>
                  append({ service_id: null, product_id: null, quantity: 1 })
                }
                variant="outlined"
                size="small"
              >
                Adicionar Item
              </Button>
            </Box>

            <Divider sx={{ mb: 2 }} />

            {fields.map((field, index) => {
              const itemType =
                watch(`items.${index}.service_id`) !== null
                  ? "service"
                  : watch(`items.${index}.product_id`) !== null
                    ? "product"
                    : "service";

              return (
                <Box
                  key={field.id}
                  sx={{
                    display: "flex",
                    gap: 2,
                    alignItems: "flex-start",
                    mb: 2,
                    p: 2,
                    borderRadius: 1,
                    backgroundColor: "rgba(0,0,0,0.02)",
                    border: "1px solid rgba(0,0,0,0.05)",
                  }}
                >
                  <FormControl sx={{ minWidth: 140 }}>
                    <FormLabel sx={{ fontSize: "12px", mb: 0.5 }}>
                      Tipo
                    </FormLabel>
                    <TextField
                      select
                      value={itemType}
                      size="small"
                      onChange={(e) => {
                        const type = e.target.value;
                        if (type === "service") {
                          setValue(`items.${index}.product_id`, null);
                          setValue(`items.${index}.service_id`, null);
                        } else {
                          setValue(`items.${index}.service_id`, null);
                          setValue(`items.${index}.product_id`, null);
                        }
                      }}
                    >
                      <MenuItem value="service">Serviço</MenuItem>
                      <MenuItem value="product">Produto</MenuItem>
                    </TextField>
                  </FormControl>

                  <FormControl fullWidth>
                    <FormLabel sx={{ fontSize: "12px", mb: 0.5 }}>
                      Selecionar{" "}
                      {itemType === "service" ? "Serviço" : "Produto"}
                    </FormLabel>
                    {itemType === "service" ? (
                      <TextField
                        select
                        {...register(`items.${index}.service_id`)}
                        fullWidth
                        size="small"
                        defaultValue=""
                        error={!!errors.items?.[index]?.service_id}
                      >
                        <MenuItem value="">Selecione um serviço...</MenuItem>
                        {services.map((s) => (
                          <MenuItem key={s.id} value={s.id}>
                            {s.name}
                          </MenuItem>
                        ))}
                      </TextField>
                    ) : (
                      <TextField
                        select
                        {...register(`items.${index}.product_id`)}
                        fullWidth
                        size="small"
                        defaultValue=""
                        error={!!errors.items?.[index]?.product_id}
                      >
                        <MenuItem value="">Selecione um produto...</MenuItem>
                        {products.map((p) => (
                          <MenuItem key={p.id} value={p.id}>
                            {p.name}
                          </MenuItem>
                        ))}
                      </TextField>
                    )}
                  </FormControl>

                  <FormControl sx={{ width: 100 }}>
                    <FormLabel sx={{ fontSize: "12px", mb: 0.5 }}>
                      Qtd
                    </FormLabel>
                    <TextField
                      {...register(`items.${index}.quantity`)}
                      type="number"
                      size="small"
                    />
                  </FormControl>

                  <Box sx={{ pt: 3 }}>
                    <IconButton
                      onClick={() => remove(index)}
                      color="error"
                      size="small"
                    >
                      <Delete />
                    </IconButton>
                  </Box>
                </Box>
              );
            })}

            {errors.items?.root && (
              <Typography color="error" variant="caption">
                {errors.items.root.message}
              </Typography>
            )}
          </Box>
        </DialogContent>
        <Divider />
        <DialogActions sx={{ p: 2, gap: 1 }}>
          <Button onClick={onClose} variant="text" color="inherit">
            Cancelar
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={mutation.isPending}
            sx={{ px: 4 }}
          >
            {editingPackage ? "Atualizar" : "Salvar"}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
