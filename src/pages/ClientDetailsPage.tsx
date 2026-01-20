import {
  Box,
  Chip,
  CircularProgress,
  Divider,
  Typography,
  Button,
  IconButton,
  Avatar,
} from "@mui/material";
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import apiClient from "../api/apiClient";
import { Mail, Mars, Pencil, Phone, Plus, Trash2, Venus } from "lucide-react";
import CustomCard from "../components/Card/CustomCard";
import theme from "../theme";

type Client = {
  id: number;
  name: string;
  email: string | null;
  phone: string | null;
  is_active: boolean;
};

export default function ClientDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const [client, setClient] = useState<Client | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchClient = async () => {
      try {
        setLoading(true);
        const TENANT_ID = 1;

        const response = await apiClient.get<Client>(`/api/v1/clients/${id}`, {
          params: { tenant_id: TENANT_ID },
        });

        setClient(response.data);
      } catch (err) {
        console.error("Erro ao buscar cliente", err);
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchClient();
  }, [id]);

  if (loading || !client) {
    return (
      <Box p={3} display="flex" justifyContent="center">
        <CircularProgress />
      </Box>
    );
  }

  const pets = [
    {
      id: 1,
      name: "Karim",
      species: "dog",
      breed: "Golden Retriever",
      age: 4,
      is_active: true,
      gender: "male",
    },
    {
      id: 2,
      name: "Angie",
      species: "dog",
      breed: "Golden Retriever",
      age: 4,
      is_active: true,
      gender: "female",
    },
    {
      id: 3,
      name: "Cat",
      species: "cat",
      breed: "Siamese",
      age: 4,
      is_active: true,
      gender: "male",
    },
    {
      id: 4,
      name: "Catty",
      species: "cat",
      breed: "Golden Retriever",
      age: 4,
      is_active: true,
      gender: "female",
    },
  ];
  return (
    <Box
      sx={{
        maxWidth: "60%",
        mx: "auto",
        p: 3,
        display: "flex",
        flexDirection: "column",
        gap: 3,
      }}
    >
      <CustomCard>
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Typography variant="h5" fontWeight={600}>
            {client.name}
          </Typography>
          <Chip
            label={client.is_active ? "Ativo" : "Inativo"}
            sx={{
              bgcolor: client.is_active ? "success.light" : "error.light",
              color: "text.secondary",
              height: "20px",
            }}
          />
        </Box>
        <Box sx={{ display: "flex", gap: 2, mt: 2 }}>
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 2,
              backgroundColor: "secondary.main",
              py: 1,
              px: 2,
              borderRadius: 2,
              fontSize: 14,
            }}
          >
            <Mail size={20} />
            {client.email}
          </Box>
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 2,
              backgroundColor: "secondary.main",
              py: 1,
              px: 2,
              borderRadius: 2,
              fontSize: 14,
            }}
          >
            <Phone size={20} />
            {client.phone}
          </Box>
        </Box>
      </CustomCard>

      <Divider />

      <Box display="flex" justifyContent="space-between" alignItems="center">
        <Box sx={{ width: "60%" }}>
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <Typography variant="h6" fontWeight={600}>
              Pets
            </Typography>

            <Button
              variant="contained"
              startIcon={<Plus size={16} />}
              onClick={() => {
                // 🔥 aqui você vai abrir o modal de criar pet
              }}
            >
              Novo Pet
            </Button>
          </Box>
          {pets.map((pet) => (
            <CustomCard
              sx={{ display: "flex", gap: 2, height: "150px", mt: 2, p: 1.5 }}
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
                      {pet.age} anos
                    </Typography>
                  </Box>
                  <Chip
                    label={pet.gender}
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
                <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                  <Box sx={{ display: "flex", gap: 6 }}>
                    <Box>
                      <Typography color="text.primary">Espécie</Typography>
                      <Typography color="text.disabled">
                        {pet.species}
                      </Typography>
                    </Box>
                    <Box>
                      <Typography color="text.primary">Raça</Typography>
                      <Typography color="text.disabled">{pet.breed}</Typography>
                    </Box>
                  </Box>
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "flex-end",
                      gap: 1,
                      width: "30px",
                    }}
                  >
                    <IconButton
                      size="small"
                      sx={{
                        color: "primary.main",
                        width: 24,
                      }}
                      onClick={() => {}}
                    >
                      <Pencil size={16} />
                    </IconButton>

                    <IconButton
                      size="small"
                      sx={{
                        color: "error.main",
                      }}
                      onClick={() => {}}
                    >
                      <Trash2 size={16} />
                    </IconButton>
                  </Box>
                </Box>
              </Box>
            </CustomCard>
          ))}
        </Box>
        <Box sx={{ width: "40%" }}></Box>
      </Box>

      {/* Placeholder pets */}
      {/* <Typography color="text.primary">Nenhum pet cadastrado ainda.</Typography> */}
    </Box>
  );
}
