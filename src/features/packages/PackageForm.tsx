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
} from "@mui/material";
import { Add, Delete } from "@mui/icons-material";
import { useForm, useFieldArray } from "react-hook-form";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createPackage, updatePackage } from "../../api/services/packages";
import { fetchServices } from "../../api/services/tenant_services";
import { fetchProducts } from "../../api/services/products";
import type { Package, PackageFormData } from "./types";
import { useEffect } from "react";
import type { Service } from "../tenant_services/types";
import type { Product } from "../products/types";

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

  const { register, control, handleSubmit, reset, watch, setValue } =
    useForm<PackageFormData>({
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
    data.price_cents = Number(data.price_cents);
    mutation.mutate(data);
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        {editingPackage ? "Editar Pacote" : "Novo Pacote"}
      </DialogTitle>
      <form onSubmit={handleSubmit(onSubmit)}>
        <DialogContent>
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, sm: 8 }}>
              <TextField
                {...register("name")}
                label="Nome do Pacote"
                fullWidth
                required
                variant="outlined"
                margin="normal"
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <TextField
                {...register("price_cents")}
                label="Preço do Combo (Centavos)"
                type="number"
                fullWidth
                required
                variant="outlined"
                margin="normal"
                helperText={`Equivale a R$ ${(watch("price_cents") / 100).toFixed(2)}`}
              />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <TextField
                {...register("description")}
                label="Descrição"
                fullWidth
                multiline
                rows={2}
                variant="outlined"
              />
            </Grid>
          </Grid>

          <Box sx={{ mt: 3 }}>
            <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: "bold" }}>
              Itens Inclusos
            </Typography>
            {fields.map((field, index) => (
              <Box
                key={field.id}
                sx={{ display: "flex", gap: 2, alignItems: "center", mb: 2 }}
              >
                <TextField
                  select
                  label="Tipo de Item"
                  defaultValue={field.service_id ? "service" : "product"}
                  sx={{ width: 150 }}
                  size="small"
                  onChange={(e) => {
                    const type = e.target.value;
                    if (type === "service") {
                      setValue(`items.${index}.product_id`, null);
                    } else {
                      setValue(`items.${index}.service_id`, null);
                    }
                  }}
                >
                  <MenuItem value="service">Serviço</MenuItem>
                  <MenuItem value="product">Produto</MenuItem>
                </TextField>

                {watch(`items.${index}.service_id`) !== null ||
                (!watch(`items.${index}.service_id`) &&
                  !watch(`items.${index}.product_id`)) ? (
                  <TextField
                    select
                    {...register(`items.${index}.service_id`)}
                    label="Selecionar Serviço"
                    fullWidth
                    size="small"
                    defaultValue=""
                  >
                    <MenuItem value="">Selecione...</MenuItem>
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
                    label="Selecionar Produto"
                    fullWidth
                    size="small"
                    defaultValue=""
                  >
                    <MenuItem value="">Selecione...</MenuItem>
                    {products.map((p) => (
                      <MenuItem key={p.id} value={p.id}>
                        {p.name}
                      </MenuItem>
                    ))}
                  </TextField>
                )}

                <TextField
                  {...register(`items.${index}.quantity`)}
                  label="Qtd"
                  type="number"
                  sx={{ width: 80 }}
                  size="small"
                />

                <IconButton onClick={() => remove(index)} color="error">
                  <Delete />
                </IconButton>
              </Box>
            ))}
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
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Cancelar</Button>
          <Button
            type="submit"
            variant="contained"
            disabled={mutation.isPending}
          >
            Salvar
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
