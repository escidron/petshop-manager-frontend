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
  Typography,
  IconButton,
  useTheme,
  useMediaQuery,
} from "@mui/material";
import { useForm, Controller, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { adjustStock, fetchProducts } from "../../api/services/products";
import { useToast } from "../../hooks/useToast";
import { InventoryAdjustmentSchema, type InventoryAdjustment } from "./schemas";
import { type Product } from "../products/types";
import { Button } from "../../components/Button/Button";
import { useState } from "react";
import { X } from "lucide-react";

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
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const toast = useToast();
  const queryClient = useQueryClient();
  const [productLimit, setProductLimit] = useState(20);

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
    resolver: zodResolver(InventoryAdjustmentSchema) as Resolver<InventoryAdjustment>,
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
      queryClient.invalidateQueries({ queryKey: ["pos-startup"] });
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
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      fullScreen={isMobile}
      slotProps={{
        paper: {
          sx: {
            width: { xs: "100%", sm: "500px" },
            maxWidth: { xs: "100%", sm: "500px" },
            m: { xs: 0, sm: 2 },
            borderRadius: { xs: 0, sm: 3 },
            maxHeight: { xs: "100dvh", sm: "90vh" },
            height: { xs: "100dvh", sm: "auto" },
          },
        },
      }}
    >
      <DialogTitle
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          px: { xs: 2, sm: 3 },
          py: 2,
          borderBottom: "1px solid",
          borderColor: "divider",
        }}
      >
        <Typography variant="h6" fontWeight={700}>
          Ajustar Estoque {product ? `- ${product.name}` : ""}
        </Typography>
        <IconButton size="small" onClick={onClose} sx={{ color: "text.secondary" }}>
          <X size={20} />
        </IconButton>
      </DialogTitle>
      <form onSubmit={handleSubmit(onSubmit)}>
        <DialogContent
          sx={{
            p: { xs: 2, sm: 3 },
            pb: { xs: "calc(20px + env(safe-area-inset-bottom, 0px))", sm: 3 },
          }}
        >
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
                      filterOptions={(options, state) => {
                        const input = state.inputValue.toLowerCase();
                        return options.filter((option) =>
                          option.name.toLowerCase().includes(input)
                        ).slice(0, productLimit);
                      }}
                      onInputChange={(_, __, reason) => {
                        if (reason === "input") setProductLimit(20);
                      }}
                      ListboxProps={{
                        onScroll: (event: React.SyntheticEvent) => {
                          const listboxNode = event.currentTarget;
                          if (listboxNode.scrollTop + listboxNode.clientHeight >= listboxNode.scrollHeight - 10) {
                            setProductLimit((prev) => prev + 20);
                          }
                        }
                      }}
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
                    fullWidth
                    placeholder="Quantidade"
                    inputMode="decimal"
                    error={!!errors.quantity_changed}
                    helperText={errors.quantity_changed?.message}
                    value={field.value === 0 ? "" : field.value}
                    onChange={(e) => {
                      const val = e.target.value.trim();
                      if (/^[0-9]*[.,]?[0-9]*$/.test(val) || val === "") {
                        field.onChange(val);
                      }
                    }}
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
        <DialogActions
          sx={{
            p: { xs: 2, sm: 3 },
            gap: 1.5,
            flexDirection: { xs: "column-reverse", sm: "row" },
            "& > button": {
              width: { xs: "100%", sm: "auto" },
              minHeight: 44,
              borderRadius: 2,
            },
          }}
        >
          <Button onClick={onClose} disabled={adjustMutation.isPending} variant="outlined">
            Cancelar
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={
              adjustMutation.isPending || (product ? false : !selectedProductId)
            }
            sx={{ fontWeight: 700 }}
          >
            {adjustMutation.isPending ? "Ajustando..." : "Confirmar"}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
