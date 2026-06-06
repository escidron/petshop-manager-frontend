import { Box } from "@mui/material";
import { Search, Plus, Library } from "lucide-react";
import CustomTextField from "../../components/Textfield/CustomTextfield";
import { Button } from "../../components/Button/Button";

type Props = {
  search: string;
  onSearchChange: (value: string) => void;
  onCreate: () => void;
  onImportLibrary: () => void;
};

export default function ServiceToolbar({
  search,
  onSearchChange,
  onCreate,
  onImportLibrary,
}: Props) {
  return (
    <Box mb={2} display="flex" justifyContent="space-between" gap={2}>
      <CustomTextField
        icon={<Search size={18} />}
        placeholder="Pesquisar serviço"
        value={search}
        onChange={(e) => onSearchChange(e.target.value)}
      />

      <Box display="flex" gap={1.5}>
        <Button variant="outlined" startIcon={<Library size={18} />} onClick={onImportLibrary}>
          Cadastro em Massa
        </Button>
        <Button startIcon={<Plus size={18} />} onClick={onCreate}>
          Novo Serviço
        </Button>
      </Box>
    </Box>
  );
}
