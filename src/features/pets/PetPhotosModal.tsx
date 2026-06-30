import React, { useRef, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogActions,
  Grid,
  IconButton,
  Typography,
  Box,
  CircularProgress,
  Card,
  CardMedia,
  Tooltip,
} from "@mui/material";
import { Star, Trash2, Plus, X, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "../../components/Button/Button";
import type { Pet } from "./types";
import { uploadPetPhoto, deletePetPhoto, setProfilePhoto } from "../../api/services/pets";
import { useToast } from "../../hooks/useToast";

type Props = {
  pet: Pet;
  open: boolean;
  onClose: () => void;
  onRefresh: () => void;
};

export default function PetPhotosModal({ pet, open, onClose, onRefresh }: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [settingProfileId, setSettingProfileId] = useState<number | null>(null);
  const [photoToDelete, setPhotoToDelete] = useState<number | null>(null);
  const [previewIndex, setPreviewIndex] = useState<number | null>(null);
  const toast = useToast();

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const validFiles = Array.from(files).filter(file => file.type.startsWith("image/"));
    if (validFiles.length === 0) {
      toast.error("Por favor, selecione apenas arquivos de imagem válidos.");
      return;
    }

    try {
      setUploading(true);
      await Promise.all(
        validFiles.map(file => uploadPetPhoto(pet.id, file, false, "general"))
      );
      toast.success(
        validFiles.length === 1
          ? "Foto adicionada com sucesso!"
          : `${validFiles.length} fotos adicionadas com sucesso!`
      );
      onRefresh();
    } catch (error) {
      console.error(error);
      toast.error("Erro ao fazer upload das fotos.");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleDeleteConfirm = async () => {
    if (photoToDelete === null) return;
    try {
      setDeletingId(photoToDelete);
      await deletePetPhoto(pet.id, photoToDelete);
      toast.success("Foto excluída com sucesso!");
      setPhotoToDelete(null);
      onRefresh();
    } catch (error) {
      console.error(error);
      toast.error("Erro ao excluir a foto.");
    } finally {
      setDeletingId(null);
    }
  };

  const handleSetProfile = async (photoId: number) => {
    try {
      setSettingProfileId(photoId);
      await setProfilePhoto(pet.id, photoId);
      toast.success("Foto de perfil atualizada!");
      onRefresh();
    } catch (error) {
      console.error(error);
      toast.error("Erro ao definir foto de perfil.");
    } finally {
      setSettingProfileId(null);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
      <DialogTitle sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", pb: 1 }}>
        <Typography variant="h6" fontWeight={700} color="text.primary">
          Galeria de Fotos: {pet.name}
        </Typography>
        <IconButton onClick={onClose} size="small" sx={{ color: "text.primary" }}>
          <X size={20} />
        </IconButton>
      </DialogTitle>

      <DialogContent dividers sx={{ p: 3, borderTop: "1px solid", borderBottom: "1px solid", borderColor: "divider" }}>
        {/* Upload Section */}
        <Box
          sx={{
            display: "flex",
            justifyContent: "flex-end",
            alignItems: "center",
            mb: 3,
          }}
        >
          <input
            type="file"
            ref={fileInputRef}
            style={{ display: "none" }}
            accept="image/*"
            multiple
            onChange={handleFileChange}
            disabled={uploading}
          />

          <Button
            variant="contained"
            startIcon={uploading ? <CircularProgress size={16} color="inherit" /> : <Plus size={16} />}
            onClick={handleUploadClick}
            disabled={uploading}
            sx={{ px: 3, borderRadius: 2 }}
          >
            {uploading ? "Enviando..." : "Adicionar Nova Foto"}
          </Button>
        </Box>

        {/* Photos Grid */}
        {!pet.photos || pet.photos.length === 0 ? (
          <Box
            sx={{
              py: 8,
              textAlign: "center",
              border: "2px dashed",
              borderColor: "divider",
              borderRadius: 3,
              bgcolor: "background.default",
            }}
          >
            <Typography color="text.primary" fontWeight={500}>
              Nenhuma foto adicionada a este pet ainda.
            </Typography>
          </Box>
        ) : (
          <Grid container spacing={2}>
            {pet.photos.map((photo, index) => (
              <Grid size={{ xs: 12, sm: 6, md: 4 }} key={photo.id}>
                <Card
                  sx={{
                    position: "relative",
                    borderRadius: 3,
                    overflow: "hidden",
                    boxShadow: photo.is_profile ? "0 0 0 2px #ffc107, 0 8px 16px rgba(255, 193, 7, 0.15)" : "0 4px 12px rgba(0,0,0,0.05)",
                    transition: "box-shadow 0.2s",
                    "&:hover": {
                      boxShadow: photo.is_profile ? "0 0 0 3px #ffc107, 0 12px 20px rgba(255, 193, 7, 0.25)" : "0 8px 24px rgba(0,0,0,0.12)",
                      "& .photo-actions": {
                        opacity: 1,
                      },
                    },
                  }}
                >
                  <CardMedia
                    component="img"
                    height="200"
                    image={photo.photo_url}
                    alt="Foto do pet"
                    onClick={() => setPreviewIndex(index)}
                    sx={{ objectFit: "cover", cursor: "pointer" }}
                  />

                  {/* Badge de Perfil */}
                  {photo.is_profile && (
                    <Box
                      sx={{
                        position: "absolute",
                        top: 12,
                        left: 12,
                        bgcolor: "#ffc107",
                        color: "#000",
                        fontWeight: 700,
                        px: 1.5,
                        py: 0.5,
                        borderRadius: 2,
                        fontSize: "0.7rem",
                        display: "flex",
                        alignItems: "center",
                        gap: 0.5,
                        boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
                        textTransform: "uppercase",
                        letterSpacing: "0.5px",
                      }}
                    >
                      <Star size={12} fill="#000" color="#000" /> Perfil
                    </Box>
                  )}

                  {/* Overlay de Ações (Aparece no Hover) */}
                  <Box
                    className="photo-actions"
                    sx={{
                      position: "absolute",
                      bottom: 0,
                      left: 0,
                      right: 0,
                      bgcolor: "rgba(0, 0, 0, 0.6)",
                      backdropFilter: "blur(2px)",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      p: 1,
                      opacity: 0,
                      transition: "opacity 0.2s ease-in-out",
                    }}
                  >
                    <Box>
                      {!photo.is_profile ? (
                        <Tooltip title="Definir como perfil" placement="top">
                          <IconButton
                            size="small"
                            onClick={() => handleSetProfile(photo.id)}
                            disabled={settingProfileId !== null}
                            sx={{ color: "white", "&:hover": { color: "#ffc107" } }}
                          >
                            {settingProfileId === photo.id ? (
                              <CircularProgress size={16} color="inherit" />
                            ) : (
                              <Star size={18} />
                            )}
                          </IconButton>
                        </Tooltip>
                      ) : (
                        <Typography variant="caption" sx={{ color: "#ffc107", pl: 1, fontWeight: 600 }}>
                          Foto Principal
                        </Typography>
                      )}
                    </Box>

                    <Tooltip title="Excluir foto" placement="top">
                      <IconButton
                        size="small"
                        onClick={() => setPhotoToDelete(photo.id)}
                        disabled={deletingId !== null}
                        sx={{ color: "white", "&:hover": { color: "#f44336" } }}
                      >
                        {deletingId === photo.id ? (
                          <CircularProgress size={16} color="inherit" />
                        ) : (
                          <Trash2 size={18} />
                        )}
                      </IconButton>
                    </Tooltip>
                  </Box>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}
      </DialogContent>

      {/* Modal de Confirmação de Exclusão */}
      <Dialog
        open={photoToDelete !== null}
        onClose={() => setPhotoToDelete(null)}
        maxWidth="xs"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3 } }}
      >
        <DialogTitle sx={{ fontWeight: 600 }}>Excluir Foto</DialogTitle>
        <DialogContent>
          <Typography>Tem certeza que deseja excluir esta foto da galeria?</Typography>
        </DialogContent>
        <DialogActions sx={{ p: 3, gap: 1 }}>
          <Button variant="text" onClick={() => setPhotoToDelete(null)}>
            Cancelar
          </Button>
          <Button
            variant="contained"
            onClick={handleDeleteConfirm}
            disabled={deletingId !== null}
            sx={{ bgcolor: "error.light" }}
          >
            Excluir
          </Button>
        </DialogActions>
      </Dialog>

      {/* Lightbox / Carrossel de Visualização das Fotos */}
      <Dialog
        open={previewIndex !== null}
        onClose={() => setPreviewIndex(null)}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            bgcolor: "black",
            borderRadius: 3,
            overflow: "hidden",
            boxShadow: "none",
          },
        }}
      >
        <Box sx={{ position: "relative", display: "flex", alignItems: "center", justifyContent: "center", height: "550px", width: "100%", bgcolor: "black" }}>
          {previewIndex !== null && pet.photos && pet.photos[previewIndex] && (
            <>
              {/* Imagem Principal */}
              <img
                src={pet.photos[previewIndex].photo_url}
                alt="Pet Foto Grande"
                style={{
                  maxWidth: "90%",
                  maxHeight: "480px",
                  objectFit: "contain",
                }}
              />

              {/* Botão Fechar */}
              <IconButton
                onClick={() => setPreviewIndex(null)}
                sx={{
                  position: "absolute",
                  top: 16,
                  right: 16,
                  color: "white",
                  bgcolor: "rgba(0, 0, 0, 0.5)",
                  "&:hover": { bgcolor: "rgba(0, 0, 0, 0.7)" },
                }}
              >
                <X size={20} />
              </IconButton>

              {/* Navegação Esquerda */}
              {pet.photos.length > 1 && (
                <IconButton
                  onClick={() =>
                    setPreviewIndex((prev) =>
                      prev !== null ? (prev === 0 ? pet.photos!.length - 1 : prev - 1) : null
                    )
                  }
                  sx={{
                    position: "absolute",
                    left: 16,
                    color: "white",
                    bgcolor: "rgba(0, 0, 0, 0.5)",
                    "&:hover": { bgcolor: "rgba(0, 0, 0, 0.7)" },
                  }}
                >
                  <ChevronLeft size={24} />
                </IconButton>
              )}

              {/* Navegação Direita */}
              {pet.photos.length > 1 && (
                <IconButton
                  onClick={() =>
                    setPreviewIndex((prev) =>
                      prev !== null ? (prev === pet.photos!.length - 1 ? 0 : prev + 1) : null
                    )
                  }
                  sx={{
                    position: "absolute",
                    right: 16,
                    color: "white",
                    bgcolor: "rgba(0, 0, 0, 0.5)",
                    "&:hover": { bgcolor: "rgba(0, 0, 0, 0.7)" },
                  }}
                >
                  <ChevronRight size={24} />
                </IconButton>
              )}

              {/* Indicador de Quantidade */}
              <Box
                sx={{
                  position: "absolute",
                  bottom: 16,
                  color: "white",
                  bgcolor: "rgba(0, 0, 0, 0.6)",
                  px: 2,
                  py: 0.5,
                  borderRadius: 2,
                  fontSize: "0.85rem",
                }}
              >
                {previewIndex + 1} / {pet.photos.length}
              </Box>
            </>
          )}
        </Box>
      </Dialog>
    </Dialog>
  );
}
