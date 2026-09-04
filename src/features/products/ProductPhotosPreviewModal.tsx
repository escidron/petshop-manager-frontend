import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  Box,
  Typography,
  IconButton,
  Chip,
} from "@mui/material";
import {
  X,
  ChevronLeft,
  ChevronRight,
  Plus,
  Package,
} from "lucide-react";
import type { Product } from "./types";
import { formatBRLFromCents } from "../../utils/masks";
import { Button } from "../../components/Button/Button";

type Props = {
  open: boolean;
  onClose: () => void;
  product: Product | null;
  initialIndex?: number;
  onAddToCart?: (product: Product) => void;
};

export default function ProductPhotosPreviewModal({
  open,
  onClose,
  product,
  initialIndex = 0,
  onAddToCart,
}: Props) {
  const photos = product?.photos || [];
  const [currentIndex, setCurrentIndex] = useState(initialIndex);

  useEffect(() => {
    if (open) {
      setCurrentIndex(initialIndex >= 0 && initialIndex < photos.length ? initialIndex : 0);
    }
  }, [open, initialIndex, photos.length]);

  // Keyboard navigation (Arrow keys & Escape)
  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") {
        setCurrentIndex((prev) => (prev > 0 ? prev - 1 : photos.length - 1));
      } else if (e.key === "ArrowRight") {
        setCurrentIndex((prev) => (prev < photos.length - 1 ? prev + 1 : 0));
      } else if (e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, photos.length, onClose]);

  if (!product) return null;

  const currentPhoto = photos[currentIndex];
  const priceValue = product.price_cents ?? (product as any).price ?? 0;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      slotProps={{
        paper: {
          sx: {
            borderRadius: { xs: 2, sm: 3 },
            overflow: "hidden",
            bgcolor: "background.paper",
            maxHeight: "90vh",
            display: "flex",
            flexDirection: "column",
          },
        },
      }}
    >
      {/* Header */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          px: { xs: 2, sm: 2.5 },
          py: 1.75,
          borderBottom: "1px solid",
          borderColor: "divider",
        }}
      >
        <Box sx={{ minWidth: 0, pr: 1 }}>
          <Typography variant="subtitle1" fontWeight={800} noWrap>
            {product.name}
          </Typography>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, mt: 0.25 }}>
            {product.sku && (
              <Typography variant="caption" color="text.secondary">
                SKU: {product.sku}
              </Typography>
            )}
            {product.category && (
              <Chip
                label={product.category}
                size="small"
                sx={{ height: 18, fontSize: "0.68rem", fontWeight: 600 }}
              />
            )}
          </Box>
        </Box>

        <IconButton size="small" onClick={onClose} sx={{ color: "text.secondary" }}>
          <X size={20} />
        </IconButton>
      </Box>

      {/* Main Content: Photo Carousel */}
      <DialogContent
        sx={{
          p: 0,
          bgcolor: "#0F172A",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          position: "relative",
          height: { xs: 340, sm: 440 },
          minHeight: { xs: 340, sm: 440 },
          maxHeight: { xs: 340, sm: 440 },
          overflow: "hidden",
        }}
      >
        {photos.length > 0 && currentPhoto ? (
          <>
            <Box
              sx={{
                width: "100%",
                height: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                p: { xs: 1, sm: 2 },
              }}
            >
              <Box
                component="img"
                src={currentPhoto.photo_url}
                alt={`${product.name} - Foto ${currentIndex + 1}`}
                sx={{
                  maxWidth: "100%",
                  maxHeight: "100%",
                  width: "auto",
                  height: "auto",
                  objectFit: "contain",
                  display: "block",
                  userSelect: "none",
                }}
              />
            </Box>

            {/* Badges / Indicators */}
            {currentPhoto.is_primary && (
              <Chip
                label="Principal / Capa"
                color="primary"
                size="small"
                sx={{
                  position: "absolute",
                  top: 14,
                  left: 14,
                  fontWeight: 700,
                  fontSize: "0.7rem",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.4)",
                }}
              />
            )}

            {/* Navigation Arrows */}
            {photos.length > 1 && (
              <>
                <IconButton
                  onClick={() =>
                    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : photos.length - 1))
                  }
                  sx={{
                    position: "absolute",
                    left: 12,
                    color: "#fff",
                    bgcolor: "rgba(0,0,0,0.5)",
                    "&:hover": { bgcolor: "rgba(0,0,0,0.75)" },
                    p: { xs: 0.75, sm: 1 },
                  }}
                >
                  <ChevronLeft size={24} />
                </IconButton>

                <IconButton
                  onClick={() =>
                    setCurrentIndex((prev) => (prev < photos.length - 1 ? prev + 1 : 0))
                  }
                  sx={{
                    position: "absolute",
                    right: 12,
                    color: "#fff",
                    bgcolor: "rgba(0,0,0,0.5)",
                    "&:hover": { bgcolor: "rgba(0,0,0,0.75)" },
                    p: { xs: 0.75, sm: 1 },
                  }}
                >
                  <ChevronRight size={24} />
                </IconButton>

                {/* Counter */}
                <Box
                  sx={{
                    position: "absolute",
                    bottom: 12,
                    bgcolor: "rgba(0,0,0,0.6)",
                    color: "#fff",
                    px: 1.5,
                    py: 0.25,
                    borderRadius: 3,
                    fontSize: "0.75rem",
                    fontWeight: 600,
                  }}
                >
                  {currentIndex + 1} / {photos.length}
                </Box>
              </>
            )}
          </>
        ) : (
          <Box sx={{ textAlign: "center", color: "grey.500", py: 8 }}>
            <Package size={48} style={{ opacity: 0.4, marginBottom: 8 }} />
            <Typography variant="body2" color="grey.400">
              Nenhuma foto disponível para este produto.
            </Typography>
          </Box>
        )}
      </DialogContent>

      {/* Thumbnail Strip (if multiple photos) */}
      {photos.length > 1 && (
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1,
            px: 2,
            py: 1.25,
            bgcolor: "background.paper",
            borderTop: "1px solid",
            borderColor: "divider",
            overflowX: "auto",
            "&::-webkit-scrollbar": { height: 4 },
          }}
        >
          {photos.map((photo, index) => (
            <Box
              key={photo.id}
              onClick={() => setCurrentIndex(index)}
              sx={{
                width: 48,
                height: 48,
                borderRadius: 1.5,
                overflow: "hidden",
                border: "2px solid",
                borderColor: index === currentIndex ? "primary.main" : "transparent",
                cursor: "pointer",
                flexShrink: 0,
                opacity: index === currentIndex ? 1 : 0.6,
                transition: "all 0.15s ease",
                "&:hover": { opacity: 1 },
              }}
            >
              <Box
                component="img"
                src={photo.photo_url}
                alt={`Miniatura ${index + 1}`}
                sx={{ width: "100%", height: "100%", objectFit: "cover" }}
              />
            </Box>
          ))}
        </Box>
      )}

      {/* Footer: Details & Actions */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          px: { xs: 2, sm: 2.5 },
          py: 1.75,
          borderTop: "1px solid",
          borderColor: "divider",
          bgcolor: "background.paper",
          gap: 1.5,
          flexWrap: "wrap",
        }}
      >
        <Box>
          <Typography variant="caption" color="text.secondary" display="block">
            Preço de Venda
          </Typography>
          <Typography variant="h6" fontWeight={800} color="primary.main">
            R$ {formatBRLFromCents(priceValue) ?? "-"}
            <Typography component="span" variant="caption" color="text.secondary" sx={{ ml: 0.5, fontWeight: 600 }}>
              /{product.unit || "UN"}
            </Typography>
          </Typography>
        </Box>

        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
          {onAddToCart && (
            <Button
              variant="contained"
              startIcon={<Plus size={16} />}
              onClick={() => {
                onAddToCart(product);
                onClose();
              }}
              sx={{ borderRadius: 2, px: 2.5, fontWeight: 700 }}
            >
              Adicionar ao Caixa
            </Button>
          )}
        </Box>
      </Box>
    </Dialog>
  );
}
