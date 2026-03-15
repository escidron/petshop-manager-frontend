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
  IconButton,
  Divider,
  Chip,
  Tabs,
  Tab,
  Autocomplete,
  Tooltip,
  alpha,
} from "@mui/material";
import {
  Search,
  Trash2,
  ShoppingCart,
  ReceiptText,
  Tag,
  ClipboardList,
  User,
  Plus,
  Minus,
  Filter,
  LayoutGrid,
  List as ListIcon,
} from "lucide-react";
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
  const [categoryTab, setCategoryTab] = useState(0);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

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
  const handleAddItem = (
    item: {
      id: number;
      name: string;
      price_cents?: number;
      quantity?: number;
    },
    type: "product" | "service",
  ) => {
    const price = (item.price_cents || 0) / 100;

    const existingIndex = cart.findIndex(
      (c) => c.item_id === item.id && c.item_type === type,
    );

    if (existingIndex >= 0) {
      if (
        type === "product" &&
        cart[existingIndex].quantity >= (item.quantity || 0)
      ) {
        toast.warning("Quantidade máxima em estoque atingida.");
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

  const handleUpdateQuantity = (index: number, delta: number) => {
    const newCart = [...cart];
    const item = newCart[index];
    const newQuantity = item.quantity + delta;

    if (newQuantity <= 0) {
      handleRemoveItem(index);
      return;
    }

    // If product, check stock
    if (item.item_type === "product") {
      const product = products.find((p) => p.id === item.item_id);
      if (product && newQuantity > product.quantity) {
        toast.warning("Limite de estoque atingido.");
        return;
      }
    }

    item.quantity = newQuantity;
    item.subtotal = item.quantity * item.unit_price;
    setCart(newCart);
  };

  const handleRemoveItem = (index: number) => {
    setCart(cart.filter((_, i) => i !== index));
  };

  const clearCart = () => {
    setCart([]);
    setSelectedClientId(null);
  };

  const selectedClient = clients.find((c) => c.id === selectedClientId);

  return (
    <Grid container spacing={3} sx={{ height: "100%", p: 1 }}>
      {/* Sidebar: Digital Receipt */}
      <Grid size={{ xs: 12, md: 4, lg: 3.5 }} sx={{ height: "100%" }}>
        <Paper
          elevation={4}
          sx={{
            height: "100%",
            display: "flex",
            flexDirection: "column",
            borderRadius: 3,
            overflow: "hidden",
            border: "1px solid",
            borderColor: "divider",
          }}
        >
          {/* Receipt Header */}
          <Box
            sx={{
              p: 2.5,
              bgcolor: "primary.main",
              color: "white",
              textAlign: "center",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 2,
            }}
          >
            <ReceiptText size={32} />
            <Typography variant="h6" sx={{ fontWeight: 700, letterSpacing: 1 }}>
              TICKET DE VENDA
            </Typography>
          </Box>

          {/* Client Selection */}
          <Box
            sx={{ p: 2, borderBottom: "1px dashed", borderColor: "divider" }}
          >
            <Autocomplete
              options={clients}
              getOptionLabel={(option) => option.name}
              value={selectedClient || null}
              onChange={(_, newValue) =>
                setSelectedClientId(newValue?.id || null)
              }
              renderInput={(params) => (
                <TextField
                  {...params}
                  placeholder="Vincular Cliente"
                  variant="outlined"
                  size="small"
                  InputProps={{
                    ...params.InputProps,
                    startAdornment: (
                      <InputAdornment position="start">
                        <User size={20} color="gray" />
                      </InputAdornment>
                    ),
                  }}
                  sx={{
                    "& .MuiOutlinedInput-root": {
                      borderRadius: 2,
                      bgcolor: "background.paper",
                    },
                  }}
                />
              )}
            />
          </Box>

          {/* Cart Items List */}
          <Box sx={{ flexGrow: 1, overflowY: "auto", p: 1 }}>
            {cart.length === 0 ? (
              <Box
                sx={{
                  height: "100%",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  opacity: 0.3,
                  py: 8,
                }}
              >
                <ShoppingCart size={64} style={{ opacity: 0.2 }} />
                <Typography variant="body1">Carrinho Vazio</Typography>
              </Box>
            ) : (
              <List sx={{ pt: 0 }}>
                {cart.map((item, index) => (
                  <Box key={`${item.item_type}-${item.item_id}-${index}`}>
                    <ListItem
                      sx={{
                        flexDirection: "column",
                        alignItems: "stretch",
                        py: 1.5,
                        px: 1,
                      }}
                    >
                      <Box
                        sx={{
                          display: "flex",
                          justifyContent: "space-between",
                          mb: 1,
                        }}
                      >
                        <Typography
                          variant="body2"
                          sx={{ fontWeight: 700, flex: 1 }}
                        >
                          {item.name}
                        </Typography>
                        <Typography variant="body2" sx={{ fontWeight: 800 }}>
                          R$ {item.subtotal.toFixed(2)}
                        </Typography>
                      </Box>

                      <Box
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                        }}
                      >
                        <Box
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            bgcolor: "action.hover",
                            borderRadius: 1.5,
                          }}
                        >
                          <IconButton
                            size="small"
                            onClick={() => handleUpdateQuantity(index, -1)}
                          >
                            <Minus size={18} />
                          </IconButton>
                          <Typography
                            variant="body2"
                            sx={{ px: 1.5, fontWeight: 700 }}
                          >
                            {item.quantity}
                          </Typography>
                          <IconButton
                            size="small"
                            onClick={() => handleUpdateQuantity(index, 1)}
                          >
                            <Plus size={18} />
                          </IconButton>
                        </Box>

                        <Tooltip title="Remover item">
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => handleRemoveItem(index)}
                          >
                            <Trash2 size={18} />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </ListItem>
                    <Divider sx={{ borderStyle: "dashed", mx: 1 }} />
                  </Box>
                ))}
              </List>
            )}
          </Box>

          {/* Receipt Footer */}
          <Box
            sx={{
              p: 2.5,
              bgcolor: "primary.50",
              borderTop: "3px double",
              borderColor: "divider",
            }}
          >
            <Box
              sx={{ display: "flex", justifyContent: "space-between", mb: 2 }}
            >
              <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                Total:
              </Typography>
              <Typography variant="h4" color="primary" sx={{ fontWeight: 900 }}>
                R$ {cartTotal.toFixed(2)}
              </Typography>
            </Box>

            <Box sx={{ display: "flex", gap: 1.5 }}>
              <Button
                variant="outlined"
                color="inherit"
                onClick={clearCart}
                disabled={cart.length === 0}
                sx={{
                  flex: 1,
                  borderRadius: 2,
                  height: 48,
                  borderColor: "divider",
                }}
              >
                Limpar
              </Button>
              <Button
                variant="contained"
                color="success"
                fullWidth
                size="large"
                disabled={cart.length === 0}
                onClick={() => setIsCheckoutOpen(true)}
                sx={{
                  flex: 2,
                  borderRadius: 2,
                  height: 48,
                  fontWeight: 700,
                  boxShadow: "0 4px 14px 0 rgba(46, 125, 50, 0.39)",
                }}
              >
                COBRAR
              </Button>
            </Box>
          </Box>
        </Paper>
      </Grid>

      {/* Main Content: Catalog */}
      <Grid
        size={{ xs: 12, md: 8, lg: 8.5 }}
        sx={{ height: "100%", display: "flex", flexDirection: "column" }}
      >
        {/* Search & Tabs Header */}
        <Box sx={{ mb: 3 }}>
          <Grid container spacing={2} alignItems="center">
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                placeholder="Buscar (Nome, Código...)"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Search size={20} color="gray" />
                    </InputAdornment>
                  ),
                  sx: { borderRadius: 3, bgcolor: "background.paper" },
                }}
              />
            </Grid>
            <Grid
              size={{ xs: 12, sm: 6 }}
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "flex-end",
                gap: 2,
              }}
            >
              <Tabs
                value={categoryTab}
                onChange={(_, newValue) => setCategoryTab(newValue)}
                sx={{
                  "& .MuiTab-root": { color: "text.primary", fontWeight: 600 },
                  "& .Mui-selected": { color: "primary.main" },
                  "& .MuiTabs-indicator": {
                    height: 3,
                    borderRadius: "3px 3px 0 0",
                  },
                }}
                indicatorColor="primary"
              >
                <Tab label="Todos" />
                <Tab label="Produtos" />
                <Tab label="Serviços" />
              </Tabs>

              <Divider
                orientation="vertical"
                flexItem
                sx={{ mx: 0.5, height: 24, alignSelf: "center" }}
              />

              <Box
                sx={{
                  bgcolor: "background.paper",
                  borderRadius: 2,
                  p: 0.5,
                  display: "flex",
                  border: "1px solid",
                  borderColor: "divider",
                }}
              >
                <Tooltip title="Vista em Grade">
                  <IconButton
                    size="small"
                    onClick={() => setViewMode("grid")}
                    color={viewMode === "grid" ? "primary" : "inherit"}
                    sx={{
                      borderRadius: 1.5,
                      bgcolor:
                        viewMode === "grid"
                          ? alpha("#1976d2", 0.08)
                          : "transparent",
                    }}
                  >
                    <LayoutGrid size={18} />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Vista em Lista">
                  <IconButton
                    size="small"
                    onClick={() => setViewMode("list")}
                    color={viewMode === "list" ? "primary" : "inherit"}
                    sx={{
                      borderRadius: 1.5,
                      bgcolor:
                        viewMode === "list"
                          ? alpha("#1976d2", 0.08)
                          : "transparent",
                    }}
                  >
                    <ListIcon size={18} />
                  </IconButton>
                </Tooltip>
              </Box>
            </Grid>
          </Grid>
        </Box>

        {/* Catalog Grid */}
        <Box sx={{ flexGrow: 1, overflowY: "auto", pr: 0.5 }}>
          {(categoryTab === 0 || categoryTab === 1) &&
            filteredProducts.length > 0 && (
              <Box sx={{ mb: 4 }}>
                <Typography
                  variant="overline"
                  sx={{
                    fontWeight: 800,
                    color: "primary.main",
                    mb: 2,
                    display: "block",
                  }}
                >
                  Produtos em Estoque
                </Typography>
                <Grid container spacing={viewMode === "grid" ? 2 : 1}>
                  {filteredProducts.map((product) => (
                    <Grid
                      size={
                        viewMode === "grid"
                          ? { xs: 12, sm: 6, md: 4, lg: 3 }
                          : { xs: 12 }
                      }
                      key={`prod-${product.id}`}
                    >
                      {viewMode === "grid" ? (
                        <Paper
                          elevation={0}
                          onClick={() => handleAddItem(product, "product")}
                          sx={{
                            p: 2,
                            borderRadius: 3,
                            cursor: "pointer",
                            height: "100%",
                            display: "flex",
                            flexDirection: "column",
                            position: "relative",
                            transition: "all 0.2s ease-in-out",
                            border: "1px solid",
                            borderColor: "divider",
                            bgcolor: "background.paper",
                            "&:hover": {
                              borderColor: "primary.main",
                              transform: "translateY(-4px)",
                              boxShadow: "0 8px 24px rgba(0,0,0,0.06)",
                              "& .add-btn": {
                                bgcolor: "primary.main",
                                color: "white",
                              },
                            },
                          }}
                        >
                          <Box
                            sx={{
                              mb: 1.5,
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "flex-start",
                            }}
                          >
                            <Box
                              sx={{
                                width: 36,
                                height: 36,
                                borderRadius: 1.5,
                                bgcolor: alpha("#1976d2", 0.08),
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                color: "primary.main",
                              }}
                            >
                              <Tag size={18} />
                            </Box>
                            <Chip
                              label={`${product.quantity} un`}
                              size="small"
                              sx={{
                                fontSize: "0.65rem",
                                height: 20,
                                bgcolor: "action.hover",
                                fontWeight: 700,
                              }}
                            />
                          </Box>
                          <Typography
                            variant="body2"
                            sx={{
                              fontWeight: 700,
                              mb: 1,
                              color: "text.primary",
                              lineClamp: 2,
                            }}
                          >
                            {product.name}
                          </Typography>
                          <Box
                            sx={{
                              mt: "auto",
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "center",
                            }}
                          >
                            <Typography
                              variant="subtitle1"
                              sx={{ fontWeight: 800, color: "primary.main" }}
                            >
                              R${" "}
                              {(
                                (product.price_cents ||
                                  (product as any).price ||
                                  0) / 100
                              ).toFixed(2)}
                            </Typography>
                            <Box
                              className="add-btn"
                              sx={{
                                width: 28,
                                height: 28,
                                borderRadius: "50%",
                                border: "1.5px solid",
                                borderColor: "primary.main",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                transition: "all 0.2s",
                              }}
                            >
                              <Plus size={18} />
                            </Box>
                          </Box>
                        </Paper>
                      ) : (
                        <Paper
                          elevation={0}
                          onClick={() => handleAddItem(product, "product")}
                          sx={{
                            p: 1.5,
                            borderRadius: 2,
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            gap: 2,
                            transition: "all 0.2s",
                            border: "1px solid",
                            borderColor: "divider",
                            bgcolor: "background.paper",
                            "&:hover": {
                              borderColor: "primary.main",
                              bgcolor: "background.paper",
                            },
                          }}
                        >
                          <Box
                            sx={{
                              width: 32,
                              height: 32,
                              borderRadius: 1,
                              bgcolor: alpha("#1976d2", 0.08),
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              color: "primary.main",
                              flexShrink: 0,
                            }}
                          >
                            <Tag size={18} />
                          </Box>
                          <Typography
                            variant="body2"
                            sx={{ fontWeight: 700, flexGrow: 1 }}
                          >
                            {product.name}
                          </Typography>
                          <Chip
                            label={`${product.quantity} un`}
                            size="small"
                            sx={{
                              fontSize: "0.65rem",
                              height: 18,
                              fontWeight: 700,
                            }}
                          />
                          <Typography
                            variant="body2"
                            sx={{
                              fontWeight: 800,
                              color: "primary.main",
                              minWidth: 80,
                              textAlign: "right",
                            }}
                          >
                            R${" "}
                            {(
                              (product.price_cents ||
                                (product as any).price ||
                                0) / 100
                            ).toFixed(2)}
                          </Typography>
                          <IconButton size="small" color="primary">
                            <Plus size={18} />
                          </IconButton>
                        </Paper>
                      )}
                    </Grid>
                  ))}
                </Grid>
              </Box>
            )}

          {(categoryTab === 0 || categoryTab === 2) &&
            filteredServices.length > 0 && (
              <Box>
                <Typography
                  variant="overline"
                  sx={{
                    fontWeight: 800,
                    color: "primary.main",
                    mb: 2,
                    display: "block",
                  }}
                >
                  Serviços de Pet Shop
                </Typography>
                <Grid container spacing={viewMode === "grid" ? 2 : 1}>
                  {filteredServices.map((service) => (
                    <Grid
                      size={
                        viewMode === "grid"
                          ? { xs: 12, sm: 6, md: 4, lg: 3 }
                          : { xs: 12 }
                      }
                      key={`serv-${service.id}`}
                    >
                      {viewMode === "grid" ? (
                        <Paper
                          elevation={0}
                          onClick={() => handleAddItem(service, "service")}
                          sx={{
                            p: 2,
                            borderRadius: 3,
                            cursor: "pointer",
                            height: "100%",
                            display: "flex",
                            flexDirection: "column",
                            position: "relative",
                            transition: "all 0.2s ease-in-out",
                            border: "1px solid",
                            borderColor: "divider",
                            bgcolor: "background.paper",
                            "&:hover": {
                              borderColor: "primary.main",
                              transform: "translateY(-4px)",
                              boxShadow: "0 8px 24px rgba(0,0,0,0.06)",
                              "& .add-btn-s": {
                                bgcolor: "primary.main",
                                color: "white",
                              },
                            },
                          }}
                        >
                          <Box
                            sx={{
                              mb: 1.5,
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "flex-start",
                            }}
                          >
                            <Box
                              sx={{
                                width: 36,
                                height: 36,
                                borderRadius: 1.5,
                                bgcolor: alpha("#9c27b0", 0.08),
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                color: "primary.main",
                              }}
                            >
                              <ClipboardList size={18} />
                            </Box>
                            <Chip
                              label="SERVIÇO"
                              size="small"
                              color="secondary"
                              sx={{
                                fontSize: "0.6rem",
                                height: 18,
                                fontWeight: 800,
                              }}
                            />
                          </Box>
                          <Typography
                            variant="body2"
                            sx={{
                              fontWeight: 700,
                              mb: 1,
                              color: "text.primary",
                            }}
                          >
                            {service.name}
                          </Typography>
                          <Box
                            sx={{
                              mt: "auto",
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "center",
                            }}
                          >
                            <Typography
                              variant="subtitle1"
                              sx={{ fontWeight: 800, color: "primary.main" }}
                            >
                              R$ {((service.price_cents || 0) / 100).toFixed(2)}
                            </Typography>
                            <Box
                              className="add-btn-s"
                              sx={{
                                width: 28,
                                height: 28,
                                borderRadius: "50%",
                                border: "1.5px solid",
                                borderColor: "secondary.main",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                transition: "all 0.2s",
                              }}
                            >
                              <Plus size={18} />
                            </Box>
                          </Box>
                        </Paper>
                      ) : (
                        <Paper
                          elevation={0}
                          onClick={() => handleAddItem(service, "service")}
                          sx={{
                            p: 1.5,
                            borderRadius: 2,
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            gap: 2,
                            transition: "all 0.2s",
                            border: "1px solid",
                            borderColor: "divider",
                            bgcolor: "background.paper",
                            "&:hover": {
                              borderColor: "primary.main",
                              bgcolor: alpha("#1976d2", 0.02),
                            },
                          }}
                        >
                          <Box
                            sx={{
                              width: 32,
                              height: 32,
                              borderRadius: 1,
                              bgcolor: alpha("#9c27b0", 0.08),
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              color: "primary.main",
                              flexShrink: 0,
                            }}
                          >
                            <ClipboardList size={18} />
                          </Box>
                          <Typography
                            variant="body2"
                            sx={{ fontWeight: 700, flexGrow: 1 }}
                          >
                            {service.name}
                          </Typography>
                          <Typography
                            variant="body2"
                            sx={{
                              fontWeight: 800,
                              color: "primary.main",
                              minWidth: 80,
                              textAlign: "right",
                            }}
                          >
                            R$ {((service.price_cents || 0) / 100).toFixed(2)}
                          </Typography>
                          <IconButton size="small" color="primary">
                            <Plus size={18} />
                          </IconButton>
                        </Paper>
                      )}
                    </Grid>
                  ))}
                </Grid>
              </Box>
            )}

          {searchTerm &&
            filteredProducts.length === 0 &&
            filteredServices.length === 0 && (
              <Box sx={{ textAlign: "center", mt: 10 }}>
                <Filter size={64} style={{ opacity: 0.2, marginBottom: 16 }} />
                <Typography variant="h6" color="text.secondary">
                  Nenhum item encontrado
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Tente mudar sua busca ou categoria
                </Typography>
              </Box>
            )}
        </Box>
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
