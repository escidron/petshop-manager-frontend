import {
  Mail,
  Phone,
  MapPin,
  Calendar,
  CreditCard,
  Instagram,
  Facebook,
  User,
  Pencil,
} from "lucide-react";
import { Chip, Typography, Box, Grid, Paper, Button, IconButton, Tooltip } from "@mui/material";
import type { Client } from "./types";
import { maskPhone, maskCpf, maskCnpj, maskBirthDate, maskCep } from "../../utils/masks";

type Props = {
  client: Client;
  onEdit?: () => void;
};

const InfoItem = ({
  icon: Icon,
  label,
  value,
  secondaryValue,
}: {
  icon: React.ComponentType<{ size?: number | string }>;
  label: string;
  value?: string | null;
  secondaryValue?: string | null;
}) => {
  if (!value) return null;
  return (
    <Box sx={{ display: "flex", gap: 1.5, mb: 1.5 }}>
      <Box sx={{ color: "primary.main", mt: 0.5 }}>
        <Icon size={18} />
      </Box>
      <Box>
        <Typography variant="caption" color="text.disabled" sx={{ display: "block", lineHeight: 1 }}>
          {label}
        </Typography>
        <Typography variant="body2" fontWeight={500} color="text.primary">
          {value}
        </Typography>
        {secondaryValue && (
          <Typography variant="caption" color="text.secondary">
            {secondaryValue}
          </Typography>
        )}
      </Box>
    </Box>
  );
};

