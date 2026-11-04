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
    <Box
      mb={2}
      display="flex"
      flexDirection={{ xs: "column", md: "row" }}
      justifyContent="space-between"
      alignItems={{ xs: "stretch", md: "center" }}
      gap={1.5}
      sx={{ width: "100%" }}
    >
      <Box sx={{ flex: 1, width: "100%", maxWidth: { md: "420px" } }}>
        <CustomTextField
          fullWidth
          icon={<Search size={18} />}
          placeholder="Pesquisar pet ou tutor..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
        />
      </Box>

      <Button
        startIcon={<Plus size={18} />}
        onClick={onCreate}
      >
        Novo Pet
      </Button>
    </Box>
  );
}
