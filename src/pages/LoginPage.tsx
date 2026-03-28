import { useState } from "react";
import { Box, Typography, Button, Stack } from "@mui/material";
import CustomCard from "../components/Card/CustomCard";
import { ShieldCheck, Zap, PawPrint, Lock } from "lucide-react";
import { useNavigate } from "react-router";
import { login, type LoginPayload } from "../api/services/users";
import UserLoginForm from "../features/users/UserLoginForm";
import { useAuth } from "../hooks/useAuth";
import { useToast } from "../hooks/useToast";
import axios from "axios";

const LoginPage = () => {
  const [userForm, setUserForm] = useState<LoginPayload>({
    email: "",
    password: "",
  });
  const navigate = useNavigate();
  const { setUser } = useAuth();
  const toast = useToast();

  const handleAuth = async () => {
    try {
      const response = await login(userForm);
      setUser(response);
      navigate("/dashboard");
    } catch (error) {
      let message = "Erro ao fazer login. Tente novamente.";
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 401 || error.response?.status === 403) {
          message = "E-mail ou senha incorretos.";
        } else if (error.response?.status === 429) {
          message = "Muitas tentativas. Aguarde alguns instantes.";
        }
      }
      toast.error(message);
    }
  };

  return (
    <Box
      sx={{
        display: "flex",
        height: "100vh",
        width: "100vw",
        overflow: "hidden",
        bgcolor: "#F8FAFC",
      }}
    >
      {/* Left Pane - Branding & Welcome */}
      <Box
        sx={{
          width: { xs: "0%", md: "42%" },
          display: { xs: "none", md: "flex" },
          flexDirection: "column",
          justifyContent: "space-between",
          background: "linear-gradient(135deg, #313485 0%, #4B4EAD 100%)",
          position: "relative",
          p: 6,
          color: "white",
        }}
      >
        <Box
          sx={{
            position: "absolute",
            top: -100,
            left: -100,
            width: 300,
            height: 300,
            borderRadius: "50%",
            background: "rgba(255, 255, 255, 0.03)",
            filter: "blur(60px)",
          }}
        />
        <Box
          sx={{
            position: "absolute",
            bottom: -50,
            right: -50,
            width: 250,
            height: 250,
            borderRadius: "50%",
            background: "rgba(255, 255, 255, 0.05)",
            filter: "blur(40px)",
          }}
        />

        <Box sx={{ display: "flex", alignItems: "center", gap: 2, zIndex: 1 }}>
          <Box
            sx={{
              bgcolor: "rgba(255, 255, 255, 0.1)",
              p: 1.5,
              borderRadius: 3,
              backdropFilter: "blur(10px)",
              border: "1px solid rgba(255, 255, 255, 0.2)",
            }}
          >
            <ShieldCheck size={28} />
          </Box>
          <Typography variant="h5" fontWeight={800} letterSpacing={-0.5}>
            Petshop Manager
          </Typography>
        </Box>

        <Box sx={{ zIndex: 1 }}>
          <Box
            sx={{
              display: "inline-flex",
              alignItems: "center",
              gap: 1,
              bgcolor: "rgba(255, 255, 255, 0.1)",
              px: 2,
              py: 0.5,
              borderRadius: 5,
              mb: 3,
            }}
          >
            <Zap size={14} color="#FBBF24" />
            <Typography
              variant="caption"
              fontWeight={700}
              sx={{ opacity: 0.9 }}
            >
              BEM-VINDO DE VOLTA
            </Typography>
          </Box>

          <Typography
            variant="h2"
            sx={{ fontWeight: 800, mb: 2, lineHeight: 1.2, color: "white" }}
          >
            Que bom ver você novamente!
          </Typography>

          <Typography
            variant="body1"
            sx={{ opacity: 0.8, mb: 5, fontSize: "1.1rem", maxWidth: 450 }}
          >
            Continue de onde parou e gerencie seu petshop com a eficiência que
            ele merece.
          </Typography>

          <Stack spacing={3} sx={{ mt: 4 }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
              <Box sx={{ color: "#93C5FD" }}>
                <PawPrint size={24} />
              </Box>
              <Typography variant="subtitle1" fontWeight={600}>
                Gestão de Clientes e Pets
              </Typography>
            </Box>
            <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
              <Box sx={{ color: "#93C5FD" }}>
                <Zap size={24} />
              </Box>
              <Typography variant="subtitle1" fontWeight={600}>
                Agendamentos Inteligentes
              </Typography>
            </Box>
            <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
              <Box sx={{ color: "#93C5FD" }}>
                <Lock size={24} />
              </Box>
              <Typography variant="subtitle1" fontWeight={600}>
                Segurança e Backups
              </Typography>
            </Box>
          </Stack>
        </Box>

        <Typography variant="caption" sx={{ opacity: 0.5, zIndex: 1 }}>
          © 2026 Petshop Manager. Todos os direitos reservados.
        </Typography>
      </Box>

      {/* Right Pane - Login Form */}
      <Box
        sx={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          position: "relative",
          overflowY: "auto",
        }}
      >
        <Box
          sx={{
            p: 4,
            display: "flex",
            justifyContent: "flex-end",
            alignItems: "center",
          }}
        >
          <Typography variant="body2" color="text.disabled" fontWeight={600}>
            Ainda não tem conta?{" "}
            <Button
              onClick={() => navigate("/signup")}
              sx={{ fontWeight: 800, textTransform: "none" }}
            >
              Criar Conta
            </Button>
          </Typography>
        </Box>

        <Box
          sx={{
            flex: 1,
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            px: { xs: 2, sm: 4, lg: 8 },
            pb: 8,
          }}
        >
          <Box sx={{ width: "100%", maxWidth: 500 }}>
            <Box sx={{ mb: 4, textAlign: { xs: "center", md: "left" } }}>
              <Typography variant="h4" fontWeight={900} color="primary.main">
                Fazer Login
              </Typography>
              <Typography variant="body1" color="text.secondary">
                Insira suas credenciais para acessar sua plataforma.
              </Typography>
            </Box>

            <CustomCard
              sx={{
                p: 4,
                borderRadius: 5,
                boxShadow: "0 20px 40px rgba(0,0,0,0.05)",
              }}
            >
              <UserLoginForm
                user={userForm}
                onChange={setUserForm}
                handleSubmit={handleAuth}
              />
            </CustomCard>

            <Box sx={{ mt: 4, textAlign: "center" }}>
              <Typography variant="caption" color="text.disabled">
                Protegido por criptografia de ponta a ponta.
              </Typography>
            </Box>
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

export default LoginPage;
