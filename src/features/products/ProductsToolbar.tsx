import { Box } from "@mui/material";
import { Search, Plus, Upload } from "lucide-react";
import CustomTextField from "../../components/Textfield/CustomTextfield";
import { Button } from "../../components/Button/Button";

type Props = {
  search: string;
  onSearchChange: (value: string) => void;
  onCreate: () => void;
  onImport: () => void;
};

export default function ProductsToolbar({
  search,
  onSearchChange,
  onCreate,
  onImport,
}: Props) {
  return (
    <Box mb={2} display="flex" justifyContent="space-between" gap={2}>
      <CustomTextField
        icon={<Search size={18} />}
        placeholder="Pesquisar produto"
        value={search}
        onChange={(e) => onSearchChange(e.target.value)}
      />

      <Box display="flex" gap={2}>
        <Button variant="outlined" startIcon={<Upload size={18} />} onClick={onImport}>
          Importar
        </Button>
        <Button startIcon={<Plus size={18} />} onClick={onCreate}>
          Novo Produto
        </Button>
      </Box>
    </Box>
  );
}
