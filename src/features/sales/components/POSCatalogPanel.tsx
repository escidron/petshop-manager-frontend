import {
  Box,
  Paper,
  Typography,
  Grid,
  Chip,
  InputAdornment,
  TextField,
  IconButton,
  Tooltip,
  alpha,
  Collapse,
  Alert,
  Skeleton,
} from "@mui/material";
import {
  Search,
  ClipboardList,
  Plus,
  Filter,
  LayoutGrid,
  List as ListIcon,
  ShoppingBag,
  Barcode,
  Calendar,
  Clock,
  ArrowRight,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import dayjs from "dayjs";
import { useState, useEffect } from "react";
import { getCoatTypeLabel } from "../../../utils/formatCoatType";
import type { CoatType } from "../../pets/types";
import type { Appointment } from "../../appointments/types";

interface Product {
  id: number;
  name: string;
  price_cents?: number;
  price?: number;
  quantity: number;
  unit?: string;
  category?: string;
  min_stock: number;
  is_active: boolean;
}

interface Service {
  id: number;
  name: string;
  price_cents?: number;
  is_active: boolean;
  species?: string;
  size?: string;
  coat_type?: string;
  duration_minutes?: number;
}

interface Package {
  id: number;
  name: string;
  price_cents?: number;
  description?: string;
  is_active: boolean;
}

type CatalogTab = "appointments" | "products" | "services" | "packages" | null;

interface POSCatalogPanelProps {
  activeTab: CatalogTab;
  searchTerm: string;
  viewMode: "grid" | "list";
  isLoading: boolean;
  products: Product[];
  services: Service[];
  packages: Package[];
  appointments?: Appointment[];
  getAppointmentPrice?: (apt: Appointment) => number;
  onPullAppointment?: (apt: Appointment) => void;
  onTabChange: (tab: CatalogTab) => void;
  onSearchChange: (term: string) => void;
  onViewModeChange: (mode: "grid" | "list") => void;
  lowStockProducts: Product[];
  lowStockExpanded: boolean;
  onLowStockToggle: () => void;
  onAddItem: (
    item: { id: number; name: string; price_cents?: number; quantity?: number },
    type: "product" | "service" | "package"
  ) => void;
}

const POSSkeleton = ({ viewMode }: { viewMode: "grid" | "list" }) => (
  <Grid container spacing={2}>
    {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
      <Grid
        size={viewMode === "grid" ? { xs: 6, sm: 6, md: 6, lg: 4, xl: 3 } : { xs: 12 }}
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

const ViewModeToggle = ({
  viewMode,
  onChange,
}: {
  viewMode: "grid" | "list";
  onChange: (mode: "grid" | "list") => void;
}) => (
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
        onClick={() => onChange("grid")}
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
        onClick={() => onChange("list")}
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
);

export default function POSCatalogPanel({
  activeTab,
  searchTerm,
  viewMode,
  isLoading,
  products,
  services,
  packages,
  onTabChange,
  onSearchChange,
  onViewModeChange,
  onAddItem,
  appointments = [],
  getAppointmentPrice,
  onPullAppointment,
  lowStockProducts,
  lowStockExpanded,
  onLowStockToggle,
}: POSCatalogPanelProps) {
  const [productLimit, setProductLimit] = useState(24);

  useEffect(() => {
    setProductLimit(24);
  }, [activeTab, searchTerm]);
  const tabs: { id: CatalogTab; label: string; icon: React.ReactNode }[] = [
    { id: "appointments", label: "Agendamentos", icon: <Calendar size={20} /> },
    { id: "products", label: "Produtos", icon: <Barcode size={20} /> },
    { id: "services", label: "Serviços", icon: <ClipboardList size={20} /> },
    { id: "packages", label: "Pacotes", icon: <ShoppingBag size={20} /> },
  ];

  // Derived state for the catalog
  const activeTabConfig = tabs.find((t) => t.id === activeTab);

  const renderProduct = (product: Product) => (
    <Grid
      size={viewMode === "grid" ? { xs: 6, sm: 6, md: 6, lg: 4, xl: 3 } : { xs: 12 }}
      key={`prod-${product.id}`}
    >
      {viewMode === "grid" ? (
        <Paper
          elevation={0}
          onClick={() => onAddItem(product, "product")}
          sx={{
            p: 2, borderRadius: 3, cursor: "pointer", height: "100%",
            display: "flex", flexDirection: "column", position: "relative",
            transition: "all 0.2s ease-in-out", border: "1px solid",
            borderColor: "divider", bgcolor: "background.paper",
            "&:hover": {
              borderColor: "primary.main",
              "& .add-btn": { bgcolor: "primary.main", color: "white" },
            },
          }}
        >
          <Box sx={{ mb: 1.5, display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <Box sx={{ width: 36, height: 36, borderRadius: 1.5, bgcolor: alpha("#1976d2", 0.08), display: "flex", alignItems: "center", justifyContent: "center", color: "primary.main" }}>
              <Barcode size={18} />
            </Box>
            <Chip label={`${product.quantity} ${product.unit || "UN"}`} size="small" sx={{ fontSize: "0.65rem", height: 20, bgcolor: "action.hover", fontWeight: 700 }} />
          </Box>
          <Typography variant="body2" sx={{ fontWeight: 700, mb: 1, color: "text.primary", lineClamp: 2 }}>
            {product.name}
          </Typography>
          <Box sx={{ mt: "auto", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 800, color: "primary.main" }}>
              R$ {((product.price_cents || (product as any).price || 0) / 100).toFixed(2)}
              <Typography component="span" variant="caption" color="text.primary" sx={{ fontWeight: 600, ml: 0.25 }}>
                /{product.unit?.toLowerCase() || "un"}
              </Typography>
            </Typography>
            <Box className="add-btn" sx={{ width: 28, height: 28, borderRadius: "50%", border: "1.5px solid", borderColor: "primary.main", display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.2s" }}>
              <Plus size={18} />
            </Box>
          </Box>
        </Paper>
      ) : (
        <Paper
          elevation={0}
          onClick={() => onAddItem(product, "product")}
          sx={{ p: 1.5, borderRadius: 2, cursor: "pointer", display: "flex", alignItems: "center", gap: 2, transition: "all 0.2s", border: "1px solid", borderColor: "divider", bgcolor: "background.paper", "&:hover": { borderColor: "primary.main" } }}
        >
          <Box sx={{ width: 32, height: 32, borderRadius: 1, bgcolor: alpha("#1976d2", 0.08), display: "flex", alignItems: "center", justifyContent: "center", color: "primary.main", flexShrink: 0 }}>
            <Barcode size={18} />
          </Box>
          <Typography variant="body2" sx={{ fontWeight: 700, flexGrow: 1 }}>{product.name}</Typography>
          <Chip label={`${product.quantity} ${product.unit || "UN"}`} size="small" sx={{ fontSize: "0.65rem", height: 18, fontWeight: 700 }} />
          <Typography variant="body2" sx={{ fontWeight: 800, color: "primary.main", minWidth: 80, textAlign: "right" }}>
            R$ {((product.price_cents || (product as any).price || 0) / 100).toFixed(2)}
            <Typography component="span" variant="caption" color="text.primary" sx={{ fontWeight: 600, ml: 0.25 }}>/{product.unit?.toLowerCase() || "un"}</Typography>
          </Typography>
          <IconButton size="small" color="primary"><Plus size={18} /></IconButton>
        </Paper>
      )}
    </Grid>
  );

  const renderAppointment = (apt: Appointment) => {
    const isToday = dayjs(apt.scheduled_at).isSame(dayjs(), "day");
    const price = getAppointmentPrice ? getAppointmentPrice(apt) : 0;
    const aptServices = [
      ...new Set(
        apt.items.flatMap((i) =>
          i.services
            .filter((s) => !s.is_package_covered)
            .map((s) => s.name)
        )
      ),
    ];
    const pets = [...new Set(apt.items.map((i) => i.pet.name))];

    return (
      <Paper
        key={apt.id}
        elevation={0}
        onClick={() => onPullAppointment && onPullAppointment(apt)}
        sx={{
          display: "flex", alignItems: "center", gap: 2, p: 2, mb: 1.5,
          border: "1px solid", borderColor: "divider", borderRadius: 3,
          bgcolor: "background.paper", cursor: "pointer", transition: "all 0.18s ease",
          "&:hover": { borderColor: "primary.main", bgcolor: (theme) => alpha(theme.palette.primary.main, 0.03) },
        }}
      >
        <Box
          sx={{
            width: 48, height: 48, borderRadius: 2,
            bgcolor: isToday ? (theme) => alpha(theme.palette.primary.main, 0.1) : "action.hover",
            display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
            flexShrink: 0, color: isToday ? "primary.main" : "text.primary",
          }}
        >
          {isToday ? (
            <>
              <Clock size={14} />
              <Typography variant="caption" sx={{ fontWeight: 800, fontSize: "0.6rem", mt: 0.25 }}>HOJE</Typography>
            </>
          ) : (
            <>
              <Typography variant="caption" sx={{ fontWeight: 800, lineHeight: 1.2, fontSize: "0.75rem" }}>{dayjs(apt.scheduled_at).format("DD")}</Typography>
              <Typography variant="caption" sx={{ fontWeight: 600, fontSize: "0.6rem", opacity: 0.7 }}>{dayjs(apt.scheduled_at).format("MMM").toUpperCase()}</Typography>
            </>
          )}
        </Box>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.4 }}>
            <Typography variant="body1" sx={{ fontWeight: 800, color: "text.primary", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
              {apt.client.name}
            </Typography>
            {isToday && (
              <Chip label={dayjs(apt.scheduled_at).format("HH:mm")} size="small" color="primary" variant="outlined" sx={{ height: 20, fontSize: "0.6rem", fontWeight: 800 }} />
            )}
          </Box>
          <Typography variant="caption" sx={{ color: "text.primary", fontWeight: 500, display: "block", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            {pets.join(", ")}
            {aptServices.length > 0 && ` • ${aptServices.join(", ")}`}
          </Typography>
        </Box>
        <Box sx={{ textAlign: "right", display: "flex", flexDirection: "column", alignItems: "flex-end" }}>
          {price > 0 && (
            <Typography variant="subtitle2" sx={{ fontWeight: 800, color: "success.main" }}>
              R$ {(price / 100).toFixed(2)}
            </Typography>
          )}
          <ArrowRight size={18} className="arrow-icon" style={{ opacity: 0.4 }} />
        </Box>
      </Paper>
    );
  };

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2, height: "100%" }}>
      {/* Tab Cards */}
      <Grid container spacing={1.5}>
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <Grid size={{ xs: 6, sm: 3 }} key={tab.id}>
              <Paper
                elevation={0}
                onClick={() => { onTabChange(tab.id!); onSearchChange(""); }}
                sx={{
                  p: 1.5,
                  borderRadius: 2,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 1,
                  border: "2px solid",
                  borderColor: isActive ? "primary.main" : "divider",
                  bgcolor: isActive ? alpha("#1976d2", 0.04) : "background.paper",
                  transition: "all 0.2s ease",
                  "&:hover": {
                    borderColor: "primary.main",
                    bgcolor: alpha("#1976d2", 0.04),
                  },
                }}
              >
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: isActive ? "primary.main" : "text.primary",
                  }}
                >
                  {tab.icon}
                </Box>
                <Typography variant="body2" sx={{ fontWeight: 800, color: isActive ? "primary.main" : "text.primary" }}>
                  {tab.label}
                </Typography>
              </Paper>
            </Grid>
          );
        })}
      </Grid>

      {/* Search Bar */}
      <TextField
        fullWidth
        size="small"
        placeholder={`Pesquisar ${activeTabConfig?.label.toLowerCase() || ""}...`}
        value={searchTerm}
        onChange={(e) => onSearchChange(e.target.value)}
        autoFocus
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <Search size={18} color="gray" />
            </InputAdornment>
          ),
          sx: { borderRadius: 3, bgcolor: "background.paper" },
        }}
      />

      {/* Low Stock Alert */}
      {/* Main Scrollable Container */}
      <Box 
        onScroll={(e) => {
          const target = e.target as HTMLElement;
          if (target.scrollHeight - target.scrollTop <= target.clientHeight + 100) {
            setProductLimit(prev => {
              const maxCurrent = 
                activeTab === "appointments" ? (appointments?.length || 0) :
                activeTab === "products" ? products.length :
                activeTab === "services" ? services.length :
                activeTab === "packages" ? packages.length : 0;
              if (prev < maxCurrent) {
                return prev + 24;
              }
              return prev;
            });
          }
        }}
        sx={{ flexGrow: 1, minHeight: 0, overflowY: "auto", pr: 1, display: "flex", flexDirection: "column", gap: 2, "&::-webkit-scrollbar": { width: 6 }, "&::-webkit-scrollbar-thumb": { backgroundColor: "rgba(0,0,0,0.1)", borderRadius: 4 } }}
      >
        {/* Low Stock Alert */}
        {lowStockProducts.length > 0 && activeTab === "products" && (
          <Alert
            severity="warning"
            onClick={onLowStockToggle}
            action={
              <IconButton size="small" onClick={(e) => { e.stopPropagation(); onLowStockToggle(); }}>
                {lowStockExpanded ? <ChevronUp size={22} /> : <ChevronDown size={22} />}
              </IconButton>
            }
            sx={{ borderRadius: 2, cursor: "pointer", flexShrink: 0 }}
          >
            <Typography variant="body2" sx={{ fontWeight: 700 }}>
              {lowStockProducts.length} produto
              {lowStockProducts.length > 1 ? "s" : ""} com estoque baixo
            </Typography>
            <Collapse in={lowStockExpanded}>
              <Box sx={{ mt: 0.5 }}>
                {lowStockProducts.map((p) => (
                  <Typography key={p.id} variant="body2" color="text.primary">
                    {p.name} ({p.quantity} un)
                  </Typography>
                ))}
              </Box>
            </Collapse>
          </Alert>
        )}

        {/* Appointments Tab */}
      {activeTab === "appointments" && (
        isLoading ? (
          <POSSkeleton viewMode="list" />
        ) : appointments.length === 0 ? (
          <Paper elevation={0} sx={{ p: 4, textAlign: "center", border: "1px solid", borderColor: "divider", borderRadius: 3, bgcolor: "background.paper" }}>
            <Calendar size={36} style={{ opacity: 0.2, marginBottom: 8 }} />
            <Typography variant="body1" sx={{ fontWeight: 600, color: "text.primary" }}>
              {searchTerm ? "Nenhum resultado encontrado" : "Nenhuma pendência"}
            </Typography>
            <Typography variant="body2" sx={{ color: "text.primary", mt: 0.5 }}>
              {searchTerm ? "Tente buscar por outro nome" : "Agendamentos finalizados aparecerão aqui"}
            </Typography>
          </Paper>
        ) : (
          <Box sx={{ display: "flex", flexDirection: "column" }}>
            {appointments.slice(0, productLimit).map(renderAppointment)}
          </Box>
        )
      )}

      {/* Products Tab */}
      {activeTab === "products" && (
        isLoading ? (
          <POSSkeleton viewMode={viewMode} />
        ) : products.length > 0 ? (
          <Box>
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
              <Typography variant="overline" sx={{ fontWeight: 800, color: "primary.main", display: "block" }}>
                {searchTerm ? `Resultados para "${searchTerm}"` : "Produtos"}
              </Typography>
              <ViewModeToggle viewMode={viewMode} onChange={onViewModeChange} />
            </Box>
            <Box>
              <Grid container spacing={viewMode === "grid" ? 2 : 1}>
                {products.slice(0, productLimit).map(renderProduct)}
              </Grid>
            </Box>
          </Box>
        ) : (
          <Box sx={{ textAlign: "center", mt: 10 }}>
            <Filter size={64} style={{ opacity: 0.2, marginBottom: 16 }} />
            <Typography variant="h6" color="text.primary">Nenhum produto encontrado</Typography>
            <Typography variant="body2" color="text.primary">Tente mudar sua busca</Typography>
          </Box>
        )
      )}

      {/* Services Tab */}
      {activeTab === "services" && (
        isLoading ? (
          <POSSkeleton viewMode={viewMode} />
        ) : services.length > 0 ? (
          <Box>
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
              <Typography variant="overline" sx={{ fontWeight: 800, color: "primary.main", display: "block" }}>
                {searchTerm ? `Resultados para "${searchTerm}"` : "Serviços de Pet Shop"}
              </Typography>
              <ViewModeToggle viewMode={viewMode} onChange={onViewModeChange} />
            </Box>
            <Grid container spacing={viewMode === "grid" ? 2 : 1}>
              {services.slice(0, productLimit).map((service) => (
                <Grid
                  size={viewMode === "grid" ? { xs: 6, sm: 6, md: 6, lg: 4, xl: 3 } : { xs: 12 }}
                  key={`serv-${service.id}`}
                >
                  {viewMode === "grid" ? (
                    <Paper
                      elevation={0}
                      onClick={() => onAddItem(service, "service")}
                      sx={{ p: 2, borderRadius: 3, cursor: "pointer", height: "100%", display: "flex", flexDirection: "column", position: "relative", transition: "all 0.2s ease-in-out", border: "1px solid", borderColor: "divider", bgcolor: "background.paper", "&:hover": { borderColor: "primary.main", "& .add-btn-s": { bgcolor: "primary.main", color: "white" } } }}
                    >
                      <Box sx={{ mb: 1.5, display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                        <Box sx={{ width: 36, height: 36, borderRadius: 1.5, bgcolor: alpha("#9c27b0", 0.08), display: "flex", alignItems: "center", justifyContent: "center", color: "primary.main" }}>
                          <ClipboardList size={18} />
                        </Box>
                        <Chip label="SERVIÇO" size="small" color="secondary" sx={{ fontSize: "0.6rem", height: 18, fontWeight: 800 }} />
                      </Box>
                      <Typography variant="body2" sx={{ fontWeight: 700, mb: 0.5, color: "text.primary" }}>{service.name}</Typography>
                      {(service.species || service.size || service.coat_type || service.duration_minutes) && (
                        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5, mb: 1 }}>
                          {service.species && <Chip label={service.species} size="small" sx={{ fontSize: "0.6rem", height: 18, fontWeight: 600 }} />}
                          {service.size && <Chip label={`Porte ${service.size}`} size="small" color="primary" variant="outlined" sx={{ fontSize: "0.6rem", height: 18, fontWeight: 600 }} />}
                          {service.coat_type && <Chip label={`Pel. ${getCoatTypeLabel(service.coat_type as CoatType)}`} size="small" sx={{ fontSize: "0.6rem", height: 18, fontWeight: 600 }} />}
                          {service.duration_minutes && <Chip label={`${service.duration_minutes} min`} size="small" variant="outlined" sx={{ fontSize: "0.6rem", height: 18, fontWeight: 600 }} />}
                        </Box>
                      )}
                      <Box sx={{ mt: "auto", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <Typography variant="subtitle1" sx={{ fontWeight: 800, color: "primary.main" }}>R$ {((service.price_cents || 0) / 100).toFixed(2)}</Typography>
                        <Box className="add-btn-s" sx={{ width: 28, height: 28, borderRadius: "50%", border: "1.5px solid", borderColor: "secondary.main", display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.2s" }}><Plus size={18} /></Box>
                      </Box>
                    </Paper>
                  ) : (
                    <Paper
                      elevation={0}
                      onClick={() => onAddItem(service, "service")}
                      sx={{ p: 1.5, borderRadius: 2, cursor: "pointer", display: "flex", alignItems: "center", gap: 2, transition: "all 0.2s", border: "1px solid", borderColor: "divider", bgcolor: "background.paper", "&:hover": { borderColor: "primary.main", bgcolor: alpha("#1976d2", 0.02) } }}
                    >
                      <Box sx={{ width: 32, height: 32, borderRadius: 1, bgcolor: alpha("#9c27b0", 0.08), display: "flex", alignItems: "center", justifyContent: "center", color: "primary.main", flexShrink: 0 }}><ClipboardList size={18} /></Box>
                      <Box sx={{ flexGrow: 1 }}>
                        <Typography variant="body2" sx={{ fontWeight: 700 }}>{service.name}</Typography>
                        {(service.species || service.size || service.coat_type || service.duration_minutes) && (
                          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5, mt: 0.25 }}>
                            {service.species && <Chip label={service.species} size="small" sx={{ fontSize: "0.55rem", height: 16, fontWeight: 600 }} />}
                            {service.size && <Chip label={`Porte ${service.size}`} size="small" color="primary" variant="outlined" sx={{ fontSize: "0.55rem", height: 16, fontWeight: 600 }} />}
                            {service.coat_type && <Chip label={`Pel. ${getCoatTypeLabel(service.coat_type as CoatType)}`} size="small" sx={{ fontSize: "0.55rem", height: 16, fontWeight: 600 }} />}
                            {service.duration_minutes && <Chip label={`${service.duration_minutes} min`} size="small" variant="outlined" sx={{ fontSize: "0.55rem", height: 16, fontWeight: 600 }} />}
                          </Box>
                        )}
                      </Box>
                      <Typography variant="body2" sx={{ fontWeight: 800, color: "primary.main", minWidth: 80, textAlign: "right" }}>R$ {((service.price_cents || 0) / 100).toFixed(2)}</Typography>
                      <IconButton size="small" color="primary"><Plus size={18} /></IconButton>
                    </Paper>
                  )}
                </Grid>
              ))}
            </Grid>
          </Box>
        ) : (
          <Box sx={{ textAlign: "center", mt: 10 }}>
            <Filter size={64} style={{ opacity: 0.2, marginBottom: 16 }} />
            <Typography variant="h6" color="text.primary">Nenhum serviço encontrado</Typography>
            <Typography variant="body2" color="text.primary">Tente mudar sua busca</Typography>
          </Box>
        )
      )}

      {/* Packages Tab */}
      {activeTab === "packages" && (
        isLoading ? (
          <POSSkeleton viewMode={viewMode} />
        ) : packages.length > 0 ? (
          <Box>
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
              <Typography variant="overline" sx={{ fontWeight: 800, color: "primary.main", display: "block" }}>
                {searchTerm ? `Resultados para "${searchTerm}"` : "Pacotes de Serviços / Produtos"}
              </Typography>
              <ViewModeToggle viewMode={viewMode} onChange={onViewModeChange} />
            </Box>
            <Grid container spacing={viewMode === "grid" ? 2 : 1}>
              {packages.slice(0, productLimit).map((pkg) => (
                <Grid
                  size={viewMode === "grid" ? { xs: 6, sm: 6, md: 6, lg: 4, xl: 3 } : { xs: 12 }}
                  key={`pkg-${pkg.id}`}
                >
                  {viewMode === "grid" ? (
                    <Paper
                      elevation={0}
                      onClick={() => onAddItem(pkg, "package")}
                      sx={{ p: 2, borderRadius: 3, cursor: "pointer", height: "100%", display: "flex", flexDirection: "column", position: "relative", transition: "all 0.2s ease-in-out", border: "1px solid", borderColor: "divider", bgcolor: "background.paper", "&:hover": { borderColor: "primary.main", "& .add-btn-p": { bgcolor: "primary.main", color: "white" } } }}
                    >
                      <Box sx={{ mb: 1.5, display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                        <Box sx={{ width: 36, height: 36, borderRadius: 1.5, bgcolor: alpha("#ff9800", 0.08), display: "flex", alignItems: "center", justifyContent: "center", color: "#ff9800" }}><ShoppingBag size={18} /></Box>
                        <Chip label="PACOTE" size="small" sx={{ fontSize: "0.65rem", fontWeight: 900, bgcolor: alpha("#ff9800", 0.1), color: "#ff9800", border: "none" }} />
                      </Box>
                      <Typography variant="body2" sx={{ fontWeight: 700, mb: 0.5, color: "text.primary" }}>{pkg.name}</Typography>
                      <Typography variant="caption" color="text.primary" sx={{ mb: 2, flexGrow: 1, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                        {pkg.description || "Combo promocional"}
                      </Typography>
                      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mt: "auto" }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 800, color: "primary.main" }}>R$ {((pkg.price_cents || 0) / 100).toFixed(2)}</Typography>
                        <IconButton size="small" className="add-btn-p" sx={{ transition: "all 0.2s", bgcolor: alpha("#1976d2", 0.04) }}><Plus size={18} /></IconButton>
                      </Box>
                    </Paper>
                  ) : (
                    <Paper
                      elevation={0}
                      onClick={() => onAddItem(pkg, "package")}
                      sx={{ p: 1.5, borderRadius: 2, cursor: "pointer", display: "flex", alignItems: "center", gap: 2, border: "1px solid", borderColor: "divider", bgcolor: "background.paper", "&:hover": { borderColor: "primary.main", boxShadow: "0 4px 12px rgba(0,0,0,0.05)" } }}
                    >
                      <Box sx={{ width: 32, height: 32, borderRadius: 1, bgcolor: alpha("#ff9800", 0.08), display: "flex", alignItems: "center", justifyContent: "center", color: "#ff9800", flexShrink: 0 }}><ShoppingBag size={18} /></Box>
                      <Typography variant="body2" sx={{ fontWeight: 700, flexGrow: 1 }}>{pkg.name}</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 800, color: "primary.main", minWidth: 80, textAlign: "right" }}>R$ {((pkg.price_cents || 0) / 100).toFixed(2)}</Typography>
                      <IconButton size="small" color="primary"><Plus size={18} /></IconButton>
                    </Paper>
                  )}
                </Grid>
              ))}
            </Grid>
          </Box>
        ) : (
          <Box sx={{ textAlign: "center", mt: 10 }}>
            <Filter size={64} style={{ opacity: 0.2, marginBottom: 16 }} />
            <Typography variant="h6" color="text.primary">Nenhum pacote encontrado</Typography>
            <Typography variant="body2" color="text.primary">Tente mudar sua busca</Typography>
          </Box>
        )
      )}
      </Box>
    </Box>
  );
}
