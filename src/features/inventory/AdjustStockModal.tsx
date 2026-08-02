import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  TextField,
  MenuItem,
  CircularProgress,
  Autocomplete,
} from "@mui/material";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { adjustStock, fetchProducts } from "../../api/services/products";
import { toast } from "react-toastify";
import { InventoryAdjustmentSchema, type InventoryAdjustment } from "./schemas";
import { type Product } from "../products/types";
import { Button } from "../../components/Button/Button";

type AdjustStockModalProps = {
  open: boolean;
  onClose: () => void;
  product?: Product | null;
};

export default function AdjustStockModal({
  open,
  onClose,
  product,
}: AdjustStockModalProps) {
  const queryClient = useQueryClient();

  const { data: products = [], isLoading: isLoadingProducts } = useQuery<Product[]>({
    queryKey: ["products"],
    queryFn: () => fetchProducts(),
  });

  const {
    control,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<InventoryAdjustment>({
    resolver: zodResolver(InventoryAdjustmentSchema),
    defaultValues: {
      product_id: product?.id || 0,
      log_type: "adjustment",
      quantity_changed: 1,
      description: "",
    },
  });

  const selectedProductId = watch("product_id");

  const adjustMutation = useMutation({
    mutationFn: async (data: InventoryAdjustment) => {
      // The old products API used quantityChange logic.
      // If we are passing IN, it's positive. If OUT, it's negative.
      const change =
        data.log_type === "out"
          ? -data.quantity_changed
          : data.quantity_changed;
      return adjustStock(data.product_id, change, data.description || "");
    },
    onSuccess: () => {
      toast.success("Estoque ajustado com sucesso!");
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["inventory_logs"] });
      reset();
      onClose();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || "Erro ao ajustar o estoque.");
    },
  });

  const onSubmit = (data: InventoryAdjustment) => {
    adjustMutation.mutate(data);
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        Ajustar Estoque {product ? `- ${product.name}` : ""}
      </DialogTitle>
      <form onSubmit={handleSubmit(onSubmit)}>
        <DialogContent dividers>
          <Grid container spacing={2}>
            {!product && (
              <Grid size={{ xs: 12 }}>
                <Controller
                  name="product_id"
                  control={control}
                  render={({ field: { onChange, value, ...field } }) => (
                    <Autocomplete
                      {...field}
                      size="small"
                      options={products}
                      getOptionLabel={(option) =>
                        `${option.name} (Estoque: ${option.quantity})`
                      }
                      value={products.find((p) => p.id === value) || null}
                      onChange={(_, newValue) => {
                        onChange(newValue ? newValue.id : 0);
                      }}
                      disabled={isLoadingProducts}
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          placeholder="Selecione um produto"
                          error={!!errors.product_id}
                          helperText={errors.product_id?.message}
                          InputProps={{
                            ...params.InputProps,
                            endAdornment: (
                              <>
                                {isLoadingProducts ? (
                                  <CircularProgress color="inherit" size={20} />
                                ) : null}
                                {params.InputProps.endAdornment}
                              </>
                            ),
                          }}
                        />
                      )}
                    />
                  )}
                />
              </Grid>
            )}

            <Grid size={{ xs: 12, sm: 6 }}>
              <Controller
                name="log_type"
                control={control}
                render={({ field }) => (
                  <TextField
                    size="small"
                    {...field}
                    select
                    fullWidth
                    error={!!errors.log_type}
                    helperText={errors.log_type?.message}
                  >
                    <MenuItem value="in">Entrada (+)</MenuItem>
                    <MenuItem value="out">Saída (-)</MenuItem>
                    <MenuItem value="adjustment">Ajuste de Balanço</MenuItem>
                  </TextField>
                )}
              />
            </Grid>

            <Grid size={{ xs: 12, sm: 6 }}>
              <Controller
                name="quantity_changed"
                control={control}
                render={({ field }) => (
                  <TextField
                    size="small"
                    type="number"
                    fullWidth
                    placeholder="Quantidade"
                    error={!!errors.quantity_changed}
                    helperText={errors.quantity_changed?.message}
                    value={field.value === 0 ? "" : field.value}
                    onChange={(e) =>
                      field.onChange(
                        e.target.value === "" ? 0 : Number(e.target.value),
                      )
                    }
                    onBlur={field.onBlur}
                    name={field.name}
                    ref={field.ref}
                  />
                )}
              />
            </Grid>

            <Grid size={{ xs: 12 }}>
              <Controller
                name="description"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    placeholder="Motivo / Observação"
                    multiline
                    rows={2}
                    error={!!errors.description}
                    helperText={errors.description?.message}
                  />
                )}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose} disabled={adjustMutation.isPending} variant="text">
            Cancelar
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={
              adjustMutation.isPending || (product ? false : !selectedProductId)
            }
          >
            {adjustMutation.isPending ? "Ajustando..." : "Confirmar"}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
