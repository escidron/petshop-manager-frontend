import { useState } from "react";
import { Box, Typography, Button, Stack, FormControl, FormLabel } from "@mui/material";
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
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <Box sx={{ width: "100%", maxWidth: 500, p: 2 }}>
        <Button
          startIcon={<ArrowLeft size={16} />}
          onClick={() => navigate("/login")}
          sx={{ mb: 4, textTransform: "none", color: "text.secondary" }}
        >
          Voltar para o Login
        </Button>

        <Box sx={{ mb: 4, textAlign: "center" }}>
          <Typography variant="h4" fontWeight={900} color="primary.main">
            Recuperar Senha
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Insira seu e-mail para receber um código de 6 dígitos.
          </Typography>
        </Box>

        <CustomCard sx={{ p: 4, borderRadius: 5, boxShadow: "0 20px 40px rgba(0,0,0,0.05)" }}>
          <form onSubmit={handleRequestOtp}>
            <Stack spacing={3}>
              <FormControl>
                <FormLabel sx={{ color: "text.primary", mb: 0.5 }}>
                  <Stack direction="row" spacing={0.5} alignItems="center">
                    <Mail size={16} />
                    <Typography>Email</Typography>
                  </Stack>
                </FormLabel>
                <CustomTextField
                  type="email"
                  value={email}
                  required
                  placeholder="Seu e-mail cadastrado"
                  onChange={(e) => setEmail(e.target.value)}
                  fullWidth
                />
              </FormControl>

              <Button
                type="submit"
                variant="contained"
                disabled={loading}
                sx={{
                  py: 1.5,
                  fontWeight: 700,
                  fontSize: "1.1rem",
                  bgcolor: "primary.main",
                  "&:hover": { bgcolor: "primary.dark" },
                  borderRadius: 2,
                  display: "flex",
                  gap: 1
                }}
                fullWidth
              >
                {loading ? "Enviando..." : "Enviar Código"}
                {!loading && <Key size={18} />}
              </Button>
            </Stack>
          </form>
        </CustomCard>
      </Box>
    </Box>
  );
};

export default ForgotPasswordPage;
