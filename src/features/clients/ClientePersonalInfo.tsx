import {
  Mail,
  Phone,
  MapPin,
  Calendar,
  CreditCard,
  Instagram,
  Facebook,
  Twitter,
  User,
} from "lucide-react";
import { Chip, Typography, Box, Grid, Divider, Paper } from "@mui/material";
import type { Client } from "./types";
import { maskPhone, maskCpf, maskCnpj, maskBirthDate, maskCep } from "../../utils/masks";

type Props = {
  client: Client;
};

const InfoItem = ({
  icon: Icon,
  label,
  value,
  secondaryValue,
}: {
  icon: any;
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

const ClientePersonalInfo = ({ client }: Props) => {
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
      <Box>
        <Typography variant="body2" color="text.primary">
          {client.street}{client.number ? `, ${client.number}` : ""}
          {client.complement ? ` - ${client.complement}` : ""}
        </Typography>
        <Typography variant="body2" color="text.primary">
          {client.neighborhood ? `${client.neighborhood}, ` : ""}
          {client.city}{client.state ? ` - ${client.state}` : ""}
        </Typography>
        {client.cep && (
          <Typography variant="caption" color="text.disabled">
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
      </Box>

      <Grid container spacing={4}>
        {/* Coluna 1: Contato */}
        <Grid size={{ xs: 12, md: 4 }}>
          <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 2, textTransform: "uppercase", fontSize: "0.7rem", letterSpacing: 1, color: "text.disabled" }}>
            Contato
          </Typography>
          <InfoItem icon={Mail} label="E-mail" value={client.email} />
          <InfoItem icon={Phone} label="Principal" value={client.phone ? maskPhone(client.phone) : null} />
          <Divider sx={{ my: 2 }} />
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
          
          <Divider sx={{ my: 2 }} />
          
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
            {client.x && (
              <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, p: 1, borderRadius: 2, bgcolor: "grey.50" }}>
                <Twitter size={20} color="#000000" />
                <Typography variant="body2" fontWeight={500}>{client.x}</Typography>
              </Box>
            )}
            {!client.instagram && !client.facebook && !client.x && (
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
