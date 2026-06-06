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
  Dialog,
  DialogTitle,
  DialogContent,
  Alert,
  Collapse,
  Skeleton,
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
  Dog,
  X,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { useState, useMemo, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchProducts } from "../../api/services/products";
import { fetchClients } from "../../api/services/clients";
import { getTenantServices } from "../../api/services/tenant_services";
import { listPackages } from "../../api/services/packages";
import { fetchPetsByClient } from "../../api/services/pets";
import CheckoutModal from "./CheckoutModal";
import PullAppointmentDialog from "./PullAppointmentDialog";
import type { SaleItem } from "./schemas";
import { toast } from "react-toastify";
import type { Appointment } from "../appointments/types";
import type { Pet } from "../pets/types";
import { getCoatTypeLabel } from "../../utils/formatCoatType";
import type { CoatType } from "../pets/types";
import type { ClientPackage } from "../client_packages/types";

const POSSkeleton = ({ viewMode }: { viewMode: "grid" | "list" }) => (
  <Grid container spacing={2}>
    {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
      <Grid
        size={
          viewMode === "grid" ? { xs: 6, sm: 6, md: 6, lg: 4, xl: 3 } : { xs: 12 }
        }
        key={i}
      >
        <Paper
          elevation={0}
          sx={{
            p: 2,
            borderRadius: 3,
            border: "1px solid",
            borderColor: "divider",
            height: viewMode === "grid" ? 160 : 64,
            display: "flex",
            flexDirection: viewMode === "grid" ? "column" : "row",
            gap: 1,
          }}
        >
          <Skeleton
            variant="rectangular"
            width={viewMode === "grid" ? 40 : 32}
            height={viewMode === "grid" ? 40 : 32}
            sx={{ borderRadius: 1.5 }}
          />
          <Box sx={{ flex: 1, overflow: "hidden" }}>
            <Skeleton width="80%" height={24} />
            <Skeleton width="40%" height={20} />
          </Box>
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              mt: viewMode === "grid" ? "auto" : 0,
              minWidth: viewMode === "grid" ? "auto" : 80,
            }}
          >
            <Skeleton width={60} height={28} />
            <Skeleton variant="circular" width={28} height={28} />
          </Box>
        </Paper>
      </Grid>
    ))}
  </Grid>
);

