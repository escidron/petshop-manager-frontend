import {
  Box,
  Paper,
  Typography,
  Grid,
  TextField,
  InputAdornment,
  List,
  ListItem,
  IconButton,
  Divider,
  Chip,
  Autocomplete,
  Tooltip,
  alpha,
  Dialog,
  DialogTitle,
  DialogContent,
  Alert,
  Collapse,
  Skeleton,
  Checkbox,
  DialogActions,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
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
  Calendar,
  Barcode,
  ShoppingBag,
} from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { useState, useMemo, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchProducts } from "../../api/services/products";
import { fetchClients } from "../../api/services/clients";
import { getTenantServices } from "../../api/services/tenant_services";
import { listPackages } from "../../api/services/packages";
import { listClientPackagesByClient } from "../../api/services/client_packages";
import { fetchPetsByClient } from "../../api/services/pets";
import { getAppointmentsByTenant, listAppointmentsByClient } from "../../api/services/appointments";
import dayjs from "dayjs";
import CheckoutModal from "./CheckoutModal";
import PullAppointmentDialog from "./PullAppointmentDialog";
import { useAuth } from "../../hooks/useAuth";
import { formatBRLFromCents } from "../../utils/masks";
import type { SaleItem } from "./schemas";
import { useToast } from "../../hooks/useToast";
import type { Appointment } from "../appointments/types";
import type { Pet } from "../pets/types";
import { getCoatTypeLabel } from "../../utils/formatCoatType";
import type { CoatType } from "../pets/types";
import type { ClientPackage } from "../client_packages/types";
import { isServiceCompatibleWithPet } from "../../utils/serviceMatcher";
import type { Service } from "../tenant_services/types";
import { Button } from "../../components/Button/Button";

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
  const { tenant } = useAuth();
  const toast = useToast();
  const location = useLocation();
  const navigate = useNavigate();
  const hasPulled = useRef(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [cart, setCart] = useState<SaleItem[]>([]);
  const [discountCents, setDiscountCents] = useState<number>(0);
  const [discountPctInput, setDiscountPctInput] = useState<string>("0");
  const discountAmount = discountCents / 100;
  const [selectedClientId, setSelectedClientId] = useState<number | null>(null);
  const [showClientWarning, setShowClientWarning] = useState(false);
  const [selectedAppointmentId, setSelectedAppointmentId] = useState<
    number | null
  >(null);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isPullDialogOpen, setIsPullDialogOpen] = useState(false);
  const [categoryTab, setCategoryTab] = useState<"appointments" | "products" | "services" | "packages">("appointments");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [lowStockExpanded, setLowStockExpanded] = useState(false);
  const [pendingPackageItem, setPendingPackageItem] = useState<{
    id: number;
    name: string;
    price_cents?: number;
    quantity?: number;
  } | null>(null);
  const [pendingPackagePetIds, setPendingPackagePetIds] = useState<number[]>([]);

  // Fetch Catalogs
  const { data: products = [], isLoading: productsLoading } = useQuery({
    queryKey: ["products", { excludeInternal: true }],
    queryFn: () => fetchProducts(true),
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
  const { data: clientActivePackages = [] } = useQuery<ClientPackage[]>({
    queryKey: ["clientPackages", "client", selectedClientId],
    queryFn: () => listClientPackagesByClient(selectedClientId!),
    enabled: !!selectedClientId,
  });
  const { data: clientAppointments = [] } = useQuery<Appointment[]>({
    queryKey: ["appointments", "client", selectedClientId],
    queryFn: () => listAppointmentsByClient(selectedClientId!),
    enabled: !!selectedClientId,
  });
  const { data: allAppointments = [], isLoading: isLoadingApts } = useQuery({
    queryKey: ["appointments", "pos-pending"],
    queryFn: () => getAppointmentsByTenant(),
    staleTime: 1000 * 60 * 2,
  });

  const pendingAppointments = useMemo(() => {
    const pending = allAppointments
      .filter((apt) => apt.status === "completed" && !apt.is_paid && !apt.is_fully_package_covered);
    
    // Sort: today first (by time ascending), then older ones
    const now = dayjs();
    return pending.sort((a, b) => {
      const aIsToday = dayjs(a.scheduled_at).isSame(now, 'day');
      const bIsToday = dayjs(b.scheduled_at).isSame(now, 'day');
      if (aIsToday && !bIsToday) return -1;
      if (!aIsToday && bIsToday) return 1;
      if (aIsToday && bIsToday) return dayjs(a.scheduled_at).valueOf() - dayjs(b.scheduled_at).valueOf();
      return dayjs(b.scheduled_at).valueOf() - dayjs(a.scheduled_at).valueOf();
    });
  }, [allAppointments]);

  const filteredAppointments = useMemo(() => {
    if (!searchTerm || categoryTab !== "appointments") return pendingAppointments;
    const term = searchTerm.toLowerCase();
    return pendingAppointments.filter((apt) => {
      const clientMatch = apt.client.name.toLowerCase().includes(term);
      const petMatch = apt.items.some((item) => item.pet.name.toLowerCase().includes(term));
      const serviceMatch = apt.items.some((item) =>
        item.services.some((s) => s.name.toLowerCase().includes(term))
      );
      return clientMatch || petMatch || serviceMatch;
    });
  }, [pendingAppointments, searchTerm, categoryTab]);

  const isLoadingItems = productsLoading || servicesLoading || packagesLoading;

  // Calculate cart total
  const cartTotal = cart.reduce((acc, item) => acc + item.subtotal, 0);

  const discountPercentage = cartTotal > 0 ? (discountAmount / cartTotal) * 100 : 0;
  const isDiscountExceeded = tenant?.allow_discount === false
    ? discountAmount > 0
    : discountPercentage > (tenant?.max_discount_percentage ?? 100);

  const getIncompatibleServicesForPet = (pet: Pet) => {
    if (!pendingPackageItem) return [];
    const pkgDef = packages.find((p) => p.id === pendingPackageItem.id);
    if (!pkgDef) return [];

    const pkgServices = pkgDef.items
      .filter((item) => item.service_id)
      .map((item) => services.find((s) => s.id === item.service_id))
      .filter(Boolean) as Service[];

    return pkgServices.filter((s) => !isServiceCompatibleWithPet(s, pet));
  };

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
    // Pacotes pedem obrigatoriamente a seleção de cliente e pet
    if (type === "package") {
      if (!selectedClientId) {
        setShowClientWarning(true);
        toast.warning("Por favor, selecione um cliente antes de adicionar um pacote.");
        return;
      }
      setPendingPackageItem(item);
      return;
    }

    addItemToCart(item, type);
  };

  const addItemToCart = (
    item: { id: number; name: string; price_cents?: number; quantity?: number; unit?: string },
    type: "product" | "service" | "package",
    petIds?: number[],
    petNames?: string[],
  ) => {
    const price = (item.price_cents || 0) / 100;
    const displayName =
      type === "package" && petNames && petNames.length > 0 ? `${item.name} (${petNames.join(', ')})` : item.name;

    const existingIndex = cart.findIndex(
      (c) => c.item_id === item.id && c.item_type === type && JSON.stringify(c.pet_ids) === JSON.stringify(petIds),
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
          pet_ids: petIds,
          unit: type === "product" ? item.unit || "UN" : "UN",
        },
      ]);
    }
  };

  const handlePetsSelected = () => {
    if (!pendingPackageItem || pendingPackagePetIds.length === 0) return;
    const selectedPets = clientPets.filter(p => pendingPackagePetIds.includes(p.id));
    addItemToCart(pendingPackageItem, "package", selectedPets.map(p => p.id), selectedPets.map(p => p.name));
    setPendingPackageItem(null);
    setPendingPackagePetIds([]);
  };

  const handlePetSelectionCancel = () => {
    setPendingPackageItem(null);
    setPendingPackagePetIds([]);
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
    setDiscountCents(0);
    setDiscountPctInput("0");
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

    const hasCoveredItems = appointment.items.some(item => 
      item.services.some(s => s.is_package_covered)
    );

    if (hasCoveredItems) {
      toast.info(`Importado apenas serviços pendentes de ${appointment.client.name}. Os serviços de pacote já foram debitados.`);
    } else {
      toast.success(`Agendamento de ${appointment.client.name} carregado.`);
    }
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
      pet_ids: pkg.pets ? pkg.pets.map(p => p.id) : undefined,
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

  useEffect(() => {
    if (pendingPackageItem) {
      // Auto-select compatible pets
      const defaultIds = clientPets
        .filter(p => !p.is_deceased && getIncompatibleServicesForPet(p).length === 0)
        .map(p => p.id);
      
      setPendingPackagePetIds((prev) => {
        if (prev.length === defaultIds.length && prev.every(id => defaultIds.includes(id))) {
          return prev;
        }
        return defaultIds;
      });
    } else {
      setPendingPackagePetIds((prev) => prev.length === 0 ? prev : []);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pendingPackageItem, clientPets]);

  const selectedClient = clients.find((c) => c.id === selectedClientId);

  const getAppointmentPrice = (apt: Appointment) => {
    return apt.items.reduce(
      (acc, item) =>
        acc +
        item.services
          .filter((s) => !s.is_package_covered)
          .reduce((sAcc, s) => sAcc + s.price_cents, 0),
      0,
    );
  };

  const tabItems = [
    { id: "appointments" as const, label: "Agendamentos", icon: <Calendar size={20} /> },
    { id: "products" as const, label: "Produtos", icon: <Barcode size={20} /> },
    { id: "services" as const, label: "Serviços", icon: <ClipboardList size={20} /> },
    { id: "packages" as const, label: "Pacotes", icon: <ShoppingBag size={20} /> },
  ];

  return (
    <Box sx={{ display: "flex", flexDirection: { xs: "column", lg: "row" }, gap: 3, height: "100%", p: 1, width: "100%" }}>
      
      {/* Main Content: Catalog */}
      <Box sx={{ display: "flex", flexDirection: "column", gap: 2, flexGrow: 1, minWidth: 0 }}>
        {/* Top Controls: Tabs and Search */}
        <Box sx={{ display: "flex", flexDirection: { xs: 'column', md: 'row' }, gap: 2, justifyContent: "space-between", alignItems: "flex-start" }}>
          {/* Tab Buttons */}
          <Box sx={{ display: "flex", gap: 1.5, flexWrap: "wrap", flex: 1 }}>
            {tabItems
              .map((tab) => (
              <Paper
                key={tab.id}
                elevation={0}
                onClick={() => setCategoryTab(tab.id)}
                sx={{
                  px: 3,
                  py: 1.5,
                  borderRadius: "12px",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: 1.5,
                  border: "2px solid",
                  borderColor: categoryTab === tab.id ? "primary.main" : "divider",
                  bgcolor: categoryTab === tab.id ? "primary.main" : "background.paper",
                  color: categoryTab === tab.id ? "white" : "text.primary",
                  transition: "all 0.2s ease",
                  userSelect: "none",
                  "&:hover": {
                    borderColor: categoryTab === tab.id ? "primary.main" : "text.primary",
                    transform: "translateY(-1px)",
                    boxShadow: categoryTab === tab.id ? "0 4px 14px rgba(0,0,0,0.15)" : "0 2px 8px rgba(0,0,0,0.06)",
                  },
                }}
              >
                {tab.icon}
                <Typography variant="body2" sx={{ fontWeight: 700, whiteSpace: "nowrap" }}>
                  {tab.label}
                </Typography>
              </Paper>
            ))}
          </Box>

          {/* Search Bar */}
          <Box sx={{ width: { xs: '100%', md: '300px' }, flexShrink: 0 }}>
            <TextField
              fullWidth
              size="small"
              placeholder="Pesquisar por nome, pet, produto..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search size={18} color="gray" />
                  </InputAdornment>
                ),
                sx: { borderRadius: 3, bgcolor: "background.paper", height: 44 },
              }}
            />
          </Box>
        </Box>

        {/* Big Client Selection */}
        <Box sx={{ width: '100%', maxWidth: '600px', mb: 1 }}>
          <Autocomplete
            options={clients}
            getOptionLabel={(option) => option.name}
            value={selectedClient || null}
            onChange={(_, newValue) => {
              setSelectedClientId(newValue?.id || null);
              if (newValue) {
                setShowClientWarning(false);
              }
            }}
            renderInput={(params) => (
              <TextField
                {...params}
                placeholder="Pesquisar e vincular cliente para atendimento..."
                variant="outlined"
                error={showClientWarning}
                helperText={showClientWarning ? "Selecione um cliente para poder vender pacotes" : ""}
                InputProps={{
                  ...params.InputProps,
                  startAdornment: (
                    <InputAdornment position="start">
                      <User size={22} color={showClientWarning ? "error" : "primary"} />
                    </InputAdornment>
                  ),
                }}
                sx={{
                  "& .MuiOutlinedInput-root": {
                    borderRadius: 3,
                    bgcolor: !selectedClient ? (theme) => alpha(theme.palette.primary.main, 0.04) : "background.paper",
                    py: 1,
                    "& fieldset": {
                      borderWidth: !selectedClient ? 2 : 1,
                      borderColor: !selectedClient ? (theme) => alpha(theme.palette.primary.main, 0.5) : undefined,
                    },
                    "&:hover fieldset": {
                      borderColor: !selectedClient ? "primary.main" : undefined,
                    }
                  },
                }}
              />
            )}
          />
        </Box>

        {/* Content Area */}
        <Box sx={{ flexGrow: 1, overflowY: "auto", pr: 0.5, minHeight: 0 }}>

          {/* Low Stock Alert */}
          <Collapse in={lowStockProducts.length > 0 && categoryTab === "products"}>
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

          {/* === AGENDAMENTOS TAB === */}
          {categoryTab === "appointments" && (
            <Paper elevation={0} sx={{ borderRadius: 3, border: "1px solid", borderColor: "divider", overflow: "hidden" }}>
              {selectedClient ? (
                <Box sx={{ p: { xs: 2, md: 3 } }}>
                  <Box
                  sx={{
                    display: "flex",
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 2,
                    p: 2.5,
                    border: "1px solid",
                    borderRadius: 3,
                    borderColor: "divider",
                    bgcolor: (theme) => alpha(theme.palette.primary.main, 0.02),
                    mb: 4
                  }}
                >
                  <Box
                    sx={{
                      width: 48,
                      height: 48,
                      borderRadius: "50%",
                      bgcolor: (theme) => alpha(theme.palette.primary.main, 0.1),
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "primary.main",
                      flexShrink: 0
                    }}
                  >
                    <User size={24} />
                  </Box>
                  <Box sx={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 2, flexGrow: 1, flexWrap: 'wrap' }}>
                    <Typography variant="h6" sx={{ fontWeight: 800, color: "primary.main" }}>
                      {selectedClient.name}
                    </Typography>
                    
                    {/* Pets List inline */}
                    {clientPets && clientPets.length > 0 && (
                      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', alignItems: 'center' }}>
                        <Typography variant="caption" sx={{ fontWeight: 800, color: 'text.primary', opacity: 0.3, mr: 0.5 }}>
                          PETS:
                        </Typography>
                        {clientPets.map(pet => (
                          <Chip
                            key={pet.id}
                            label={pet.name}
                            size="small"
                            sx={{
                              bgcolor: (theme) => alpha(theme.palette.primary.main, 0.08),
                              color: 'primary.main',
                              fontWeight: 700,
                            }}
                          />
                        ))}
                      </Box>
                    )}
                  </Box>
                  
                  {/* Unlink Button */}
                  <IconButton 
                    onClick={clearCart} 
                    sx={{ 
                      color: 'text.primary', 
                      opacity: 0.4,
                      transition: 'all 0.2s',
                      '&:hover': { color: 'error.main', opacity: 1, bgcolor: (theme) => alpha(theme.palette.error.main, 0.1) } 
                    }}
                  >
                    <X size={24} />
                  </IconButton>
                </Box>

                  {/* Dashboard Info Grid */}
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4, width: '100%', maxWidth: 800, mb: 4, mx: 'auto' }}>
                    
                    {/* 1. Pending to Pay Appointments */}
                    {(() => {
                      const pendingToPay = clientAppointments
                        .filter(a => 
                          a.id !== selectedAppointmentId && 
                          a.status === "completed" && 
                          !a.is_paid &&
                          getAppointmentPrice(a) > 0
                        )
                        .sort((a, b) => dayjs(a.scheduled_at).valueOf() - dayjs(b.scheduled_at).valueOf());

                      if (pendingToPay.length === 0) return null;

                      return (
                        <Box sx={{ width: '100%' }}>
                          <Typography variant="overline" sx={{ fontWeight: 800, color: 'primary.main', mb: 1.5, display: 'block', letterSpacing: 1 }}>
                            AGUARDANDO PAGAMENTO
                          </Typography>
                          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                            {pendingToPay.map(apt => {
                              return (
                                <Paper key={apt.id} elevation={0} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 2, border: '1px solid', borderColor: (theme) => alpha(theme.palette.primary.main, 0.4), borderRadius: 3, bgcolor: (theme) => alpha(theme.palette.primary.main, 0.04) }}>
                                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flex: 1 }}>
                                    <Box sx={{ width: 36, height: 36, borderRadius: 2, bgcolor: (theme) => alpha(theme.palette.primary.main, 0.1), display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'primary.main', flexShrink: 0 }}>
                                      <Calendar size={18} />
                                    </Box>
                                    <Box>
                                      <Typography variant="body2" sx={{ fontWeight: 800, color: 'text.primary' }}>
                                        {dayjs(apt.scheduled_at).format("DD/MM")} às {dayjs(apt.scheduled_at).format("HH:mm")}
                                      </Typography>
                                      <Typography variant="caption" sx={{ display: 'block', fontWeight: 600, color: 'text.primary', opacity: 0.7 }}>
                                        Pets: {apt.items.map(i => i.pet.name).join(', ')}
                                      </Typography>
                                    </Box>
                                  </Box>
                                  <Box sx={{ flex: 1, display: 'flex', justifyContent: 'center', px: 2 }}>
                                    <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.primary', opacity: 0.6, textAlign: 'center' }}>
                                      {[...new Set(apt.items.flatMap(i => i.services.map(s => s.name)))].join(', ')}
                                    </Typography>
                                  </Box>
                                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flex: 1, justifyContent: 'flex-end' }}>
                                    <Typography variant="body2" sx={{ fontWeight: 800, color: 'primary.main' }}>
                                      R$ {(getAppointmentPrice(apt) / 100).toFixed(2)}
                                    </Typography>
                                    <Button
                                      variant="contained"
                                      size="small"
                                      onClick={() => handlePullAppointment(apt)}
                                      sx={{ 
                                        bgcolor: 'primary.main', 
                                        color: 'white', 
                                        fontWeight: 700, 
                                        borderRadius: 2,
                                        px: 2,
                                        boxShadow: 'none',
                                        '&:hover': { bgcolor: 'primary.dark', boxShadow: 'none' } 
                                      }}
                                    >
                                      Cobrar
                                    </Button>
                                  </Box>
                                </Paper>
                              );
                            })}
                          </Box>
                        </Box>
                      );
                    })()}

                    {/* 2. Active Packages */}
                    {(() => {
                      const packagesWithBalance = clientActivePackages
                        .filter(pkg => pkg.is_active)
                        .map(pkg => ({
                          ...pkg,
                          remaining: pkg.credits?.reduce((acc, credit) => acc + credit.remaining_qty, 0) || 0
                        }))
                        .filter(pkg => pkg.remaining > 0);

                      if (packagesWithBalance.length === 0) return null;

                      return (
                        <Box sx={{ width: '100%' }}>
                          <Typography variant="overline" sx={{ fontWeight: 800, color: 'text.primary', opacity: 0.5, mb: 1.5, display: 'block', letterSpacing: 1 }}>
                            PACOTES DISPONÍVEIS
                          </Typography>
                          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                            {packagesWithBalance.map(pkg => (
                              <Paper key={pkg.id} elevation={0} sx={{ display: 'flex', flexDirection: 'column', p: 2, border: '1px solid', borderColor: (theme) => alpha(theme.palette.primary.main, 0.2), borderRadius: 3, bgcolor: (theme) => alpha(theme.palette.primary.main, 0.03) }}>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
                                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                    <Box sx={{ width: 32, height: 32, borderRadius: 2, bgcolor: (theme) => alpha(theme.palette.primary.main, 0.1), display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'primary.main' }}>
                                      <ShoppingBag size={16} />
                                    </Box>
                                    <Typography variant="body2" sx={{ fontWeight: 800, color: 'text.primary' }}>
                                      {pkg.package_name}
                                    </Typography>
                                  </Box>
                                </Box>
                                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                                  {pkg.credits?.filter(c => c.remaining_qty > 0).map(credit => (
                                    <Box key={credit.id} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', bgcolor: 'background.paper', p: 1, px: 1.5, borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
                                      <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.primary' }}>
                                        {credit.service_name}
                                      </Typography>
                                      <Chip
                                        label={`${credit.remaining_qty} disp.`}
                                        size="small"
                                        sx={{ height: 22, fontSize: '0.65rem', fontWeight: 800, bgcolor: (theme) => alpha(theme.palette.primary.main, 0.1), color: 'primary.dark' }}
                                      />
                                    </Box>
                                  ))}
                                </Box>
                              </Paper>
                            ))}
                          </Box>
                        </Box>
                      );
                    })()}

                    {/* 3. Upcoming Appointments */}
                    {(() => {
                      const upcoming = clientAppointments
                        .filter(a => 
                          a.id !== selectedAppointmentId && 
                          ["pending", "confirmed"].includes(a.status) &&
                          dayjs(a.scheduled_at).isAfter(dayjs().subtract(1, 'day'))
                        )
                        .sort((a, b) => dayjs(a.scheduled_at).valueOf() - dayjs(b.scheduled_at).valueOf())
                        .slice(0, 3);

                      if (upcoming.length === 0) return null;

                      return (
                        <Box sx={{ width: '100%' }}>
                          <Typography variant="overline" sx={{ fontWeight: 800, color: 'text.primary', opacity: 0.5, mb: 1.5, display: 'block', letterSpacing: 1 }}>
                            PRÓXIMOS AGENDAMENTOS
                          </Typography>
                          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                            {upcoming.map(apt => {
                              const isToday = dayjs(apt.scheduled_at).isSame(dayjs(), 'day');
                              return (
                                <Paper key={apt.id} elevation={0} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 3, bgcolor: 'background.paper' }}>
                                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flex: 1 }}>
                                    <Box sx={{ width: 36, height: 36, borderRadius: 2, bgcolor: (theme) => alpha(theme.palette.text.primary, 0.04), display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'text.primary', flexShrink: 0 }}>
                                      <Calendar size={18} />
                                    </Box>
                                    <Box>
                                      <Typography variant="body2" sx={{ fontWeight: 700, color: 'text.primary' }}>
                                        {isToday ? "Hoje" : dayjs(apt.scheduled_at).format("DD/MM")} às {dayjs(apt.scheduled_at).format("HH:mm")}
                                      </Typography>
                                      <Typography variant="caption" sx={{ display: 'block', fontWeight: 600, color: 'text.primary', opacity: 0.7 }}>
                                        Pets: {apt.items.map(i => i.pet.name).join(', ')}
                                      </Typography>
                                    </Box>
                                  </Box>
                                  <Box sx={{ flex: 1, display: 'flex', justifyContent: 'center', px: 2 }}>
                                    <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.primary', opacity: 0.6, textAlign: 'center' }}>
                                      {[...new Set(apt.items.flatMap(i => i.services.map(s => s.name)))].join(', ')}
                                    </Typography>
                                  </Box>
                                  <Box sx={{ flex: 1, display: 'flex', justifyContent: 'flex-end' }}>
                                    {isToday && (
                                      <Chip label="Hoje" size="small" sx={{ height: 20, fontSize: '0.65rem', fontWeight: 800, bgcolor: (theme) => alpha(theme.palette.warning.main, 0.15), color: 'warning.dark' }} />
                                    )}
                                  </Box>
                                </Paper>
                              );
                            })}
                          </Box>
                        </Box>
                      );
                    })()}
                  </Box>

                  <Button
                    variant="outlined"
                    color="inherit"
                    onClick={clearCart}
                    sx={{
                      px: 4,
                      py: 1.25,
                      borderRadius: 2,
                      fontWeight: 700,
                      borderColor: "divider",
                      "&:hover": {
                        bgcolor: "action.hover",
                      },
                    }}
                  >
                    Voltar para Lista de Agendamentos
                  </Button>
                </Box>
              ) : (
                <>
                  <Box sx={{ p: 2.5, borderBottom: "1px solid", borderColor: "divider", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <Box>
                      <Typography variant="h6" sx={{ fontWeight: 800, color: "text.primary" }}>
                        Agendamentos para Cobrar
                      </Typography>
                      <Typography variant="caption" color="text.primary" sx={{ opacity: 0.5 }}>
                        {filteredAppointments.length} agendamento{filteredAppointments.length !== 1 ? "s" : ""} finalizado{filteredAppointments.length !== 1 ? "s" : ""} · clique para cobrar
                      </Typography>
                    </Box>
                  </Box>
                  {isLoadingApts ? (
                    <Box sx={{ p: 4 }}>
                      {[1, 2, 3, 4].map((i) => (
                        <Skeleton key={i} height={56} sx={{ mb: 1, borderRadius: 1 }} />
                      ))}
                    </Box>
                  ) : filteredAppointments.length === 0 ? (
                    <Box sx={{ textAlign: "center", py: 8 }}>
                      <Calendar size={48} style={{ opacity: 0.2, marginBottom: 12 }} />
                      <Typography variant="body1" color="text.primary" sx={{ fontWeight: 600 }}>
                        {searchTerm ? "Nenhum agendamento encontrado" : "Nenhum agendamento pendente de pagamento"}
                      </Typography>
                      <Typography variant="body2" color="text.primary" sx={{ mt: 0.5, opacity: 0.6 }}>
                        {searchTerm ? "Tente buscar por outro nome" : "Agendamentos finalizados aparecerão aqui"}
                      </Typography>
                    </Box>
                  ) : (
                    <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow sx={{ "& th": { fontWeight: 700, color: "text.primary", opacity: 0.5, fontSize: "0.8rem", textTransform: "uppercase", letterSpacing: 0.8, borderBottom: "2px solid", borderColor: "divider", py: 1.25 } }}>
                        <TableCell sx={{ pl: 3 }}>Cliente</TableCell>
                        <TableCell>Pets</TableCell>
                        <TableCell>Serviços</TableCell>
                        <TableCell>Horário</TableCell>
                        <TableCell align="right" sx={{ pr: 3 }}>Valor</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {filteredAppointments.map((apt) => {
                        const priceCents = getAppointmentPrice(apt);
                        const allPets = apt.items.map((item) => item.pet);
                        const allServices = apt.items.flatMap((item) =>
                          item.services.filter((s) => !s.is_package_covered).map((s) => s.name)
                        );
                        // Dedupe service names
                        const uniqueServices = [...new Set(allServices)];
                        const isToday = dayjs(apt.scheduled_at).isSame(dayjs(), 'day');

                        return (
                          <TableRow
                            key={apt.id}
                            onClick={() => handlePullAppointment(apt)}
                            sx={{
                              cursor: "pointer",
                              transition: "all 0.15s ease",
                              "&:hover": {
                                bgcolor: (theme) => alpha(theme.palette.primary.main, 0.04),
                              },
                              "& td": {
                                borderBottom: "1px solid",
                                borderColor: "divider",
                                py: 1.75,
                              },
                            }}
                          >
                            <TableCell sx={{ pl: 3 }}>
                              <Typography variant="body2" sx={{ fontWeight: 700, color: "text.primary" }}>
                                {apt.client.name}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
                                {allPets.map((pet, idx) => (
                                  <Chip
                                    key={pet.id || idx}
                                    label={pet.name}
                                    size="small"
                                    sx={{
                                      fontSize: "0.72rem",
                                      fontWeight: 600,
                                      height: 24,
                                      bgcolor: (theme) => alpha(theme.palette.primary.main, 0.08),
                                      color: "primary.main",
                                    }}
                                  />
                                ))}
                              </Box>
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2" color="text.primary" sx={{ fontWeight: 500 }}>
                                {uniqueServices.length > 0 ? uniqueServices.join(", ") : "—"}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Box>
                                <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
                                  {isToday && (
                                    <Chip
                                      label="HOJE"
                                      size="small"
                                      sx={{
                                        fontSize: "0.6rem",
                                        fontWeight: 800,
                                        height: 20,
                                        bgcolor: (theme) => alpha(theme.palette.success.main, 0.1),
                                        color: "success.dark",
                                      }}
                                    />
                                  )}
                                  <Typography variant="body2" sx={{ fontWeight: 700, color: "text.primary" }}>
                                    {dayjs(apt.scheduled_at).format("HH:mm")}
                                  </Typography>
                                </Box>
                                {!isToday && (
                                  <Typography variant="caption" color="text.primary" sx={{ opacity: 0.5, fontWeight: 500 }}>
                                    {dayjs(apt.scheduled_at).format("DD/MM/YYYY")}
                                  </Typography>
                                )}
                              </Box>
                            </TableCell>
                            <TableCell align="right" sx={{ pr: 3 }}>
                              <Typography variant="body2" sx={{ fontWeight: 800, color: "primary.main" }}>
                                R$ {(priceCents / 100).toFixed(2).replace(".", ",")}
                              </Typography>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
              </>
            )}
            </Paper>
          )}

          {/* === PRODUCTS TAB === */}
          {categoryTab === "products" && (
            isLoadingItems ? (
              <POSSkeleton viewMode={viewMode} />
            ) : filteredProducts.length > 0 ? (
              <Box>
                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
                  <Typography
                    variant="overline"
                    sx={{ fontWeight: 800, color: "primary.main", display: "block" }}
                  >
                    Produtos em Estoque
                  </Typography>
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
                          bgcolor: viewMode === "grid" ? alpha("#1976d2", 0.08) : "transparent",
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
                          bgcolor: viewMode === "list" ? alpha("#1976d2", 0.08) : "transparent",
                        }}
                      >
                        <ListIcon size={18} />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </Box>
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
                            <Typography component="span" variant="caption" color="text.primary" sx={{ fontWeight: 600, ml: 0.25 }}>
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
            ) : (
              <Box sx={{ textAlign: "center", mt: 10 }}>
                <Filter size={64} style={{ opacity: 0.2, marginBottom: 16 }} />
                <Typography variant="h6" color="text.primary">
                  Nenhum produto encontrado
                </Typography>
                <Typography variant="body2" color="text.primary">
                  Tente mudar sua busca
                </Typography>
              </Box>
            )
          )}

          {/* === SERVICES TAB === */}
          {categoryTab === "services" && (
            isLoadingItems ? (
              <POSSkeleton viewMode={viewMode} />
            ) : filteredServices.length > 0 ? (
              <Box>
                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
                  <Typography
                    variant="overline"
                    sx={{ fontWeight: 800, color: "primary.main", display: "block" }}
                  >
                    Serviços de Pet Shop
                  </Typography>
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
                          bgcolor: viewMode === "grid" ? alpha("#1976d2", 0.08) : "transparent",
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
                          bgcolor: viewMode === "list" ? alpha("#1976d2", 0.08) : "transparent",
                        }}
                      >
                        <ListIcon size={18} />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </Box>
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
            ) : (
              <Box sx={{ textAlign: "center", mt: 10 }}>
                <Filter size={64} style={{ opacity: 0.2, marginBottom: 16 }} />
                <Typography variant="h6" color="text.primary">
                  Nenhum serviço encontrado
                </Typography>
                <Typography variant="body2" color="text.primary">
                  Tente mudar sua busca
                </Typography>
              </Box>
            )
          )}

          {/* === PACKAGES TAB === */}
          {categoryTab === "packages" && (
            isLoadingItems ? (
              <POSSkeleton viewMode={viewMode} />
            ) : filteredPackages.length > 0 ? (
              <Box>
                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
                  <Typography
                    variant="overline"
                    sx={{ fontWeight: 800, color: "primary.main", display: "block" }}
                  >
                    Pacotes de Serviços / Produtos
                  </Typography>
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
                          bgcolor: viewMode === "grid" ? alpha("#1976d2", 0.08) : "transparent",
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
                          bgcolor: viewMode === "list" ? alpha("#1976d2", 0.08) : "transparent",
                        }}
                      >
                        <ListIcon size={18} />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </Box>
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
            ) : (
              <Box sx={{ textAlign: "center", mt: 10 }}>
                <Filter size={64} style={{ opacity: 0.2, marginBottom: 16 }} />
                <Typography variant="h6" color="text.primary">
                  Nenhum pacote encontrado
                </Typography>
                <Typography variant="body2" color="text.primary">
                  Tente mudar sua busca
                </Typography>
              </Box>
            )
          )}
        </Box>
      </Box>

      {/* Sidebar: Ticket de Venda */}
      <Box sx={{ maxHeight: "800px", width: { lg: "400px", xs: "100%" }, minWidth: { lg: "360px", xs: "100%" }, flexShrink: 0 }}>
        <Paper
          elevation={0}
          sx={{
            height: "100%",
            display: "flex",
            flexDirection: "column",
            borderRadius: 3,
            overflow: "hidden",
            border: "1px solid",
            borderColor: "divider",
            bgcolor: "background.paper",
          }}
        >
          {/* Receipt Header */}
          <Box
            sx={{
              p: 2.5,
              borderBottom: "1px solid",
              borderColor: "divider",
            }}
          >
            <Typography variant="h6" sx={{ fontWeight: 800, color: "text.primary" }}>
              Ticket de Venda
            </Typography>
          </Box>



          {/* Cart Items List */}
          <Box sx={{ flexGrow: 1, overflowY: "auto", px: 2, py: 1 }}>
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
                <ShoppingCart size={48} style={{ opacity: 0.2 }} />
                <Typography variant="body2" sx={{ mt: 1 }}>Carrinho Vazio</Typography>
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
                        px: 0,
                      }}
                    >
                      <Box
                        sx={{
                          display: "flex",
                          justifyContent: "space-between",
                          mb: 0.5,
                        }}
                      >
                        <Typography
                          variant="body2"
                          sx={{ fontWeight: 700, flex: 1, color: "text.primary" }}
                        >
                          {item.name}
                        </Typography>
                        <Typography variant="body2" sx={{ fontWeight: 700, color: "text.primary", ml: 1, whiteSpace: "nowrap" }}>
                          R$ {item.subtotal.toFixed(2).replace(".", ",")}
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
                            <Minus size={16} />
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
                              width: "40px",
                              textAlign: "center",
                              border: "none",
                              background: "transparent",
                              fontWeight: 700,
                              outline: "none",
                              fontSize: "0.8rem",
                            }}
                          />
                          <Typography variant="caption" sx={{ fontWeight: 700, mr: 0.5, opacity: 0.7 }}>
                            {item.unit || "UN"}
                          </Typography>
                          <IconButton
                            size="small"
                            onClick={() => handleUpdateQuantity(index, 1)}
                          >
                            <Plus size={16} />
                          </IconButton>
                        </Box>

                        <Tooltip title="Remover item">
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => handleRemoveItem(index)}
                          >
                            <Trash2 size={16} />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </ListItem>
                    <Divider sx={{ borderStyle: "dashed" }} />
                  </Box>
                ))}
              </List>
            )}
          </Box>

          {/* Receipt Footer */}
          <Box
            sx={{
              px: 2,
              py: 2,
              borderTop: "1px solid",
              borderColor: "divider",
            }}
          >
            <Typography variant="subtitle2" sx={{ fontWeight: 800, color: "text.primary", mb: 1.5 }}>
              Resumo:
            </Typography>
            <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5, mb: 1.5 }}>
              <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                <Typography variant="body2" color="text.primary">
                  Subtotal:
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 600, color: "text.primary" }}>
                  R$ {cartTotal.toFixed(2).replace(".", ",")}
                </Typography>
              </Box>

              {tenant?.allow_discount !== false && cart.length > 0 && (
                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", minHeight: 36 }}>
                  <Typography variant="body2" color="text.primary">
                    Desconto:
                  </Typography>
                  <Box sx={{ display: "flex", gap: 0.5, position: "relative" }}>
                    {/* R$ Field */}
                    <TextField
                      value={discountCents === 0 ? "" : formatBRLFromCents(discountCents)}
                      size="small"
                      placeholder="0,00"
                      onFocus={(e) => e.target.select()}
                      onChange={(e) => {
                        const digits = e.target.value.replace(/\D/g, "");
                        const cents = digits === "" ? 0 : Number(digits);
                        const maxCents = Math.round(cartTotal * 100);
                        const finalCents = Math.min(maxCents, cents);
                        setDiscountCents(finalCents);
                        if (cartTotal > 0) {
                           setDiscountPctInput(Number(((finalCents / 100) / cartTotal * 100).toFixed(2)).toString());
                        } else {
                           setDiscountPctInput("0");
                        }
                      }}
                      slotProps={{
                        input: {
                          startAdornment: (
                            <InputAdornment position="start">
                              <Typography sx={{ color: "text.disabled", fontWeight: 500, fontSize: "0.7rem" }}>
                                R$
                              </Typography>
                            </InputAdornment>
                          ),
                        },
                        htmlInput: {
                          style: { textAlign: "right", fontWeight: 700, fontSize: "0.8rem", padding: "3px 6px" }
                        }
                      }}
                      sx={{ width: 90 }}
                      error={isDiscountExceeded}
                    />

                    {/* % Field */}
                    <TextField
                      value={discountPctInput === "0" ? "" : discountPctInput}
                      size="small"
                      placeholder="0"
                      onFocus={(e) => e.target.select()}
                      onChange={(e) => {
                         let val = e.target.value.replace(/[^0-9.,]/g, "").replace(",", ".");
                         const parts = val.split(".");
                         if (parts.length > 2) val = parts[0] + "." + parts.slice(1).join("");
                         
                         setDiscountPctInput(val);
                         
                         const pct = parseFloat(val) || 0;
                         const newCents = Math.round((pct / 100) * cartTotal * 100);
                         const maxCents = Math.round(cartTotal * 100);
                         setDiscountCents(Math.min(maxCents, newCents));
                      }}
                      slotProps={{
                        input: {
                          endAdornment: (
                            <InputAdornment position="end">
                              <Typography sx={{ color: "text.disabled", fontWeight: 500, fontSize: "0.7rem" }}>
                                %
                              </Typography>
                            </InputAdornment>
                          ),
                        },
                        htmlInput: {
                          style: { textAlign: "right", fontWeight: 700, fontSize: "0.8rem", padding: "3px 6px" }
                        }
                      }}
                      sx={{ width: 65 }}
                      error={isDiscountExceeded}
                    />

                    {/* Helper text moved outside to cover both fields */}
                    {isDiscountExceeded && (
                       <Typography
                         color="error"
                         sx={{
                           position: "absolute",
                           top: "100%",
                           right: 0,
                           whiteSpace: "nowrap",
                           margin: 0,
                           fontSize: "0.62rem",
                           zIndex: 10,
                           mt: 0.5
                         }}
                       >
                          {`Máx: R$ ${((cartTotal * (tenant?.max_discount_percentage ?? 100)) / 100).toFixed(2)} (${(tenant?.max_discount_percentage ?? 100)}%)`}
                       </Typography>
                    )}
                  </Box>
                </Box>
              )}

              {/* Extra spacing when helper text is shown */}
              <Box sx={{ height: isDiscountExceeded ? 10 : 0, transition: "height 0.2s" }} />

              <Divider sx={{ my: 0.5 }} />

              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 800, color: "text.primary" }}>
                  Total:
                </Typography>
                <Typography variant="h5" color="primary" sx={{ fontWeight: 900 }}>
                  R$ {(cartTotal - discountAmount).toFixed(2).replace(".", ",")}
                </Typography>
              </Box>
            </Box>

            <Button
              variant="contained"
              color="primary"
              fullWidth
              size="large"
              disabled={cart.length === 0 || isDiscountExceeded}
              onClick={() => setIsCheckoutOpen(true)}
              startIcon={<ShoppingCart size={20} />}
              sx={{
                borderRadius: 2.5,
                height: 52,
                fontWeight: 800,
                fontSize: "0.95rem",
                textTransform: "uppercase",
                letterSpacing: 0.5,
                boxShadow: "0 4px 14px rgba(0,0,0,0.15)",
              }}
            >
              COBRAR R$ {(cartTotal - discountAmount).toFixed(2).replace(".", ",")}
            </Button>

            {cart.length > 0 && (
              <Button
                variant="text"
                color="inherit"
                fullWidth
                onClick={clearCart}
                sx={{
                  mt: 1,
                  borderRadius: 2,
                  height: 36,
                  fontWeight: 600,
                  fontSize: "0.8rem",
                  opacity: 0.6,
                  "&:hover": { opacity: 1 },
                }}
              >
                Limpar carrinho
              </Button>
            )}
          </Box>
        </Paper>
      </Box>

      {isCheckoutOpen && (
        <CheckoutModal
          open={isCheckoutOpen}
          onClose={() => setIsCheckoutOpen(false)}
          cart={cart}
          totalAmount={cartTotal - discountAmount}
          discountAmount={discountAmount}
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
        onClose={handlePetSelectionCancel}
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
              Para quais pets é este pacote?
            </Typography>
          </Box>
          <IconButton
            size="small"
            onClick={handlePetSelectionCancel}
            sx={{ color: "white" }}
          >
            <X size={18} />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ p: 0 }}>
          {clientPets.filter(p => !p.is_deceased).length === 0 ? (
            <Box sx={{ p: 3, textAlign: "center" }}>
              <Typography color="text.primary" variant="body2">
                Nenhum pet ativo encontrado para este cliente. Por favor, cadastre um pet antes de vender o pacote.
              </Typography>
            </Box>
          ) : (
            <List sx={{ pt: 0 }}>
              {clientPets.filter(p => !p.is_deceased).map((pet) => {
                const incompatible = getIncompatibleServicesForPet(pet);
                const hasIncompatible = incompatible.length > 0;
                const isSelected = pendingPackagePetIds.includes(pet.id);

                return (
                  <ListItem
                    key={pet.id}
                    onClick={() => {
                      setPendingPackagePetIds(prev => 
                        prev.includes(pet.id) 
                          ? prev.filter(id => id !== pet.id)
                          : [...prev, pet.id]
                      );
                    }}
                    sx={{
                      cursor: "pointer",
                      borderBottom: "1px solid",
                      borderColor: "divider",
                      opacity: hasIncompatible ? 0.6 : 1,
                      "&:hover": { bgcolor: "action.hover" },
                      gap: 1.5,
                      px: 2,
                    }}
                  >
                    <Checkbox
                      checked={isSelected}
                      disableRipple
                      sx={{ color: "primary.main", py: 0 }}
                    />
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="body2" fontWeight={700} color={hasIncompatible ? "text.disabled" : "text.primary"}>
                        {pet.name}
                      </Typography>
                      <Typography variant="caption" color="text.primary" display="block">
                        {pet.species} {pet.breed ? `· ${pet.breed}` : ""} {pet.size ? `· ${pet.size}` : ""} {pet.coat_type ? `· ${pet.coat_type}` : ""}
                      </Typography>
                      {hasIncompatible && (
                        <Typography variant="caption" color="error.main" sx={{ display: "block", fontWeight: 600 }}>
                          Incompatível: {incompatible.map((s) => `${s.name}${s.size ? ` (${s.size})` : ""}`).join(", ")}
                        </Typography>
                      )}
                    </Box>
                  </ListItem>
                );
              })}
            </List>
          )}
        </DialogContent>
        {clientPets.filter(p => !p.is_deceased).length > 0 && (
          <DialogActions sx={{ p: 2, bgcolor: "background.default", borderTop: "1px solid", borderColor: "divider" }}>
            <Button
              variant="contained"
              color="primary"
              disabled={pendingPackagePetIds.length === 0}
              onClick={handlePetsSelected}
              fullWidth
            >
              Adicionar ao Carrinho
            </Button>
          </DialogActions>
        )}
      </Dialog>
    </Box>
  );
}
