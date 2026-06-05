import { useState } from "react";
import { Box, Typography, Button, Stack } from "@mui/material";
import CustomCard from "../components/Card/CustomCard";
import { Zap, PawPrint, Lock } from "lucide-react";
import { useNavigate } from "react-router";
import { login, type LoginPayload } from "../api/services/users";
import UserLoginForm from "../features/users/UserLoginForm";
import { useAuth } from "../hooks/useAuth";
import { useToast } from "../hooks/useToast";
import axios from "axios";
import LegalDialog from "../components/LegalDialog";

const LoginPage = () => {
  const [userForm, setUserForm] = useState<LoginPayload>({
    email: "",
    password: "",
  });
  const [loading, setLoading] = useState(false);
  const [failedAttempts, setFailedAttempts] = useState(0);
  const navigate = useNavigate();
  const { setUser, checkAuth } = useAuth();
  const toast = useToast();
  const [legalModal, setLegalModal] = useState<{ open: boolean; type: "terms" | "privacy" }>({
    open: false,
    type: "terms",
  });

  const handleAuth = async () => {
    setLoading(true);
    try {
      const response = await login(userForm);
      setFailedAttempts(0);

      if (response.needs_tenant_selection) {
        navigate("/select-tenant", {
          state: {
            selection_token: response.selection_token,
            tenants: response.tenants,
          },
        });
        return;
      }

      setUser(response.user);
      await checkAuth();
      navigate("/dashboard");
    } catch (error) {
      const newFailedAttempts = failedAttempts + 1;
      setFailedAttempts(newFailedAttempts);

      let message = "Erro ao fazer login. Tente novamente.";
      
      if (axios.isAxiosError(error)) {
        const isWAFBlock = error.response?.status === 403;
        
        // Se for 403 (WAF) ou chegamos a 3 tentativas, forçamos um reset suave
        if (isWAFBlock || newFailedAttempts >= 3) {
          message = isWAFBlock 
            ? "Problema de conexão detectado (WAF). Tentando recuperar sua sessão..."
            : "Muitas tentativas falhas. Reiniciando sessão...";
          
          toast.info(message);
          
          try {
            const baseUrl = import.meta.env.VITE_API_BASE_URL;
            // Tentativa de limpar cookies via fetch isolado
            await fetch(`${baseUrl}/api/v1/auth/logout`, {
              method: 'GET',
              mode: 'no-cors',
              credentials: 'include'
            });
            
            // Pequeno delay para garantir que o navegador processe a limpeza antes de recarregar
            await new Promise(r => setTimeout(r, 800));
            
            setFailedAttempts(0);
            window.location.reload(); // Recarregar para garantir estado limpo
            return;
          } catch (e) {
            console.error("Erro no recovery", e);
          }
        }

        if (error.response?.status === 401 || error.response?.status === 403) {
          message = "E-mail ou senha incorretos.";
        } else if (error.response?.status === 429) {
          message = "Muitas tentativas. Aguarde alguns instantes.";
        }
      }
      toast.error(message);
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

        <Box sx={{ zIndex: 1 }}>
          <img src="/logo.png" alt="PetControle" width={150} />
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
          © 2026 PetControle. Todos os direitos reservados.
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
                loading={loading}
              />
            </CustomCard>

            <Box sx={{ mt: 4, textAlign: "center" }}>
              <Typography variant="caption" color="text.disabled" sx={{ display: "block", mb: 1 }}>
                Protegido por criptografia de ponta a ponta.
              </Typography>
              <Stack direction="row" spacing={2} justifyContent="center">
                <Button 
                  onClick={() => setLegalModal({ open: true, type: "terms" })} 
                  sx={{ fontSize: "0.7rem", color: "text.disabled", minWidth: 0, p: 0, textTransform: "none", "&:hover": { color: "primary.main" } }}
                >
                  Termos de Uso
                </Button>
                <Button 
                  onClick={() => setLegalModal({ open: true, type: "privacy" })} 
                  sx={{ fontSize: "0.7rem", color: "text.disabled", minWidth: 0, p: 0, textTransform: "none", "&:hover": { color: "primary.main" } }}
                >
                  Privacidade
                </Button>
              </Stack>
            </Box>
          </Box>
        </Box>
      </Box>
      <LegalDialog
        open={legalModal.open}
        onClose={() => setLegalModal((prev) => ({ ...prev, open: false }))}
        type={legalModal.type}
      />
    </Box>
  );
};

export default LoginPage;
