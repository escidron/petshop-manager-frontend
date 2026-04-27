import { useState, useEffect } from "react";
import { Box, Typography, Button, Stack } from "@mui/material";
import CustomCard from "../components/Card/CustomCard";
import {
  Settings,
  User,
  Store,
  CheckCircle2,
  ArrowLeft,
  Zap,
} from "lucide-react";
import { useToast } from "../hooks/useToast";
import { useNavigate } from "react-router";

import UserSignupForm from "../features/users/UserSignupForm";
import TenantCreateForm from "../features/tenants/TenantForm";

import type { UserFormData } from "../features/users/types";
import type { TenantFormData } from "../features/tenants/types";
import { signup } from "../api/services/auth";
import PlanForm from "../features/plans/PlanForm";
import type { PlanCode } from "../features/plans/types";
import { useSearchParams } from "react-router";
import { useAuth } from "../hooks/useAuth";
import axios from "axios";

const SignupPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const stepParam = Number(searchParams.get("step")) as 1 | 2 | 3;
  const step: 1 | 2 | 3 = stepParam || 1;
  const planFromUrl = searchParams.get("plan") as PlanCode | null;
  const [planCode, setPlanCode] = useState<PlanCode | null>(planFromUrl);
  const [userData, setUserData] = useState<UserFormData | null>(null);
  const [tenantData, setTenantData] = useState<TenantFormData | null>(null);
  const [loading, setLoading] = useState(false);

  const toast = useToast();
  const navigate = useNavigate();
  const { checkAuth } = useAuth();

  // Sincronizar estado local com a URL caso mude externamente (ex: botão voltar do navegador)
  useEffect(() => {
    if (planFromUrl && planFromUrl !== planCode) {
      setPlanCode(planFromUrl);
    }
  }, [planFromUrl]);

  const goToStep = (newStep: 1 | 2 | 3) => {
    const newParams = new URLSearchParams(searchParams);
    newParams.set("step", String(newStep));
    setSearchParams(newParams);
  };

  const handleSelectPlan = (plan: PlanCode) => {
    setPlanCode(plan);
    const newParams = new URLSearchParams(searchParams);
    newParams.set("step", "2");
    newParams.set("plan", plan);
    setSearchParams(newParams);
  };

  const handleSubmitUser = (data: UserFormData) => {
    setUserData(data);
    goToStep(3);
  };

  const handleSubmitTenant = async (data: TenantFormData) => {
    setTenantData(data);
    if (!planCode || !userData) return;

    setLoading(true);
    try {
      await signup(
        {
          email: userData.email,
          password: userData.password,
          name: userData.name,
        },
        {
          name: data.name,
          phone: data.phone,
          document: data.document,
        },
        planCode,
      );

      toast.success("Conta criada com sucesso");
      await checkAuth();
      navigate("/dashboard");
    } catch (error: unknown) {
      let message = "Erro ao criar conta";
      if (axios.isAxiosError(error)) {
        message = error.response?.data?.detail ?? message;
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
      {/* Left Pane - Branding & Benefits */}
      <Box
        sx={{
          width: { xs: "0%", md: "35%" },
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
              PLATAFORMA #1 PARA PETSHOPS
            </Typography>
          </Box>

          <Typography
            variant="h2"
            sx={{ fontWeight: 800, mb: 2, lineHeight: 1.2, color: "white" }}
          >
            {step === 1 && "Simplicidade para gerenciar seu tempo."}
            {step === 2 && "Sua conta é a porta para o sucesso."}
            {step === 3 && "Personalize a vitrine do seu negócio."}
          </Typography>

          <Typography
            variant="body1"
            sx={{ opacity: 0.8, mb: 5, fontSize: "1.1rem", maxWidth: 450 }}
          >
            {step === 1 && "Escolha o plano que melhor se adapta à sua rotina e comece a escalar hoje mesmo."}
            {step === 2 && "Junte-se a milhares de empreendedores que transformaram a gestão de seus pets."}
            {step === 3 && "Seus clientes vão notar a diferença desde o primeiro agendamento."}
          </Typography>

          <Stack spacing={2} sx={{ mt: 4 }}>
            {[
              { idx: 1, label: "Plano Ideal", icon: <Settings size={18} /> },
              { idx: 2, label: "Dados da Conta", icon: <User size={18} /> },
              { idx: 3, label: "Seu Negócio", icon: <Store size={18} /> },
            ].map((item) => (
              <Box
                key={item.idx}
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 2,
                  opacity: step === item.idx ? 1 : 0.5,
                  transition: "opacity 0.3s ease",
                }}
              >
                <Box
                  sx={{
                    width: 32,
                    height: 32,
                    borderRadius: "50%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    bgcolor:
                      step === item.idx ? "white" : "rgba(255,255,255,0.1)",
                    color: step === item.idx ? "primary.main" : "white",
                    fontWeight: 800,
                  }}
                >
                  {step > item.idx ? <CheckCircle2 size={16} /> : item.idx}
                </Box>
                <Typography variant="subtitle2" fontWeight={700}>
                  {item.label}
                </Typography>
              </Box>
            ))}
          </Stack>
        </Box>

        <Typography variant="caption" sx={{ opacity: 0.5, zIndex: 1 }}>
          © 2026 PetControle. Todos os direitos reservados.
        </Typography>
      </Box>

      {/* Right Pane - Forms */}
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
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          {step > 1 ? (
            <Button
              startIcon={<ArrowLeft size={18} />}
              onClick={() => goToStep((step - 1) as 1 | 2)}
              sx={{ color: "text.primary", fontWeight: 700 }}
            >
              Voltar
            </Button>
          ) : (
            <Box />
          )}
          <Typography variant="body2" color="text.disabled" fontWeight={600}>
            Já tem conta?{" "}
            <Button
              onClick={() => navigate("/login")}
              sx={{ fontWeight: 800, textTransform: "none" }}
            >
              Fazer Login
            </Button>
          </Typography>
        </Box>

        <Box
          sx={{
            flex: 1,
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            px: { xs: 2, sm: 4, lg: step === 1 ? 4 : 8 },
            pb: 8,
          }}
        >
          <Box sx={{ width: "100%", maxWidth: step === 1 ? 800 : 650 }}>
            <Box sx={{ mb: 4, textAlign: { xs: "center", md: "left" } }}>
              <Typography variant="h4" fontWeight={900} color="primary.main">
                {step === 1 && "Bem-vindo!"}
                {step === 2 && "Sua conta pessoal"}
                {step === 3 && "Detalhes da empresa"}
              </Typography>
              <Typography variant="body1" color="text.secondary">
                {step === 1 &&
                  "Comece selecionando o plano que faz sentido para você."}
                {step === 2 && "Preencha seus dados de acesso."}
                {step === 3 &&
                  "Configure como seus clientes verão seu petshop."}
              </Typography>
            </Box>

            <Box
              sx={{
                animation: "fadeIn 0.5s ease-out",
                "@keyframes fadeIn": {
                  from: { opacity: 0, transform: "translateY(10px)" },
                  to: { opacity: 1, transform: "translateY(0)" },
                },
              }}
            >
              {step === 1 && <PlanForm onSubmit={handleSelectPlan} selectedPlan={planCode || undefined} />}

              {step === 2 && (
                <CustomCard sx={{ p: 4, borderRadius: 5, boxShadow: "0 20px 40px rgba(0,0,0,0.05)" }}>
                  <UserSignupForm onSubmit={handleSubmitUser} defaultValues={userData || {}} />
                </CustomCard>
              )}

              {step === 3 && (
                <CustomCard sx={{ p: 4, borderRadius: 5, boxShadow: "0 20px 40px rgba(0,0,0,0.05)" }}>
                  <TenantCreateForm onSubmit={handleSubmitTenant} loading={loading} defaultValues={tenantData || {}} />
                </CustomCard>
              )}
            </Box>
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

export default SignupPage;
