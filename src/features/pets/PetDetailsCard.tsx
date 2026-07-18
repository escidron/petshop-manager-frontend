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
        gap: 2,
        height: "150px",
        mt: 2,
        p: 1.5,
        minWidth: "550px",
      }}
    >
      <Box
        onClick={handleImageClick}
        sx={{
          height: "100%",
          borderRadius: 3,
          aspectRatio: 1,
          position: "relative",
          cursor: "pointer",
          overflow: "hidden",
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

        <Box sx={{ height: "100%", backgroundColor: "text.primary", borderRadius: 3 }}>
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
              style={{ height: "100%", width: "100%", objectFit: "cover", borderRadius: 12 }}
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
              borderRadius: 3,
            }}
          >
            <Camera color="#fff" size={24} />
          </Box>
        )}
      </Box>
      <Box sx={{ width: "100%" }}>
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
            <Typography variant="h6" fontWeight={600} mb={0}>
              {pet.name}
            </Typography>
            {pet.gender && ["male", "female"].includes(pet.gender) && (
              <Chip
                label={pet.gender === "male" ? "Macho" : "Femea"}
                size="small"
                icon={
                  pet.gender === "male" ? (
                    <Mars color={theme.palette.text.primary} size={16} />
                  ) : (
                    <Venus color={theme.palette.text.primary} size={16} />
                  )
                }
                sx={{
                  bgcolor:
                    pet.gender === "male"
                      ? "rgba(33, 150, 243, 0.3)"
                      : "rgba(233, 30, 99, 0.3)",
                  color: "text.primary",
                  px: 1,
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
                  px: 1,
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
            >
              Fotos
            </Button>
          )}
        </Box>
        <Divider sx={{ my: 1 }} />
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Box sx={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
            <Box>
              <Typography color="text.primary">Espécie</Typography>
              <Typography color="text.disabled">
                {pet.species}
              </Typography>
            </Box>
            {pet.breed && (
              <Box>
                <Typography color="text.primary">Raça</Typography>
                <Typography color="text.disabled">{pet.breed}</Typography>
              </Box>
            )}

            {pet.size && (
              <Box>
                <Typography color="text.primary">Porte</Typography>
                <Typography color="text.disabled">
                  {PET_SIZES.find((s) => s.value === pet.size)?.label || pet.size}
                </Typography>
              </Box>
            )}
            {pet.coat_type && (
              <Box>
                <Typography color="text.primary">Pelagem</Typography>
                <Typography color="text.disabled">
                  {COAT_TYPES.find((t) => t.value === pet.coat_type)?.label || pet.coat_type}
                </Typography>
              </Box>
            )}

          </Box>
          <Box
            sx={{
              display: "flex",
              height: "30px",
              alignItems: "center",
              gap: 1,
            }}
          >


            <IconButton
              size="medium"
              sx={{
                color: "primary.main",
              }}
              onClick={() => onEdit(pet)}
            >
              <Pencil size={16} />
            </IconButton>

            <IconButton
              size="medium"
              sx={{
                color: "error.main",
              }}
              onClick={() => onDelete(pet)}
            >
              <Trash2 size={16} />
            </IconButton>
          </Box>
        </Box>
      </Box>
    </CustomCard>
  );
};

export default PetDetailsCard;
