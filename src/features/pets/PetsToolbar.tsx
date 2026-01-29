import { Box } from "@mui/material";
import { Search, Plus } from "lucide-react";
import CustomTextField from "../../components/Textfield/CustomTextfield";
import { Button } from "../../components/Button/Button";

type Props = {
  search: string;
  onSearchChange: (value: string) => void;
  onCreate: () => void;
};

export default function PetsToolbar({
  search,
  onSearchChange,
  onCreate,
}: Props) {
  return (
    <Box mb={2} display="flex" justifyContent="space-between" gap={2}>
      <CustomTextField
        icon={<Search size={18} />}
        placeholder="Pesquisar pet"
        value={search}
        onChange={(e) => onSearchChange(e.target.value)}
      />

      <Button startIcon={<Plus size={18} />} onClick={onCreate}>
        Novo Pet
      </Button>
    </Box>
  );
}
