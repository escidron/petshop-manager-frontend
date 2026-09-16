import { useState, useEffect } from "react";
import { Alert, Box, Typography, Button, Stack } from "@mui/material";
import CustomCard from "../components/Card/CustomCard";
import {
  Settings,
  User,
  Store,
  CheckCircle2,
  ArrowLeft,
  Zap,
  Calendar,
  MessageCircle,
} from "lucide-react";
import { useToast } from "../hooks/useToast";
import { useNavigate } from "react-router";

import UserSignupForm from "../features/users/UserSignupForm";
import TenantCreateForm from "../features/tenants/TenantForm";
import LegalDialog from "../components/LegalDialog";

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
  const packageFromUrl = searchParams.get("package");
  const [planCode, setPlanCode] = useState<PlanCode>(planFromUrl || "FREE_TRIAL");
  const [selectedPackage, setSelectedPackage] = useState<string | null>(
    packageFromUrl ?? null
  );
  const [userData, setUserData] = useState<UserFormData | null>(null);
  const [tenantData, setTenantData] = useState<TenantFormData | null>(null);
  const [loading, setLoading] = useState(false);
  const [emailExists, setEmailExists] = useState(false);

  const toast = useToast();
  const navigate = useNavigate();
  const { checkAuth } = useAuth();
  const [legalModal, setLegalModal] = useState<{ open: boolean; type: "terms" | "privacy" }>({
    open: false,
    type: "terms",
  });

  // Sincronizar estado local com a URL caso mude externamente
  useEffect(() => {
    if (planFromUrl && planFromUrl !== planCode) {
      setPlanCode(planFromUrl);
    }
    if (packageFromUrl !== undefined && packageFromUrl !== selectedPackage) {
      setSelectedPackage(packageFromUrl ?? null);
    }
  }, [planFromUrl, packageFromUrl, planCode, selectedPackage]);

  const goToStep = (newStep: 1 | 2 | 3) => {
    const newParams = new URLSearchParams(searchParams);
    newParams.set("step", String(newStep));
    if (planCode) newParams.set("plan", planCode);
    if (selectedPackage) {
      newParams.set("package", selectedPackage);
    } else {
      newParams.delete("package");
    }
    setSearchParams(newParams);
  };

  const handleSelectPlan = (plan: PlanCode, packageId?: string | null) => {
    setPlanCode(plan);
    setSelectedPackage(packageId ?? null);
    const newParams = new URLSearchParams(searchParams);
    newParams.set("step", "2");
    newParams.set("plan", plan);
    if (packageId) {
      newParams.set("package", packageId);
    } else {
      newParams.delete("package");
    }
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
          email: data.email || undefined,
          phone: data.phone,
          document: data.document,
        },
        planCode,
        selectedPackage
      );

      toast.success("Conta criada com sucesso");
      await checkAuth();
      navigate("/dashboard");
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        const detail = error.response?.data?.detail ?? "";
        if (detail === "E-mail já cadastrado") {
          setEmailExists(true);
          return;
        }
        toast.error(detail || "Erro ao criar conta");
      } else {
        toast.error("Erro ao criar conta");
      }
    } finally {
      setLoading(false);
    }
  };

  const getPackagePrice = (pkgId: string | null) => {
    switch (pkgId) {
      case "200":
        return "R$ 37,90";
      case "500":
        return "R$ 69,90";
      case "1000":
        return "R$ 119,90";
      case "2000":
        return "R$ 199,90";
      default:
        return "R$ 0,00";
    }
  };

  const formatPackageCount = (pkgId: string | null) => {
    if (!pkgId) return "";
    if (pkgId === "1000") return "1.000";
    if (pkgId === "2000") return "2.000";
    return pkgId;
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
          <Box
            sx={{
              bgcolor: "white",
              px: 2,
              py: 1,
              borderRadius: 2.5,
              display: "inline-flex",
              alignItems: "center",
              boxShadow: "0 4px 16px rgba(0,0,0,0.12)",
            }}
          >
            <img src="/logo_dark.png" alt="Data Pet" style={{ height: 34, width: "auto", display: "block" }} />
          </Box>
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
            {step === 1 && "Seu plano e automações ideais."}
            {step === 2 && "Sua conta é a porta para o sucesso."}
            {step === 3 && "Personalize a vitrine do seu negócio."}
          </Typography>

          <Typography
            variant="body1"
            sx={{ opacity: 0.8, mb: 5, fontSize: "1.1rem", maxWidth: 450 }}
          >
            {step === 1 &&
              "Aproveite 1 mês grátis do Data Pet Pro e adicione mensagens automáticas se desejar."}
            {step === 2 &&
              "Junte-se a milhares de empreendedores que transformaram a gestão de seus pets."}
            {step === 3 &&
              "Seus clientes vão notar a diferença desde o primeiro agendamento."}
          </Typography>

          <Stack spacing={2} sx={{ mt: 4 }}>
            {[
              { idx: 1, label: "Plano & Pacotes", icon: <Settings size={18} /> },
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
          © 2026 Data Pet. Todos os direitos reservados.
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
            px: { xs: 2, sm: 3, lg: step === 1 ? 3 : 8 },
            pb: 8,
          }}
        >
          <Box sx={{ width: "100%", maxWidth: step === 1 ? 1080 : 650 }}>
            <Box sx={{ mb: 3, textAlign: { xs: "center", md: "left" } }}>
              <Typography variant="h4" fontWeight={900} color="primary.main">
                {step === 1 && "Seu plano Data Pet"}
                {step === 2 && "Sua conta pessoal"}
                {step === 3 && "Detalhes da empresa"}
              </Typography>
              <Typography variant="body1" color="text.primary" sx={{ mt: 0.5 }}>
                {step === 1 &&
                  "Confirme seu plano e escolha pacotes adicionais se desejar."}
                {step === 2 && "Preencha seus dados de acesso."}
                {step === 3 &&
                  "Configure como seus clientes verão seu petshop."}
              </Typography>
            </Box>

            {/* Selected Plan Summary Banner on Step 2 and 3 */}
            {step > 1 && (
              <Box
                sx={{
                  mb: 3,
                  p: 2,
                  borderRadius: "16px",
                  bgcolor: "white",
                  border: "1.5px solid",
                  borderColor: selectedPackage ? "#86EFAC" : "#E2E8F0",
                  boxShadow: "0 4px 16px rgba(0,0,0,0.03)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 2,
                }}
              >
                <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                  <Box
                    sx={{
                      width: 38,
                      height: 38,
                      borderRadius: "10px",
                      bgcolor: selectedPackage ? "#DCFCE7" : "#EEF2FF",
                      color: selectedPackage ? "#16A34A" : "#313485",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    {selectedPackage ? (
                      <MessageCircle size={20} />
                    ) : (
                      <Calendar size={20} />
                    )}
                  </Box>
                  <Box>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 0.8, flexWrap: "wrap" }}>
                      <Typography sx={{ fontWeight: 800, fontSize: "0.92rem", color: "#0F172A" }}>
                        Data Pet Pro
                      </Typography>
                      <Box
                        sx={{
                          fontSize: "0.72rem",
                          color: "#15803D",
                          bgcolor: "#DCFCE7",
                          px: 1,
                          py: 0.2,
                          borderRadius: "4px",
                          fontWeight: 800,
                        }}
                      >
                        🎁 1º mês grátis
                      </Box>
                    </Box>
                    <Typography sx={{ fontSize: "0.78rem", color: "#64748B", mt: 0.2 }}>
                      {selectedPackage
                        ? `+ ${formatPackageCount(selectedPackage)} msgs WhatsApp (${getPackagePrice(selectedPackage)}/mês)`
                        : "Sem pacote de mensagens (100% gratuito no 1º mês)"}
                    </Typography>
                  </Box>
                </Box>

                <Button
                  size="small"
                  variant="outlined"
                  onClick={() => goToStep(1)}
                  sx={{
                    fontSize: "0.78rem",
                    fontWeight: 700,
                    borderRadius: "8px",
                    textTransform: "none",
                    whiteSpace: "nowrap",
                    borderColor: "#CBD5E1",
                    color: "#313485",
                    "&:hover": {
                      borderColor: "#313485",
                      bgcolor: "#EEF2FF",
                    },
                  }}
                >
                  Alterar
                </Button>
              </Box>
            )}

            <Box
              sx={{
                animation: "fadeIn 0.5s ease-out",
                "@keyframes fadeIn": {
                  from: { opacity: 0, transform: "translateY(10px)" },
                  to: { opacity: 1, transform: "translateY(0)" },
                },
              }}
            >
              {step === 1 && (
                <PlanForm
                  onSubmit={handleSelectPlan}
                  selectedPlan={planCode || undefined}
                  selectedPackage={selectedPackage}
                />
              )}

              {step === 2 && (
                <CustomCard sx={{ p: 4, borderRadius: 5, boxShadow: "0 20px 40px rgba(0,0,0,0.05)" }}>
                  <UserSignupForm 
                    onSubmit={handleSubmitUser} 
                    defaultValues={userData || {}} 
                    onOpenLegal={(type) => setLegalModal({ open: true, type })}
                  />
                </CustomCard>
              )}

              {step === 3 && (
                <CustomCard sx={{ p: 4, borderRadius: 5, boxShadow: "0 20px 40px rgba(0,0,0,0.05)" }}>
                  {emailExists && (
                    <Alert
                      severity="info"
                      sx={{ mb: 2, borderRadius: 2 }}
                      action={
                        <Button
                          size="small"
                          sx={{ fontWeight: 700, width: "100px" }}
                          onClick={() => navigate("/login")}
                        >
                          Fazer Login
                        </Button>
                      }
                    >
                      Este e-mail já tem uma conta. Faça login e adicione o novo estabelecimento pelo menu do usuário.
                    </Alert>
                  )}
                  <TenantCreateForm onSubmit={handleSubmitTenant} loading={loading} defaultValues={tenantData || {}} />
                  <Typography variant="caption" sx={{ mt: 3, display: "block", textAlign: "center", color: "text.primary" }}>
                    Ao criar sua conta, você concorda com nossos{" "}
                    <Button 
                      onClick={() => setLegalModal({ open: true, type: "terms" })}
                      sx={{ p: 0, minWidth: 0, color: "inherit", fontWeight: 700, fontSize: "inherit", textTransform: "none", verticalAlign: "baseline" }}
                    >
                      Termos de Uso
                    </Button>{" "}
                    e{" "}
                    <Button 
                      onClick={() => setLegalModal({ open: true, type: "privacy" })}
                      sx={{ p: 0, minWidth: 0, color: "inherit", fontWeight: 700, fontSize: "inherit", textTransform: "none", verticalAlign: "baseline" }}
                    >
                      Política de Privacidade
                    </Button>.
                  </Typography>
                </CustomCard>
              )}
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

export default SignupPage;