export default function POSInterface() {
  const location = useLocation();
  const navigate = useNavigate();
  const hasPulled = useRef(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [cart, setCart] = useState<SaleItem[]>([]);
  const [selectedClientId, setSelectedClientId] = useState<number | null>(null);
  const [selectedAppointmentId, setSelectedAppointmentId] = useState<
    number | null
  >(null);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isPullDialogOpen, setIsPullDialogOpen] = useState(false);
  const [categoryTab, setCategoryTab] = useState(0);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [lowStockExpanded, setLowStockExpanded] = useState(false);
  const [pendingPackageItem, setPendingPackageItem] = useState<{
    id: number;
    name: string;
    price_cents?: number;
  } | null>(null);

  // Fetch Catalogs
  const { data: products = [], isLoading: productsLoading } = useQuery({
    queryKey: ["products"],
    queryFn: fetchProducts,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
  const { data: services = [], isLoading: servicesLoading } = useQuery({
    queryKey: ["services"],
    queryFn: getTenantServices,
    staleTime: 1000 * 60 * 5,
  });
  const { data: clients = [] } = useQuery({
    queryKey: ["clients"],
    queryFn: fetchClients,
    staleTime: 1000 * 60 * 10, // Clients change even less frequently
  });
  const { data: packages = [], isLoading: packagesLoading } = useQuery({
    queryKey: ["packages"],
    queryFn: listPackages,
    staleTime: 1000 * 60 * 5,
  });
  const { data: clientPets = [] } = useQuery<Pet[]>({
    queryKey: ["pets", "client", selectedClientId],
    queryFn: () => fetchPetsByClient(selectedClientId!),
    enabled: !!selectedClientId,
  });

  const isLoadingItems = productsLoading || servicesLoading || packagesLoading;

  // Calculate cart total
  const cartTotal = cart.reduce((acc, item) => acc + item.subtotal, 0);

  // Filter items
  const lowStockProducts = useMemo(() => {
    return products.filter(
      (p) => p.is_active && p.quantity <= p.min_stock,
    );
  }, [products]);

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

  const filteredPackages = useMemo(() => {
    return packages.filter(
      (pkg) =>
        pkg.is_active &&
        pkg.name.toLowerCase().includes(searchTerm.toLowerCase()),
    );
  }, [packages, searchTerm]);

  // Handlers
  const handleAddItem = (
    item: {
      id: number;
      name: string;
      price_cents?: number;
      quantity?: number;
    },
    type: "product" | "service" | "package",
  ) => {
    // Pacotes com cliente selecionado pedem o pet antes de adicionar ao carrinho
    if (type === "package" && selectedClientId) {
      setPendingPackageItem(item);
      return;
    }

    addItemToCart(item, type);
  };

  const addItemToCart = (
    item: { id: number; name: string; price_cents?: number; quantity?: number; unit?: string },
    type: "product" | "service" | "package",
    petId?: number,
    petName?: string,
  ) => {
    const price = (item.price_cents || 0) / 100;
    const displayName =
      type === "package" && petName ? `${item.name} (${petName})` : item.name;

    const existingIndex = cart.findIndex(
      (c) => c.item_id === item.id && c.item_type === type && c.pet_id === petId,
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
          name: displayName,
          quantity: 1,
          unit_price: price,
          subtotal: price,
          pet_id: petId,
          unit: type === "product" ? item.unit || "UN" : "UN",
        },
      ]);
    }
  };

  const handlePetSelected = (pet: Pet) => {
    if (!pendingPackageItem) return;
    addItemToCart(pendingPackageItem, "package", pet.id, pet.name);
    setPendingPackageItem(null);
  };

  const handlePetSelectionSkip = () => {
    if (!pendingPackageItem) return;
    addItemToCart(pendingPackageItem, "package");
    setPendingPackageItem(null);
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

  const handleSetQuantity = (index: number, value: number) => {
    if (value <= 0) return;
    const newCart = [...cart];
    const item = newCart[index];

    // If product, check stock
    if (item.item_type === "product") {
      const product = products.find((p) => p.id === item.item_id);
      if (product && value > product.quantity) {
        toast.warning("Limite de estoque atingido.");
        return;
      }
    }

    item.quantity = value;
    item.subtotal = item.quantity * item.unit_price;
    setCart(newCart);
  };

  const handleRemoveItem = (index: number) => {
    setCart(cart.filter((_, i) => i !== index));
  };

  const clearCart = () => {
    setCart([]);
    setSelectedClientId(null);
    setSelectedAppointmentId(null);
  };

  const handlePullAppointment = (appointment: Appointment) => {
    // Serviços cobertos por pacote não entram no caixa
    const chargeableItems: SaleItem[] = appointment.items.flatMap((item) =>
      item.services
        .filter((s) => !s.is_package_covered)
        .map((s) => ({
          item_id: s.id,
          item_type: "service" as const,
          name: `${s.name} (${item.pet.name})`,
          quantity: 1,
          unit_price: s.price_cents / 100,
          subtotal: s.price_cents / 100,
          employee_id: s.employee_id || null,
        })),
    );

    if (chargeableItems.length === 0) {
      toast.info("Todos os serviços deste agendamento foram cobertos por pacote.");
      setIsPullDialogOpen(false);
      return;
    }

    setSelectedClientId(appointment.client.id);
    setSelectedAppointmentId(appointment.id);
    setCart(chargeableItems);
    setIsPullDialogOpen(false);
    toast.success(`Agendamento de ${appointment.client.name} carregado.`);
  };

  const handlePullPackage = (pkg: ClientPackage) => {
    const packageDef = packages.find((p) => p.id === pkg.package_id);
    if (!packageDef) {
      toast.error("Pacote não encontrado no catálogo.");
      return;
    }

    const price = packageDef.price_cents / 100;
    const item: SaleItem = {
      item_id: packageDef.id,
      item_type: "package",
      name: pkg.package_name,
      quantity: 1,
      unit_price: price,
      subtotal: price,
      pet_id: pkg.pet_id,
      client_package_id_to_pay: pkg.id,
    };

    setSelectedClientId(pkg.client_id);
    setCart([item]);
    setIsPullDialogOpen(false);
    toast.success("Venda de pacote pendente carregada.");
  };

  // Auto-pull appointment or package if coming from outside
  useEffect(() => {
    const state = location.state as { pullAppointment?: Appointment; pullPackage?: ClientPackage } | null;
    if (state && !hasPulled.current) {
      if (state.pullAppointment) {
        handlePullAppointment(state.pullAppointment);
        hasPulled.current = true;
        navigate(location.pathname, { replace: true, state: {} });
      } else if (state.pullPackage) {
        handlePullPackage(state.pullPackage);
        hasPulled.current = true;
        navigate(location.pathname, { replace: true, state: {} });
      }
    }
  }, [location, navigate, packages]);

  const selectedClient = clients.find((c) => c.id === selectedClientId);

  return (
    <Grid container spacing={3} sx={{ height: "100%", p: 1, width: "100%", flexWrap: { md: "nowrap", xs: "wrap" } }}>
      {/* Sidebar: Digital Receipt */}
      <Grid 
        size={{ xs: 12, md: "auto" }} 
        sx={{ 
          maxHeight: "800px",
          width: { md: "430px", xs: "100%" },
          minWidth: { md: "410px", xs: "100%" },
          flexShrink: 0,
          flexGrow: 0
        }}
      >
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
            maxWidth: "550px",
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

          <Box
            sx={{ p: 2, borderBottom: "1px dashed", borderColor: "divider" }}
          >
            <Button
              fullWidth
              variant="outlined"
              color="primary"
              startIcon={<ClipboardList size={20} />}
              onClick={() => setIsPullDialogOpen(true)}
              sx={{
                borderRadius: 2,
                height: 48,
                fontWeight: 700,
                borderStyle: "dashed",
                borderWidth: 2,
                "&:hover": { borderWidth: 2 },
              }}
            >
              PUXAR AGENDAMENTOS
            </Button>
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
                            px: 1,
                          }}
                        >
                          <IconButton
                            size="small"
                            onClick={() => handleUpdateQuantity(index, -1)}
                          >
                            <Minus size={18} />
                          </IconButton>
                          <input
                            type="number"
                            value={item.quantity}
                            onChange={(e) => {
                              const val = parseInt(e.target.value);
                              if (!isNaN(val)) {
                                handleSetQuantity(index, val);
                              }
                            }}
                            min={1}
                            style={{
                              width: "55px",
                              textAlign: "center",
                              border: "none",
                              background: "transparent",
                              fontWeight: 700,
                              outline: "none",
                              fontSize: "0.875rem",
                            }}
                          />
                          <Typography variant="body2" sx={{ fontWeight: 700, mr: 0.5, opacity: 0.8 }}>
                            {item.unit || "UN"}
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
        size={{ xs: 12, md: "grow" }}
        sx={{
          height: "100%",
          display: "flex",
          flexDirection: "column",
          gap: 2,
          flexGrow: 1,
          minWidth: 0,
        }}
      >
        {/* Search & Tabs Header */}
        <Box>
          <Grid container spacing={2} alignItems="center">
            <Grid size={{ xs: 12, sm: 5 }}>
              <TextField
                fullWidth
                size="small"
                placeholder="Buscar (Nome, Código...)"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Search size={16} color="gray" />
                    </InputAdornment>
                  ),
                  sx: { borderRadius: 3, bgcolor: "background.paper" },
                }}
              />
            </Grid>
            <Grid
              size={{ xs: 12, sm: 7 }}
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
                  minHeight: 38,
                  "& .MuiTab-root": {
                    color: "text.primary",
                    fontWeight: 700,
                    fontSize: 13.5,
                    minWidth: 0,
                    px: 2.5,
                    minHeight: 38,
                    height: 38,
                    borderRadius: "20px",
                    border: "2px solid",
                    borderColor: "divider",
                    mx: 0.5,
                    transition: "all 0.2s ease",
                    textTransform: "none",
                    "&:hover": {
                      borderColor: "text.primary",
                      color: "text.primary",
                    },
                  },
                  "& .Mui-selected": {
                    color: "primary.main !important",
                    borderColor: "primary.main",
                    bgcolor: (theme) => alpha(theme.palette.primary.main, 0.08),
                  },
                  "& .MuiTabs-indicator": {
                    display: "none",
                  },
                }}
              >
                <Tab label="Todos" />
                <Tab label="Produtos" />
                <Tab label="Serviços" />
                <Tab label="Pacotes" />
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
        <Box sx={{ flexGrow: 1, overflowY: "auto", pr: 0.5, minHeight: 0 }}>
          {/* Low Stock Alert */}
          <Collapse in={lowStockProducts.length > 0}>
            <Alert
              severity="warning"
              onClick={() => setLowStockExpanded((prev) => !prev)}
              action={
                <IconButton
                  size="small"
                  onClick={(e) => {
                    e.stopPropagation();
                    setLowStockExpanded((prev) => !prev);
                  }}
                >
                  {lowStockExpanded ? (
                    <ChevronUp size={22} />
                  ) : (
                    <ChevronDown size={22} />
                  )}
                </IconButton>
              }
              sx={{ mb: 2, borderRadius: 2, cursor: "pointer" }}
            >
              <Typography variant="body2" sx={{ fontWeight: 700 }}>
                {lowStockProducts.length} produto
                {lowStockProducts.length > 1 ? "s" : ""} com estoque baixo
              </Typography>
              <Collapse in={lowStockExpanded}>
                <Box sx={{ mt: 0.5 }}>
                  {lowStockProducts.map((p) => (
                    <Typography
                      key={p.id}
                      variant="body2"
                      color="text.primary"
                    >
                      {p.name} ({p.quantity} un)
                    </Typography>
                  ))}
                </Box>
              </Collapse>
            </Alert>
          </Collapse>

        {isLoadingItems ? (
          <POSSkeleton viewMode={viewMode} />
        ) : (
          <>
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
                          ? { xs: 6, sm: 6, md: 6, lg: 4, xl: 3 }
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
                              label={`${product.quantity} ${product.unit || "UN"}`}
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
                              <Typography component="span" variant="caption" color="text.primary" sx={{ fontWeight: 600, ml: 0.25 }}>
                                /{product.unit?.toLowerCase() || "un"}
                              </Typography>
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
                            label={`${product.quantity} ${product.unit || "UN"}`}
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
                            <Typography component="span" variant="caption" color="text.secondary" sx={{ fontWeight: 600, ml: 0.25 }}>
                              /{product.unit?.toLowerCase() || "un"}
                            </Typography>
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
                          ? { xs: 6, sm: 6, md: 6, lg: 4, xl: 3 }
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
                              mb: 0.5,
                              color: "text.primary",
                            }}
                          >
                            {service.name}
                          </Typography>
                          {(service.species || service.size || service.coat_type || service.duration_minutes) && (
                            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5, mb: 1 }}>
                              {service.species && (
                                <Chip label={service.species} size="small" sx={{ fontSize: "0.6rem", height: 18, fontWeight: 600 }} />
                              )}
                              {service.size && (
                                <Chip label={`Porte ${service.size}`} size="small" color="primary" variant="outlined" sx={{ fontSize: "0.6rem", height: 18, fontWeight: 600 }} />
                              )}
                              {service.coat_type && (
                                <Chip label={`Pel. ${getCoatTypeLabel(service.coat_type as CoatType)}`} size="small" sx={{ fontSize: "0.6rem", height: 18, fontWeight: 600 }} />
                              )}
                              {service.duration_minutes && (
                                <Chip label={`${service.duration_minutes} min`} size="small" variant="outlined" sx={{ fontSize: "0.6rem", height: 18, fontWeight: 600 }} />
                              )}
                            </Box>
                          )}
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
                          <Box sx={{ flexGrow: 1 }}>
                            <Typography variant="body2" sx={{ fontWeight: 700 }}>
                              {service.name}
                            </Typography>
                            {(service.species || service.size || service.coat_type || service.duration_minutes) && (
                              <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5, mt: 0.25 }}>
                                {service.species && (
                                  <Chip label={service.species} size="small" sx={{ fontSize: "0.55rem", height: 16, fontWeight: 600 }} />
                                )}
                                {service.size && (
                                  <Chip label={`Porte ${service.size}`} size="small" color="primary" variant="outlined" sx={{ fontSize: "0.55rem", height: 16, fontWeight: 600 }} />
                                )}
                                {service.coat_type && (
                                  <Chip label={`Pel. ${getCoatTypeLabel(service.coat_type as CoatType)}`} size="small" sx={{ fontSize: "0.55rem", height: 16, fontWeight: 600 }} />
                                )}
                                {service.duration_minutes && (
                                  <Chip label={`${service.duration_minutes} min`} size="small" variant="outlined" sx={{ fontSize: "0.55rem", height: 16, fontWeight: 600 }} />
                                )}
                              </Box>
                            )}
                          </Box>
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

          {(categoryTab === 0 || categoryTab === 3) &&
            filteredPackages.length > 0 && (
              <Box sx={{ mt: 4 }}>
                <Typography
                  variant="overline"
                  sx={{
                    fontWeight: 800,
                    color: "primary.main",
                    mb: 2,
                    display: "block",
                  }}
                >
                  Pacotes de Serviços / Produtos
                </Typography>
                <Grid container spacing={viewMode === "grid" ? 2 : 1}>
                  {filteredPackages.map((pkg) => (
                    <Grid
                      size={
                        viewMode === "grid"
                          ? { xs: 6, sm: 6, md: 6, lg: 4, xl: 3 }
                          : { xs: 12 }
                      }
                      key={`pkg-${pkg.id}`}
                    >
                      {viewMode === "grid" ? (
                        <Paper
                          elevation={0}
                          onClick={() => handleAddItem(pkg, "package")}
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
                              "& .add-btn-p": {
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
                                bgcolor: alpha("#ff9800", 0.08),
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                color: "#ff9800",
                              }}
                            >
                              <Tag size={18} />
                            </Box>
                            <Chip
                              label="PACOTE"
                              size="small"
                              sx={{
                                fontSize: "0.65rem",
                                fontWeight: 900,
                                bgcolor: alpha("#ff9800", 0.1),
                                color: "#ff9800",
                                border: "none",
                              }}
                            />
                          </Box>

                          <Typography
                            variant="body2"
                            sx={{
                              fontWeight: 700,
                              mb: 0.5,
                              color: "text.primary",
                            }}
                          >
                            {pkg.name}
                          </Typography>
                          <Typography
                            variant="caption"
                            color="text.primary"
                            sx={{
                              mb: 2,
                              flexGrow: 1,
                              display: "-webkit-box",
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: "vertical",
                              overflow: "hidden",
                            }}
                          >
                            {pkg.description || "Combo promocional"}
                          </Typography>

                          <Box
                            sx={{
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "center",
                              mt: "auto",
                            }}
                          >
                            <Typography
                              variant="subtitle2"
                              sx={{ fontWeight: 800, color: "primary.main" }}
                            >
                              R$ {((pkg.price_cents || 0) / 100).toFixed(2)}
                            </Typography>
                            <IconButton
                              size="small"
                              className="add-btn-p"
                              sx={{
                                transition: "all 0.2s",
                                bgcolor: alpha("#1976d2", 0.04),
                              }}
                            >
                              <Plus size={18} />
                            </IconButton>
                          </Box>
                        </Paper>
                      ) : (
                        <Paper
                          elevation={0}
                          onClick={() => handleAddItem(pkg, "package")}
                          sx={{
                            p: 1.5,
                            borderRadius: 2,
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            gap: 2,
                            border: "1px solid",
                            borderColor: "divider",
                            bgcolor: "background.paper",
                            "&:hover": {
                              borderColor: "primary.main",
                              boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
                            },
                          }}
                        >
                          <Box
                            sx={{
                              width: 32,
                              height: 32,
                              borderRadius: 1,
                              bgcolor: alpha("#ff9800", 0.08),
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              color: "#ff9800",
                              flexShrink: 0,
                            }}
                          >
                            <Tag size={18} />
                          </Box>
                          <Typography
                            variant="body2"
                            sx={{ fontWeight: 700, flexGrow: 1 }}
                          >
                            {pkg.name}
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
                            R$ {((pkg.price_cents || 0) / 100).toFixed(2)}
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
            filteredServices.length === 0 &&
            filteredPackages.length === 0 && (
              <Box sx={{ textAlign: "center", mt: 10 }}>
                <Filter size={64} style={{ opacity: 0.2, marginBottom: 16 }} />
                <Typography variant="h6" color="text.primary">
                  Nenhum item encontrado
                </Typography>
                <Typography variant="body2" color="text.primary">
                  Tente mudar sua busca ou categoria
                </Typography>
              </Box>
            )}
          </>
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
          appointmentId={selectedAppointmentId}
          onSuccess={clearCart}
        />
      )}

      {isPullDialogOpen && (
        <PullAppointmentDialog
          open={isPullDialogOpen}
          onClose={() => setIsPullDialogOpen(false)}
          onSelect={(item, type) => {
            if (type === "appointment") handlePullAppointment(item);
            else handlePullPackage(item);
          }}
        />
      )}

      <Dialog
        open={!!pendingPackageItem}
        onClose={handlePetSelectionSkip}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            bgcolor: "primary.main",
            color: "white",
            py: 1.5,
            px: 2,
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Dog size={18} />
            <Typography variant="subtitle1" fontWeight={700}>
              Para qual pet é este pacote?
            </Typography>
          </Box>
          <IconButton
            size="small"
            onClick={handlePetSelectionSkip}
            sx={{ color: "white" }}
          >
            <X size={18} />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ p: 0 }}>
          {clientPets.length === 0 ? (
            <Box sx={{ p: 3, textAlign: "center" }}>
              <Typography color="text.primary" variant="body2">
                Nenhum pet encontrado para este cliente.
              </Typography>
              <Button
                variant="outlined"
                size="small"
                onClick={handlePetSelectionSkip}
                sx={{ mt: 2 }}
              >
                Adicionar sem pet
              </Button>
            </Box>
          ) : (
            <List sx={{ pt: 0 }}>
              {clientPets.map((pet) => (
                <ListItem
                  key={pet.id}
                  onClick={() => handlePetSelected(pet)}
                  sx={{
                    cursor: "pointer",
                    borderBottom: "1px solid",
                    borderColor: "divider",
                    "&:hover": { bgcolor: "action.hover" },
                    gap: 1.5,
                  }}
                >
                  <Dog size={16} color="gray" />
                  <Box>
                    <Typography variant="body2" fontWeight={700}>
                      {pet.name}
                    </Typography>
                    <Typography variant="caption" color="text.primary">
                      {pet.species}
                      {pet.breed ? ` · ${pet.breed}` : ""}
                    </Typography>
                  </Box>
                </ListItem>
              ))}
              <ListItem
                onClick={handlePetSelectionSkip}
                sx={{
                  cursor: "pointer",
                  "&:hover": { bgcolor: "action.hover" },
                  gap: 1.5,
                  color: "text.primary",
                }}
              >
                <Typography variant="body2">
                  Adicionar sem vincular pet
                </Typography>
              </ListItem>
            </List>
          )}
        </DialogContent>
      </Dialog>
    </Grid>
  );
}
