import { useState } from "react";
import { Box, Typography, Button, Stack, FormControl, FormLabel, alpha, Divider } from "@mui/material";
import CustomCard from "../components/Card/CustomCard";
import CustomTextField from "../components/Textfield/CustomTextfield";
import { Mail, ArrowLeft, Key } from "lucide-react";
import { useNavigate } from "react-router";
import { forgotPassword } from "../api/services/users";
import { useToast } from "../hooks/useToast";
import axios from "axios";

const ForgotPasswordPage = () => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const toast = useToast();

  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await forgotPassword(email);
      toast.success("Se o e-mail estiver cadastrado, você receberá um código em instantes.");
      // Navegar para reset chamando o email junto
      navigate("/reset-password", { state: { email } });
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 404) {
        toast.error("E-mail não cadastrado em nossa base.");
      } else {
        toast.error("Erro ao solicitar recuperação. Tente novamente.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        display: "flex",
        height: "100vh",
        width: "100vw",
        bgcolor: "#F8FAFC",
        background: "linear-gradient(135deg, #F8FAFC 0%, #EEF2F6 50%, #E2E8F0 100%)",
        justifyContent: "center",
        alignItems: "center",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Background Blobs for Visual Depth */}
      <Box
        sx={{
          position: "absolute",
          top: "10%",
          left: "15%",
          width: 300,
          height: 300,
          borderRadius: "50%",
          bgcolor: "rgba(49, 52, 133, 0.03)",
          filter: "blur(80px)",
          zIndex: 0,
          pointerEvents: "none",
        }}
      />
      <Box
        sx={{
          position: "absolute",
          bottom: "10%",
          right: "15%",
          width: 350,
          height: 350,
          borderRadius: "50%",
          bgcolor: "rgba(25, 118, 210, 0.04)",
          filter: "blur(100px)",
          zIndex: 0,
          pointerEvents: "none",
        }}
      />

      <Box sx={{ width: "100%", maxWidth: 460, p: 2, zIndex: 1 }}>
        <CustomCard
          sx={{
            p: 4.5,
            borderRadius: 6,
            boxShadow: "0 25px 50px -12px rgba(0,0,0,0.04)",
            border: "1px solid",
            borderColor: "divider",
            bgcolor: "background.paper",
            position: "relative",
            overflow: "visible",
          }}
        >
          {/* Circular Icon Header */}
          <Box
            sx={{
              display: "flex",
              justifyContent: "center",
              mb: 3,
            }}
          >
            <Box
              sx={{
                width: 64,
                height: 64,
                borderRadius: "50%",
                bgcolor: (theme) => alpha(theme.palette.primary.main, 0.08),
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "primary.main",
                boxShadow: "0 8px 20px rgba(25, 118, 210, 0.08)",
              }}
            >
              <Key size={30} />
            </Box>
          </Box>

          <Box sx={{ mb: 4, textAlign: "center" }}>
            <Typography variant="h4" fontWeight={900} color="text.primary" sx={{ mb: 1, letterSpacing: "-0.5px" }}>
              Recuperar Senha
            </Typography>
            <Typography variant="body2" color="text.primary" sx={{ fontSize: "0.95rem", px: 2 }}>
              Insira seu e-mail cadastrado abaixo para receber um código de 6 dígitos.
            </Typography>
          </Box>

          <form onSubmit={handleRequestOtp}>
            <Stack spacing={3}>
              <FormControl>
                <FormLabel sx={{ color: "text.primary", fontWeight: 600, mb: 1, fontSize: "0.85rem" }}>
                  <Stack direction="row" spacing={0.75} alignItems="center">
                    <Mail size={16} color="gray" />
                    <Typography variant="body2" fontWeight={700}>E-mail da sua conta</Typography>
                  </Stack>
                </FormLabel>
                <CustomTextField
                  type="email"
                  value={email}
                  required
                  placeholder="seuemail@exemplo.com"
                  onChange={(e) => setEmail(e.target.value)}
                  fullWidth
                  sx={{
                    "& .MuiOutlinedInput-root": {
                      borderRadius: 3,
                    }
                  }}
                />
              </FormControl>

              <Button
                type="submit"
                disabled={loading}
                variant="contained"
                sx={{
                  py: 1.6,
                  fontWeight: 700,
                  fontSize: "1rem",
                  bgcolor: "primary.main",
                  "&:hover": {
                    bgcolor: "primary.dark",
                    transform: "translateY(-1px)",
                    boxShadow: "0 8px 20px rgba(25, 118, 210, 0.25)",
                  },
                  borderRadius: 3,
                  display: "flex",
                  gap: 1,
                  transition: "all 0.2s ease",
                  textTransform: "none",
                }}
                fullWidth
              >
                {loading ? "Enviando..." : "Enviar Código"}
                {!loading && <Key size={18} />}
              </Button>
            </Stack>
          </form>

          <Divider sx={{ my: 3.5 }} />

          <Box sx={{ textAlign: "center" }}>
            <Button
              startIcon={<ArrowLeft size={16} />}
              onClick={() => navigate("/login")}
              sx={{
                textTransform: "none",
                color: "text.primary",
                fontWeight: 600,
                fontSize: "0.9rem",
                "&:hover": {
                  color: "primary.main",
                  bgcolor: "transparent",
                }
              }}
            >
              Voltar para o Login
            </Button>
          </Box>
        </CustomCard>
      </Box>
    </Box>
  );
};

export default ForgotPasswordPage;
