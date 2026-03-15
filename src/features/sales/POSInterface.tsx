import {
  Box,
  Paper,
  Typography,
  Grid,
  TextField,
  InputAdornment,
  Button,
  List,
  ListItem,
  ListItemText,
  IconButton,
  Divider,
  Chip,
} from "@mui/material";
import {
  Search as SearchIcon,
  Delete as DeleteIcon,
  ShoppingCart,
  PointOfSale,
} from "@mui/icons-material";
import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchProducts } from "../../api/services/products";
import { fetchClients } from "../../api/services/clients";
import { getTenantServices } from "../../api/services/tenant_services";
import CheckoutModal from "./CheckoutModal";
import type { SaleItem } from "./schemas";
import { toast } from "react-toastify";

export default function POSInterface() {
  const [searchTerm, setSearchTerm] = useState("");
  const [cart, setCart] = useState<SaleItem[]>([]);
  const [selectedClientId, setSelectedClientId] = useState<number | null>(null);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);

  // Fetch Catalogs
  const { data: products = [] } = useQuery({
    queryKey: ["products"],
    queryFn: fetchProducts,
  });

  const { data: services = [] } = useQuery({
    queryKey: ["services"],
    queryFn: getTenantServices,
  });

  const { data: clients = [] } = useQuery({
    queryKey: ["clients"],
    queryFn: fetchClients,
  });

  // Calculate cart total
  const cartTotal = cart.reduce((acc, item) => acc + item.subtotal, 0);

  // Filter items
  const filteredProducts = useMemo(() => {
    return products.filter(
      (p) =>
        p.is_active &&
        p.quantity > 0 &&
        p.name.toLowerCase().includes(searchTerm.toLowerCase()),
    );
  }, [products, searchTerm]);

  const filteredServices = useMemo(() => {
    return services.filter(
      (s) =>
        s.is_active && s.name.toLowerCase().includes(searchTerm.toLowerCase()),
    );
  }, [services, searchTerm]);

  // Handlers
  const handleAddItem = (item: any, type: "product" | "service") => {
    const price = type === "product" ? item.price : item.price_cents / 100;

    // Check if already in cart
    const existingIndex = cart.findIndex(
      (c) => c.item_id === item.id && c.item_type === type,
    );

    if (existingIndex >= 0) {
      if (type === "product" && cart[existingIndex].quantity >= item.quantity) {
        toast.warning(
          "Quantidade máxima em estoque atingida para este produto.",
        );
        return;
      }

      const newCart = [...cart];
      newCart[existingIndex].quantity += 1;
      newCart[existingIndex].subtotal =
        newCart[existingIndex].quantity * newCart[existingIndex].unit_price;
      setCart(newCart);
    } else {
      setCart([
        ...cart,
        {
          item_id: item.id,
          item_type: type,
          name: item.name,
          quantity: 1,
          unit_price: price,
          subtotal: price,
        },
      ]);
    }
  };

  const handleRemoveItem = (index: number) => {
    setCart(cart.filter((_, i) => i !== index));
  };

  const clearCart = () => {
    setCart([]);
    setSelectedClientId(null);
  };

  return (
    <Grid container spacing={2} sx={{ height: "100%" }}>
      {/* Carrinho (Esquerda) */}
      <Grid xs={12} md={4} sx={{ height: "100%" }}>
        <Paper
          elevation={3}
          sx={{
            height: "100%",
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
          }}
        >
          <Box sx={{ p: 2, bgcolor: "primary.main", color: "white" }}>
            <Typography variant="h6" display="flex" alignItems="center" gap={1}>
              <ShoppingCart /> Frente de Caixa
            </Typography>
          </Box>

          <Box sx={{ p: 2, borderBottom: 1, borderColor: "divider" }}>
            <TextField
              select
              fullWidth
              size="small"
              label="Vincular Cliente (Opcional)"
              value={selectedClientId || ""}
              onChange={(e) =>
                setSelectedClientId(
                  e.target.value ? Number(e.target.value) : null,
                )
              }
              SelectProps={{ native: true }}
            >
              <option value="">Nenhum (Venda Avulsa)</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </TextField>
          </Box>

          <List sx={{ flexGrow: 1, overflowY: "auto", p: 0 }}>
            {cart.length === 0 ? (
              <Box sx={{ p: 4, textAlign: "center", color: "text.secondary" }}>
                <Typography>Sem itens no carrinho</Typography>
                <Typography variant="body2">
                  Selecione produtos ao lado
                </Typography>
              </Box>
            ) : (
              cart.map((item, index) => (
                <Box key={`${item.item_type}-${item.item_id}-${index}`}>
                  <ListItem
                    secondaryAction={
                      <IconButton
                        edge="end"
                        color="error"
                        onClick={() => handleRemoveItem(index)}
                      >
                        <DeleteIcon />
                      </IconButton>
                    }
                  >
                    <ListItemText
                      primary={
                        <Typography variant="body2" sx={{ fontWeight: "bold" }}>
                          {item.quantity}x {item.name}
                        </Typography>
                      }
                      secondary={
                        <Typography variant="body2" color="primary">
                          R$ {item.subtotal.toFixed(2)}
                        </Typography>
                      }
                    />
                  </ListItem>
                  <Divider />
                </Box>
              ))
            )}
          </List>

          <Box
            sx={{
              p: 2,
              bgcolor: "background.default",
              borderTop: 1,
              borderColor: "divider",
            }}
          >
            <Box
              sx={{ display: "flex", justifyContent: "space-between", mb: 2 }}
            >
              <Typography variant="h6">Total:</Typography>
              <Typography
                variant="h5"
                color="primary"
                sx={{ fontWeight: "bold" }}
              >
                R$ {cartTotal.toFixed(2)}
              </Typography>
            </Box>
            <Box sx={{ display: "flex", gap: 1 }}>
              {cart.length > 0 && (
                <Button variant="outlined" color="error" onClick={clearCart}>
                  Cancelar
                </Button>
              )}
              <Button
                variant="contained"
                color="success"
                fullWidth
                size="large"
                disabled={cart.length === 0}
                startIcon={<PointOfSale />}
                onClick={() => setIsCheckoutOpen(true)}
              >
                Cobrar
              </Button>
            </Box>
          </Box>
        </Paper>
      </Grid>

      {/* Catálogo (Direita) */}
      <Grid xs={12} md={8} sx={{ height: "100%" }}>
        <Paper
          elevation={0}
          sx={{
            height: "100%",
            display: "flex",
            flexDirection: "column",
            bgcolor: "transparent",
          }}
        >
          <Box sx={{ mb: 2 }}>
            <TextField
              fullWidth
              placeholder="Buscar produtos ou serviços..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
                sx: { bgcolor: "background.paper" },
              }}
            />
          </Box>

          <Box sx={{ flexGrow: 1, overflowY: "auto" }}>
            {searchTerm &&
              filteredProducts.length === 0 &&
              filteredServices.length === 0 && (
                <Typography textAlign="center" mt={4} color="text.secondary">
                  Nenhum resultado encontrado.
                </Typography>
              )}

            {filteredProducts.length > 0 && (
              <>
                <Typography
                  variant="subtitle1"
                  sx={{ mb: 1, fontWeight: "bold" }}
                >
                  Produtos em Estoque
                </Typography>
                <Grid container spacing={2} sx={{ mb: 4 }}>
                  {filteredProducts.map((product: any) => (
                    <Grid xs={6} sm={4} md={3} key={product.id}>
                      <Paper
                        elevation={1}
                        sx={{
                          p: 2,
                          cursor: "pointer",
                          "&:hover": {
                            borderColor: "primary.main",
                            borderWidth: 2,
                            borderStyle: "solid",
                            m: "-2px",
                          },
                          height: "100%",
                          display: "flex",
                          flexDirection: "column",
                          justifyContent: "space-between",
                        }}
                        onClick={() => handleAddItem(product, "product")}
                      >
                        <Box>
                          <Typography
                            variant="body2"
                            sx={{
                              fontWeight: "bold",
                              mb: 0.5,
                              lineHeight: 1.2,
                            }}
                          >
                            {product.name}
                          </Typography>
                          <Typography
                            variant="caption"
                            color="text.secondary"
                            display="block"
                          >
                            Estoque: {product.quantity}
                          </Typography>
                        </Box>
                        <Typography
                          variant="subtitle2"
                          color="primary"
                          sx={{ mt: 1 }}
                        >
                          R$ {product.price.toFixed(2)}
                        </Typography>
                      </Paper>
                    </Grid>
                  ))}
                </Grid>
              </>
            )}

            {filteredServices.length > 0 && (
              <>
                <Typography
                  variant="subtitle1"
                  sx={{ mb: 1, fontWeight: "bold" }}
                >
                  Apenas Serviços
                </Typography>
                <Grid container spacing={2}>
                  {filteredServices.map((service: any) => (
                    <Grid xs={6} sm={4} md={3} key={service.id}>
                      <Paper
                        elevation={1}
                        sx={{
                          p: 2,
                          cursor: "pointer",
                          "&:hover": {
                            borderColor: "secondary.main",
                            borderWidth: 2,
                            borderStyle: "solid",
                            m: "-2px",
                          },
                          bgcolor: "secondary.50",
                          height: "100%",
                          display: "flex",
                          flexDirection: "column",
                          justifyContent: "space-between",
                        }}
                        onClick={() => handleAddItem(service, "service")}
                      >
                        <Box>
                          <Chip
                            label="Serviço"
                            size="small"
                            color="secondary"
                            sx={{ mb: 1, fontSize: "0.65rem", height: 20 }}
                          />
                          <Typography
                            variant="body2"
                            sx={{
                              fontWeight: "bold",
                              mb: 0.5,
                              lineHeight: 1.2,
                            }}
                          >
                            {service.name}
                          </Typography>
                        </Box>
                        <Typography
                          variant="subtitle2"
                          color="secondary.dark"
                          sx={{ mt: 1 }}
                        >
                          R$ {(service.price_cents / 100).toFixed(2)}
                        </Typography>
                      </Paper>
                    </Grid>
                  ))}
                </Grid>
              </>
            )}
          </Box>
        </Paper>
      </Grid>

      {isCheckoutOpen && (
        <CheckoutModal
          open={isCheckoutOpen}
          onClose={() => setIsCheckoutOpen(false)}
          cart={cart}
          totalAmount={cartTotal}
          clientId={selectedClientId}
          onSuccess={clearCart}
        />
      )}
    </Grid>
  );
}
