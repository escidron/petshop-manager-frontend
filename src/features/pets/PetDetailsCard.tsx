import CustomCard from "../../components/Card/CustomCard";
import {
  Box,
  Chip,
  Divider,
  IconButton,
  Typography,
} from "@mui/material";
import { Mars, Pencil, Trash2, Venus } from "lucide-react";
import theme from "../../theme";
import type { Pet } from "./types";

type Props = {
  pet: Pet;
  onEdit: (pet: Pet) => void;
  onDelete: (pet: Pet) => void;
};

const PetDetailsCard = ({ pet, onEdit, onDelete }: Props) => {
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
        sx={{
          height: "100%",
          borderRadius: 1,
          aspectRatio: 1,
        }}
      >
        <Box sx={{ height: "100%",backgroundColor: "text.primary",borderRadius: 3 }}>
          <img
            style={{ height: "100%", width: "100%" }}
            alt="pet photo"
            src={
              pet.species === "Canino"
                ? "/dog_background.png"
                : "/cat_background.png"
            }
          />
        </Box>
      </Box>
      <Box sx={{ width: "100%" }}>
        <Box sx={{ display: "flex", justifyContent: "space-between" }}>
          <Box>
            <Typography variant="h6" fontWeight={600} mb={0}>
              {pet.name}
            </Typography>
          </Box>
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
        </Box>
        <Divider sx={{ my: 1 }} />
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Box sx={{ display: "flex", gap: 4 }}>
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
