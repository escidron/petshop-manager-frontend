import { useState } from "react";
import { useToast } from "../../hooks/useToast";
import { DEFAULT_CLIENT_FORM } from "../clients/constants";
import type { ClientFormData } from "../clients/types";
import { brDateToISO } from "../../utils/formatDates";
import { createClient } from "../../api/services/clients";
import { Box, Typography } from "@mui/material";
import ClientForm from "../clients/ClientForm";
import { User } from "lucide-react";

type Props = {
  onNext: () => void;
  onBack: () => void;
};

export default function ClientStep({ onNext }: Props) {
  const toast = useToast();

  const defaultValues = DEFAULT_CLIENT_FORM;
  const [showAdditionalInfo, setShowAdditionalInfo] = useState(false);

  const handleSubmit = async (data: ClientFormData) => {
    const payload = {
      ...data,
      birth_date: brDateToISO(data.birth_date),
    };
    await createClient(payload);

    toast.success("Cliente cadastrado com sucesso");
    onNext();
  };

  return (
    <Box
      sx={{
        width: showAdditionalInfo ? "100%" : "500px",
        maxWidth: "1400px", // largura máxima
        minWidth: showAdditionalInfo ? "800px" : "600px",
      }}
    >
      <Box
        sx={{ display: "flex", alignItems: "center", marginBottom: 2, gap: 1 }}
      >
        <User />
        <Typography variant="h5" mt={0.5}>Cadastre seu primeiro tutor</Typography>
      </Box>

      <ClientForm
        mode={"create"}
        defaultValues={defaultValues}
        showAdditionalInfo={showAdditionalInfo}
        onSubmit={handleSubmit}
        setShowAdditionalInfo={setShowAdditionalInfo}
        createPetMandatory={true}
      />
    </Box>
  );
}
