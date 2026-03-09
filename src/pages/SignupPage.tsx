import { Box, Typography } from "@mui/material";
import CustomCard from "../components/Card/CustomCard";
import { useState } from "react";
import axios from "axios";
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

const SignupPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const stepParam = Number(searchParams.get("step")) as 1 | 2 | 3;
  const step: 1 | 2 | 3 = stepParam || 1;
  const planFromUrl = searchParams.get("plan") as PlanCode | null;
  const [planCode, setPlanCode] = useState<PlanCode | null>(planFromUrl);
  const [userData, setUserData] = useState<UserFormData | null>(null);

  const toast = useToast();
  const navigate = useNavigate();

  const goToStep = (newStep: 1 | 2 | 3) => {
    setSearchParams({ step: String(newStep) });
  };

  // STEP 1 → Plano
  const handleSelectPlan = (plan: PlanCode) => {
    setPlanCode(plan);
    goToStep(2);
  };

  // STEP 2 → Usuário
  const handleSubmitUser = (data: UserFormData) => {
    setUserData(data);
    goToStep(3);
  };

  // STEP 3 → Tenant + Signup final
  const handleSubmitTenant = async (data: TenantFormData) => {
    if (!planCode || !userData) return;

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
        },
        planCode,
      );

      toast.success("Conta criada com sucesso");

      navigate("/dashboard");
    } catch (error: unknown) {
      let message = "Erro ao criar conta";

      if (axios.isAxiosError(error)) {
        message = error.response?.data?.detail ?? message;
      }

      toast.error(message);
    } finally {
      // setLoading(false);
    }
  };

  return (
    <Box sx={{ display: "flex", height: "100%", p: 4 }}>
      <Box
        sx={{
          width: "40%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          backgroundColor: "primary.main",
          borderRadius: 10,
          p: 4,
        }}
      >
        <Typography variant="h1" color="text.secondary">
          {step === 1 && "Escolha seu plano"}
          {step === 2 && "Crie sua conta"}
          {step === 3 && "Configure seu negócio"}
        </Typography>

        <Typography variant="body1" color="text.secondary">
          {step === 1 && "Selecione o plano ideal para o seu negócio."}
          {step === 2 && "Preencha seus dados para criar sua conta."}
          {step === 3 && "Agora configure seu estabelecimento."}
        </Typography>

        <img
          src="/signup.png"
          alt="signup"
          style={{
            width: "80%",
            height: "80%",
            objectFit: "contain",
          }}
        />
      </Box>

      <Box
        sx={{
          width: "60%",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        {step === 1 && <PlanForm onSubmit={handleSelectPlan} />}

        {step === 2 && (
          <CustomCard sx={{ maxWidth: "550px", maxHeight: "600px" }}>
            <Typography variant="h1">Criar conta</Typography>
            <UserSignupForm onSubmit={handleSubmitUser} />
          </CustomCard>
        )}

        {step === 3 && (
          <CustomCard sx={{ maxWidth: "550px", maxHeight: "600px" }}>
            <Typography variant="h1">Seu estabelecimento</Typography>
            <TenantCreateForm onSubmit={handleSubmitTenant} />
          </CustomCard>
        )}
      </Box>
    </Box>
  );
};

export default SignupPage;
