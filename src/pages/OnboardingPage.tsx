import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import type { OnboardingStep } from "../features/onboarding/types";
import { useAuth } from "../hooks/useAuth";
import { updateTenantOnboardingStep } from "../api/services/tenants";
import OnboardingStepper from "../features/onboarding/OnboardingStepper";
import ServicesStep from "../features/onboarding/ServiceStep";
import BusinessHoursStep from "../features/onboarding/BusinessHoursStep";
import ClientStep from "../features/onboarding/ClientStep";
import { Box, Typography } from "@mui/material";
import CustomCard from "../components/Card/CustomCard";
import PetStep from "../features/onboarding/PetStep";
import { useToast } from "../hooks/useToast";

export default function OnboardingPage() {
  const { tenant, setTenant } = useAuth();
  const [step, setStep] = useState<OnboardingStep>("client");
  const navigate = useNavigate();
  const toast = useToast();

  async function loadStep() {
    if (!tenant) return;
    setStep(tenant.onboarding_step);
  }

  async function updateStep(newStep: OnboardingStep) {
    if (!tenant) return;
    try {
      await updateTenantOnboardingStep(newStep);
      setStep(newStep);
      if (newStep === "completed") {
        setTenant({ ...tenant, onboarding_step: "completed" });
        navigate("/");
      }
    } catch {
      toast.error("Erro ao avançar etapa. Tente novamente.");
    }
  }
  useEffect(() => {
    loadStep();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  if (!step) return <div>Loading...</div>;

  return (
    <Box sx={{ display: "flex", justifyContent: "center" }}>
      <CustomCard
        sx={{
          width: "60%",
          minWidth: "800px",
          maxWidth: "1400px",
          display: "flex",
          justifyContent: "center",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        <Box
          mb={4}
          sx={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
          }}
        >
          <Typography variant="h5" fontWeight={600}>
            Vamos configurar seu sistema em menos de 2 minutos
          </Typography>

          <Typography variant="body1" color="text.primary" mt={1}>
            Você está a poucos passos de criar seu primeiro agendamento. Não se
            preocupe, você poderá alterar tudo depois.
          </Typography>
        </Box>
        <Box width={500} mb={5}>
          <OnboardingStepper currentStep={step} />
        </Box>

        {step === "services" && (
          <ServicesStep onNext={() => updateStep("business_hours")} />
        )}

        {step === "business_hours" && (
          <BusinessHoursStep
            onBack={() => updateStep("services")}
            onNext={() => updateStep("client")}
          />
        )}

        {step === "client" && (
          <ClientStep
            onBack={() => updateStep("business_hours")}
            onNext={() => updateStep("pet")}
          />
        )}
        {step === "pet" && (
          <PetStep
            onBack={() => updateStep("client")}
            onNext={() => updateStep("completed")}
          />
        )}
      </CustomCard>
    </Box>
  );
}
