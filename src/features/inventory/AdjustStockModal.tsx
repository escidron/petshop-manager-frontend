import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Grid,
  TextField,
  MenuItem,
  CircularProgress,
} from "@mui/material";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { adjustStock, fetchProducts } from "../../api/services/products";
import { toast } from "react-toastify";
import { InventoryAdjustmentSchema, type InventoryAdjustment } from "./schemas";
import { type Product } from "../products/types";

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

  const { data: products = [], isLoading: isLoadingProducts } = useQuery({
    queryKey: ["products"],
    queryFn: fetchProducts,
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
              <Grid xs={12}>
                <Controller
                  name="product_id"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      select
                      fullWidth
                      label="Produto"
                      error={!!errors.product_id}
                      helperText={errors.product_id?.message}
                      disabled={isLoadingProducts}
                    >
                      {isLoadingProducts && (
                        <MenuItem value={0} disabled>
                          <CircularProgress size={20} sx={{ mr: 2 }} />{" "}
                          Carregando...
                        </MenuItem>
                      )}
                      {!isLoadingProducts &&
                        products.map((p) => (
                          <MenuItem key={p.id} value={p.id}>
                            {p.name} (Estoque: {p.quantity})
                          </MenuItem>
                        ))}
                    </TextField>
                  )}
                />
              </Grid>
            )}

            <Grid xs={12} sm={6}>
              <Controller
                name="log_type"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    select
                    fullWidth
                    label="Tipo de Movimentação"
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

            <Grid xs={12} sm={6}>
              <Controller
                name="quantity_changed"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    type="number"
                    fullWidth
                    label="Quantidade"
                    error={!!errors.quantity_changed}
                    helperText={errors.quantity_changed?.message}
                    onChange={(e) => field.onChange(Number(e.target.value))}
                  />
                )}
              />
            </Grid>

            <Grid xs={12}>
              <Controller
                name="description"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label="Motivo / Observação"
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
          <Button onClick={onClose} disabled={adjustMutation.isPending}>
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
