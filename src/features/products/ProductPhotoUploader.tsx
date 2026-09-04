import React, { useRef, useState, useEffect } from "react";
import {
  Box,
  Typography,
  IconButton,
  Tooltip,
  CircularProgress,
  Chip,
  alpha,
  useTheme,
} from "@mui/material";
import { ImagePlus, Trash2, Star, UploadCloud } from "lucide-react";
import type { ProductPhoto } from "./types";
import { deleteProductPhoto, setPrimaryProductPhoto } from "../../api/services/products";
import { useToast } from "../../hooks/useToast";

type PendingPhoto = {
  file: File;
  previewUrl: string;
};

type Props = {
  productId?: number;
  existingPhotos: ProductPhoto[];
  onExistingPhotosChange: (photos: ProductPhoto[]) => void;
  pendingFiles: File[];
  onPendingFilesChange: (files: File[]) => void;
  disabled?: boolean;
};

export default function ProductPhotoUploader({
  productId,
  existingPhotos,
  onExistingPhotosChange,
  pendingFiles,
  onPendingFilesChange,
  disabled = false,
}: Props) {
  const theme = useTheme();
  const toast = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [pendingPhotos, setPendingPhotos] = useState<PendingPhoto[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [loadingPhotoId, setLoadingPhotoId] = useState<number | null>(null);

  // Sync pendingPhotos previews when pendingFiles change
  useEffect(() => {
    // Generate previews for pending files
    const newPending: PendingPhoto[] = pendingFiles.map((file) => ({
      file,
      previewUrl: URL.createObjectURL(file),
    }));
    setPendingPhotos(newPending);

    return () => {
      // Cleanup object URLs on unmount or re-sync
      newPending.forEach((p) => URL.revokeObjectURL(p.previewUrl));
    };
  }, [pendingFiles]);

  const handleFilesSelected = (files: FileList | File[] | null) => {
    if (!files || files.length === 0) return;

    const validFiles = Array.from(files).filter((file) =>
      file.type.startsWith("image/")
    );

    if (validFiles.length === 0) {
      toast.error("Por favor, selecione apenas arquivos de imagem (JPG, PNG, WEBP).");
      return;
    }

    // Append to existing pending files
    const updated = [...pendingFiles, ...validFiles];
    onPendingFilesChange(updated);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled) setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (disabled) return;
    handleFilesSelected(e.dataTransfer.files);
  };

  // Remove a pending file before save
  const handleRemovePending = (index: number) => {
    const updated = pendingFiles.filter((_, i) => i !== index);
    onPendingFilesChange(updated);
  };

  // Set pending photo as primary by moving it to index 0
  const handleSetPendingPrimary = (index: number) => {
    if (index === 0) return;
    const selected = pendingFiles[index];
    const rest = pendingFiles.filter((_, i) => i !== index);
    onPendingFilesChange([selected, ...rest]);
  };

  // Delete existing photo from GCP and DB
  const handleDeleteExisting = async (photoId: number) => {
    if (!productId) return;
    try {
      setLoadingPhotoId(photoId);
      await deleteProductPhoto(productId, photoId);
      toast.success("Foto removida com sucesso!");
      const updated = existingPhotos.filter((p) => p.id !== photoId);
      // If deleted was primary and others remain, first remaining becomes primary
      if (updated.length > 0 && !updated.some((p) => p.is_primary)) {
        updated[0].is_primary = true;
      }
      onExistingPhotosChange(updated);
    } catch (error) {
      console.error(error);
      toast.error("Erro ao excluir foto do produto.");
    } finally {
      setLoadingPhotoId(null);
    }
  };

  // Set existing photo as primary
  const handleSetExistingPrimary = async (photoId: number) => {
    if (!productId) return;
    try {
      setLoadingPhotoId(photoId);
      await setPrimaryProductPhoto(productId, photoId);
      toast.success("Foto principal atualizada!");
      const updated = existingPhotos.map((p) => ({
        ...p,
        is_primary: p.id === photoId,
      }));
      onExistingPhotosChange(updated);
    } catch (error) {
      console.error(error);
      toast.error("Erro ao definir foto principal.");
    } finally {
      setLoadingPhotoId(null);
    }
  };

  const totalPhotos = existingPhotos.length + pendingPhotos.length;
  const hasExistingPrimary = existingPhotos.some((p) => p.is_primary);

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <Box>
          <Typography variant="subtitle2" fontWeight={700} color="text.primary">
            Fotos do Produto
          </Typography>
          <Typography fontSize="12px" color="text.secondary">
            Selecione uma ou mais fotos para o catálogo e PDV
          </Typography>
        </Box>
        {totalPhotos > 0 && (
          <Chip
            size="small"
            label={`${totalPhotos} ${totalPhotos === 1 ? "foto" : "fotos"}`}
            sx={{ fontWeight: 600, bgcolor: "secondary.main", fontSize: "0.75rem" }}
          />
        )}
      </Box>

      {/* Hidden file input */}
      <input
        type="file"
        ref={fileInputRef}
        style={{ display: "none" }}
        accept="image/*"
        multiple
        disabled={disabled}
        onChange={(e) => {
          handleFilesSelected(e.target.files);
          if (fileInputRef.current) fileInputRef.current.value = "";
        }}
      />

      {/* Photo Gallery Grid */}
      {totalPhotos > 0 && (
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(100px, 1fr))",
            gap: 1.5,
            pt: 0.5,
          }}
        >
          {/* Existing Photos */}
          {existingPhotos.map((photo) => {
            const isBusy = loadingPhotoId === photo.id;
            return (
              <Box
                key={`existing-${photo.id}`}
                sx={{
                  position: "relative",
                  width: "100%",
                  aspectRatio: "1/1",
                  borderRadius: 2,
                  overflow: "hidden",
                  border: "2px solid",
                  borderColor: photo.is_primary ? "primary.main" : "divider",
                  bgcolor: "#000",
                  transition: "all 0.2s ease",
                  "&:hover .overlay-actions": {
                    opacity: 1,
                  },
                }}
              >
                <Box
                  component="img"
                  src={photo.photo_url}
                  alt="Foto do produto"
                  sx={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                    display: "block",
                    opacity: isBusy ? 0.4 : 1,
                  }}
                />

                {/* Primary Badge */}
                {photo.is_primary && (
                  <Chip
                    size="small"
                    label="Principal"
                    color="primary"
                    sx={{
                      position: "absolute",
                      top: 4,
                      left: 4,
                      height: 18,
                      fontSize: "0.62rem",
                      fontWeight: 700,
                      px: 0.5,
                      boxShadow: "0 2px 4px rgba(0,0,0,0.25)",
                    }}
                  />
                )}

                {/* Loading Spinner */}
                {isBusy && (
                  <Box
                    sx={{
                      position: "absolute",
                      inset: 0,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <CircularProgress size={24} sx={{ color: "#fff" }} />
                  </Box>
                )}

                {/* Hover Actions */}
                {!isBusy && !disabled && (
                  <Box
                    className="overlay-actions"
                    sx={{
                      position: "absolute",
                      inset: 0,
                      bgcolor: "rgba(0,0,0,0.45)",
                      opacity: 0,
                      transition: "opacity 0.2s ease",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 1,
                    }}
                  >
                    {!photo.is_primary && (
                      <Tooltip title="Definir como principal">
                        <IconButton
                          size="small"
                          onClick={() => handleSetExistingPrimary(photo.id)}
                          sx={{
                            bgcolor: "rgba(255,255,255,0.9)",
                            color: "warning.dark",
                            "&:hover": { bgcolor: "#fff" },
                            p: 0.6,
                          }}
                        >
                          <Star size={15} fill="currentColor" />
                        </IconButton>
                      </Tooltip>
                    )}

                    <Tooltip title="Excluir foto">
                      <IconButton
                        size="small"
                        onClick={() => handleDeleteExisting(photo.id)}
                        sx={{
                          bgcolor: "rgba(255,255,255,0.9)",
                          color: "error.main",
                          "&:hover": { bgcolor: "#fff" },
                          p: 0.6,
                        }}
                      >
                        <Trash2 size={15} />
                      </IconButton>
                    </Tooltip>
                  </Box>
                )}
              </Box>
            );
          })}

          {/* Pending Photos (newly selected) */}
          {pendingPhotos.map((item, idx) => {
            // First pending photo is considered primary if no existing photo is primary
            const isPrimary = !hasExistingPrimary && idx === 0;

            return (
              <Box
                key={`pending-${idx}`}
                sx={{
                  position: "relative",
                  width: "100%",
                  aspectRatio: "1/1",
                  borderRadius: 2,
                  overflow: "hidden",
                  border: "2px solid",
                  borderColor: isPrimary ? "primary.main" : "divider",
                  bgcolor: "#000",
                  transition: "all 0.2s ease",
                  "&:hover .overlay-actions": {
                    opacity: 1,
                  },
                }}
              >
                <Box
                  component="img"
                  src={item.previewUrl}
                  alt={`Nova foto ${idx + 1}`}
                  sx={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                    display: "block",
                  }}
                />

                {/* Primary Badge */}
                {isPrimary && (
                  <Chip
                    size="small"
                    label="Principal"
                    color="primary"
                    sx={{
                      position: "absolute",
                      top: 4,
                      left: 4,
                      height: 18,
                      fontSize: "0.62rem",
                      fontWeight: 700,
                      px: 0.5,
                      boxShadow: "0 2px 4px rgba(0,0,0,0.25)",
                    }}
                  />
                )}

                {/* Hover Actions */}
                {!disabled && (
                  <Box
                    className="overlay-actions"
                    sx={{
                      position: "absolute",
                      inset: 0,
                      bgcolor: "rgba(0,0,0,0.45)",
                      opacity: 0,
                      transition: "opacity 0.2s ease",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 1,
                    }}
                  >
                    {!isPrimary && (
                      <Tooltip title="Definir como principal">
                        <IconButton
                          size="small"
                          onClick={() => handleSetPendingPrimary(idx)}
                          sx={{
                            bgcolor: "rgba(255,255,255,0.9)",
                            color: "warning.dark",
                            "&:hover": { bgcolor: "#fff" },
                            p: 0.6,
                          }}
                        >
                          <Star size={15} fill="currentColor" />
                        </IconButton>
                      </Tooltip>
                    )}

                    <Tooltip title="Remover">
                      <IconButton
                        size="small"
                        onClick={() => handleRemovePending(idx)}
                        sx={{
                          bgcolor: "rgba(255,255,255,0.9)",
                          color: "error.main",
                          "&:hover": { bgcolor: "#fff" },
                          p: 0.6,
                        }}
                      >
                        <Trash2 size={15} />
                      </IconButton>
                    </Tooltip>
                  </Box>
                )}
              </Box>
            );
          })}

          {/* "+ Adicionar mais" button card */}
          {!disabled && (
            <Box
              onClick={() => fileInputRef.current?.click()}
              sx={{
                width: "100%",
                aspectRatio: "1/1",
                borderRadius: 2,
                border: "2px dashed",
                borderColor: "divider",
                bgcolor: "background.paper",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                gap: 0.5,
                transition: "all 0.2s ease",
                "&:hover": {
                  borderColor: "primary.main",
                  bgcolor: alpha(theme.palette.primary.main, 0.04),
                  transform: "translateY(-2px)",
                },
              }}
            >
              <ImagePlus size={22} color={theme.palette.text.secondary} />
              <Typography variant="caption" color="text.secondary" fontWeight={600} fontSize="0.7rem">
                Adicionar
              </Typography>
            </Box>
          )}
        </Box>
      )}

      {/* Main Upload Dropzone (when no photos yet) */}
      {totalPhotos === 0 && (
        <Box
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => !disabled && fileInputRef.current?.click()}
          sx={{
            p: 3,
            border: "2px dashed",
            borderColor: isDragging ? "primary.main" : "divider",
            bgcolor: isDragging
              ? alpha(theme.palette.primary.main, 0.08)
              : alpha(theme.palette.background.default || "#F8FAFC", 0.6),
            borderRadius: 2.5,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            textAlign: "center",
            cursor: disabled ? "not-allowed" : "pointer",
            transition: "all 0.2s ease",
            "&:hover": {
              borderColor: disabled ? "divider" : "primary.main",
              bgcolor: disabled ? "transparent" : alpha(theme.palette.primary.main, 0.04),
            },
          }}
        >
          <Box
            sx={{
              width: 44,
              height: 44,
              borderRadius: "50%",
              bgcolor: alpha(theme.palette.primary.main, 0.1),
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "primary.main",
              mb: 1,
            }}
          >
            <UploadCloud size={24} />
          </Box>
          <Typography variant="body2" fontWeight={600} color="text.primary">
            Arraste e solte fotos aqui, ou clique para buscar
          </Typography>
          <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5 }}>
            Selecione uma ou várias fotos (JPG, PNG, WEBP)
          </Typography>
        </Box>
      )}
    </Box>
  );
}
