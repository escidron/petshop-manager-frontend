import { useState } from "react";
import { useToast } from "../../hooks/useToast";
import { DEFAULT_PET_FORM } from "../pets/constants";
import { useClients } from "../../hooks/useClients";
import PetForm from "../pets/PetForm";
import { Box, Typography } from "@mui/material";
import type { PetFormData } from "../pets/types";
import { brDateToISO } from "../../utils/formatDates";
import { createPet } from "../../api/services/pets";
import { PawPrint } from "lucide-react";

type Props = {
  onNext: () => void;
  onBack: () => void;
};

export default function PetStep({ onNext }: Props) {
  const toast = useToast();
  const defaultValues = DEFAULT_PET_FORM;
  const [showAdditionalInfo, setShowAdditionalInfo] = useState(false);
  const { clients } = useClients();
  const handleSubmit = async (data: PetFormData) => {
    const payload = {
      ...data,
      birth_date: brDateToISO(data.birth_date),
    };
    await createPet(payload);

    toast.success("Pet cadastrado com sucesso");
    onNext();
  };
  return (
    <Box
      sx={{
        width: showAdditionalInfo ? "100%" : "500px",
        maxWidth: "1200px", // largura máxima
        minWidth: showAdditionalInfo ? "800px" : "600px",
      }}
    >
      <Box
        sx={{ display: "flex", alignItems: "center", marginBottom: 2, gap: 1 }}
      >
        <PawPrint />
        <Typography variant="h5" mt={0.5}>Cadastre seu primeiro pet</Typography>
      </Box>

      <PetForm
        defaultValues={defaultValues}
        onSubmit={handleSubmit}
        showAdditionalInfo={showAdditionalInfo}
        setShowAdditionalInfo={setShowAdditionalInfo}
        clients={clients}
      />
    </Box>
  );
}
