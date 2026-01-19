import { Box } from "@mui/material";
import { Search, Plus } from "lucide-react";
import CustomTextField from "../../components/Textfield/CustomTextfield";
import { Button } from "../../components/Button/Button";
import { useState } from "react";
import ClientFormModal from "./ClientFormModal";

export default function ClientsToolbar() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Box
        mb={2}
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        gap={2}
      >
        <CustomTextField
          icon={<Search size={18} />}
          placeholder="Pesquisar cliente"
        />

        <Button
          startIcon={<Plus size={18} />}
          onClick={() => setOpen(true)}
        >
          Novo Cliente
        </Button>
      </Box>

      <ClientFormModal
        open={open}
        onClose={() => setOpen(false)}
      />
    </>
  );
}
