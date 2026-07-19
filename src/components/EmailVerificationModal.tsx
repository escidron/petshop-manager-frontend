import React, { useState, useEffect, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  CircularProgress,
  IconButton,
  TextField,
} from "@mui/material";
import { X, Mail, CheckCircle2, AlertCircle, Edit2 } from "lucide-react";
import { verifyEmail, resendVerificationEmail, updateProfile } from "../api/services/users";
import { useAuth } from "../hooks/useAuth";
import { toast } from "react-toastify";

interface EmailVerificationModalProps {
  open: boolean;
  onClose: () => void;
}

export default function EmailVerificationModal({
  open,
  onClose,
}: EmailVerificationModalProps) {
  const { user, setUser } = useAuth();
  const [otp, setOtp] = useState<string[]>(new Array(6).fill(""));
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isEditingEmail, setIsEditingEmail] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (open) {
      setOtp(new Array(6).fill(""));
      setError(null);
      setSuccess(false);
      setIsEditingEmail(false);
      setNewEmail(user?.email || "");
      // Focus first input
      setTimeout(() => {
        if (inputRefs.current[0]) {
          inputRefs.current[0].focus();
        }
      }, 100);
    }
  }, [open, user]);

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const handleChange = (value: string, index: number) => {
    // Only allow single numbers
    if (!/^\d*$/.test(value)) return;

    const newOtp = [...otp];
    // Take the last character typed
    newOtp[index] = value.substring(value.length - 1);
    setOtp(newOtp);
    setError(null);

    // Auto-focus next input
    if (value && index < 5) {
      const nextInput = inputRefs.current[index + 1];
      if (nextInput) {
        nextInput.focus();
      }
    }
  };

  const handleKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>,
    index: number,
  ) => {
    // Handle backspace
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      const prevInput = inputRefs.current[index - 1];
      if (prevInput) {
        prevInput.focus();
      }
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text").trim();
    if (!/^\d{6}$/.test(pastedData)) return;

    const newOtp = pastedData.split("");
    setOtp(newOtp);

    // Focus last input
    if (inputRefs.current[5]) {
      inputRefs.current[5].focus();
    }
  };

  const handleVerify = async () => {
    const code = otp.join("");
    if (code.length < 6) {
      setError("Por favor, preencha todos os dígitos.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await verifyEmail(code);
      setSuccess(true);
      toast.success("E-mail verificado com sucesso!");
      setTimeout(() => {
        if (user) {
          setUser({ ...user, email_verified: true });
        }
        onClose();
      }, 2000);
    } catch (err: any) {
      const msg = err.response?.data?.detail || "Erro ao verificar e-mail. Tente novamente.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateEmail = async () => {
    if (!newEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newEmail)) {
      setError("Por favor, insira um e-mail válido.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const updatedUser = await updateProfile({ email: newEmail });
      if (user) {
        setUser({ ...user, email: updatedUser.email, email_verified: false });
      }
      toast.success("E-mail atualizado! Novo código enviado.");
      setIsEditingEmail(false);
      setOtp(new Array(6).fill(""));
      setCountdown(60);
      setTimeout(() => {
        if (inputRefs.current[0]) {
          inputRefs.current[0].focus();
        }
      }, 100);
    } catch (err: any) {
      const msg = err.response?.data?.detail || "Erro ao atualizar e-mail.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };


  const handleResend = async () => {
    if (countdown > 0 || resending) return;

    setResending(true);
    setError(null);
    try {
      await resendVerificationEmail();
      toast.success("Código reenviado com sucesso!");
      setCountdown(60); // 1 minute cooldown
    } catch (err: any) {
      const msg = err.response?.data?.detail || "Erro ao reenviar código.";
      setError(msg);
    } finally {
      setResending(false);
    }
  };

  const isComplete = otp.every((val) => val !== "");

  return (
    <Dialog
      open={open}
      onClose={loading ? undefined : onClose}
      maxWidth="xs"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 4,
          padding: 2,
          boxShadow: "0 10px 30px rgba(0,0,0,0.1)",
        },
      }}
    >
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1 }}>
        <Typography variant="h6" sx={{ fontWeight: 700, color: "text.primary" }}>
          Confirmar E-mail
        </Typography>
        <IconButton onClick={onClose} disabled={loading} size="small">
          <X size={18} />
        </IconButton>
      </Box>

      <DialogContent sx={{ p: 1, display: "flex", flexDirection: "column", alignItems: "center" }}>
        {success ? (
          <Box sx={{ py: 2, display: "flex", flexDirection: "column", alignItems: "center", gap: 1.5 }}>
            <Box
              sx={{
                background: "linear-gradient(135deg, #ECFDF5 0%, #D1FAE5 100%)",
                color: "#10B981",
                borderRadius: "50%",
                width: 72,
                height: 72,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                mb: 1,
                boxShadow: "0 4px 12px rgba(16, 185, 129, 0.2)",
                border: "4px solid #F0FDF4",
              }}
            >
              <CheckCircle2 size={36} />
            </Box>
            <Typography variant="h6" sx={{ fontWeight: 700, color: "#059669", textAlign: "center" }}>
              E-mail verificado!
            </Typography>
            <Typography variant="body2" sx={{ color: "text.primary", textAlign: "center" }}>
              Sua conta foi ativada com sucesso. O banner sumirá em instantes.
            </Typography>
          </Box>
        ) : isEditingEmail ? (
          <Box sx={{ display: "flex", flexDirection: "column", width: "100%", alignItems: "center", p: 1 }}>
            <Box
              sx={{
                background: "linear-gradient(135deg, #EFF6FF 0%, #DBEAFE 100%)",
                color: "#2563EB",
                borderRadius: "50%",
                width: 64,
                height: 64,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                mb: 2.5,
                boxShadow: "0 4px 10px rgba(37, 99, 235, 0.15)",
                border: "4px solid #F8FAFC",
              }}
            >
              <Edit2 size={26} />
            </Box>
            <Typography variant="body2" sx={{ color: "text.primary", textAlign: "center", mb: 3 }}>
              Insira o novo endereço de e-mail para receber o código de verificação.
            </Typography>
            <TextField
              variant="outlined"
              size="small"
              placeholder="Digite seu e-mail"  
              fullWidth
              value={newEmail}
              onChange={(e) => {
                setNewEmail(e.target.value);
                setError(null);
              }}
              sx={{ mb: 2 }}
            />
            {error && (
              <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2, color: "error.main", width: "100%" }}>
                <AlertCircle size={16} />
                <Typography variant="caption" sx={{ fontWeight: 550 }}>
                  {error}
                </Typography>
              </Box>
            )}
          </Box>
        ) : (
          <>
            <Box
              sx={{
                background: "linear-gradient(135deg, #ECFDF5 0%, #D1FAE5 100%)",
                color: "#059669",
                borderRadius: "50%",
                width: 64,
                height: 64,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                mb: 2.5,
                boxShadow: "0 4px 10px rgba(16, 185, 129, 0.15)",
                border: "4px solid #F0FDF4",
              }}
            >
              <Mail size={26} />
            </Box>

            <Typography variant="body2" sx={{ color: "text.primary", textAlign: "center", mb: 3 }}>
              Enviamos um código de verificação para o e-mail: <br />
              <strong>{user?.email}</strong>. <br />
              Por favor, insira os 6 dígitos abaixo.
              <Button
                variant="text"
                size="small"
                onClick={() => {
                  setIsEditingEmail(true);
                  setError(null);
                  setNewEmail(user?.email || "");
                }}
                sx={{
                  p: 0,
                  minWidth: 0,
                  fontSize: "0.8rem",
                  fontWeight: 700,
                  textTransform: "none",
                  display: "block",
                  margin: "6px auto 0 auto",
                }}
              >
                Alterar e-mail
              </Button>
            </Typography>

            <Box sx={{ display: "flex", gap: 1, justifyContent: "center", mb: 3 }}>
              {otp.map((digit, index) => (
                <Box
                  key={index}
                  component="input"
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleChange(e.target.value, index)}
                  onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => handleKeyDown(e, index)}
                  onPaste={index === 0 ? handlePaste : undefined}
                  ref={(el: HTMLInputElement | null) => {
                    inputRefs.current[index] = el;
                  }}
                  sx={{
                    width: 45,
                    height: 50,
                    fontSize: "1.5rem",
                    fontWeight: 700,
                    textAlign: "center",
                    borderRadius: 2,
                    border: "1.5px solid",
                    borderColor: error ? "error.main" : "grey.300",
                    outline: "none",
                    bgcolor: "grey.50",
                    transition: "all 0.2s",
                    "&:focus": {
                      borderColor: "primary.main",
                      bgcolor: "white",
                      boxShadow: "0 0 0 3px rgba(99, 102, 241, 0.15)",
                    },
                  }}
                />
              ))}
            </Box>

            {error && (
              <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2, color: "error.main" }}>
                <AlertCircle size={16} />
                <Typography variant="caption" sx={{ fontWeight: 550 }}>
                  {error}
                </Typography>
              </Box>
            )}

            <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 1, mb: 1 }}>
              <Typography variant="caption" sx={{ color: "text.primary" }}>
                Não recebeu o código?
              </Typography>
              <Button
                variant="text"
                size="small"
                onClick={handleResend}
                disabled={countdown > 0 || resending}
                sx={{
                  p: 0,
                  minWidth: 0,
                  fontSize: "0.75rem",
                  fontWeight: 700,
                  textTransform: "none",
                }}
              >
                {countdown > 0 ? `Reenviar em ${countdown}s` : "Reenviar e-mail"}
              </Button>
            </Box>
            <Typography variant="caption" sx={{ color: "text.secondary", textAlign: "center", display: "block", mt: 1 }}>
              Caso não encontre o e-mail, verifique sua caixa de <strong>spam</strong> ou <strong>lixo eletrônico</strong>.
            </Typography>
          </>
        )}
      </DialogContent>

      {!success && (
        <DialogActions sx={{ px: 1, pb: 1, pt: 2, justifyContent: "space-between", gap: 2 }}>
          {isEditingEmail ? (
            <>
              <Button
                variant="outlined"
                onClick={() => {
                  setIsEditingEmail(false);
                  setError(null);
                }}
                disabled={loading}
                fullWidth
                sx={{ borderRadius: 2.5, textTransform: "none", fontWeight: 600 }}
              >
                Voltar
              </Button>
              <Button
                variant="contained"
                onClick={handleUpdateEmail}
                disabled={loading || !newEmail || newEmail === user?.email}
                fullWidth
                sx={{
                  borderRadius: 2.5,
                  textTransform: "none",
                  fontWeight: 650,
                  boxShadow: "none",
                  "&:hover": { boxShadow: "none" },
                }}
              >
                {loading ? <CircularProgress size={20} color="inherit" /> : "Salvar"}
              </Button>
            </>
          ) : (
            <>
              <Button
                variant="outlined"
                onClick={onClose}
                disabled={loading}
                fullWidth
                sx={{ borderRadius: 2.5, textTransform: "none", fontWeight: 600 }}
              >
                Mais tarde
              </Button>
              <Button
                variant="contained"
                onClick={handleVerify}
                disabled={loading || !isComplete}
                fullWidth
                sx={{
                  borderRadius: 2.5,
                  textTransform: "none",
                  fontWeight: 650,
                  boxShadow: "none",
                  "&:hover": { boxShadow: "none" },
                }}
              >
                {loading ? <CircularProgress size={20} color="inherit" /> : "Confirmar"}
              </Button>
            </>
          )}
        </DialogActions>
      )}
    </Dialog>
  );
}
