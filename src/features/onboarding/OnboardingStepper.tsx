import { Box, Step, StepLabel, Stepper } from "@mui/material";

type Props = {
  currentStep: string;
};

const steps = [
  { key: "services", label: "Serviços" },
  { key: "business_hours", label: "Horários" },
  { key: "client", label: "Tutor" },
  { key: "pet", label: "Primeiro Pet" },
];

export default function OnboardingStepper({ currentStep }: Props) {
  const activeStepIndex = Math.max(
    steps.findIndex((step) => step.key === currentStep),
    0,
  );
  return (
    <Box sx={{ width: "100%" }}>
      <Stepper activeStep={activeStepIndex} alternativeLabel>
        {steps.map((step) => (
          <Step key={step.key}>
            <StepLabel
              sx={{
                "& .MuiStepLabel-label": {
                  color: "text.primary",
                },
              }}
            >
              {step.label}
            </StepLabel>
          </Step>
        ))}
      </Stepper>
    </Box>
  );
}
