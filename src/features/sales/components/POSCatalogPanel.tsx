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
  ChevronDown,
  ChevronUp,
  ArrowLeft,
  Star,
} from "lucide-react";
import { getCoatTypeLabel } from "../../../utils/formatCoatType";
import type { CoatType } from "../../pets/types";

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

type CatalogTab = "products" | "services" | "packages" | null;

interface POSCatalogPanelProps {
  activeTab: CatalogTab;
  searchTerm: string;
  viewMode: "grid" | "list";
  isLoading: boolean;
  products: Product[];
  services: Service[];
  packages: Package[];
  lowStockProducts: Product[];
  lowStockExpanded: boolean;
  onTabChange: (tab: CatalogTab) => void;
  onSearchChange: (term: string) => void;
  onViewModeChange: (mode: "grid" | "list") => void;
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
  lowStockProducts,
  lowStockExpanded,
  onTabChange,
  onSearchChange,
  onViewModeChange,
  onLowStockToggle,
  onAddItem,
}: POSCatalogPanelProps) {
  const tabs: { id: CatalogTab; label: string; icon: React.ReactNode }[] = [
    { id: "products", label: "Produtos", icon: <Barcode size={20} /> },
    { id: "services", label: "Serviços", icon: <ClipboardList size={20} /> },
    { id: "packages", label: "Pacotes", icon: <ShoppingBag size={20} /> },
  ];

  // Derived state for the catalog
  const activeTabConfig = tabs.find((t) => t.id === activeTab);
  const categories = [...new Set(products.map((p) => p.category).filter(Boolean))] as string[];
  const bestSellers = products.slice(0, 4); // Mocked best sellers
  const favorites = products.slice(4, 6); // Mocked favorites

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

  if (activeTab === null) {
    return (
      <Box sx={{ display: "flex", flexDirection: "column", gap: 3, pt: 2, pb: 4 }}>
        <Typography variant="overline" sx={{ fontWeight: 800, color: "text.primary", letterSpacing: 1.5 }}>
          Adicionar ao Atendimento
        </Typography>
        <Grid container spacing={3}>
          {tabs.map((tab) => (
            <Grid size={{ xs: 12, md: 4 }} key={tab.id}>
              <Paper
                elevation={0}
                onClick={() => onTabChange(tab.id!)}
                sx={{
                  p: 2.5,
                  borderRadius: 3,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: 2,
                  border: "2px solid",
                  borderColor: "divider",
                  bgcolor: "background.paper",
                  transition: "all 0.2s ease",
                  "&:hover": {
                    borderColor: "primary.main",
                    bgcolor: alpha("#1976d2", 0.04),
                  },
                }}
              >
                <Box
                  sx={{
                    width: 48,
                    height: 48,
                    borderRadius: "50%",
                    bgcolor: alpha("#1976d2", 0.08),
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "primary.main",
                  }}
                >
                  {tab.icon}
                </Box>
                <Typography variant="subtitle1" sx={{ fontWeight: 800, color: "text.primary" }}>
                  {tab.label}
                </Typography>
              </Paper>
            </Grid>
          ))}
        </Grid>
      </Box>
    );
  }

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
      {/* Browsing Header */}
      <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
          <IconButton onClick={() => { onTabChange(null); onSearchChange(""); }} sx={{ bgcolor: "background.paper", border: "1px solid", borderColor: "divider" }}>
            <ArrowLeft size={20} />
          </IconButton>
          <Typography variant="h6" sx={{ fontWeight: 800, color: "text.primary" }}>
            {activeTabConfig?.label}
          </Typography>
        </Box>
        <TextField
          fullWidth
          size="small"
          placeholder={`Pesquisar ${activeTabConfig?.label.toLowerCase()}...`}
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
      </Box>

      {/* Low Stock Alert */}
      <Collapse in={lowStockProducts.length > 0 && activeTab === "products"}>
        <Alert
          severity="warning"
          onClick={onLowStockToggle}
          action={
            <IconButton size="small" onClick={(e) => { e.stopPropagation(); onLowStockToggle(); }}>
              {lowStockExpanded ? <ChevronUp size={22} /> : <ChevronDown size={22} />}
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
                <Typography key={p.id} variant="body2" color="text.primary">
                  {p.name} ({p.quantity} un)
                </Typography>
              ))}
            </Box>
          </Collapse>
        </Alert>
      </Collapse>

      {/* Products Tab */}
      {activeTab === "products" && (
        isLoading ? (
          <POSSkeleton viewMode={viewMode} />
        ) : !searchTerm ? (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 4 }}>
            {/* Favoritos */}
            {favorites.length > 0 && (
              <Box>
                <Typography variant="overline" sx={{ fontWeight: 800, color: "text.primary", display: "block", mb: 1.5 }}>
                  <Star size={14} style={{ marginRight: 4, verticalAlign: "middle" }} />
                  Favoritos do Cliente
                </Typography>
                <Grid container spacing={viewMode === "grid" ? 2 : 1}>
                  {favorites.map(renderProduct)}
                </Grid>
              </Box>
            )}

            {/* Mais Vendidos */}
            {bestSellers.length > 0 && (
              <Box>
                <Typography variant="overline" sx={{ fontWeight: 800, color: "text.primary", display: "block", mb: 1.5 }}>
                  🔥 Mais Vendidos
                </Typography>
                <Grid container spacing={viewMode === "grid" ? 2 : 1}>
                  {bestSellers.map(renderProduct)}
                </Grid>
              </Box>
            )}

            {/* Categories */}
            {categories.length > 0 && (
              <Box>
                <Typography variant="overline" sx={{ fontWeight: 800, color: "text.primary", display: "block", mb: 1.5 }}>
                  Categorias
                </Typography>
                <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
                  <Chip label="Todos" onClick={() => onSearchChange("")} sx={{ fontWeight: 700 }} color="primary" />
                  {categories.map(c => (
                    <Chip key={c} label={c} onClick={() => onSearchChange(c)} variant="outlined" sx={{ fontWeight: 600, bgcolor: "background.paper" }} />
                  ))}
                </Box>
              </Box>
            )}
          </Box>
        ) : (
          <Box>
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
              <Typography variant="overline" sx={{ fontWeight: 800, color: "primary.main", display: "block" }}>
                {products.length > 0 ? `Resultados para "${searchTerm}"` : "Nenhum produto encontrado"}
              </Typography>
              <ViewModeToggle viewMode={viewMode} onChange={onViewModeChange} />
            </Box>
            {products.length > 0 ? (
              <Grid container spacing={viewMode === "grid" ? 2 : 1}>
                {products.map(renderProduct)}
              </Grid>
            ) : (
              <Box sx={{ textAlign: "center", mt: 6 }}>
                <Filter size={64} style={{ opacity: 0.2, marginBottom: 16 }} />
                <Typography variant="h6" color="text.primary">Nenhum produto encontrado</Typography>
                <Typography variant="body2" color="text.primary">Tente mudar sua busca</Typography>
              </Box>
            )}
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
              {services.map((service) => (
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
              {packages.map((pkg) => (
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
  );
}
