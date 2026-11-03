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
  ExternalLink,
  Repeat,
} from "lucide-react";
import { Chip, Typography, Box, Grid, Paper, Button, IconButton, Tooltip, alpha } from "@mui/material";
import type { Client } from "./types";
import type { Appointment, ClientRecurrenceSeries } from "../appointments/types";
import { maskPhone, maskCpf, maskCnpj, maskCep } from "../../utils/masks";
import { isoToBrDate } from "../../utils/formatDates";

type Props = {
  client: Client;
  onEdit?: () => void;
  onClientClick?: () => void;
  variant?: "full" | "appointment";
  upcomingRecurringAppt?: Appointment | null;
  recurringSeriesList?: ClientRecurrenceSeries[];
  onManageRecurrence?: (appointment: Appointment) => void;
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
    <Box sx={{ display: "flex", gap: 1.2, mb: 1.5, minWidth: 0 }}>
      <Box sx={{ color: "primary.main", mt: 0.25, flexShrink: 0 }}>
        <Icon size={18} />
      </Box>
      <Box sx={{ minWidth: 0, flex: 1, overflow: "hidden" }}>
        <Typography variant="caption" color="text.disabled" sx={{ display: "block", lineHeight: 1, mb: 0.25 }}>
          {label}
        </Typography>
        <Typography
          variant="body2"
          fontWeight={500}
          color="text.primary"
          sx={{
            wordBreak: "break-word",
            overflowWrap: "anywhere",
          }}
        >
          {value}
        </Typography>
        {secondaryValue && (
          <Typography variant="caption" color="text.secondary" sx={{ wordBreak: "break-word" }}>
            {secondaryValue}
          </Typography>
        )}
      </Box>
    </Box>
  );
};

