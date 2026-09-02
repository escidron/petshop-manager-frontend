import { useState } from "react";
import { Box, Menu, MenuItem, useTheme } from "@mui/material";
import { Search, Plus, Upload, Wand2, ChevronDown } from "lucide-react";
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
  const theme = useTheme();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const handleMenuOpen = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

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
          placeholder="Pesquisar cliente ou pet..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
        />
      </Box>

      {/* Desktop Actions */}
      <Box sx={{ display: { xs: "none", md: "flex" }, gap: 1, alignItems: "center" }}>
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

      {/* Mobile Actions */}
      <Box sx={{ display: { xs: "flex", md: "none" }, gap: 1.25, alignItems: "center", width: "100%" }}>
        <Button
          startIcon={<Plus size={18} />}
          onClick={onCreate}
          sx={{
            flex: 1.2,
            minHeight: 42,
            fontWeight: 700,
            borderRadius: 2,
            whiteSpace: "nowrap",
            px: 1.5,
          }}
        >
          Novo Cliente
        </Button>

        <Button
          variant="outlined"
          onClick={handleMenuOpen}
          endIcon={<ChevronDown size={16} />}
          sx={{
            flex: 1,
            minHeight: 42,
            px: 2,
            whiteSpace: "nowrap",
            borderRadius: 2,
            fontWeight: 600,
          }}
        >
          Mais Ações
        </Button>

        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleMenuClose}
          slotProps={{
            paper: {
              sx: {
                borderRadius: 2,
                mt: 1,
                boxShadow: "0 4px 20px rgba(0,0,0,0.12)",
                minWidth: 200,
              },
            },
          }}
        >
          <MenuItem
            onClick={() => {
              handleMenuClose();
              onOpenWizard();
            }}
            sx={{ py: 1.25, gap: 1.25, fontSize: "0.88rem" }}
          >
            <Wand2 size={18} color={theme.palette.primary.main} />
            Assistente de Migração
          </MenuItem>
          <MenuItem
            onClick={() => {
              handleMenuClose();
              onImport();
            }}
            sx={{ py: 1.25, gap: 1.25, fontSize: "0.88rem" }}
          >
            <Upload size={18} color={theme.palette.primary.main} />
            Cadastro em Massa
          </MenuItem>
        </Menu>
      </Box>
    </Box>
  );
}


