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
  CircularProgress,
} from "@mui/material";
import { User, ShoppingCart, X, CalendarDays, Printer } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { useState, useMemo, useEffect, useRef } from "react";
import { useQuery, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import { fetchPOSStartup, fetchPOSClientDetails, saveComanda, deleteComanda, listSales } from "../../api/services/sales";
import DaySalesModal from "../reports/DaySalesModal";
import dayjs from "dayjs";
import CheckoutModal from "./CheckoutModal";
import SaleReceiptModal from "./SaleReceiptModal";
import PullAppointmentDialog from "./PullAppointmentDialog";
import { useAuth } from "../../hooks/useAuth";
import type { SaleItem, Comanda, ComandaItem, SaleResponse } from "./schemas";
import { useToast } from "../../hooks/useToast";
import type { Appointment } from "../appointments/types";
import type { Pet } from "../pets/types";
import type { ClientPackage } from "../client_packages/types";
import type { Service } from "../tenant_services/types";
import { isPackageCompatibleWithAnyPet, getIncompatibleServicesForPet, isServiceCompatibleWithAnyPet } from "../../utils/serviceMatcher";

// Sub-components
import POSSessionHeader from "./components/POSSessionHeader";
import POSCatalogPanel from "./components/POSCatalogPanel";
import POSTicket from "./components/POSTicket";
import POSClientDashboard from "./components/POSClientDashboard";
import POSPackagePetDialog from "./components/POSPackagePetDialog";
import POSClosedStateScreen from "./components/POSClosedStateScreen";
import POSCashControlPill from "./components/POSCashControlPill";
import { Button } from "../../components/Button/Button";

import { getCurrentCashStatus } from "../../api/services/cash";
import type { CashSessionDetailResponse } from "../cash_register/types";
import OpenCashModal from "../cash_register/OpenCashModal";
import SupplyModal from "../cash_register/SupplyModal";
import BleedModal from "../cash_register/BleedModal";
import CloseCashModal from "../cash_register/CloseCashModal";
import CashStatementModal from "../cash_register/CashStatementModal";
import CashReceiptPrintModal from "../cash_register/CashReceiptPrintModal";


export default function POSInterface() {
  const theme = useTheme();
  const isMobilePOS = useMediaQuery(theme.breakpoints.down("lg"));
  const { tenant } = useAuth();
  const toast = useToast();
  const queryClient = useQueryClient();
  const location = useLocation();
  const navigate = useNavigate();

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
  const [showAllServices, setShowAllServices] = useState(false);

  const [activeComandaId, setActiveComandaId] = useState<number | null>(null);
  const [comandaSyncStatus, setComandaSyncStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const isInitialLoadRef = useRef(false);
  const autoSaveTimeoutRef = useRef<any>(null);

  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [completedSaleForReceipt, setCompletedSaleForReceipt] = useState<SaleResponse | null>(null);
  const [lastCompletedSale, setLastCompletedSale] = useState<SaleResponse | null>(null);
  const [isSaleReceiptOpen, setIsSaleReceiptOpen] = useState(false);
  const [isDaySalesOpen, setIsDaySalesOpen] = useState(false);
  const [isPullDialogOpen, setIsPullDialogOpen] = useState(false);
  const [isClientModalOpen, setIsClientModalOpen] = useState(false);
  const [clientListLimit, setClientListLimit] = useState(20);
  const [pendingRemoveItemIndex, setPendingRemoveItemIndex] = useState<number | null>(null);
  const [isClearConfirmOpen, setIsClearConfirmOpen] = useState(false);

  const todayStr = dayjs().format("YYYY-MM-DD");
  const { data: todaySales = [], refetch: refetchDaySales, isFetching: isFetchingDaySales } = useQuery({
    queryKey: ["day-sales", todayStr],
    queryFn: () => listSales(todayStr, todayStr),
    staleTime: 0,
  });

  const handleOpenDaySales = () => {
    queryClient.invalidateQueries({ queryKey: ["day-sales"] });
    refetchDaySales();
    setIsDaySalesOpen(true);
  };

  // Cash Register Selection (Multi-Terminal)
  const [selectedRegisterId, setSelectedRegisterId] = useState<number | null>(() => {
    const saved = localStorage.getItem("pos_selected_cash_register_id");
    return saved ? parseInt(saved, 10) : null;
  });

  const { data: startupData, isLoading: startupLoading } = useQuery({
    queryKey: ["pos-startup"],
    queryFn: fetchPOSStartup,
    staleTime: 1000 * 60 * 5, // 5 minutos de cache
  });

  const registers = startupData?.cash_registers || [];

  // Ensure selected register is valid
  useEffect(() => {
    if (registers.length > 0) {
      if (!selectedRegisterId || !registers.some((r) => r.id === selectedRegisterId)) {
        const defaultRegId = registers[0].id;
        setSelectedRegisterId(defaultRegId);
        localStorage.setItem("pos_selected_cash_register_id", String(defaultRegId));
      }
    }
  }, [registers, selectedRegisterId]);

  const handleSelectRegister = (id: number) => {
    setSelectedRegisterId(id);
    localStorage.setItem("pos_selected_cash_register_id", String(id));
    queryClient.invalidateQueries({ queryKey: ["cash-status"] });
  };

  // Cash Register States
  const [isOpenCashModalOpen, setIsOpenCashModalOpen] = useState(false);
  const [isSupplyModalOpen, setIsSupplyModalOpen] = useState(false);
  const [isBleedModalOpen, setIsBleedModalOpen] = useState(false);
  const [isCloseCashModalOpen, setIsCloseCashModalOpen] = useState(false);
  const [isStatementModalOpen, setIsStatementModalOpen] = useState(false);
  const [isReceiptPrintModalOpen, setIsReceiptPrintModalOpen] = useState(false);
  const [receiptSessionData, setReceiptSessionData] = useState<CashSessionDetailResponse | null>(null);

  const [catalogTab, setCatalogTab] = useState<"appointments" | "products" | "services" | "packages" | null>("appointments");
  const [viewMode, setViewMode] = useState<"grid" | "list">("list");
  const [lowStockExpanded, setLowStockExpanded] = useState(false);

  useEffect(() => {
    if (selectedClientId) {
      setCatalogTab(null);
    } else {
      setCatalogTab("appointments");
    }
  }, [selectedClientId]);

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
  const { data: fetchedCashStatus, isLoading: isCashStatusLoading } = useQuery({
    queryKey: ["cash-status", selectedRegisterId],
    queryFn: () => getCurrentCashStatus(selectedRegisterId),
    placeholderData: keepPreviousData,
    staleTime: 1000 * 15,
  });

  const cashStatus = fetchedCashStatus ?? startupData?.cash_status;

  const effectiveDrawerBalance = cashStatus?.is_open
    ? (cashStatus.current_session?.current_balance ?? 0)
    : (cashStatus?.suggested_opening_amount ?? 0);

  useEffect(() => {
    if (cashStatus?.is_open && isOpenCashModalOpen) {
      setIsOpenCashModalOpen(false);
    }
  }, [cashStatus?.is_open, isOpenCashModalOpen]);

  const { data: clientDetailsData, isLoading: clientDetailsLoading } = useQuery({
    queryKey: ["pos-client", selectedClientId],
    queryFn: () => fetchPOSClientDetails(selectedClientId!),
    enabled: !!selectedClientId,
    staleTime: 1000 * 30, // 30 segundos de cache para evitar múltiplas chamadas simultâneas
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
  const activeClientPets = useMemo(
    () => clientPets.filter((p) => !p.is_deceased),
    [clientPets]
  );

  const activeServices = useMemo(
    () => services.filter((s) => s.is_active),
    [services]
  );

  const compatibleServices = useMemo(() => {
    if (!selectedClientId || activeClientPets.length === 0) {
      return activeServices;
    }
    return activeServices.filter((s) =>
      isServiceCompatibleWithAnyPet(s, activeClientPets)
    );
  }, [activeServices, selectedClientId, activeClientPets]);

  const filteredServices = useMemo(() => {
    const baseList =
      selectedClientId && activeClientPets.length > 0 && !showAllServices
        ? compatibleServices
        : activeServices;

    if (!searchTerm) return baseList;
    const term = searchTerm.toLowerCase();
    return baseList.filter(
      (s) =>
        s.name.toLowerCase().includes(term) ||
        (s.description && s.description.toLowerCase().includes(term))
    );
  }, [selectedClientId, activeClientPets.length, showAllServices, compatibleServices, activeServices, searchTerm]);

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
  const handlePullComanda = async (comanda: Comanda) => {
    isInitialLoadRef.current = true;
    setSelectedClientId(comanda.client_id);
    setSelectedAppointmentId(comanda.appointment_id || null);
    setActiveComandaId(comanda.id);
    const discCents = Math.round((comanda.discount_amount || 0) * 100);
    setDiscountCents(discCents);
    const itemsSubtotal = (comanda.items || []).reduce((acc, i) => acc + i.subtotal, 0);
    if (itemsSubtotal > 0 && comanda.discount_amount > 0) {
      setDiscountPctInput(((comanda.discount_amount / itemsSubtotal) * 100).toFixed(2));
    } else {
      setDiscountPctInput("0");
    }

    const resolveComandaItems = (items: ComandaItem[] = [], extraAppts: Appointment[] = []): SaleItem[] => {
      const allAppts = [
        ...extraAppts,
        ...(clientDetailsData?.client_appointments || []),
        ...(startupData?.appointments || []),
      ];

      return items
        .filter((item) => {
          if (item.status && item.status !== "active") {
            return false;
          }
          if (item.item_type === "service" && (item.subtotal === 0 || item.name.includes("(via pacote)"))) {
            return false;
          }
          return true;
        })
        .map((item) => {
          const isService = item.item_type === "service";
          const aptId = isService ? (item.appointment_id || (comanda.appointment_id ?? undefined)) : undefined;
          let aptDate: string | undefined = undefined;
          if (isService) {
            if (item.appointment_date) {
              aptDate = item.appointment_date;
            } else if (aptId) {
              const matched = allAppts.find((a) => a.id === aptId);
              if (matched?.scheduled_at) {
                aptDate = matched.scheduled_at;
              } else if (aptId === comanda.appointment_id && (comanda as any).appointment?.scheduled_at) {
                aptDate = (comanda as any).appointment.scheduled_at;
              }
            }
          }
          return {
            item_id: item.item_id,
            item_type: item.item_type,
            name: item.name,
            quantity: item.quantity,
            unit_price: item.unit_price,
            subtotal: item.subtotal,
            employee_id: item.employee_id || null,
            pet_ids: item.pet_ids || undefined,
            client_package_id_to_pay: item.client_package_id_to_pay || null,
            unit: item.unit || "UN",
            appointment_id: aptId,
            appointment_date: aptDate,
          };
        });
    };

    setCart(resolveComandaItems(comanda.items || []));
    setComandaSyncStatus("saved");
    setIsPullDialogOpen(false);
    setSearchTerm("");

    try {
      const details = await queryClient.fetchQuery({
        queryKey: ["pos-client", comanda.client_id],
        queryFn: () => fetchPOSClientDetails(comanda.client_id),
        staleTime: 1000 * 30,
      });
      const freshComanda = details.open_comandas?.[0] || comanda;
      const appts = details.client_appointments || [];
      const updatedCart = resolveComandaItems(freshComanda.items || comanda.items || [], appts);
      isInitialLoadRef.current = true;
      setCart(updatedCart);
    } catch {
      // ignore
    }
  };

  const startNewSession = async (clientId?: number) => {
    isInitialLoadRef.current = true;
    setShowAllPackages(false);
    setShowAllServices(false);
    setSearchTerm("");
    setIsClientModalOpen(false);

    if (!clientId) {
      setCart([]);
      setDiscountCents(0);
      setDiscountPctInput("0");
      setSelectedAppointmentId(null);
      setSelectedClientId(null);
      setActiveComandaId(null);
      setComandaSyncStatus("idle");
      return;
    }

    setSelectedClientId(clientId);
    setCart([]);
    setDiscountCents(0);
    setDiscountPctInput("0");
    setSelectedAppointmentId(null);
    setActiveComandaId(null);
    setComandaSyncStatus("idle");

    try {
      const details = await queryClient.fetchQuery({
        queryKey: ["pos-client", clientId],
        queryFn: () => fetchPOSClientDetails(clientId),
        staleTime: 1000 * 30,
      });
      if (details.open_comandas && details.open_comandas.length > 0) {
        handlePullComanda(details.open_comandas[0]);
      }
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    if (
      selectedClientId &&
      cart.length === 0 &&
      !activeComandaId &&
      clientDetailsData?.open_comandas &&
      clientDetailsData.open_comandas.length > 0
    ) {
      handlePullComanda(clientDetailsData.open_comandas[0]);
    }
  }, [selectedClientId, clientDetailsData]);

  // Backfill missing appointment_date in cart when client appointments or all appointments are loaded
  useEffect(() => {
    if (!clientAppointments.length && !allAppointments.length) return;
    const hasMissingDate = cart.some(
      (i) => i.item_type === "service" && !i.appointment_date && i.appointment_id
    );
    if (!hasMissingDate) return;

    setCart((prevCart) =>
      prevCart.map((item) => {
        if (item.item_type === "service" && !item.appointment_date && item.appointment_id) {
          const apt = clientAppointments.find((a) => a.id === item.appointment_id) || allAppointments.find((a) => a.id === item.appointment_id);
          if (apt?.scheduled_at) {
            return { ...item, appointment_date: apt.scheduled_at };
          }
        }
        return item;
      })
    );
  }, [clientAppointments, allAppointments, cart]);

  const endSession = () => {
    isInitialLoadRef.current = true;
    setCart([]);
    setDiscountCents(0);
    setDiscountPctInput("0");
    setSelectedClientId(null);
    setSelectedAppointmentId(null);
    setActiveComandaId(null);
    setComandaSyncStatus("idle");
    setShowAllPackages(false);
    setShowAllServices(false);
    setSearchTerm("");
  };

  // ── Cart Handlers ────────────────────────────────────────────────────────
  const handleClearCart = () => {
    const hasAppointmentServices = cart.some((i) => i.item_type === "service" && (selectedAppointmentId || (i.pet_ids && i.pet_ids.length > 0)));
    if (hasAppointmentServices) {
      setIsClearConfirmOpen(true);
      return;
    }
    executeClearAll();
  };

  const executeClearOnlyExtras = () => {
    const appointmentServices = cart.filter((i) => i.item_type === "service" && (selectedAppointmentId || (i.pet_ids && i.pet_ids.length > 0)));
    setCart(appointmentServices);
    setIsClearConfirmOpen(false);
  };

  const executeClearAll = () => {
    if (activeComandaId) {
      deleteComanda(activeComandaId)
        .then(() => {
          queryClient.invalidateQueries({ queryKey: ["dashboard-startup"] });
          queryClient.invalidateQueries({ queryKey: ["open-invoices"] });
          queryClient.invalidateQueries({ queryKey: ["open-comandas"] });
          queryClient.invalidateQueries({ queryKey: ["appointments"] });
        })
        .catch(() => {});
    }
    isInitialLoadRef.current = true;
    setCart([]);
    setDiscountCents(0);
    setDiscountPctInput("0");
    setSelectedAppointmentId(null);
    setActiveComandaId(null);
    setComandaSyncStatus("idle");
    setIsClearConfirmOpen(false);
  };

  const handleInitiateCheckout = () => {
    if (!cashStatus?.is_open) {
      toast.error("O caixa está fechado! Abra o caixa antes de realizar vendas.");
      setIsOpenCashModalOpen(true);
      return;
    }
    setIsCheckoutOpen(true);
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
    const item = cart[index];
    if (item.item_type === "service" && (selectedAppointmentId || (item.pet_ids && item.pet_ids.length > 0))) {
      setPendingRemoveItemIndex(index);
      return;
    }
    executeRemoveItem(index);
  };

  const executeRemoveItem = (index: number) => {
    const newCart = cart.filter((_, i) => i !== index);
    setCart(newCart);
    if (newCart.length === 0) {
      setSelectedAppointmentId(null);
    }
    setPendingRemoveItemIndex(null);
  };

  // ── Appointment / Package / Comanda Pull ──────────────────────────────────
  const handlePullAppointment = async (appointment: Appointment) => {
    isInitialLoadRef.current = true;
    setShowAllPackages(false);
    setShowAllServices(false);
    setSearchTerm("");
    setIsPullDialogOpen(false);
    setSelectedClientId(appointment.client.id);
    setSelectedAppointmentId(appointment.id);
    setCart([]);
    setDiscountCents(0);
    setDiscountPctInput("0");
    setActiveComandaId(null);
    setComandaSyncStatus("idle");

    // Always fetch fresh client comanda directly from backend and unify any open appointments
    try {
      const details = await queryClient.fetchQuery({
        queryKey: ["pos-client", appointment.client.id],
        queryFn: () => fetchPOSClientDetails(appointment.client.id),
        staleTime: 1000 * 30,
      });
      const openComanda = details.open_comandas?.[0];

      // Check all unpaid completed appointments of this client (including the clicked one)
      const allClientAppointments = [
        appointment,
        ...(details.client_appointments || []).filter(
          (a) => a.status === "completed" && !a.is_paid && !a.is_fully_package_covered && a.id !== appointment.id
        ),
      ];

      const removedServiceKeys = new Set<string>();
      for (const apt of allClientAppointments) {
        for (const item of apt.items) {
          for (const s of item.services) {
            if (s.is_removed) {
              removedServiceKeys.add(`${apt.id}-${s.id}`);
            }
          }
        }
      }

      let initialCart: SaleItem[] = [];
      if (openComanda) {
        initialCart = (openComanda.items || [])
          .filter((item) => {
            if (item.status && item.status !== "active") {
              return false;
            }
            if (item.item_type === "service") {
              if (item.subtotal === 0 || item.name.includes("(via pacote)")) {
                return false;
              }
              const aptId = item.appointment_id || openComanda.appointment_id;
              if (aptId && removedServiceKeys.has(`${aptId}-${item.item_id}`)) {
                return false;
              }
            }
            return true;
          })
          .map((item) => {
            const isService = item.item_type === "service";
            const aptId = isService ? (item.appointment_id || openComanda.appointment_id || undefined) : undefined;
            const matchedAppt = isService ? allClientAppointments.find((a) => a.id === aptId) : undefined;
            let aptDate: string | undefined = undefined;
            if (isService) {
              aptDate = item.appointment_date || matchedAppt?.scheduled_at || (aptId === openComanda.appointment_id ? (openComanda as any).appointment?.scheduled_at : undefined) || undefined;
            }
            return {
              item_id: item.item_id,
              item_type: item.item_type,
              name: item.name,
              quantity: item.quantity,
              unit_price: item.unit_price,
              subtotal: item.subtotal,
              employee_id: item.employee_id || null,
              pet_ids: item.pet_ids || undefined,
              client_package_id_to_pay: item.client_package_id_to_pay || null,
              unit: item.unit || "UN",
              appointment_id: aptId,
              appointment_date: aptDate,
            };
          });
        setActiveComandaId(openComanda.id);
        const discCents = Math.round((openComanda.discount_amount || 0) * 100);
        setDiscountCents(discCents);
        const itemsSubtotal = (openComanda.items || []).reduce((acc, i) => acc + i.subtotal, 0);
        if (itemsSubtotal > 0 && openComanda.discount_amount > 0) {
          setDiscountPctInput(((openComanda.discount_amount / itemsSubtotal) * 100).toFixed(2));
        } else {
          setDiscountPctInput("0");
        }
      }

      for (const apt of allClientAppointments) {
        for (const item of apt.items) {
          for (const s of item.services) {
            if (s.is_removed) continue;
            if (s.is_package_covered) continue; // Não leva serviços cobertos por pacote para o carrinho
            const alreadyExists = initialCart.some(
              (ci) => ci.appointment_id === apt.id && ci.item_id === s.id && ci.item_type === "service"
            );
            if (!alreadyExists) {
              initialCart.push({
                item_id: s.id,
                item_type: "service",
                name: s.name,
                quantity: 1,
                unit_price: s.price_cents / 100,
                subtotal: s.price_cents / 100,
                employee_id: s.employee_id || null,
                pet_ids: [item.pet.id],
                appointment_id: apt.id,
                appointment_date: apt.scheduled_at,
              });
            }
          }
        }
      }

      if (initialCart.length > 0) {
        isInitialLoadRef.current = true;
        setCart(initialCart);
        setComandaSyncStatus(openComanda ? "saved" : "idle");
        return;
      }
    } catch {
      // fallback
    }

    // Fallback: if no open comanda on backend, pull appointment items
    const pulledItems: SaleItem[] = appointment.items.flatMap((item) =>
      item.services
        .filter((s) => !s.is_removed && !s.is_package_covered)
        .map((s) => ({
          item_id: s.id,
          item_type: "service" as const,
          name: s.name,
          quantity: 1,
          unit_price: s.price_cents / 100,
          subtotal: s.price_cents / 100,
          employee_id: s.employee_id || null,
          pet_ids: [item.pet.id],
          appointment_id: appointment.id,
          appointment_date: appointment.scheduled_at,
        }))
    );

    if (pulledItems.length === 0) {
      toast.info("Nenhum serviço a pagar encontrado no agendamento (serviços cobertos por pacote).");
      return;
    }

    isInitialLoadRef.current = true;
    setCart(pulledItems);
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
    isInitialLoadRef.current = true;
    setSelectedClientId(pkg.client_id);
    setSelectedAppointmentId(null);
    setActiveComandaId(null);
    setShowAllPackages(false);
    setShowAllServices(false);
    setCart([item]);
    setIsPullDialogOpen(false);
  };

  // ── Auto-save Comanda for selected client ────────────────────────────────
  useEffect(() => {
    if (isInitialLoadRef.current) {
      isInitialLoadRef.current = false;
      return;
    }

    if (!selectedClientId) {
      setComandaSyncStatus("idle");
      return;
    }

    if (cart.length === 0) {
      if (activeComandaId) {
        deleteComanda(activeComandaId)
          .then(() => {
            setActiveComandaId(null);
            setComandaSyncStatus("idle");
            queryClient.invalidateQueries({ queryKey: ["dashboard-startup"] });
            queryClient.invalidateQueries({ queryKey: ["open-invoices"] });
            queryClient.invalidateQueries({ queryKey: ["open-comandas"] });
            queryClient.invalidateQueries({ queryKey: ["appointments"] });
          })
          .catch(() => {});
      } else {
        setComandaSyncStatus("idle");
      }
      return;
    }

    setComandaSyncStatus("saving");

    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current);
    }

    autoSaveTimeoutRef.current = setTimeout(async () => {
      try {
        const saved = await saveComanda({
          comanda_id: activeComandaId,
          client_id: selectedClientId,
          appointment_id: selectedAppointmentId,
          items: cart,
          discount_amount: discountAmount,
        });
        setActiveComandaId(saved.id);
        setComandaSyncStatus("saved");
        queryClient.invalidateQueries({ queryKey: ["dashboard-startup"] });
        queryClient.invalidateQueries({ queryKey: ["open-invoices"] });
        queryClient.invalidateQueries({ queryKey: ["open-comandas"] });
        queryClient.invalidateQueries({ queryKey: ["appointments"] });
      } catch (err) {
        setComandaSyncStatus("error");
      }
    }, 400);

    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
    };
  }, [cart, discountAmount, selectedClientId, selectedAppointmentId]);

  // ── Effects ──────────────────────────────────────────────────────────────
  useEffect(() => {
    const state = location.state as {
      pullAppointment?: Appointment;
      pullPackage?: ClientPackage;
      pullComanda?: Comanda;
    } | null;
    if (state?.pullComanda || state?.pullAppointment || state?.pullPackage) {
      if (state.pullComanda) {
        handlePullComanda(state.pullComanda);
      } else if (state.pullAppointment) {
        handlePullAppointment(state.pullAppointment);
      } else if (state.pullPackage) {
        handlePullPackage(state.pullPackage);
      }
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location, navigate]);

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
  if (isCashStatusLoading && !cashStatus) {
    return (
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", height: "70vh", width: "100%" }}>
        <CircularProgress size={36} sx={{ color: "primary.main" }} />
      </Box>
    );
  }

  if (cashStatus && !cashStatus.is_open) {
    return (
      <Box sx={{ width: "100%", height: "100%", overflowY: "auto" }}>
        <POSClosedStateScreen
          cashStatus={cashStatus}
          cashRegisterId={selectedRegisterId}
          registers={registers}
          onSelectRegister={handleSelectRegister}
          onOpenSupply={() => setIsSupplyModalOpen(true)}
          onOpenBleed={() => setIsBleedModalOpen(true)}
          onViewHistory={() => {
            setIsStatementModalOpen(true);
          }}
        />

        {isSupplyModalOpen && (
          <SupplyModal
            open={isSupplyModalOpen}
            onClose={() => setIsSupplyModalOpen(false)}
            currentBalance={effectiveDrawerBalance}
            cashRegisterId={selectedRegisterId}
          />
        )}

        {isBleedModalOpen && (
          <BleedModal
            open={isBleedModalOpen}
            onClose={() => setIsBleedModalOpen(false)}
            currentBalance={effectiveDrawerBalance}
            cashRegisterId={selectedRegisterId}
          />
        )}

        {isStatementModalOpen && (
          <CashStatementModal
            open={isStatementModalOpen}
            onClose={() => setIsStatementModalOpen(false)}
            sessionData={cashStatus?.last_closed_session ?? cashStatus?.current_session ?? null}
            cashRegisterId={selectedRegisterId}
            onOpenSupply={() => setIsSupplyModalOpen(true)}
            onOpenBleed={() => setIsBleedModalOpen(true)}
            onOpenClose={() => setIsCloseCashModalOpen(true)}
            onOpenOpenModal={() => setIsOpenCashModalOpen(true)}
            onPrint={() => {
              const currentOrLast = cashStatus?.last_closed_session ?? cashStatus?.current_session;
              if (currentOrLast) {
                setReceiptSessionData(currentOrLast);
                setIsReceiptPrintModalOpen(true);
              }
            }}
          />
        )}

        {isReceiptPrintModalOpen && (
          <CashReceiptPrintModal
            open={isReceiptPrintModalOpen}
            onClose={() => setIsReceiptPrintModalOpen(false)}
            sessionData={receiptSessionData}
            tenantName={tenant?.name}
          />
        )}
      </Box>
    );
  }

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
          {/* ── Top Bar: Client Context & Day Operations ── */}
          {(() => {
            const daySalesActions = (
              <Box sx={{ display: "flex", gap: 1, alignItems: "center", flexShrink: 0 }}>
                {lastCompletedSale && (
                  <Button
                    variant="outlined"
                    size="small"
                    startIcon={<Printer size={15} />}
                    onClick={() => {
                      setCompletedSaleForReceipt(lastCompletedSale);
                      setIsSaleReceiptOpen(true);
                    }}
                    sx={{
                      color: "#313485",
                      borderColor: "#C7D2FE",
                      bgcolor: "#EEF2FF",
                      fontWeight: 600,
                      flexShrink: 0,
                      fontSize: { xs: "0.72rem", sm: "0.8rem" },
                      py: { xs: 0.5, sm: 0.65 },
                      px: { xs: 1, sm: 1.25 },
                      borderRadius: 2,
                      whiteSpace: "nowrap",
                      "&:hover": { borderColor: "#313485", bgcolor: "#E0E7FF" },
                    }}
                  >
                    Reimprimir Último
                  </Button>
                )}
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<CalendarDays size={15} />}
                  onClick={handleOpenDaySales}
                  sx={{
                    color: "#313485",
                    borderColor: "#C7D2FE",
                    bgcolor: "#EEF2FF",
                    fontWeight: 700,
                    flexShrink: 0,
                    fontSize: { xs: "0.72rem", sm: "0.82rem" },
                    py: { xs: 0.5, sm: 0.65 },
                    px: { xs: 1.25, sm: 1.5 },
                    borderRadius: 2,
                    whiteSpace: "nowrap",
                    "&:hover": { borderColor: "#313485", bgcolor: "#E0E7FF" },
                  }}
                >
                  Vendas do Dia
                </Button>
              </Box>
            );

            return selectedClient ? (
              <Paper
                elevation={0}
                sx={{ borderRadius: 3, border: "1px solid", borderColor: "divider", overflow: "hidden", flexShrink: 0, mb: 1, width: "100%", boxSizing: "border-box" }}
              >
                <POSSessionHeader
                  client={selectedClient}
                  clientPets={clientPets}
                  onBack={endSession}
                  rightAction={daySalesActions}
                />
                <POSClientDashboard
                  client={selectedClient}
                  clientPets={clientPets}
                  clientAppointments={clientAppointments}
                  clientActivePackages={clientActivePackages}
                  onClearClient={endSession}
                  hideHeader
                />
              </Paper>
            ) : (
              <Paper
                elevation={0}
                sx={{
                  p: { xs: 1, sm: 1.25 },
                  px: { xs: 1.25, sm: 2 },
                  mb: 1,
                  borderRadius: 3,
                  border: "1px solid",
                  borderColor: "divider",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  bgcolor: "background.paper",
                  flexShrink: 0,
                  gap: 1.5,
                  width: "100%",
                  boxSizing: "border-box",
                }}
              >
                {/* Lado Esquerdo: Info do Cliente com botão Vincular grudado nele */}
                <Box sx={{ display: "flex", alignItems: "center", gap: { xs: 1, sm: 1.5 }, minWidth: 0, flexWrap: "wrap" }}>
                  <Box
                    sx={{
                      width: 36,
                      height: 36,
                      borderRadius: "50%",
                      bgcolor: (theme) => alpha(theme.palette.primary.main, 0.08),
                      color: "primary.main",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    <User size={18} />
                  </Box>
                  <Box sx={{ minWidth: 0 }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 800, color: "text.primary", fontSize: { xs: "0.85rem", sm: "0.95rem" }, lineHeight: 1.2 }} noWrap>
                      Cliente Avulso
                    </Typography>
                    <Typography
                      variant="caption"
                      sx={{ color: "text.secondary", display: "block", fontSize: { xs: "0.68rem", sm: "0.75rem" } }}
                      noWrap
                    >
                      Vincule um cliente para pacotes
                    </Typography>
                  </Box>
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={() => setIsClientModalOpen(true)}
                    sx={{
                      color: "primary.main",
                      borderColor: (theme) => alpha(theme.palette.primary.main, 0.3),
                      bgcolor: (theme) => alpha(theme.palette.primary.main, 0.04),
                      fontWeight: 700,
                      flexShrink: 0,
                      fontSize: { xs: "0.75rem", sm: "0.82rem" },
                      py: 0.5,
                      px: { xs: 1.25, sm: 1.5 },
                      borderRadius: 2,
                      whiteSpace: "nowrap",
                      ml: { xs: 0, sm: 0.5 },
                      "&:hover": {
                        borderColor: "primary.main",
                        bgcolor: (theme) => alpha(theme.palette.primary.main, 0.08),
                      },
                    }}
                  >
                    Vincular
                  </Button>
                </Box>

                {/* Lado Direito: Ações operacionais do caixa */}
                {daySalesActions}
              </Paper>
            );
          })()}

          {/* Catalog to add items to the ticket */}
          <Box sx={{ flexGrow: 1, minHeight: { xs: "auto", lg: 0 }, height: { xs: "auto", lg: "100%" } }}>
            <POSCatalogPanel
              activeTab={catalogTab}
              searchTerm={searchTerm}
              viewMode={viewMode}
              isLoading={isLoadingItems}
              products={filteredProducts}
              services={filteredServices}
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
              showAllServices={showAllServices}
              onToggleShowAllServices={() => setShowAllServices((prev) => !prev)}
              totalServicesCount={activeServices.length}
              compatibleServicesCount={compatibleServices.length}
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
            activeComandaId={activeComandaId}
            comandaSyncStatus={comandaSyncStatus}
            appointments={[...clientAppointments, ...allAppointments]}
            cashControl={
              <POSCashControlPill
                currentSession={cashStatus?.current_session}
                registers={registers}
                selectedRegisterId={selectedRegisterId}
                onSelectRegister={handleSelectRegister}
                onOpenSupplyModal={() => setIsSupplyModalOpen(true)}
                onOpenBleedModal={() => setIsBleedModalOpen(true)}
                onOpenCloseCashModal={() => setIsCloseCashModalOpen(true)}
                onOpenStatementModal={() => setIsStatementModalOpen(true)}
                onOpenDaySalesModal={handleOpenDaySales}
              />
            }
            onUpdateQuantity={handleUpdateQuantity}
            onSetQuantity={handleSetQuantity}
            onRemoveItem={handleRemoveItem}
            onDiscountCentsChange={setDiscountCents}
            onDiscountPctChange={setDiscountPctInput}
            onClearCart={handleClearCart}
            onCheckout={handleInitiateCheckout}
          />
        </Box>
      )}

      {/* ── Mobile Floating Cart Bar ── */}
      {isMobilePOS && (
        <Paper
          elevation={4}
          sx={{
            position: "fixed",
            bottom: "calc(12px + env(safe-area-inset-bottom, 0px))",
            left: { xs: 8, sm: 12 },
            right: { xs: 8, sm: 12 },
            zIndex: 1050,
            borderRadius: 3,
            p: 1.25,
            bgcolor: "background.paper",
            border: "1px solid",
            borderColor: "divider",
            boxShadow: "0 8px 24px rgba(0,0,0,0.14)",
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
                onClick={handleInitiateCheckout}
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
              maxHeight: "90dvh",
              display: "flex",
              flexDirection: "column",
              bgcolor: "background.paper",
              p: 2,
              pb: "calc(16px + env(safe-area-inset-bottom, 0px))",
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
              activeComandaId={activeComandaId}
              comandaSyncStatus={comandaSyncStatus}
              appointments={[...clientAppointments, ...allAppointments]}
              cashControl={
                <POSCashControlPill
                  currentSession={cashStatus?.current_session}
                  registers={registers}
                  selectedRegisterId={selectedRegisterId}
                  onSelectRegister={handleSelectRegister}
                  onOpenSupplyModal={() => setIsSupplyModalOpen(true)}
                  onOpenBleedModal={() => setIsBleedModalOpen(true)}
                  onOpenCloseCashModal={() => setIsCloseCashModalOpen(true)}
                  onOpenStatementModal={() => setIsStatementModalOpen(true)}
                  onOpenDaySalesModal={handleOpenDaySales}
                />
              }
              onUpdateQuantity={handleUpdateQuantity}
              onSetQuantity={handleSetQuantity}
              onRemoveItem={handleRemoveItem}
              onDiscountCentsChange={setDiscountCents}
              onDiscountPctChange={setDiscountPctInput}
              onClearCart={handleClearCart}
              onCheckout={() => {
                setMobileCartDrawerOpen(false);
                handleInitiateCheckout();
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
          clientName={selectedClient?.name}
          clients={clients}
          allPets={allPets}
          onSelectClient={(id) => setSelectedClientId(id)}
          appointmentId={selectedAppointmentId}
          comandaId={activeComandaId}
          cashRegisterId={selectedRegisterId}
          onSuccess={(sale) => {
            endSession();
            queryClient.invalidateQueries({ queryKey: ["day-sales"] });
            queryClient.invalidateQueries({ queryKey: ["sales"] });
            refetchDaySales();
            if (sale) {
              setCompletedSaleForReceipt(sale);
              setLastCompletedSale(sale);
              setIsSaleReceiptOpen(true);
            }
          }}
        />
      )}

      {isSaleReceiptOpen && completedSaleForReceipt && (
        <SaleReceiptModal
          open={isSaleReceiptOpen}
          onClose={() => {
            setIsSaleReceiptOpen(false);
            setCompletedSaleForReceipt(null);
          }}
          sale={completedSaleForReceipt}
          clientName={completedSaleForReceipt.client?.name || selectedClient?.name}
          clientPhone={completedSaleForReceipt.client?.phone || selectedClient?.phone}
          tenantName={tenant?.name}
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

      {/* ── Cash Register Modals ── */}
      {isOpenCashModalOpen && (
        <OpenCashModal
          open={isOpenCashModalOpen}
          onClose={() => setIsOpenCashModalOpen(false)}
          cashStatus={cashStatus}
          cashRegisterId={selectedRegisterId}
          registers={registers}
          onSelectRegister={handleSelectRegister}
          onOpenSupply={() => setIsSupplyModalOpen(true)}
          onOpenBleed={() => setIsBleedModalOpen(true)}
          onViewHistory={() => {
            setIsStatementModalOpen(true);
          }}
        />
      )}

      {isSupplyModalOpen && (
        <SupplyModal
          open={isSupplyModalOpen}
          onClose={() => setIsSupplyModalOpen(false)}
          currentBalance={effectiveDrawerBalance}
          cashRegisterId={selectedRegisterId}
        />
      )}

      {isBleedModalOpen && (
        <BleedModal
          open={isBleedModalOpen}
          onClose={() => setIsBleedModalOpen(false)}
          currentBalance={effectiveDrawerBalance}
          cashRegisterId={selectedRegisterId}
        />
      )}

      {isCloseCashModalOpen && (
        <CloseCashModal
          open={isCloseCashModalOpen}
          onClose={() => setIsCloseCashModalOpen(false)}
          currentSession={cashStatus?.current_session ?? null}
          cashRegisterId={selectedRegisterId}
          onPrintReceipt={(closedSession) => {
            setReceiptSessionData(closedSession);
            setIsReceiptPrintModalOpen(true);
          }}
        />
      )}

      {isStatementModalOpen && (
        <CashStatementModal
          open={isStatementModalOpen}
          onClose={() => setIsStatementModalOpen(false)}
          sessionData={cashStatus?.current_session ?? cashStatus?.last_closed_session ?? null}
          cashRegisterId={selectedRegisterId}
          onOpenSupply={() => setIsSupplyModalOpen(true)}
          onOpenBleed={() => setIsBleedModalOpen(true)}
          onOpenClose={() => setIsCloseCashModalOpen(true)}
          onOpenOpenModal={() => setIsOpenCashModalOpen(true)}
          onPrint={() => {
            const currentOrLast = cashStatus?.current_session ?? cashStatus?.last_closed_session;
            if (currentOrLast) {
              setReceiptSessionData(currentOrLast);
              setIsReceiptPrintModalOpen(true);
            }
          }}
        />
      )}

      {isReceiptPrintModalOpen && (
        <CashReceiptPrintModal
          open={isReceiptPrintModalOpen}
          onClose={() => setIsReceiptPrintModalOpen(false)}
          sessionData={receiptSessionData}
          tenantName={tenant?.name}
        />
      )}

      {/* ── Dialog de confirmação para remover serviço de agendamento ── */}
      {pendingRemoveItemIndex !== null && (
        <Dialog
          open={pendingRemoveItemIndex !== null}
          onClose={() => setPendingRemoveItemIndex(null)}
          maxWidth="xs"
          fullWidth
        >
          <DialogTitle sx={{ fontWeight: 800 }}>Remover serviço do agendamento?</DialogTitle>
          <DialogContent>
            <Typography variant="body2" color="text.primary">
              O serviço <strong>{cart[pendingRemoveItemIndex]?.name}</strong> pertence a um agendamento finalizado.
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              Ao remover da comanda, ele será dispensado da cobrança e registrado como <strong>Não Cobrado</strong> no agendamento, preservando todo o histórico e prontuário do pet.
            </Typography>
          </DialogContent>
          <DialogActions sx={{ p: 2, pt: 1 }}>
            <Button onClick={() => setPendingRemoveItemIndex(null)}>
              Cancelar
            </Button>
            <Button
              variant="contained"
              color="error"
              onClick={() => executeRemoveItem(pendingRemoveItemIndex)}
            >
              Sim, remover
            </Button>
          </DialogActions>
        </Dialog>
      )}

      {/* ── Dialog de confirmação para limpar ticket com agendamento ── */}
      {isClearConfirmOpen && (
        <Dialog
          open={isClearConfirmOpen}
          onClose={() => setIsClearConfirmOpen(false)}
          maxWidth="xs"
          fullWidth
        >
          <DialogTitle sx={{ fontWeight: 800 }}>Limpar Ticket de Venda</DialogTitle>
          <DialogContent>
            <Typography variant="body2" color="text.primary">
              Este ticket contém serviços de um agendamento finalizado. O que você deseja fazer?
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 1 }}>
              * Se escolher "Limpar tudo", os serviços do agendamento serão dispensados da cobrança (marcados como Não Cobrados), preservando o histórico do pet.
            </Typography>
          </DialogContent>
          <DialogActions sx={{ p: 2, pt: 1, flexDirection: "column", gap: 1, alignItems: "stretch" }}>
            <Button
              variant="contained"
              color="primary"
              onClick={executeClearOnlyExtras}
            >
              Limpar apenas produtos e itens extras
            </Button>
            <Button
              variant="outlined"
              onClick={() => setIsClearConfirmOpen(false)}
            >
              Cancelar
            </Button>
            <Button
              variant="text"
              color="error"
              onClick={executeClearAll}
              sx={{ fontWeight: 700 }}
            >
              Limpar tudo (remover agendamento e produtos)
            </Button>
          </DialogActions>
        </Dialog>
      )}

      {/* ── Modal de Vendas do Dia / Cancelamento ── */}
      {isDaySalesOpen && (
        <DaySalesModal
          open={isDaySalesOpen}
          date={todayStr}
          sales={todaySales}
          onRefresh={refetchDaySales}
          isLoading={isFetchingDaySales}
          onClose={() => setIsDaySalesOpen(false)}
        />
      )}
    </Box>
  );
}
