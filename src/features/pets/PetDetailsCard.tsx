import CustomCard from "../../components/Card/CustomCard";
import {
  Avatar,
  Box,
  Chip,
  Divider,
  IconButton,
  Typography,
} from "@mui/material";
import { Mars, Pencil, Trash2, Venus } from "lucide-react";
import theme from "../../theme";
import { getAgeUnitLabel } from "../../utils/getAgeUnitLabel";
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
        <Avatar
          sx={{ height: "100%", width: "100%" }}
          alt="pet photo"
          src={
            pet.species === "dog" && pet.gender === "male"
              ? "/dog_male.png"
              : pet.species === "dog" && pet.gender === "female"
                ? "/dog_female.png"
                : pet.species === "cat" && pet.gender === "male"
                  ? "/cat_male.png"
                  : "/cat_female.png"
          }
        />
      </Box>
      <Box sx={{ width: "100%" }}>
        <Box sx={{ display: "flex", justifyContent: "space-between" }}>
          <Box>
            <Typography variant="h6" fontWeight={600} mb={0}>
              {pet.name}
            </Typography>
            <Typography color="text.disabled">
              {pet.age} {getAgeUnitLabel(pet.age!, pet.age_unit!)}
            </Typography>
          </Box>
          <Chip
            label={pet.gender === "male" ? "Macho" : "Femea"}
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
              <Typography color="text.disabled">{pet.species === "dog" ? "Cachorro" : "Gato"}</Typography>
            </Box>
            <Box>
              <Typography color="text.primary">Raça</Typography>
              <Typography color="text.disabled">{pet.breed}</Typography>
            </Box>
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
