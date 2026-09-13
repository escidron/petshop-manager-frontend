import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
  Box,
  IconButton,
} from "@mui/material";
import { X, Smartphone, Share, PlusSquare, Download } from "lucide-react";
import { Button } from "./Button/Button";
import { usePWAInstall } from "../hooks/usePWAInstall";

interface Props {
  open: boolean;
  onClose: () => void;
}

export default function PWAInstallModal({ open, onClose }: Props) {
  const { isIOS, canInstallNative, installPWA, isInstalled } = usePWAInstall();

  const handleInstallClick = async () => {
    if (canInstallNative) {
      await installPWA();
      onClose();
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="xs"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
          p: 1,
        },
      }}
    >
      <DialogTitle sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", pb: 1 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <Box
            sx={{
              width: 38,
              height: 38,
              borderRadius: 2,
              bgcolor: "primary.main",
              color: "white",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Smartphone size={20} />
          </Box>
          <Box>
            <Typography variant="subtitle1" fontWeight={800} color="text.primary">
              Usar como Aplicativo
            </Typography>
            <Typography variant="caption" sx={{ color: "#64748B" }}>
              Tela cheia sem barras de navegador
            </Typography>
          </Box>
        </Box>
        <IconButton onClick={onClose} size="small">
          <X size={20} />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ pt: 1.5, pb: 2 }}>
        {isInstalled ? (
          <Box sx={{ textAlign: "center", py: 2 }}>
            <Typography variant="body1" fontWeight={700} color="success.main">
              O Data Pet já está instalado no seu dispositivo!
            </Typography>
            <Typography variant="body2" sx={{ color: "#64748B", mt: 1 }}>
              Você pode acessá-lo direto pelo ícone na tela de início para ter a experiência completa em tela cheia.
            </Typography>
          </Box>
        ) : isIOS ? (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <Typography variant="body2" sx={{ color: "#64748B" }}>
              No iPhone / iPad (Safari), siga estes 2 passos rápidos para criar o atalho de app:
            </Typography>

            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 1.5,
                p: 1.5,
                borderRadius: 2,
                bgcolor: "grey.50",
                border: "1px solid",
                borderColor: "divider",
              }}
            >
              <Box
                sx={{
                  width: 36,
                  height: 36,
                  borderRadius: "50%",
                  bgcolor: "primary.light",
                  color: "primary.main",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <Share size={18} />
              </Box>
              <Typography variant="body2" color="text.primary">
                1. Toque no botão <strong>Compartilhar</strong> (ícone com seta para cima no Safari).
              </Typography>
            </Box>

            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 1.5,
                p: 1.5,
                borderRadius: 2,
                bgcolor: "grey.50",
                border: "1px solid",
                borderColor: "divider",
              }}
            >
              <Box
                sx={{
                  width: 36,
                  height: 36,
                  borderRadius: "50%",
                  bgcolor: "primary.light",
                  color: "primary.main",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <PlusSquare size={18} />
              </Box>
              <Typography variant="body2" color="text.primary">
                2. Role a lista e selecione <strong>"Adicionar à Tela de Início"</strong>.
              </Typography>
            </Box>

            <Typography variant="caption" sx={{ color: "#64748B", textAlign: "center", display: "block" }}>
              Pronto! O app abrirá em tela cheia, sem a barra de endereços do Safari.
            </Typography>
          </Box>
        ) : (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <Typography variant="body2" sx={{ color: "#64748B" }}>
              Instale o atalho do Data Pet para abrir o sistema em tela cheia, sem as barras do navegador atrapalhando.
            </Typography>

            {canInstallNative ? (
              <Button
                variant="contained"
                fullWidth
                onClick={handleInstallClick}
                startIcon={<Download size={18} />}
                sx={{ py: 1.25, fontWeight: 700, borderRadius: 2 }}
              >
                Instalar Aplicativo Agora
              </Button>
            ) : (
              <Box
                sx={{
                  p: 1.5,
                  borderRadius: 2,
                  bgcolor: "grey.50",
                  border: "1px solid",
                  borderColor: "divider",
                }}
              >
                <Typography variant="body2" color="text.primary">
                  No menu do navegador (três pontinhos no topo ou rodapé), clique em <strong>"Instalar aplicativo"</strong> ou <strong>"Adicionar à tela inicial"</strong>.
                </Typography>
              </Box>
            )}
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 2, pb: 1.5 }}>
        <Button onClick={onClose} variant="outlined" fullWidth sx={{ borderRadius: 2 }}>
          Fechar
        </Button>
      </DialogActions>
    </Dialog>
  );
}
