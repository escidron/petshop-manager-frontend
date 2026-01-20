import { Box } from "@mui/material";
import { Search, Plus } from "lucide-react";
import { useState } from "react";
import CustomTextField from "../../components/Textfield/CustomTextfield";
import { Button } from "../../components/Button/Button";
import ClientFormModal from "./ClientFormModal";

type Props = {
  search: string;
  onSearchChange: (value: string) => void;
};

export default function ClientsToolbar({
  search,
  onSearchChange,
}: Props) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Box mb={2} display="flex" justifyContent="space-between" gap={2}>
        <CustomTextField
          icon={<Search size={18} />}
          placeholder="Pesquisar cliente"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
        />

        <Button startIcon={<Plus size={18} />} onClick={() => setOpen(true)}>
          Novo Cliente
        </Button>
      </Box>

      <ClientFormModal
        open={open}
        onClose={() => setOpen(false)} />
    </>
  );
}
