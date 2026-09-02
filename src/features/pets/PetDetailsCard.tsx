import CustomCard from "../../components/Card/CustomCard";
import {
  Box,
  Chip,
  Divider,
  IconButton,
  Typography,
  CircularProgress,
} from "@mui/material";
import { Mars, Pencil, Trash2, Venus, Camera, Image } from "lucide-react";
import theme from "../../theme";
import type { Pet } from "./types";
import { useRef, useState } from "react";
import { uploadPetPhoto } from "../../api/services/pets";
import { useToast } from "../../hooks/useToast";
import { Button } from "../../components/Button/Button";
import { PET_SIZES, COAT_TYPES } from "./constants";

type Props = {
  pet: Pet;
  onEdit: (pet: Pet) => void;
  onDelete: (pet: Pet) => void;
  onPhotoUploadSuccess?: () => void;
  onViewPhotos?: (pet: Pet) => void;
};

const PetDetailsCard = ({ pet, onEdit, onDelete, onPhotoUploadSuccess, onViewPhotos }: Props) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const toast = useToast();

  const profilePhoto = pet.photos?.find((p) => p.is_profile);

  const handleImageClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Apenas imagens
    if (!file.type.startsWith("image/")) {
      toast.error("Por favor, selecione um arquivo de imagem válido.");
      return;
    }

    try {
      setUploading(true);
      await uploadPetPhoto(pet.id, file, true, "profile");
      toast.success("Foto de perfil atualizada com sucesso!");
      if (onPhotoUploadSuccess) {
        onPhotoUploadSuccess();
      }
    } catch (error) {
      console.error("Erro ao fazer upload da foto:", error);
      toast.error("Erro ao fazer upload da foto de perfil.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <CustomCard
      sx={{
        display: "flex",
        gap: { xs: 1.5, sm: 2 },
        height: "auto",
        minHeight: { xs: 120, sm: 150 },
        mt: 1.5,
        p: { xs: 1.25, sm: 1.75 },
        width: "100%",
        minWidth: 0,
      }}
    >
      <Box
        onClick={handleImageClick}
        sx={{
          width: { xs: 76, sm: 115, md: 125 },
          height: { xs: 76, sm: "auto" },
          aspectRatio: 1,
          borderRadius: 2.5,
          position: "relative",
          cursor: "pointer",
          overflow: "hidden",
          flexShrink: 0,
          alignSelf: { xs: "flex-start", sm: "stretch" },
          "&:hover .upload-overlay": {
            opacity: 1,
          },
        }}
      >
        <input
          type="file"
          ref={fileInputRef}
          style={{ display: "none" }}
          accept="image/*"
          onChange={handleFileChange}
          disabled={uploading}
        />

        <Box sx={{ height: "100%", backgroundColor: "text.primary", borderRadius: 2.5 }}>
          {uploading ? (
            <Box
              sx={{
                display: "flex",
                height: "100%",
                alignItems: "center",
                justifyContent: "center",
                bgcolor: "rgba(0, 0, 0, 0.5)",
              }}
            >
              <CircularProgress size={24} color="inherit" />
            </Box>
          ) : (
            <img
              style={{ height: "100%", width: "100%", objectFit: "cover", borderRadius: 10 }}
              alt="pet photo"
              src={
                profilePhoto
                  ? profilePhoto.photo_url
                  : pet.species === "Canino"
                  ? "/dog_background.png"
                  : "/cat_background.png"
              }
            />
          )}
        </Box>

        {!uploading && (
          <Box
            className="upload-overlay"
            sx={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              bgcolor: "rgba(0, 0, 0, 0.4)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              opacity: 0,
              transition: "opacity 0.2s ease-in-out",
              borderRadius: 2.5,
            }}
          >
            <Camera color="#fff" size={22} />
          </Box>
        )}
      </Box>

      <Box sx={{ width: "100%", minWidth: 0, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 1, flexWrap: "wrap" }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, minWidth: 0 }}>
            <Typography variant="h6" fontWeight={700} sx={{ fontSize: { xs: "0.95rem", sm: "1.15rem" } }}>
              {pet.name}
            </Typography>
            {pet.gender && ["male", "female"].includes(pet.gender) && (
              <Chip
                label={pet.gender === "male" ? "Macho" : "Fêmea"}
                size="small"
                icon={
                  pet.gender === "male" ? (
                    <Mars color={theme.palette.text.primary} size={14} />
                  ) : (
                    <Venus color={theme.palette.text.primary} size={14} />
                  )
                }
                sx={{
                  bgcolor:
                    pet.gender === "male"
                      ? "rgba(33, 150, 243, 0.15)"
                      : "rgba(233, 30, 99, 0.15)",
                  color: "text.primary",
                  height: 20,
                  fontSize: "0.7rem",
                  fontWeight: 600,
                  px: 0.5,
                }}
              />
            )}
            {pet.is_deceased && (
              <Chip
                label="Óbito 🖤"
                size="small"
                sx={{
                  bgcolor: "rgba(0, 0, 0, 0.6)",
                  color: "#fff",
                  fontWeight: 600,
                  height: 20,
                  fontSize: "0.7rem",
                  px: 0.5,
                }}
              />
            )}
          </Box>
          {onViewPhotos && (
            <Button
              variant="outlined"
              size="small"
              startIcon={<Image size={14} />}
              onClick={() => onViewPhotos(pet)}
              sx={{ height: 28, fontSize: "0.75rem", px: 1 }}
            >
              Fotos
            </Button>
          )}
        </Box>

        <Divider sx={{ my: 0.75 }} />

        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-end",
            gap: 1.5,
          }}
        >
          <Box sx={{ display: "flex", gap: { xs: 1.5, sm: 3 }, flexWrap: "wrap", flex: 1, minWidth: 0 }}>
            <Box>
              <Typography color="text.primary" sx={{ fontSize: { xs: "0.72rem", sm: "0.85rem" }, fontWeight: 600 }}>Espécie</Typography>
              <Typography color="text.disabled" sx={{ fontSize: { xs: "0.72rem", sm: "0.85rem" } }}>
                {pet.species}
              </Typography>
            </Box>
            {pet.breed && (
              <Box>
                <Typography color="text.primary" sx={{ fontSize: { xs: "0.72rem", sm: "0.85rem" }, fontWeight: 600 }}>Raça</Typography>
                <Typography color="text.disabled" sx={{ fontSize: { xs: "0.72rem", sm: "0.85rem" } }}>{pet.breed}</Typography>
              </Box>
            )}

            {pet.size && (
              <Box>
                <Typography color="text.primary" sx={{ fontSize: { xs: "0.72rem", sm: "0.85rem" }, fontWeight: 600 }}>Porte</Typography>
                <Typography color="text.disabled" sx={{ fontSize: { xs: "0.72rem", sm: "0.85rem" } }}>
                  {PET_SIZES.find((s) => s.value === pet.size)?.label || pet.size}
                </Typography>
              </Box>
            )}
            {pet.coat_type && (
              <Box>
                <Typography color="text.primary" sx={{ fontSize: { xs: "0.72rem", sm: "0.85rem" }, fontWeight: 600 }}>Pelagem</Typography>
                <Typography color="text.disabled" sx={{ fontSize: { xs: "0.72rem", sm: "0.85rem" } }}>
                  {COAT_TYPES.find((t) => t.value === pet.coat_type)?.label || pet.coat_type}
                </Typography>
              </Box>
            )}
          </Box>

          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 0.5,
              flexShrink: 0,
            }}
          >
            <IconButton
              size="small"
              sx={{ color: "primary.main" }}
              onClick={() => onEdit(pet)}
            >
              <Pencil size={15} />
            </IconButton>

            <IconButton
              size="small"
              sx={{ color: "error.main" }}
              onClick={() => onDelete(pet)}
            >
              <Trash2 size={15} />
            </IconButton>
          </Box>
        </Box>
      </Box>
    </CustomCard>
  );
};

export default PetDetailsCard;
