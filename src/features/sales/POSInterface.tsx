import {
  Box,
  Paper,
  Autocomplete,
  TextField,
  InputAdornment,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
  alpha,
  useMediaQuery,
  useTheme,
  Drawer,
  IconButton,
} from "@mui/material";
import { User, ShoppingCart, X } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { useState, useMemo, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchPOSStartup, fetchPOSClientDetails } from "../../api/services/sales";
import dayjs from "dayjs";
import CheckoutModal from "./CheckoutModal";
import PullAppointmentDialog from "./PullAppointmentDialog";
import { useAuth } from "../../hooks/useAuth";
import type { SaleItem } from "./schemas";
import { useToast } from "../../hooks/useToast";
import type { Appointment } from "../appointments/types";
import type { Pet } from "../pets/types";
import type { ClientPackage } from "../client_packages/types";
import type { Service } from "../tenant_services/types";
import { isPackageCompatibleWithAnyPet, getIncompatibleServicesForPet } from "../../utils/serviceMatcher";

// Sub-components
import POSSessionHeader from "./components/POSSessionHeader";
import POSCatalogPanel from "./components/POSCatalogPanel";
import POSTicket from "./components/POSTicket";
import POSClientDashboard from "./components/POSClientDashboard";
import POSPackagePetDialog from "./components/POSPackagePetDialog";
import { Button } from "../../components/Button/Button";


