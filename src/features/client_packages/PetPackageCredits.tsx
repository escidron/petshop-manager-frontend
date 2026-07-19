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
  Autocomplete,
  TextField,
} from "@mui/material";
import { ShoppingBag, Trash2, ChevronDown, ChevronUp, History, MessageCircle } from "lucide-react";
import { useState } from "react";
import {
  deactivateClientPackage,
  consumeClientPackageCredit,
  revertClientPackageCredit,
} from "../../api/services/client_packages";
import type { ClientPackage } from "./types";
import theme from "../../theme";
import { formatServiceLabel } from "../../utils/formatServiceLabel";
import { Button } from "../../components/Button/Button";
import { useToast } from "../../hooks/useToast";
import { useAuth } from "../../hooks/useAuth";

type Props = {
  packages: ClientPackage[];
  clientPhone?: string;
  onRefresh: () => void;
};

export default function PetPackageCredits({ packages, clientPhone, onRefresh }: Props) {
  const [removing, setRemoving] = useState<number | null>(null);
  const [confirmId, setConfirmId] = useState<number | null>(null);
  const [expandedPackageId, setExpandedPackageId] = useState<number | null>(null);
  const [consumeConfirmData, setConsumeConfirmData] = useState<{ creditId: number, serviceName: string, packagePets: ClientPackage["pets"] } | null>(null);
  const [consumeSelectedPetId, setConsumeSelectedPetId] = useState<number | "">("");
  const [revertConfirmCreditId, setRevertConfirmCreditId] = useState<number | null>(null);
  const [revertConfirmServiceName, setRevertConfirmServiceName] = useState<string>("");
  const toast = useToast();
  const { tenant } = useAuth();

  const confirmPackage = packages.find((p) => p.id === confirmId);

  const handleDeactivate = async () => {
    if (!confirmId) return;
    try {
      setRemoving(confirmId);
      await deactivateClientPackage(confirmId);
      toast.success("Pacote cancelado com sucesso!");
      onRefresh();
    } catch (e: any) {
      toast.error(e.response?.data?.detail || "Erro ao cancelar pacote");
    } finally {
      setConfirmId(null);
      setRemoving(null);
    }
  };

  const confirmConsume = async () => {
    if (!consumeConfirmData) return;
    
    let notes = "Consumo manual";
    if (consumeSelectedPetId) {
      const pet = consumeConfirmData.packagePets.find(p => p.id === consumeSelectedPetId);
      if (pet) {
        notes = `Consumo manual - Pet: ${pet.name}`;
      }
    }

    try {
      await consumeClientPackageCredit(consumeConfirmData.creditId, notes);
      toast.success("Baixa realizada com sucesso!");
      onRefresh();
    } catch (e) {
      toast.error("Erro ao realizar baixa.");
    } finally {
      setConsumeConfirmData(null);
      setConsumeSelectedPetId("");
    }
  };

  const confirmRevert = async () => {
    if (revertConfirmCreditId === null) return;
    try {
      await revertClientPackageCredit(revertConfirmCreditId);
      toast.success("Estorno realizado com sucesso!");
      onRefresh();
    } catch (e) {
      toast.error("Erro ao estornar.");
    } finally {
      setRevertConfirmCreditId(null);
    }
  };

  const handleShareWhatsApp = (pkg: ClientPackage) => {
    if (!clientPhone) {
      toast.warning("Telefone do cliente não cadastrado.");
      return;
    }

    const cleanPhone = clientPhone.replace(/\D/g, "");
    const petshopName = tenant?.name ? `*${tenant.name}*\n` : "";
    const purchaseDate = new Date(pkg.created_at).toLocaleDateString();
    const expirationDate = pkg.expires_at ? new Date(pkg.expires_at).toLocaleDateString() : null;
    
    let text = `${petshopName}`;
    text += `Olá, *${pkg.client.name}*!\n\n`;
    text += `Aqui está o saldo do pacote *${pkg.package_name}* para os pets *${pkg.pets.map(p => p.name).join(', ')}*:\n`;
    text += `*Data da compra:* ${purchaseDate}\n`;
    if (expirationDate) {
      text += `*Validade do pacote:* ${expirationDate}\n`;
    }
    text += `\n*Status dos itens:*\n`;

    pkg.credits.forEach((credit) => {
      const creditUsages = pkg.usages
        .filter((u) => u.credit_id === credit.id && u.change_qty > 0)
        .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

      for (let i = 0; i < credit.total_qty; i++) {
        const isUsed = i < credit.used_qty;
        const usage = isUsed ? creditUsages[i] : null;
        const serviceName = credit.service ? formatServiceLabel(credit.service) : credit.service_name;

        if (isUsed) {
          const dateStr = usage ? ` em ${new Date(usage.created_at).toLocaleDateString()}` : "";
          text += `~${serviceName}~ (Utilizado${dateStr})\n`;
        } else {
          text += `*${serviceName}* (A utilizar)\n`;
        }
      }
    });

    text += `\nAgradecemos a preferência!`;

    const url = `https://wa.me/55${cleanPhone}?text=${encodeURIComponent(text)}`;
    window.open(url, "_blank");
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

      <Dialog open={consumeConfirmData !== null} onClose={() => setConsumeConfirmData(null)} maxWidth="xs" fullWidth>
        <DialogTitle>Confirmar Baixa Manual</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ color: "text.primary", mb: 2 }}>
            Tem certeza que deseja dar baixa manual em <strong>{consumeConfirmData?.serviceName}</strong>?
          </DialogContentText>
          
          {consumeConfirmData && consumeConfirmData.packagePets.length > 0 && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="body2" color="text.primary" sx={{ mb: 1 }}>
                Para qual pet este serviço foi realizado? (Opcional)
              </Typography>
              <Autocomplete
                options={consumeConfirmData.packagePets}
                getOptionLabel={(option) => option.name}
                value={consumeConfirmData.packagePets.find(p => p.id === consumeSelectedPetId) || null}
                onChange={(_, newValue) => setConsumeSelectedPetId(newValue ? newValue.id : "")}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    placeholder="Selecione o pet"
                    size="small"
                  />
                )}
                isOptionEqualToValue={(option, value) => option.id === value.id}
                noOptionsText="Nenhum pet encontrado"
                fullWidth
              />
            </Box>
          )}

        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button variant="outlined" onClick={() => setConsumeConfirmData(null)}>
            Voltar
          </Button>
          <Button variant="contained" color="primary" onClick={confirmConsume}>
            Confirmar Baixa
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={revertConfirmCreditId !== null} onClose={() => setRevertConfirmCreditId(null)} maxWidth="xs" fullWidth>
        <DialogTitle>Confirmar Estorno / Reverter Baixa</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ color: "text.primary" }}>
            Tem certeza que deseja reverter a baixa de <strong>{revertConfirmServiceName}</strong>? O crédito correspondente será restaurado.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button variant="outlined" onClick={() => setRevertConfirmCreditId(null)}>
            Voltar
          </Button>
          <Button variant="contained" color="error" onClick={confirmRevert}>
            Confirmar Estorno
          </Button>
        </DialogActions>
      </Dialog>

      <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
        {packages.map((pkg) => (
          <Box
            key={pkg.id}
            sx={{
              border: "1px solid",
              borderColor: "divider",
              borderRadius: 3,
              p: 2,
              bgcolor: pkg.is_active ? "common.white" : "grey.50",
              boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
              opacity: pkg.is_active ? 1 : 0.75,
            }}
          >
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                mb: 1.5,
              }}
            >
              <Box>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap", mb: 0.5 }}>
                  <ShoppingBag size={18} color={theme.palette.primary.main} />
                  <Typography variant="subtitle2" fontWeight={700} color="text.primary">
                    {pkg.package_name}
                  </Typography>
                  {pkg.is_paid && (
                    <Chip label="Pago" size="small" color="success" sx={{ height: 20, fontSize: "0.7rem", fontWeight: 700 }} />
                  )}
                  {!pkg.is_active && (
                    <Chip label="Finalizado" size="small" color="default" sx={{ height: 20, fontSize: "0.7rem", fontWeight: 700, bgcolor: "grey.200", color: "grey.700" }} />
                  )}
                  {pkg.expires_at && (
                    <Chip
                      label={
                        new Date(pkg.expires_at) < new Date()
                          ? "Expirado"
                          : `Expira em: ${new Date(pkg.expires_at).toLocaleDateString()}`
                      }
                      size="small"
                      color={new Date(pkg.expires_at) < new Date() ? "error" : "default"}
                      sx={{ height: 20, fontSize: 10, fontWeight: 600 }}
                    />
                  )}
                </Box>
                <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, mb: 1, flexWrap: "wrap" }}>
                  <Typography variant="body2" color="text.primary" sx={{ mr: 0.5 }}>Pets:</Typography>
                  {pkg.pets.map(p => (
                    <Chip 
                      key={p.id} 
                      label={p.name} 
                      size="small" 
                      variant="outlined" 
                      sx={{ height: 22, fontSize: "0.7rem", fontWeight: 600, borderColor: "divider", bgcolor: "grey.50" }} 
                    />
                  ))}
                </Box>
                <Typography variant="caption" color="text.primary" sx={{ opacity: 0.8, display: "block" }}>
                  Comprado em: {new Date(pkg.created_at).toLocaleDateString()}
                </Typography>
              </Box>
              
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <Tooltip title="Compartilhar por WhatsApp">
                  <span>
                    <Button
                      size="small"
                      variant="outlined"
                      color="success"
                      startIcon={<MessageCircle size={14} />}
                      onClick={() => handleShareWhatsApp(pkg)}
                      disabled={!clientPhone || !pkg.is_active}
                      sx={{ fontSize: "0.75rem", py: 0.25, px: 1 }}
                    >
                      Enviar pacote
                    </Button>
                  </span>
                </Tooltip>

                <Tooltip title="Cancelar pacote">
                  <IconButton
                    size="small"
                    color="error"
                    disabled={removing === pkg.id || !pkg.is_active}
                    onClick={() => setConfirmId(pkg.id)}
                  >
                    <Trash2 size={16} />
                  </IconButton>
                </Tooltip>
              </Box>
            </Box>

            <Divider sx={{ mb: 1.5 }} />

            <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
              {pkg.credits.map((credit) => {
                const creditUsages = pkg.usages
                  .filter((u) => u.credit_id === credit.id && u.change_qty > 0)
                  .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

                return (
                  <Box key={credit.id} sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                    {Array.from({ length: credit.total_qty }).map((_, i) => {
                      const isUsed = i < credit.used_qty;
                      const usage = isUsed ? creditUsages[i] : null;
                      const serviceName = credit.service ? formatServiceLabel(credit.service) : credit.service_name;

                      return (
                        <Box
                          key={`${credit.id}-${i}`}
                          sx={{
                            display: "flex",
                            flexDirection: "column",
                            py: 1,
                            borderBottom: "1px solid",
                            borderColor: "grey.100",
                            "&:last-child": { borderBottom: "none" },
                          }}
                        >
                          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <Typography
                              variant="body2"
                              fontWeight={600}
                              color={isUsed ? "text.disabled" : "text.primary"}
                              sx={{ textDecoration: isUsed ? "line-through" : "none" }}
                            >
                              {serviceName}
                            </Typography>

                            {isUsed ? (
                              <Button
                                size="small"
                                variant="outlined"
                                color="error"
                                onClick={() => {
                                  setRevertConfirmCreditId(credit.id);
                                  setRevertConfirmServiceName(serviceName);
                                }}
                                sx={{ textTransform: "none", fontSize: "0.72rem", py: 0.25, px: 1, minWidth: 0 }}
                              >
                                Reverter Baixa
                              </Button>
                            ) : (
                              <Button
                                size="small"
                                variant="outlined"
                                color="primary"
                                onClick={() => {
                                  setConsumeConfirmData({ creditId: credit.id, serviceName, packagePets: pkg.pets });
                                  setConsumeSelectedPetId(pkg.pets.length === 1 ? pkg.pets[0].id : "");
                                }}
                                sx={{ textTransform: "none", fontSize: "0.72rem", py: 0.25, px: 1, minWidth: 0, fontWeight: 700 }}
                              >
                                Dar baixa manual
                              </Button>
                            )}
                          </Box>

                          {isUsed && (
                            <Typography variant="caption" color="text.primary" sx={{ mt: 0.5 }}>
                              Baixa realizada{usage ? ` em ${new Date(usage.created_at).toLocaleDateString()}` : ""}{usage?.user_name ? ` por ${usage.user_name}` : ""} {usage?.notes ? `[${usage.notes}]` : ""}
                            </Typography>
                          )}
                        </Box>
                      );
                    })}
                  </Box>
                );
              })}
            </Box>

            <Divider sx={{ my: 1.5 }} />

            {/* Usages Statement */}
            <Box>
              <Button
                size="small"
                variant="text"
                startIcon={<History size={14} />}
                endIcon={expandedPackageId === pkg.id ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                onClick={() => setExpandedPackageId(expandedPackageId === pkg.id ? null : pkg.id)}
                sx={{ textTransform: "none", fontSize: "0.75rem", p: 0, minWidth: 0 }}
              >
                {expandedPackageId === pkg.id ? "Ocultar histórico de ações" : "Ver histórico de ações"}
              </Button>
              
              {expandedPackageId === pkg.id && (
                <Box sx={{ mt: 1.5, pl: 1.5, borderLeft: "2px solid", borderColor: "primary.light", display: "flex", flexDirection: "column", gap: 1 }}>
                  {pkg.usages.length === 0 ? (
                    <Typography variant="caption" color="text.primary" sx={{ opacity: 0.6 }}>
                      Nenhum consumo registrado ainda.
                    </Typography>
                  ) : (
                    pkg.usages.map((usage) => (
                      <Box key={usage.id} sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <Box>
                          <Typography variant="caption" fontWeight={600} display="block" color="text.primary">
                            {usage.service_name}
                          </Typography>
                          <Typography variant="caption" color="text.primary" sx={{ opacity: 0.7 }}>
                            {new Date(usage.created_at).toLocaleString()}{usage.user_name ? ` por ${usage.user_name}` : ""} - {usage.notes}
                          </Typography>
                        </Box>
                        <Chip
                          label={usage.change_qty > 0 ? "Consumido" : "Estornado"}
                          size="small"
                          color={usage.change_qty > 0 ? "info" : "warning"}
                          sx={{ height: 16, fontSize: 9, fontWeight: 700 }}
                        />
                      </Box>
                    ))
                  )}
                </Box>
              )}
            </Box>
          </Box>
        ))}
      </Box>
    </>
  );
}
