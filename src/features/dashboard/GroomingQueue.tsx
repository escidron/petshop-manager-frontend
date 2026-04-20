import { Box, Typography, Chip, Avatar } from "@mui/material";
import CustomCard from "../../components/Card/CustomCard";
import { Scissors } from "lucide-react";

const dummyGroomingPets: { id: number; name: string; breed: string; status: string; color: "info" | "warning" | "success" }[] = [
  { id: 1, name: "Thor", breed: "Golden Retriever", status: "Em banho", color: "info" },
  { id: 2, name: "Mel", breed: "Poodle", status: "Aguardando", color: "warning" },
  { id: 3, name: "Luna", breed: "Shih Tzu", status: "Pronto", color: "success" },
  { id: 4, name: "Max", breed: "Bulldog", status: "Aguardando", color: "warning" },
];

export default function GroomingQueue() {
  return (
    <Box sx={{ mt: 3 }}>
      <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1.5 }}>
        <Scissors size={20} />
        <Typography variant="h6" fontWeight={600}>
          Fila de Banho e Tosa
        </Typography>
      </Box>
      <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
        {dummyGroomingPets.map((pet) => (
          <CustomCard
            key={pet.id}
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              p: 1.5,
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
              <Avatar sx={{ bgcolor: "primary.light", width: 32, height: 32, fontSize: "0.875rem" }}>
                {pet.name[0]}
              </Avatar>
              <Box>
                <Typography variant="body2" fontWeight={600}>
                  {pet.name}
                </Typography>
                <Typography variant="caption" color="text.disabled">
                  {pet.breed}
                </Typography>
              </Box>
            </Box>
            <Chip
              label={pet.status}
              size="small"
              color={pet.color}
              sx={{ fontWeight: 500, height: 24, fontSize: "0.7rem" }}
            />
          </CustomCard>
        ))}
      </Box>
    </Box>
  );
}
