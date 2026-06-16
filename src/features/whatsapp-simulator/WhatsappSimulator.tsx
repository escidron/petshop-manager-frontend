import * as React from "react";
import {
  Box,
  Drawer,
  IconButton,
  Typography,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Button,
  CircularProgress,
} from "@mui/material";
import { X, Send, Smartphone, MessageSquare } from "lucide-react";
import apiClient from "../../api/apiClient";
import { fetchClients } from "../../api/services/clients";
import type { Client } from "../clients/types";

interface Message {
  id: number;
  phone_number: string;
  direction: "inbound" | "outbound";
  content: string;
  buttons: Array<{ id: string; text: string }> | null;
  created_at: string;
}

interface WhatsappSimulatorProps {
  open: boolean;
  onClose: () => void;
}

export default function WhatsappSimulator({ open, onClose }: WhatsappSimulatorProps) {
  const [clients, setClients] = React.useState<Client[]>([]);
  const [selectedClient, setSelectedClient] = React.useState<Client | null>(null);
  const [messages, setMessages] = React.useState<Message[]>([]);
  const [inputText, setInputText] = React.useState("");
  const [loadingClients, setLoadingClients] = React.useState(false);
  const [loadingMessages, setLoadingMessages] = React.useState(false);
  const [sending, setSending] = React.useState(false);

  const messagesEndRef = React.useRef<HTMLDivElement>(null);

  // Carrega clientes ao abrir
  React.useEffect(() => {
    if (open) {
      setLoadingClients(true);
      fetchClients()
        .then((data) => {
          // Filtra apenas clientes que têm telefone
          const withPhone = data.filter((c) => c.phone && c.phone.trim() !== "");
          setClients(withPhone);
          if (withPhone.length > 0 && !selectedClient) {
            setSelectedClient(withPhone[0]);
          }
        })
        .catch((err) => console.error("Erro ao buscar clientes", err))
        .finally(() => setLoadingClients(false));
    }
  }, [open]);

  // Carrega mensagens ao selecionar um cliente
  const loadMessages = (phone: string) => {
    setLoadingMessages(true);
    apiClient
      .get<Message[]>(`/api/v1/whatsapp/messages?phone_number=${phone}`)
      .then((res) => {
        setMessages(res.data);
      })
      .catch((err) => console.error("Erro ao buscar mensagens do WhatsApp", err))
      .finally(() => setLoadingMessages(false));
  };

  React.useEffect(() => {
    if (selectedClient?.phone) {
      loadMessages(selectedClient.phone);
    } else {
      setMessages([]);
    }
  }, [selectedClient]);

  // Rola até o final das mensagens
  React.useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSelectClient = (clientId: number) => {
    const client = clients.find((c) => c.id === clientId) || null;
    setSelectedClient(client);
  };

  // Envia resposta simulada do cliente (inbound)
  const handleSendMessage = (textToSend: string, buttonPayload?: string) => {
    if (!selectedClient?.phone || (!textToSend.trim() && !buttonPayload)) return;

    setSending(true);
    const content = textToSend;
    setInputText("");

    // Otimisticamente adiciona a mensagem do cliente na tela antes da resposta da API
    const optimisticMessage: Message = {
      id: Date.now(),
      phone_number: selectedClient.phone,
      direction: "inbound",
      content: content,
      buttons: null,
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, optimisticMessage]);

    apiClient
      .post<Message>("/api/v1/whatsapp/simulate-inbound", {
        phone_number: selectedClient.phone,
        content: content,
        button_payload: buttonPayload,
      })
      .then(() => {
        // Recarrega todas as mensagens para ver a resposta automática gerada pelo backend
        if (selectedClient?.phone) {
          loadMessages(selectedClient.phone);
        }
      })
      .catch((err) => {
        console.error("Erro ao enviar mensagem simulada", err);
      })
      .finally(() => setSending(false));
  };

  // Formata hora da mensagem
  const formatTime = (isoString: string) => {
    try {
      const date = new Date(isoString);
      return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    } catch {
      return "";
    }
  };

  // Converte URLs em links clicáveis e asteriscos em texto negrito estilo WhatsApp
  const formatMessageText = (text: string) => {
    if (!text) return "";

    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const parts = text.split(urlRegex);

    return parts.map((part, i) => {
      if (urlRegex.test(part)) {
        return (
          <a
            key={`url-${i}`}
            href={part}
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: "#039be5", textDecoration: "underline", wordBreak: "break-all" }}
          >
            {part}
          </a>
        );
      }

      const boldRegex = /\*([^*]+)\*/g;
      const subParts = part.split(boldRegex);
      return subParts.map((subPart, j) => {
        if (j % 2 === 1) {
          return (
            <strong key={`bold-${i}-${j}`} style={{ fontWeight: 700 }}>
              {subPart}
            </strong>
          );
        }
        return subPart;
      });
    });
  };

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      PaperProps={{
        sx: {
          width: { xs: "100%", sm: 420 },
          display: "flex",
          flexDirection: "column",
          height: "100%",
          p: 0,
          borderLeft: "1px solid #e0e0e0",
        },
      }}
    >
      {/* HEADER DO SIMULADOR */}
      <Box
        sx={{
          bgcolor: "#075E54",
          color: "white",
          p: 2,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          borderBottom: "4px solid #128C7E",
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
          <Smartphone size={24} />
          <Box>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, lineHeight: 1.2 }}>
              Simulador de WhatsApp
            </Typography>
            <Typography variant="caption" sx={{ opacity: 0.8 }}>
              Modo Sandbox (Cliente Final)
            </Typography>
          </Box>
        </Box>
        <IconButton size="small" onClick={onClose} sx={{ color: "white" }}>
          <X size={20} />
        </IconButton>
      </Box>

      {/* SELETOR DE CLIENTE */}
      <Box sx={{ p: 2, borderBottom: "1px solid #e0e0e0", bgcolor: "#f9f9f9" }}>
        {loadingClients ? (
          <Box sx={{ display: "flex", justifyContent: "center", p: 1 }}>
            <CircularProgress size={24} />
          </Box>
        ) : clients.length === 0 ? (
          <Typography variant="body2" color="text.primary" sx={{ textAlign: "center" }}>
            Nenhum cliente com telefone cadastrado para simular.
          </Typography>
        ) : (
          <FormControl fullWidth size="small">
            <InputLabel id="select-client-label">Simular Cliente</InputLabel>
            <Select
              labelId="select-client-label"
              value={selectedClient?.id || ""}
              label="Simular Cliente"
              onChange={(e) => handleSelectClient(Number(e.target.value))}
            >
              {clients.map((c) => (
                <MenuItem key={c.id} value={c.id}>
                  {c.name} ({c.phone})
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        )}
      </Box>

      {/* CONVERSA (ESTILO WHATSAPP) */}
      <Box
        sx={{
          flex: 1,
          overflowY: "auto",
          bgcolor: "#efeae2", // Cor padrão de fundo do WhatsApp
          backgroundImage: "radial-gradient(#dfdcd6 10%, transparent 10%)",
          backgroundSize: "20px 20px",
          p: 2,
          display: "flex",
          flexDirection: "column",
          gap: 1.5,
        }}
      >
        {loadingMessages ? (
          <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100%" }}>
            <CircularProgress size={32} sx={{ color: "#075E54" }} />
          </Box>
        ) : !selectedClient ? (
          <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", opacity: 0.5 }}>
            <MessageSquare size={48} />
            <Typography variant="body2" sx={{ mt: 1 }}>
              Selecione um cliente para iniciar.
            </Typography>
          </Box>
        ) : messages.length === 0 ? (
          <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", opacity: 0.6, p: 4, textAlign: "center" }}>
            <Typography variant="body2" color="text.primary">
              Nenhuma mensagem trocada ainda.
            </Typography>
            <Typography variant="caption" color="text.primary" sx={{ mt: 1 }}>
              Crie um novo agendamento com status "Pendente" para este cliente para ver o envio da mensagem.
            </Typography>
          </Box>
        ) : (
          messages.map((msg) => {
            const isClient = msg.direction === "inbound";
            return (
              <Box
                key={msg.id}
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: isClient ? "flex-end" : "flex-start",
                  width: "100%",
                }}
              >
                {/* BALÃO DA MENSAGEM */}
                <Box
                  sx={{
                    maxWidth: "85%",
                    bgcolor: isClient ? "#d9fdd3" : "#ffffff", // Verde WhatsApp vs Branco
                    borderRadius: isClient ? "8px 0px 8px 8px" : "0px 8px 8px 8px",
                    p: 1.25,
                    boxShadow: "0px 1px 1px rgba(0,0,0,0.1)",
                    position: "relative",
                  }}
                >
                  <Typography
                    variant="body2"
                    sx={{
                      whiteSpace: "pre-line",
                      color: "#303030",
                      lineHeight: 1.4,
                      pb: 1,
                      pr: 4,
                    }}
                  >
                    {formatMessageText(msg.content)}
                  </Typography>
                  <Typography
                    variant="caption"
                    sx={{
                      position: "absolute",
                      bottom: 2,
                      right: 6,
                      fontSize: "0.65rem",
                      color: "text.secondary",
                    }}
                  >
                    {formatTime(msg.created_at)}
                  </Typography>
                </Box>

                {/* BOTÕES DE RESPOSTA RÁPIDA (META TEMPLATE BUTTONS) */}
                {!isClient && msg.buttons && msg.buttons.length > 0 && (
                  <Box
                    sx={{
                      display: "flex",
                      flexDirection: "column",
                      gap: 0.5,
                      mt: 0.5,
                      width: "85%",
                    }}
                  >
                    {msg.buttons.map((btn) => (
                      <Button
                        key={btn.id}
                        variant="outlined"
                        fullWidth
                        disabled={sending}
                        onClick={() => handleSendMessage(btn.text, btn.id)}
                        sx={{
                          bgcolor: "#ffffff",
                          color: "#00a884",
                          borderColor: "#e1e1e1",
                          borderRadius: 2,
                          textTransform: "none",
                          py: 0.75,
                          fontSize: "0.825rem",
                          fontWeight: 600,
                          boxShadow: "0px 1px 1px rgba(0,0,0,0.05)",
                          "&:hover": {
                            bgcolor: "#f7f7f7",
                            borderColor: "#d1d1d1",
                          },
                        }}
                      >
                        {btn.text}
                      </Button>
                    ))}
                  </Box>
                )}
              </Box>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </Box>

      {/* INPUT DO CHAT (TEXTO LIVRE) */}
      <Box
        component="form"
        onSubmit={(e) => {
          e.preventDefault();
          handleSendMessage(inputText);
        }}
        sx={{
          p: 1.5,
          bgcolor: "#f0f2f5",
          display: "flex",
          alignItems: "center",
          gap: 1,
          borderTop: "1px solid #e0e0e0",
        }}
      >
        <TextField
          fullWidth
          size="small"
          placeholder="Responda como cliente..."
          value={inputText}
          disabled={!selectedClient || sending}
          onChange={(e) => setInputText(e.target.value)}
          sx={{
            bgcolor: "white",
            borderRadius: 5,
            "& .MuiOutlinedInput-root": {
              borderRadius: 5,
              "& fieldset": { borderColor: "transparent" },
              "&:hover fieldset": { borderColor: "transparent" },
              "&.Mui-focused fieldset": { borderColor: "transparent" },
            },
          }}
        />
        <IconButton
          type="submit"
          disabled={!selectedClient || !inputText.trim() || sending}
          sx={{
            bgcolor: inputText.trim() ? "#00a884" : "transparent",
            color: inputText.trim() ? "white" : "text.secondary",
            "&:hover": {
              bgcolor: inputText.trim() ? "#008f72" : "transparent",
            },
            p: 1,
          }}
        >
          <Send size={18} />
        </IconButton>
      </Box>
    </Drawer>
  );
}