const ClientePersonalInfo = ({
  client,
  onEdit,
  onClientClick,
  variant = "full",
  upcomingRecurringAppt,
  recurringSeriesList,
  onManageRecurrence,
}: Props) => {
  const formatDocument = (doc?: string | null, type?: string | null) => {
    if (!doc) return null;
    return type === "CPF" ? maskCpf(doc) : maskCnpj(doc);
  };

  const getSingleLineAddress = () => {
    const parts: string[] = [];

    if (client.street) {
      let streetPart = client.street;
      if (client.number) {
        streetPart += `, nº ${client.number}`;
      }
      parts.push(streetPart);
    } else if (client.number) {
      parts.push(`nº ${client.number}`);
    }

    if (client.complement) {
      parts.push(client.complement);
    }

    if (client.neighborhood) {
      parts.push(client.neighborhood);
    }

    if (client.city) {
      let cityState = client.city;
      if (client.state) {
        cityState += ` - ${client.state}`;
      }
      parts.push(cityState);
    } else if (client.state) {
      parts.push(client.state);
    }

    if (client.cep) {
      parts.push(`CEP: ${maskCep(client.cep)}`);
    }

    if (parts.length === 0) return null;
    return parts.join(", ");
  };

  const getMapsQuery = () => {
    const parts = [
      client.street,
      client.number,
      client.neighborhood,
      client.city,
      client.state,
      client.cep,
    ].filter(Boolean);
    return parts.length > 0 ? parts.join(", ") : null;
  };

  const singleLineAddress = getSingleLineAddress();
  const mapsQuery = getMapsQuery();

  const hasContact = !!(
    client.email ||
    client.phone ||
    client.phone_secondary ||
    client.phone_tertiary
  );

  // Componente da linha única de endereço compartilhado entre ambos os modos
  const renderSingleLineAddressRow = (borderStyle: "dashed" | "solid" = "dashed") => {
    if (!singleLineAddress) return null;
    return (
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 1.2,
          mt: 1.5,
          pt: 1.25,
          borderTop: `1px ${borderStyle}`,
          borderColor: "divider",
          minWidth: 0,
        }}
      >
        <Box sx={{ color: "primary.main", display: "flex", alignItems: "center", flexShrink: 0 }}>
          <MapPin size={17} />
        </Box>
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{
            minWidth: 0,
            flex: 1,
            lineHeight: 1.4,
            fontSize: "0.85rem",
            wordBreak: "break-word",
          }}
        >
          <Box component="span" fontWeight={600} color="text.primary">
            Endereço:{" "}
          </Box>
          {singleLineAddress}
        </Typography>
        {mapsQuery && (
          <Tooltip title="Abrir no Google Maps">
            <IconButton
              component="a"
              href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(mapsQuery)}`}
              target="_blank"
              rel="noopener noreferrer"
              size="small"
              sx={{
                color: "primary.main",
                bgcolor: "grey.50",
                border: "1px solid",
                borderColor: "divider",
                borderRadius: 1.5,
                p: 0.5,
                flexShrink: 0,
                "&:hover": { bgcolor: "grey.100" },
              }}
            >
              <ExternalLink size={14} />
            </IconButton>
          </Tooltip>
        )}
      </Box>
    );
  };

  // Card de Recorrência por Pet compartilhado entre os modos
  const renderActiveRecurrenceCard = () => {
    const resolvedSeries: ClientRecurrenceSeries[] =
      recurringSeriesList && recurringSeriesList.length > 0
        ? recurringSeriesList
        : upcomingRecurringAppt
        ? [
            {
              recurrence_id: upcomingRecurringAppt.recurrence_id || String(upcomingRecurringAppt.id),
              frequency:
                upcomingRecurringAppt.recurrence_frequency === "monthly"
                  ? "monthly"
                  : upcomingRecurringAppt.recurrence_frequency === "biweekly"
                  ? "biweekly"
                  : "weekly",
              representative_appointment: upcomingRecurringAppt,
              next_appointment: upcomingRecurringAppt,
              last_appointment: upcomingRecurringAppt,
              pet_ids:
                upcomingRecurringAppt.items
                  ?.map((it) => it.pet?.id)
                  .filter((id): id is number => typeof id === "number") || [],
              pet_names:
                upcomingRecurringAppt.items
                  ?.map((it) => it.pet?.name)
                  .filter((name): name is string => Boolean(name)) || [],
            },
          ]
        : [];

    if (resolvedSeries.length === 0) return null;

    return (
      <Box
        sx={{
          mt: 1.75,
          pt: 1.5,
          borderTop: "1px dashed",
          borderColor: "divider",
          display: "flex",
          flexDirection: "column",
          gap: 1.25,
        }}
      >
        {resolvedSeries.map((series) => {
          const refAppt = series.next_appointment || series.last_appointment;
          const petNamesLabel = series.pet_names.join(", ");
          const freqLabel =
            series.frequency === "monthly"
              ? "Mensal"
              : series.frequency === "biweekly"
              ? "Quinzenal"
              : "Semanal";

          return (
            <Box
              key={series.recurrence_id}
              sx={{
                p: { xs: 1.5, sm: 2 },
                borderRadius: 2.5,
                border: "1px solid",
                borderColor: (theme) => alpha(theme.palette.primary.main, 0.25),
                bgcolor: (theme) => alpha(theme.palette.primary.main, 0.04),
                display: "flex",
                flexDirection: { xs: "column", sm: "row" },
                justifyContent: "space-between",
                alignItems: { xs: "flex-start", sm: "center" },
                gap: 1.5,
              }}
            >
              <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1.5 }}>
                <Box
                  sx={{
                    p: 1,
                    borderRadius: 2,
                    bgcolor: (theme) => alpha(theme.palette.primary.main, 0.12),
                    color: "primary.main",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    mt: 0.25,
                    flexShrink: 0,
                  }}
                >
                  <Repeat size={20} />
                </Box>
                <Box>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap" }}>
                    <Typography variant="subtitle2" fontWeight={700} color="text.primary">
                      Recorrência Ativa
                    </Typography>
                    <Chip
                      size="small"
                      label={freqLabel}
                      color="primary"
                      sx={{ height: 20, fontSize: "0.7rem", fontWeight: 700 }}
                    />
                  </Box>
                  <Typography variant="body2" color="text.secondary" sx={{ display: "block", mt: 0.35, fontSize: "0.85rem" }}>
                    Próximo:{" "}
                    <b>
                      {new Date(refAppt.scheduled_at).toLocaleDateString("pt-BR")} às{" "}
                      {new Date(refAppt.scheduled_at).toLocaleTimeString("pt-BR", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </b>
                    {petNamesLabel && (
                      <Box
                        component="span"
                        sx={{
                          ml: 0.75,
                          color: "text.primary",
                          fontWeight: 600,
                        }}
                      >
                        • Pet:{" "}
                        <Box
                          component="span"
                          sx={{
                            fontSize: "0.95rem",
                            fontWeight: 700,
                            color: "text.primary",
                          }}
                        >
                          {petNamesLabel}
                        </Box>
                      </Box>
                    )}
                  </Typography>
                </Box>
              </Box>

              {onManageRecurrence && (
                <Button
                  size="small"
                  variant="contained"
                  color="primary"
                  startIcon={<Pencil size={14} />}
                  onClick={() => onManageRecurrence(series.representative_appointment)}
                  sx={{
                    alignSelf: { xs: "stretch", sm: "auto" },
                    borderRadius: 2,
                    textTransform: "none",
                    fontWeight: 600,
                    fontSize: "0.8rem",
                    px: 2,
                  }}
                >
                  Gerenciar Recorrência
                </Button>
              )}
            </Box>
          );
        })}
      </Box>
    );
  };

  // MODO AGENDAMENTO: Exibe somente nome, contato (email e telefones) e endereço em uma linha no rodapé
  if (variant === "appointment") {
    return (
      <Paper
        elevation={0}
        sx={{
          p: { xs: 1.5, sm: 2 },
          borderRadius: 3,
          border: "1px solid",
          borderColor: "divider",
          width: "100%",
          minWidth: 0,
        }}
      >
        {/* Header com dados básicos e botão WhatsApp */}
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 1,
            mb: hasContact || singleLineAddress ? 1.5 : 0,
          }}
        >
          <Box
            onClick={onClientClick}
            sx={{
              display: "flex",
              gap: 1.25,
              alignItems: "center",
              minWidth: 0,
              flex: 1,
              ...(onClientClick && {
                cursor: "pointer",
                borderRadius: 2,
                p: 0.75,
                m: -0.75,
                transition: "all 0.2s ease-in-out",
                "&:hover": {
                  bgcolor: (theme) => alpha(theme.palette.primary.main, 0.08),
                  "& .client-name-text": {
                    color: "primary.main",
                  },
                  "& .client-link-icon": {
                    color: "primary.main",
                    transform: "translate(2px, -2px)",
                  },
                },
              }),
            }}
          >
            <Box
              sx={{
                width: { xs: 38, sm: 44 },
                height: { xs: 38, sm: 44 },
                borderRadius: "10px",
                bgcolor: "primary.main",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "white",
                flexShrink: 0,
              }}
            >
              <User size={20} />
            </Box>
            <Box sx={{ minWidth: 0, flex: 1 }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
                <Typography
                  className="client-name-text"
                  variant="h6"
                  fontWeight={700}
                  color="text.primary"
                  noWrap
                  sx={{
                    fontSize: { xs: "0.95rem", sm: "1.1rem" },
                    lineHeight: 1.2,
                    transition: "color 0.2s ease",
                  }}
                >
                  {client.name}
                </Typography>
                {onClientClick && (
                  <Tooltip title="Ver detalhes do cliente">
                    <Box
                      className="client-link-icon"
                      component="span"
                      sx={{
                        display: "inline-flex",
                        alignItems: "center",
                        color: "text.disabled",
                        transition: "all 0.2s ease",
                      }}
                    >
                      <ExternalLink size={15} />
                    </Box>
                  </Tooltip>
                )}
              </Box>
              <Box sx={{ display: "flex", gap: 1, alignItems: "center", mt: 0.25 }}>
                <Chip
                  label={client.is_active ? "Ativo" : "Inativo"}
                  size="small"
                  sx={{
                    bgcolor: client.is_active ? "success.lighter" : "error.lighter",
                    color: client.is_active ? "success.dark" : "error.dark",
                    fontWeight: 600,
                    fontSize: "0.65rem",
                    height: "18px",
                  }}
                />
              </Box>
            </Box>
          </Box>

          {client.phone && (
            <Button
              variant="outlined"
              size="small"
              color="success"
              startIcon={<img src="/whatsapp.png" alt="WhatsApp" style={{ width: 15, height: 15 }} />}
              onClick={(e) => {
                e.stopPropagation();
                const cleanPhone = client.phone!.replace(/\D/g, "");
                const phoneWithCountry = cleanPhone.startsWith("55") ? cleanPhone : `55${cleanPhone}`;
                window.open(`https://wa.me/${phoneWithCountry}`, "_blank");
              }}
              sx={{
                borderRadius: 2,
                textTransform: "none",
                fontWeight: 600,
                fontSize: "0.75rem",
                height: 30,
                px: 1.5,
                borderColor: "success.light",
                color: "success.main",
                flexShrink: 0,
                "&:hover": {
                  borderColor: "success.dark",
                },
              }}
            >
              WhatsApp
            </Button>
          )}
        </Box>

        {/* Linha de contatos (E-mail, Principal, Secundário, Terciário) */}
        {hasContact && (
          <Box
            sx={{
              display: "flex",
              flexWrap: "wrap",
              gap: { xs: 2, sm: 3.5 },
              alignItems: "flex-start",
              pt: 1.5,
              borderTop: "1px solid",
              borderColor: "divider",
            }}
          >
            {client.email && (
              <InfoItem icon={Mail} label="E-mail" value={client.email} />
            )}
            {client.phone && (
              <InfoItem icon={Phone} label="Principal" value={maskPhone(client.phone)} />
            )}
            {client.phone_secondary && (
              <InfoItem
                icon={Phone}
                label={client.phone_secondary_name || "Contato 2"}
                value={maskPhone(client.phone_secondary)}
              />
            )}
            {client.phone_tertiary && (
              <InfoItem
                icon={Phone}
                label={client.phone_tertiary_name || "Contato 3"}
                value={maskPhone(client.phone_tertiary)}
              />
            )}
          </Box>
        )}

        {/* Linha única de endereço no final */}
        {renderSingleLineAddressRow(hasContact ? "dashed" : "solid")}

        {/* Recorrência Ativa do Cliente */}
        {renderActiveRecurrenceCard()}
      </Paper>
    );
  }

  // MODO COMPLETO (Usado na página de detalhes do cliente)
  const hasPersonal = !!(client.document || client.birth_date);
  const hasSocial = !!(client.instagram || client.facebook);
  const hasGridSections = hasContact || hasPersonal || hasSocial;

  // Calcula tamanho das colunas do Grid (12, 6 ou 4 dependendo de quantas seções existem)
  const activeGridCount = [hasContact, hasPersonal, hasSocial].filter(Boolean).length;
  const colSize = activeGridCount === 1 ? 12 : activeGridCount === 2 ? 6 : 4;

  return (
    <Paper
      elevation={0}
      sx={{
        p: { xs: 1.5, sm: 2.5 },
        borderRadius: 3,
        border: "1px solid",
        borderColor: "divider",
        width: "100%",
        minWidth: 0,
      }}
    >
      {/* Header */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 1,
          mb: hasGridSections || singleLineAddress ? { xs: 1.5, sm: 2 } : 0,
        }}
      >
        <Box sx={{ display: "flex", gap: 1.25, alignItems: "center", minWidth: 0, flex: 1 }}>
          <Box
            sx={{
              width: { xs: 40, sm: 48 },
              height: { xs: 40, sm: 48 },
              borderRadius: "12px",
              bgcolor: "primary.main",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "white",
              flexShrink: 0,
            }}
          >
            <User size={20} />
          </Box>
          <Box sx={{ minWidth: 0, flex: 1 }}>
            <Typography
              variant="h6"
              fontWeight={700}
              color="text.primary"
              noWrap
              sx={{
                fontSize: { xs: "0.95rem", sm: "1.15rem" },
                lineHeight: 1.2,
              }}
            >
              {client.name}
            </Typography>
            <Box sx={{ display: "flex", gap: 1, alignItems: "center", mt: 0.25 }}>
              <Chip
                label={client.is_active ? "Ativo" : "Inativo"}
                size="small"
                sx={{
                  bgcolor: client.is_active ? "success.lighter" : "error.lighter",
                  color: client.is_active ? "success.dark" : "error.dark",
                  fontWeight: 600,
                  fontSize: "0.65rem",
                  height: "18px",
                }}
              />
            </Box>
          </Box>
        </Box>

        <Box sx={{ display: "flex", gap: 0.75, alignItems: "center", flexShrink: 0 }}>
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
                  p: 0.6,
                  "&:hover": {
                    bgcolor: "grey.100",
                    color: "primary.main",
                  }
                }}
              >
                <Pencil size={15} />
              </IconButton>
            </Tooltip>
          )}

          {client.phone && (
            <Button
              variant="outlined"
              size="small"
              color="success"
              startIcon={<img src="/whatsapp.png" alt="WhatsApp" style={{ width: 16, height: 16 }} />}
              onClick={() => {
                const cleanPhone = client.phone!.replace(/\D/g, "");
                const phoneWithCountry = cleanPhone.startsWith("55") ? cleanPhone : `55${cleanPhone}`;
                window.open(`https://wa.me/${phoneWithCountry}`, "_blank");
              }}
              sx={{ 
                borderRadius: 2, 
                textTransform: "none",
                fontWeight: 600,
                fontSize: "0.75rem",
                height: 32,
                px: { xs: 1, sm: 1.5 },
                borderColor: "success.light",
                color: "success.main",
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

      {/* Grid com Contato, Dados Pessoais e Redes Sociais */}
      {hasGridSections && (
        <Grid container spacing={{ xs: 2, md: 3 }}>
          {/* Coluna 1: Contato */}
          {hasContact && (
            <Grid size={{ xs: 12, sm: 6, md: colSize }}>
              <Typography
                variant="subtitle2"
                fontWeight={700}
                sx={{
                  mb: 1.5,
                  textTransform: "uppercase",
                  fontSize: "0.7rem",
                  letterSpacing: 1,
                  color: "text.disabled",
                }}
              >
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
          )}

          {/* Coluna 2: Dados Pessoais */}
          {hasPersonal && (
            <Grid size={{ xs: 12, sm: 6, md: colSize }}>
              <Typography
                variant="subtitle2"
                fontWeight={700}
                sx={{
                  mb: 1.5,
                  textTransform: "uppercase",
                  fontSize: "0.7rem",
                  letterSpacing: 1,
                  color: "text.disabled",
                }}
              >
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
                value={client.birth_date ? isoToBrDate(client.birth_date) : null} 
              />
            </Grid>
          )}

          {/* Coluna 3: Redes Sociais */}
          {hasSocial && (
            <Grid size={{ xs: 12, sm: 6, md: colSize }}>
              <Typography
                variant="subtitle2"
                fontWeight={700}
                sx={{
                  mb: 1.5,
                  textTransform: "uppercase",
                  fontSize: "0.7rem",
                  letterSpacing: 1,
                  color: "text.disabled",
                }}
              >
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
              </Box>
            </Grid>
          )}
        </Grid>
      )}

      {/* Endereço em uma linha única no final também na tela de detalhes do cliente */}
      {renderSingleLineAddressRow(hasGridSections ? "dashed" : "solid")}

      {/* Recorrência Ativa do Cliente */}
      {renderActiveRecurrenceCard()}
    </Paper>
  );
};

export default ClientePersonalInfo;
