import {
  Box,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Divider,
  IconButton,
  Tooltip,
  Typography,
} from "@mui/material";
import { Package, Trash2 } from "lucide-react";
import { useState } from "react";
import { deactivateClientPackage } from "../../api/services/client_packages";
import type { ClientPackage } from "./types";
import theme from "../../theme";
import { formatServiceLabel } from "../../utils/formatServiceLabel";
import { Button } from "../../components/Button/Button";

type Props = {
  packages: ClientPackage[];
  onRefresh: () => void;
};

export default function PetPackageCredits({ packages, onRefresh }: Props) {
  const [removing, setRemoving] = useState<number | null>(null);
  const [confirmId, setConfirmId] = useState<number | null>(null);

  const confirmPackage = packages.find((p) => p.id === confirmId);

  const handleDeactivate = async () => {
    if (!confirmId) return;
    try {
      setRemoving(confirmId);
      setConfirmId(null);
      await deactivateClientPackage(confirmId);
      onRefresh();
    } finally {
      setRemoving(null);
    }
  };

  if (packages.length === 0) {
    return (
      <Typography variant="body2" color="text.primary">
        Nenhum pacote ativo.
      </Typography>
    );
  }

  return (
    <>
    <Dialog open={!!confirmId} onClose={() => setConfirmId(null)} maxWidth="xs" fullWidth>
      <DialogTitle>Cancelar pacote</DialogTitle>
      <DialogContent>
        <DialogContentText sx={{ color: "text.primary" }}>
          Tem certeza que deseja cancelar o pacote <strong>{confirmPackage?.package_name}</strong>? Os créditos restantes serão perdidos.
        </DialogContentText>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button variant="outlined" onClick={() => setConfirmId(null)}>
          Voltar
        </Button>
        <Button variant="contained" color="error" onClick={handleDeactivate}>
          Cancelar pacote
        </Button>
      </DialogActions>
    </Dialog>

    <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
      {packages.map((pkg) => (
        <Box
          key={pkg.id}
          sx={{
            border: "1px solid",
            borderColor: "divider",
            borderRadius: 2,
            p: 1.5,
            bgcolor: "common.white",
          }}
        >
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              mb: 1,
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <Package size={16} color={theme.palette.primary.main} />
              <Typography variant="body2" fontWeight={600}>
                {pkg.package_name}
              </Typography>
              {pkg.expires_at && (
                <Chip
                  label={
                    new Date(pkg.expires_at) < new Date()
                      ? "Expirado"
                      : `Expira em: ${new Date(pkg.expires_at).toLocaleDateString()}`
                  }
                  size="small"
                  color={new Date(pkg.expires_at) < new Date() ? "error" : "default"}
                  sx={{ height: 20, fontSize: 10 }}
                />
              )}
            </Box>
            <Tooltip title="Cancelar pacote">
              <IconButton
                size="small"
                color="error"
                disabled={removing === pkg.id}
                onClick={() => setConfirmId(pkg.id)}
              >
                <Trash2 size={14} />
              </IconButton>
            </Tooltip>
          </Box>

          <Divider sx={{ mb: 1 }} />

          <Box sx={{ display: "flex", flexDirection: "column", gap: 0.75 }}>
            {pkg.credits.map((credit) => {
              const exhausted = credit.remaining_qty === 0;
              return (
                <Box
                  key={credit.id}
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <Typography
                    variant="body2"
                    color={exhausted ? "text.disabled" : "text.primary"}
                    sx={{ textDecoration: exhausted ? "line-through" : "none" }}
                  >
                    {credit.service ? formatServiceLabel(credit.service) : credit.service_name}
                  </Typography>
                  <Chip
                    label={`${credit.remaining_qty} / ${credit.total_qty}`}
                    size="small"
                    variant="outlined"
                    color={
                      exhausted
                        ? "default"
                        : credit.remaining_qty <= 1
                          ? "warning"
                          : "success"
                    }
                    sx={{ fontWeight: 700, fontSize: 12 }}
                  />
                </Box>
              );
            })}
          </Box>
        </Box>
      ))}
    </Box>
    </>
  );
}