export default function POSInterface() {
  const theme = useTheme();
  const isMobilePOS = useMediaQuery(theme.breakpoints.down("lg"));
  const { tenant } = useAuth();
  const toast = useToast();
  const location = useLocation();
  const navigate = useNavigate();
  const hasPulled = useRef(false);

  // ── State ───────────────────────────────────────────────────────────────
  const [searchTerm, setSearchTerm] = useState("");
  const [cart, setCart] = useState<SaleItem[]>([]);
  const [discountCents, setDiscountCents] = useState<number>(0);
  const [discountPctInput, setDiscountPctInput] = useState<string>("0");
  const discountAmount = discountCents / 100;
  const [mobileCartDrawerOpen, setMobileCartDrawerOpen] = useState(false);
  const totalCartItems = cart.reduce((acc, item) => acc + item.quantity, 0);

  const [selectedClientId, setSelectedClientId] = useState<number | null>(null);
  const [selectedAppointmentId, setSelectedAppointmentId] = useState<number | null>(null);
  const [showAllPackages, setShowAllPackages] = useState(false);

  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isPullDialogOpen, setIsPullDialogOpen] = useState(false);
  const [isClientModalOpen, setIsClientModalOpen] = useState(false);
  const [clientListLimit, setClientListLimit] = useState(20);

  const [catalogTab, setCatalogTab] = useState<"appointments" | "products" | "services" | "packages" | null>("appointments");
  const [viewMode, setViewMode] = useState<"grid" | "list">("list");
  const [lowStockExpanded, setLowStockExpanded] = useState(false);

  const [pendingPackageItem, setPendingPackageItem] = useState<{
    id: number;
    name: string;
    price_cents?: number;
    price?: number;
    quantity?: number;
    unit?: string;
  } | null>(null);
  const [pendingPackagePetIds, setPendingPackagePetIds] = useState<number[]>([]);

  // ── Data Fetching ────────────────────────────────────────────────────────
  const { data: startupData, isLoading: startupLoading } = useQuery({
    queryKey: ["pos-startup"],
    queryFn: fetchPOSStartup,
    staleTime: 1000 * 60 * 5, // 5 minutos de cache
  });

  const { data: clientDetailsData, isLoading: clientDetailsLoading } = useQuery({
    queryKey: ["pos-client", selectedClientId],
    queryFn: () => fetchPOSClientDetails(selectedClientId!),
    enabled: !!selectedClientId,
    staleTime: 1000 * 60 * 5,
  });

  // Global Data
  const products = useMemo(() => {
    return (startupData?.products || []).map((p: any) => ({
      ...p,
      price_cents: p.price_cents ?? (typeof p.price === "number" ? p.price : 0),
      cost_cents: p.cost_cents ?? (typeof p.cost === "number" ? p.cost : 0),
    }));
  }, [startupData?.products]);
  const services = startupData?.services || [];
  const packages = startupData?.packages || [];
  const clients = startupData?.clients || [];
  const allPets = startupData?.pets || [];
  const allAppointments = startupData?.appointments || [];

  // Client Specific Data
  const clientPets = clientDetailsData?.client_pets || [];
  const clientActivePackages = clientDetailsData?.client_packages || [];
  const clientAppointments = clientDetailsData?.client_appointments || [];

  // ── Derived State ────────────────────────────────────────────────────────
  const selectedClient = clients.find((c) => c.id === selectedClientId);

  const pendingAppointments = useMemo(() => {
    const pending = allAppointments.filter(
      (apt) => apt.status === "completed" && !apt.is_paid && !apt.is_fully_package_covered
    );
    const now = dayjs();
    return pending.sort((a, b) => {
      const aIsToday = dayjs(a.scheduled_at).isSame(now, "day");
      const bIsToday = dayjs(b.scheduled_at).isSame(now, "day");
      if (aIsToday && !bIsToday) return -1;
      if (!aIsToday && bIsToday) return 1;
      if (aIsToday && bIsToday)
        return dayjs(a.scheduled_at).valueOf() - dayjs(b.scheduled_at).valueOf();
      return dayjs(b.scheduled_at).valueOf() - dayjs(a.scheduled_at).valueOf();
    });
  }, [allAppointments]);

  const filteredAppointments = useMemo(() => {
    if (!searchTerm) return pendingAppointments;
    const term = searchTerm.toLowerCase();
    return pendingAppointments.filter((apt) => {
      const clientMatch = apt.client.name.toLowerCase().includes(term);
      const petMatch = apt.items.some((item: any) => item.pet.name.toLowerCase().includes(term));
      const serviceMatch = apt.items.some((item: any) =>
        item.services.some((s: any) => s.name.toLowerCase().includes(term))
      );
      return clientMatch || petMatch || serviceMatch;
    });
  }, [pendingAppointments, searchTerm]);

  const cartTotal = cart.reduce((acc, item) => acc + item.subtotal, 0);
  const discountPercentage = cartTotal > 0 ? (discountAmount / cartTotal) * 100 : 0;
  const isDiscountExceeded =
    tenant?.allow_discount === false
      ? discountAmount > 0
      : discountPercentage > (tenant?.max_discount_percentage ?? 100);

  const isLoadingItems = startupLoading || clientDetailsLoading;

  const lowStockProducts = useMemo(
    () => products.filter((p) => p.is_active && p.quantity <= p.min_stock),
    [products]
  );
  const filteredProducts = useMemo(
    () => products.filter((p) => p.is_active && p.quantity > 0 && p.name.toLowerCase().includes(searchTerm.toLowerCase())),
    [products, searchTerm]
  );
  const filteredServices = useMemo(
    () => services.filter((s) => s.is_active && s.name.toLowerCase().includes(searchTerm.toLowerCase())),
    [services, searchTerm]
  );
  const activeClientPets = useMemo(
    () => clientPets.filter((p) => !p.is_deceased),
    [clientPets]
  );

  const activePackages = useMemo(
    () => packages.filter((pkg) => pkg.is_active),
    [packages]
  );

  const compatiblePackages = useMemo(() => {
    if (!selectedClientId || activeClientPets.length === 0) {
      return activePackages;
    }
    return activePackages.filter((pkg) =>
      isPackageCompatibleWithAnyPet(pkg, activeClientPets, services)
    );
  }, [activePackages, selectedClientId, activeClientPets, services]);

  const filteredPackages = useMemo(() => {
    const baseList =
      selectedClientId && activeClientPets.length > 0 && !showAllPackages
        ? compatiblePackages
        : activePackages;

    if (!searchTerm) return baseList;
    const term = searchTerm.toLowerCase();
    return baseList.filter(
      (pkg) =>
        pkg.name.toLowerCase().includes(term) ||
        (pkg.description && pkg.description.toLowerCase().includes(term))
    );
  }, [selectedClientId, activeClientPets.length, showAllPackages, compatiblePackages, activePackages, searchTerm]);

  // ── Helpers ──────────────────────────────────────────────────────────────
  const getAppointmentPrice = (apt: Appointment) =>
    apt.items.reduce(
      (acc, item) =>
        acc + item.services.filter((s) => !s.is_package_covered).reduce((sAcc, s) => sAcc + s.price_cents, 0),
      0
    );

  const getIncompatibleServices = (pet: Pet): Service[] => {
    if (!pendingPackageItem) return [];
    const pkgDef = packages.find((p) => p.id === pendingPackageItem.id);
    if (!pkgDef) return [];
    return getIncompatibleServicesForPet(pkgDef, pet, services);
  };

  // ── Session Control ──────────────────────────────────────────────────────
  const startNewSession = (clientId?: number) => {
    setCart([]);
    setDiscountCents(0);
    setDiscountPctInput("0");
    setSelectedAppointmentId(null);
    setSelectedClientId(clientId ?? null);
    setShowAllPackages(false);
    setSearchTerm("");
    setIsClientModalOpen(false);
  };

  const endSession = () => {
    setCart([]);
    setDiscountCents(0);
    setDiscountPctInput("0");
    setSelectedClientId(null);
    setSelectedAppointmentId(null);
    setShowAllPackages(false);
    setSearchTerm("");
  };

  // ── Cart Handlers ────────────────────────────────────────────────────────
  const handleClearCart = () => {
    setCart([]);
    setDiscountCents(0);
    setDiscountPctInput("0");
    setSelectedAppointmentId(null);
  };

  const addItemToCart = (
    item: { id: number; name: string; price_cents?: number; price?: number; quantity?: number; unit?: string },
    type: "product" | "service" | "package",
    petIds?: number[],
    petNames?: string[]
  ) => {
    const rawCents = item.price_cents ?? (typeof (item as any).price === "number" ? (item as any).price : 0);
    const price = rawCents / 100;
    const displayName =
      type === "package" && petNames && petNames.length > 0
        ? `${item.name} (${petNames.join(", ")})`
        : item.name;

    const existingIndex = cart.findIndex(
      (c) => c.item_id === item.id && c.item_type === type && JSON.stringify(c.pet_ids) === JSON.stringify(petIds)
    );

    if (existingIndex >= 0) {
      if (type === "product" && cart[existingIndex].quantity >= (item.quantity || 0)) {
        toast.warning("Quantidade máxima em estoque atingida.");
        return;
      }
      const newCart = [...cart];
      newCart[existingIndex].quantity += 1;
      newCart[existingIndex].subtotal = newCart[existingIndex].quantity * newCart[existingIndex].unit_price;
      setCart(newCart);
    } else {
      setCart([...cart, {
        item_id: item.id,
        item_type: type,
        name: displayName,
        quantity: 1,
        unit_price: price,
        subtotal: price,
        pet_ids: petIds,
        unit: type === "product" ? item.unit || "UN" : "UN",
      }]);
    }
  };

  const handleAddItem = (
    item: { id: number; name: string; price_cents?: number; price?: number; quantity?: number; unit?: string },
    type: "product" | "service" | "package"
  ) => {
    if (type === "package") {
      if (!selectedClientId) {
        toast.warning("Por favor, selecione um cliente antes de adicionar um pacote.");
        return;
      }
      setPendingPackageItem(item);
      return;
    }
    addItemToCart(item, type);
  };

  const handlePetsSelected = () => {
    if (!pendingPackageItem || pendingPackagePetIds.length === 0) return;
    const selectedPets = clientPets.filter((p) => pendingPackagePetIds.includes(p.id));
    addItemToCart(pendingPackageItem, "package", selectedPets.map((p) => p.id), selectedPets.map((p) => p.name));
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
    if (newQuantity <= 0) { handleRemoveItem(index); return; }
    if (item.item_type === "product") {
      const product = products.find((p) => p.id === item.item_id);
      if (product && newQuantity > product.quantity) { toast.warning("Limite de estoque atingido."); return; }
    }
    item.quantity = newQuantity;
    item.subtotal = item.quantity * item.unit_price;
    setCart(newCart);
  };

  const handleSetQuantity = (index: number, value: number) => {
    if (value <= 0) return;
    const newCart = [...cart];
    const item = newCart[index];
    if (item.item_type === "product") {
      const product = products.find((p) => p.id === item.item_id);
      if (product && value > product.quantity) { toast.warning("Limite de estoque atingido."); return; }
    }
    item.quantity = value;
    item.subtotal = item.quantity * item.unit_price;
    setCart(newCart);
  };

  const handleRemoveItem = (index: number) => {
    const newCart = cart.filter((_, i) => i !== index);
    setCart(newCart);
    if (newCart.length === 0) {
      setSelectedAppointmentId(null);
    }
  };

  // ── Appointment / Package Pull ────────────────────────────────────────────
  const handlePullAppointment = (appointment: Appointment) => {
    const pulledItems: SaleItem[] = appointment.items.flatMap((item) =>
      item.services.map((s) => ({
        item_id: s.id,
        item_type: "service" as const,
        name: s.is_package_covered ? `${s.name} (via pacote)` : s.name,
        quantity: 1,
        unit_price: s.is_package_covered ? 0 : s.price_cents / 100,
        subtotal: s.is_package_covered ? 0 : s.price_cents / 100,
        employee_id: s.employee_id || null,
        pet_ids: [item.pet.id],
      }))
    );

    if (pulledItems.length === 0) {
      toast.info("Nenhum serviço encontrado no agendamento.");
      setIsPullDialogOpen(false);
      return;
    }

    setSelectedClientId(appointment.client.id);
    setSelectedAppointmentId(appointment.id);
    setShowAllPackages(false);
    setCart(pulledItems);
    setIsPullDialogOpen(false);
    setSearchTerm("");
    
    toast.success(`Agendamento de ${appointment.client.name} carregado.`);
  };

  const handlePullPackage = (pkg: ClientPackage) => {
    const packageDef = packages.find((p) => p.id === pkg.package_id);
    if (!packageDef) { toast.error("Pacote não encontrado no catálogo."); return; }
    const price = packageDef.price_cents / 100;
    const item: SaleItem = {
      item_id: packageDef.id,
      item_type: "package",
      name: pkg.package_name,
      quantity: 1,
      unit_price: price,
      subtotal: price,
      pet_ids: pkg.pets ? pkg.pets.map((p) => p.id) : undefined,
      client_package_id_to_pay: pkg.id,
    };
    setSelectedClientId(pkg.client_id);
    setShowAllPackages(false);
    setCart([item]);
    setIsPullDialogOpen(false);
    toast.success("Venda de pacote pendente carregada.");
  };

  // ── Effects ──────────────────────────────────────────────────────────────
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
      const defaultIds = clientPets
        .filter((p) => !p.is_deceased && getIncompatibleServices(p).length === 0)
        .map((p) => p.id);
      setPendingPackagePetIds((prev) => {
        if (prev.length === defaultIds.length && prev.every((id) => defaultIds.includes(id))) return prev;
        return defaultIds;
      });
    } else {
      setPendingPackagePetIds((prev) => (prev.length === 0 ? prev : []));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pendingPackageItem, clientPets]);

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: { xs: "column", lg: "row" },
        gap: { xs: 1, lg: 3 },
        height: { xs: "auto", lg: "100%" },
        minHeight: { xs: "auto", lg: "100%" },
        p: 0,
        width: "100%",
        maxWidth: "100%",
        minWidth: 0,
        boxSizing: "border-box",
      }}
    >
      {/* ── Left Column ── */}
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          flexGrow: 1,
          minWidth: 0,
          width: "100%",
          maxWidth: "100%",
          height: { xs: "auto", lg: "100%" },
          pb: isMobilePOS ? 10 : 0,
          boxSizing: "border-box",
        }}
      >
        <Box sx={{ display: "flex", flexDirection: "column", height: { xs: "auto", lg: "100%" }, width: "100%" }}>
          {selectedClient ? (
            <Paper
              elevation={0}
              sx={{ borderRadius: 3, border: "1px solid", borderColor: "divider", overflow: "hidden", flexShrink: 0, mb: 1, width: "100%", boxSizing: "border-box" }}
            >
              <POSSessionHeader
                client={selectedClient}
                clientPets={clientPets}
                onBack={endSession}
              />
              <POSClientDashboard
                client={selectedClient}
                clientPets={clientPets}
                clientAppointments={clientAppointments}
                clientActivePackages={clientActivePackages}
                selectedAppointmentId={selectedAppointmentId}
                getAppointmentPrice={getAppointmentPrice}
                onPullAppointment={handlePullAppointment}
                onClearClient={endSession}
                hideHeader
              />
            </Paper>
          ) : (
            <Paper
              elevation={0}
              sx={{
                p: { xs: 1, sm: 1.5 },
                mb: 1,
                borderRadius: 3,
                border: "1px dashed",
                borderColor: "divider",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                bgcolor: "background.paper",
                flexShrink: 0,
                gap: 1,
                width: "100%",
                boxSizing: "border-box",
              }}
            >
              <Box sx={{ display: "flex", alignItems: "center", gap: { xs: 1, sm: 1.5 }, minWidth: 0, flex: 1 }}>
                <Box
                  sx={{
                    width: 36,
                    height: 36,
                    borderRadius: "50%",
                    bgcolor: (theme) => alpha(theme.palette.text.primary, 0.04),
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "text.primary",
                    flexShrink: 0,
                  }}
                >
                  <User size={18} />
                </Box>
                <Box sx={{ minWidth: 0, flex: 1 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 800, color: "text.primary", fontSize: { xs: "0.85rem", sm: "0.95rem" } }} noWrap>
                    Cliente Avulso
                  </Typography>
                  <Typography
                    variant="caption"
                    sx={{ color: "text.primary", opacity: 0.75, display: "block", fontSize: { xs: "0.68rem", sm: "0.75rem" } }}
                    noWrap
                  >
                    Vincule um cliente para pacotes
                  </Typography>
                </Box>
              </Box>
              <Button
                variant="outlined"
                size="small"
                onClick={() => setIsClientModalOpen(true)}
                sx={{
                  color: "text.primary",
                  flexShrink: 0,
                  fontSize: { xs: "0.75rem", sm: "0.85rem" },
                  py: { xs: 0.5, sm: 0.75 },
                  px: { xs: 1.25, sm: 1.5 },
                  whiteSpace: "nowrap",
                  "&:hover": { borderColor: "primary.main", color: "primary.main", bgcolor: (theme) => alpha(theme.palette.primary.main, 0.04) },
                }}
              >
                Vincular
              </Button>
            </Paper>
          )}

          {/* Catalog to add items to the ticket */}
          <Box sx={{ flexGrow: 1, minHeight: { xs: "auto", lg: 0 }, height: { xs: "auto", lg: "100%" } }}>
            <POSCatalogPanel
              activeTab={catalogTab}
              searchTerm={searchTerm}
              viewMode={viewMode}
              isLoading={isLoadingItems}
              products={filteredProducts}
              services={filteredServices as any}
              packages={filteredPackages as any}
              appointments={filteredAppointments}
              getAppointmentPrice={getAppointmentPrice}
              onPullAppointment={handlePullAppointment}
              lowStockProducts={lowStockProducts}
              lowStockExpanded={lowStockExpanded}
              onTabChange={setCatalogTab}
              onSearchChange={setSearchTerm}
              onViewModeChange={setViewMode}
              onLowStockToggle={() => setLowStockExpanded((prev) => !prev)}
              onAddItem={handleAddItem}
              selectedClient={selectedClient}
              clientPets={clientPets}
              showAllPackages={showAllPackages}
              onToggleShowAllPackages={() => setShowAllPackages((prev) => !prev)}
              totalPackagesCount={activePackages.length}
              compatiblePackagesCount={compatiblePackages.length}
            />
          </Box>
        </Box>
      </Box>

      {/* ── Desktop Right Column: Ticket ── */}
      {!isMobilePOS && (
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            gap: 2,
            maxHeight: "800px",
            width: { xl: "480px", lg: "440px" },
            minWidth: { xl: "420px", lg: "400px" },
            flexShrink: 0,
          }}
        >
          <POSTicket
            cart={cart}
            cartTotal={cartTotal}
            discountCents={discountCents}
            discountPctInput={discountPctInput}
            isDiscountExceeded={isDiscountExceeded}
            allowDiscount={tenant?.allow_discount !== false}
            maxDiscountPercentage={tenant?.max_discount_percentage ?? 100}
            clientPetNames={Object.fromEntries(clientPets.map((p) => [p.id, p.name]))}
            onUpdateQuantity={handleUpdateQuantity}
            onSetQuantity={handleSetQuantity}
            onRemoveItem={handleRemoveItem}
            onDiscountCentsChange={setDiscountCents}
            onDiscountPctChange={setDiscountPctInput}
            onClearCart={handleClearCart}
            onCheckout={() => setIsCheckoutOpen(true)}
          />
        </Box>
      )}

      {/* ── Mobile Floating Cart Bar ── */}
      {isMobilePOS && (
        <Paper
          elevation={4}
          sx={{
            position: "fixed",
            bottom: 12,
            left: 12,
            right: 12,
            zIndex: 1050,
            borderRadius: 3,
            p: 1.25,
            bgcolor: "background.paper",
            border: "1px solid",
            borderColor: "divider",
            boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 1.5,
          }}
        >
          <Box
            onClick={() => setMobileCartDrawerOpen(true)}
            sx={{ display: "flex", alignItems: "center", gap: 1.25, cursor: "pointer", flex: 1, minWidth: 0 }}
          >
            <Box
              sx={{
                width: 38,
                height: 38,
                borderRadius: 2,
                bgcolor: "primary.main",
                color: "white",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                position: "relative",
                flexShrink: 0,
              }}
            >
              <ShoppingCart size={18} />
              {totalCartItems > 0 && (
                <Box
                  sx={{
                    position: "absolute",
                    top: -5,
                    right: -5,
                    bgcolor: "secondary.main",
                    color: "white",
                    borderRadius: "50%",
                    minWidth: 18,
                    height: 18,
                    fontSize: "0.7rem",
                    fontWeight: 800,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    px: 0.5,
                  }}
                >
                  {totalCartItems}
                </Box>
              )}
            </Box>
            <Box sx={{ minWidth: 0 }}>
              <Typography variant="caption" color="text.disabled" fontWeight={600} sx={{ display: "block", lineHeight: 1.1 }}>
                {totalCartItems === 1 ? "1 item" : `${totalCartItems} itens`}
              </Typography>
              <Typography variant="subtitle2" fontWeight={800} color="text.primary" sx={{ lineHeight: 1.2 }}>
                R$ {(cartTotal - discountAmount).toFixed(2).replace(".", ",")}
              </Typography>
            </Box>
          </Box>

          <Box sx={{ display: "flex", gap: 1 }}>
            <Button
              variant="outlined"
              size="small"
              onClick={() => setMobileCartDrawerOpen(true)}
              sx={{ borderRadius: 2, px: 1.5, fontSize: "0.75rem" }}
            >
              Ver Carrinho
            </Button>
            {cart.length > 0 && (
              <Button
                variant="contained"
                size="small"
                onClick={() => setIsCheckoutOpen(true)}
                sx={{ borderRadius: 2, px: 1.75, fontWeight: 700, fontSize: "0.75rem" }}
              >
                Finalizar
              </Button>
            )}
          </Box>
        </Paper>
      )}

      {/* ── Mobile Cart Bottom Sheet Drawer ── */}
      {isMobilePOS && (
        <Drawer
          anchor="bottom"
          open={mobileCartDrawerOpen}
          onClose={() => setMobileCartDrawerOpen(false)}
          PaperProps={{
            sx: {
              borderTopLeftRadius: 20,
              borderTopRightRadius: 20,
              maxHeight: "90vh",
              display: "flex",
              flexDirection: "column",
              bgcolor: "background.paper",
              p: 2,
            },
          }}
        >
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1.5, pb: 1, borderBottom: "1px solid", borderColor: "divider" }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <ShoppingCart size={20} />
              <Typography variant="h6" fontWeight={800} color="text.primary">
                Carrinho de Vendas
              </Typography>
            </Box>
            <IconButton onClick={() => setMobileCartDrawerOpen(false)} size="small">
              <X size={20} />
            </IconButton>
          </Box>
          <Box sx={{ flex: 1, overflowY: "auto", minHeight: 0 }}>
            <POSTicket
              cart={cart}
              cartTotal={cartTotal}
              discountCents={discountCents}
              discountPctInput={discountPctInput}
              isDiscountExceeded={isDiscountExceeded}
              allowDiscount={tenant?.allow_discount !== false}
              maxDiscountPercentage={tenant?.max_discount_percentage ?? 100}
              clientPetNames={Object.fromEntries(clientPets.map((p) => [p.id, p.name]))}
              onUpdateQuantity={handleUpdateQuantity}
              onSetQuantity={handleSetQuantity}
              onRemoveItem={handleRemoveItem}
              onDiscountCentsChange={setDiscountCents}
              onDiscountPctChange={setDiscountPctInput}
              onClearCart={handleClearCart}
              onCheckout={() => {
                setMobileCartDrawerOpen(false);
                setIsCheckoutOpen(true);
              }}
            />
          </Box>
        </Drawer>
      )}

      {/* ── Modals ── */}
      {isCheckoutOpen && (
        <CheckoutModal
          open={isCheckoutOpen}
          onClose={() => setIsCheckoutOpen(false)}
          cart={cart}
          totalAmount={cartTotal - discountAmount}
          discountAmount={discountAmount}
          clientId={selectedClientId}
          appointmentId={selectedAppointmentId}
          onSuccess={endSession}
        />
      )}

      <Dialog open={isClientModalOpen} onClose={() => setIsClientModalOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 800, pb: 1 }}>Vincular Cliente</DialogTitle>
        <DialogContent sx={{ pt: 1, pb: 3, display: "flex", flexDirection: "column", gap: 1 }}>
          <Typography variant="body2" color="text.primary" sx={{ mb: 2 }}>
            A seleção de cliente é opcional. Obrigatória apenas para venda de pacotes.
          </Typography>
          <Autocomplete
            options={clients}
            filterOptions={(options, state) => {
              const input = state.inputValue.toLowerCase();
              return options
                .filter((option) => {
                  const clientPets = allPets.filter(p => p.client_id === option.id) || [];
                  const matchName = option.name.toLowerCase().includes(input);
                  const matchPet = clientPets.some(p => p.name.toLowerCase().includes(input));
                  return matchName || matchPet;
                })
                .slice(0, clientListLimit);
            }}
            getOptionLabel={(option) => option.name}
            isOptionEqualToValue={(option, value) => option.id === value?.id}
            renderOption={(props, option) => {
              const clientPets = allPets.filter(p => p.client_id === option.id) || [];
              const petsText = clientPets.length > 0 ? clientPets.map(p => p.name).join(", ") : "Sem pets cadastrados";
              return (
                <li {...props} key={option.id}>
                  <Box sx={{ display: "flex", flexDirection: "column" }}>
                    <Typography variant="body2">{option.name}</Typography>
                    <Typography variant="caption" color="text.primary">
                      Pets: {petsText}
                    </Typography>
                  </Box>
                </li>
              );
            }}
            value={null}
            onChange={(_, newValue) => {
              if (newValue) startNewSession(newValue.id);
            }}
            onInputChange={(_, __, reason) => {
              if (reason === "input") setClientListLimit(20);
            }}
            ListboxProps={{
              onScroll: (event: React.SyntheticEvent) => {
                const listboxNode = event.currentTarget;
                if (listboxNode.scrollTop + listboxNode.clientHeight >= listboxNode.scrollHeight - 10) {
                  setClientListLimit((prev) => prev + 20);
                }
              }
            }}
            renderInput={(params) => (
              <TextField
                {...params}
                placeholder="Pesquisar cliente ou pet por nome..."
                variant="outlined"
                autoFocus
                InputProps={{
                  ...params.InputProps,
                  startAdornment: (
                    <InputAdornment position="start">
                      <User size={18} style={{ opacity: 0.5 }} />
                    </InputAdornment>
                  ),
                }}
              />
            )}
          />
        </DialogContent>
        <DialogActions sx={{ p: 2, pt: 0 }}>
          <Button onClick={() => setIsClientModalOpen(false)}>Cancelar</Button>
        </DialogActions>
      </Dialog>

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

      <POSPackagePetDialog
        open={!!pendingPackageItem}
        pendingPackageItem={pendingPackageItem}
        clientPets={clientPets}
        packages={packages}
        services={services}
        pendingPackagePetIds={pendingPackagePetIds}
        onTogglePet={(petId) =>
          setPendingPackagePetIds((prev) =>
            prev.includes(petId) ? prev.filter((id) => id !== petId) : [...prev, petId]
          )
        }
        onConfirm={handlePetsSelected}
        onCancel={handlePetSelectionCancel}
      />
    </Box>
  );
}
