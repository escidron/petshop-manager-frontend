import { useState } from "react";
import { DEFAULT_SERVICE_FORM } from "../tenant_services/constants";
import ServiceForm from "../tenant_services/ServiceForm";
import { createService } from "../../api/services/tenant_services";
import type { ServiceFormData } from "../tenant_services/types";
import { useToast } from "../../hooks/useToast";
import { Box, Typography } from "@mui/material";
import { Cog } from "lucide-react";

type Props = {
  onNext: () => void;
};

export default function ServicesStep({ onNext }: Props) {
  const toast = useToast();
  const defaultValues = DEFAULT_SERVICE_FORM;
  const [showAdditionalInfo, setShowAdditionalInfo] = useState(false);

  const handleSubmit = async (data: ServiceFormData) => {
    await createService(data);
    toast.success("Serviço cadastrado com sucesso");
    onNext();
  };

  return (
    <Box
      sx={{
        width: showAdditionalInfo ? "80%" : "500px",
        maxWidth: "1000px", // largura máxima
        minWidth: showAdditionalInfo ? "1000px" : "400px",
      }}
    >
      <Box
        sx={{ display: "flex", alignItems: "center", marginBottom: 2, gap: 1 }}
      >
        <Cog />
        <Typography variant="h5">
          Cadastre seu primeiro serviço
        </Typography>
      </Box>

      <ServiceForm
        defaultValues={defaultValues}
        onSubmit={handleSubmit}
        showAdditionalInfo={showAdditionalInfo}
        setShowAdditionalInfo={setShowAdditionalInfo}
      />
    </Box>
  );
}