const ClientePersonalInfo = ({ client, onEdit }: Props) => {
  const formatDocument = (doc?: string | null, type?: string | null) => {
    if (!doc) return null;
    return type === "CPF" ? maskCpf(doc) : maskCnpj(doc);
  };

  const getFullAddress = () => {
    const parts = [
      client.street,
      client.number,
      client.complement,
      client.neighborhood,
      client.city,
      client.state ? ` - ${client.state}` : "",
      client.cep ? `(CEP: ${maskCep(client.cep)})` : "",
    ];
    const filtered = parts.filter(Boolean);
    if (filtered.length === 0) return null;
    
    return (
      <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}>
        <Typography variant="body2" color="text.primary" fontWeight={600}>
          {client.street}{client.number ? `, ${client.number}` : ""}
        </Typography>
        
        {client.complement && (
          <Typography variant="body2" color="text.primary">
            {client.complement}
          </Typography>
        )}

        <Typography variant="body2" color="text.primary">
          {client.neighborhood ? `${client.neighborhood}, ` : ""}
          {client.city}{client.state ? ` - ${client.state}` : ""}
        </Typography>

        {client.cep && (
          <Typography variant="caption" color="text.primary" sx={{ mt: 0.25, fontWeight: 500 }}>
            CEP: {maskCep(client.cep)}
          </Typography>
        )}
      </Box>
    );
  };

  return (
    <Paper elevation={0} sx={{ p: 3, borderRadius: 3, border: "1px solid", borderColor: "divider" }}>
      {/* Header */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          mb: 3,
        }}
      >
        <Box sx={{ display: "flex", gap: 2, alignItems: "center" }}>
          <Box
            sx={{
              width: 56,
              height: 56,
              borderRadius: "16px",
              bgcolor: "primary.main",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "white",
            }}
          >
            <User size={32} />
          </Box>
          <Box>
            <Typography variant="h5" fontWeight={700} color="text.primary">
              {client.name}
            </Typography>
            <Box sx={{ display: "flex", gap: 1, alignItems: "center", mt: 0.5 }}>
              <Chip
                label={client.is_active ? "Ativo" : "Inativo"}
                size="small"
                sx={{
                  bgcolor: client.is_active ? "success.lighter" : "error.lighter",
                  color: client.is_active ? "success.dark" : "error.dark",
                  fontWeight: 600,
                  fontSize: "0.7rem",
                  height: "20px",
                }}
              />
            </Box>
          </Box>
        </Box>
        <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
          {onEdit && (
            <Tooltip title="Editar Cliente">
              <IconButton 
                onClick={onEdit}
                size="small"
                sx={{ 
                  bgcolor: "grey.50",
                  border: "1px solid",
                  borderColor: "divider",
                  borderRadius: 2,
                  "&:hover": {
                    bgcolor: "grey.100",
                    color: "primary.main",
                  }
                }}
              >
                <Pencil size={18} />
              </IconButton>
            </Tooltip>
          )}

          {client.phone && (
            <Button
              variant="outlined"
              size="small"
              color="success"
              startIcon={<img src="/whatsapp.png" alt="WhatsApp" style={{ width: 20, height: 20 }} />}
              onClick={() => {
                const cleanPhone = client.phone!.replace(/\D/g, "");
                const phoneWithCountry = cleanPhone.startsWith("55") ? cleanPhone : `55${cleanPhone}`;
                window.open(`https://wa.me/${phoneWithCountry}`, "_blank");
              }}
              sx={{ 
                borderRadius: 2, 
                textTransform: "none",
                fontWeight: 600,
                borderColor: "success.light",
                color: "success.main",
                height: "fit-content",
                "&:hover": {
                  borderColor: "success.dark"
                }
              }}
            >
              WhatsApp
            </Button>
          )}
        </Box>
      </Box>

      <Grid container spacing={4}>
        {/* Coluna 1: Contato */}
        <Grid size={{ xs: 12, md: 4 }}>
          <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 2, textTransform: "uppercase", fontSize: "0.7rem", letterSpacing: 1, color: "text.disabled" }}>
            Contato
          </Typography>
          <InfoItem icon={Mail} label="E-mail" value={client.email} />
          <InfoItem icon={Phone} label="Principal" value={client.phone ? maskPhone(client.phone) : null} />

          <InfoItem 
            icon={Phone} 
            label={client.phone_secondary_name || "Contato 2"} 
            value={client.phone_secondary ? maskPhone(client.phone_secondary) : null} 
          />
          <InfoItem 
            icon={Phone} 
            label={client.phone_tertiary_name || "Contato 3"} 
            value={client.phone_tertiary ? maskPhone(client.phone_tertiary) : null} 
          />
        </Grid>

        {/* Coluna 2: Pessoal e Redes Sociais */}
        <Grid size={{ xs: 12, md: 4 }}>
          <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 2, textTransform: "uppercase", fontSize: "0.7rem", letterSpacing: 1, color: "text.disabled" }}>
            Dados Pessoais
          </Typography>
          <InfoItem 
            icon={CreditCard} 
            label={client.document_type || "Documento"} 
            value={formatDocument(client.document, client.document_type)} 
          />
          <InfoItem 
            icon={Calendar} 
            label="Nascimento" 
            value={client.birth_date ? maskBirthDate(client.birth_date) : null} 
          />
          
          
          <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 2, textTransform: "uppercase", fontSize: "0.7rem", letterSpacing: 1, color: "text.disabled" }}>
            Redes Sociais
          </Typography>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
            {client.instagram && (
              <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, p: 1, borderRadius: 2, bgcolor: "grey.50" }}>
                <Instagram size={20} color="#E4405F" />
                <Typography variant="body2" fontWeight={500}>@{client.instagram}</Typography>
              </Box>
            )}
            {client.facebook && (
              <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, p: 1, borderRadius: 2, bgcolor: "grey.50" }}>
                <Facebook size={20} color="#1877F2" />
                <Typography variant="body2" fontWeight={500}>{client.facebook}</Typography>
              </Box>
            )}
            {!client.instagram && !client.facebook && (
              <Typography variant="body2" color="text.disabled" fontStyle="italic">
                Nenhuma rede cadastrada
              </Typography>
            )}
          </Box>
        </Grid>

        {/* Coluna 3: Endereço */}
        <Grid size={{ xs: 12, md: 4 }}>
          <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 2, textTransform: "uppercase", fontSize: "0.7rem", letterSpacing: 1, color: "text.disabled" }}>
            Endereço
          </Typography>
          <Box sx={{ display: "flex", gap: 1.5 }}>
            <Box sx={{ color: "primary.main", mt: 0.5 }}>
              <MapPin size={18} />
            </Box>
            {getFullAddress() || (
              <Typography variant="body2" color="text.disabled" fontStyle="italic">
                Não informado
              </Typography>
            )}
          </Box>
        </Grid>
      </Grid>
    </Paper>
  );
};

export default ClientePersonalInfo;
