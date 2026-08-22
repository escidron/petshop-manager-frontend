import { Box } from "@mui/material";
import { Search, Plus, Upload, Wand2 } from "lucide-react";
import CustomTextField from "../../components/Textfield/CustomTextfield";
import { Button } from "../../components/Button/Button";

type Props = {
  search: string;
  onSearchChange: (value: string) => void;
  onCreate: () => void;
  onImport: () => void;
  onOpenWizard: () => void;
};

export default function ClientsToolbar({
  search,
  onSearchChange,
  onCreate,
  onImport,
  onOpenWizard,
}: Props) {
  return (
    <Box mb={2} display="flex" justifyContent="space-between" gap={2}>
      <CustomTextField
        icon={<Search size={18} />}
        placeholder="Pesquisar cliente ou pet..."
        value={search}
        onChange={(e) => onSearchChange(e.target.value)}
      />

      <Box display="flex" gap={1}>
        <Button variant="outlined" startIcon={<Wand2 size={18} />} onClick={onOpenWizard}>
          Assistente de Migração
        </Button>
        <Button variant="outlined" startIcon={<Upload size={18} />} onClick={onImport}>
          Cadastro em Massa
        </Button>
        <Button startIcon={<Plus size={18} />} onClick={onCreate}>
          Novo Cliente
        </Button>
      </Box>
    </Box>
  );
}


