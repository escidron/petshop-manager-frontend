import { Box, Typography } from "@mui/material";
import CustomCard from "../components/Card/CustomCard";
import {
  BanknoteArrowUp,
  CalendarCheck2,
  CalendarDays,
  HandCoins,
} from "lucide-react";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { DateCalendar } from "@mui/x-date-pickers/DateCalendar";
import dayjs, { Dayjs } from "dayjs";
import { useState } from "react";
import AppointmentModal from "../features/appointments/AppointmentModal";
import type { Client, Pet } from "./ClientsPage";

export type ModalState =
  | { open: false }
  | { open: true; mode: "create"; entity: "client" | "pet" | "appointment" }
  | { open: true; mode: "edit"; entity: "client"; client: Client }
  | { open: true; mode: "edit"; entity: "pet"; pet: Pet };

  export type Step = "client" | "pet" | "appointment";

const Dashboard = () => {
  const [date, setDate] = useState<Dayjs>(dayjs());
  const [modalState, setModalState] = useState<ModalState>({ open: false });
  const [step, setStep] = useState<Step>("appointment");

  return (
    <Box>
      <Box
        sx={{
          display: "flex",
          gap: 2,
          mx: "auto",
          justifyContent: "center",
          mt: 2,
        }}
      >
        <CustomCard sx={{ maxWidth: "280px", height: "120px" }}>
          <Box sx={{ display: "flex", gap: 2, alignItems: "center" }}>
            <CalendarDays size={24} />
            <Typography fontWeight={400}>Agendamentos de hoje</Typography>
          </Box>
          <Box
            sx={{
              display: "flex",
              gap: 2,
              alignItems: "center",
              justifyContent: "center",
              mt: 1,
            }}
          >
            <Typography variant="h4" fontWeight={600}>
              10
            </Typography>
          </Box>
        </CustomCard>
        <CustomCard sx={{ maxWidth: "280px", height: "120px" }}>
          <Box sx={{ display: "flex", gap: 2, alignItems: "center" }}>
            <CalendarCheck2 size={24} />
            <Typography fontWeight={400}>Check-ins pendentes</Typography>
          </Box>
          <Box
            sx={{
              display: "flex",
              gap: 2,
              alignItems: "center",
              justifyContent: "center",
              mt: 1,
            }}
          >
            <Typography variant="h4" fontWeight={600}>
              10
            </Typography>
          </Box>
        </CustomCard>
        <CustomCard sx={{ maxWidth: "280px", height: "120px" }}>
          <Box sx={{ display: "flex", gap: 2, alignItems: "center" }}>
            <BanknoteArrowUp size={24} />
            <Typography fontWeight={400}>Faturamento do dia</Typography>
          </Box>
          <Box
            sx={{
              display: "flex",
              gap: 2,
              alignItems: "center",
              justifyContent: "center",
              mt: 1,
            }}
          >
            <Typography variant="h4" fontWeight={600}>
              R$ 400
            </Typography>
          </Box>
        </CustomCard>
        <CustomCard sx={{ maxWidth: "280px", height: "120px" }}>
          <Box sx={{ display: "flex", gap: 2, alignItems: "center" }}>
            <HandCoins size={24} />
            <Typography fontWeight={400}>Faturamento do mês</Typography>
          </Box>
          <Box
            sx={{
              display: "flex",
              gap: 2,
              alignItems: "center",
              justifyContent: "center",
              mt: 1,
            }}
          >
            <Typography variant="h4" fontWeight={600}>
              R$ 4000
            </Typography>
          </Box>
        </CustomCard>
      </Box>
      <Box
        sx={{
          maxWidth: "1170px",
          mx: "auto",
          mt: 6,
          display: "flex",
          gap: 2,
        }}
      >
        <Box sx={{ width: "60%" }}>
          <Typography variant="h5" fontWeight={600}>
            Agendas do dia
          </Typography>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 1, mt: 2 }}>
            <CustomCard>asd</CustomCard>
            <CustomCard>asd</CustomCard>
            <CustomCard>asd</CustomCard>
            <CustomCard>asd</CustomCard>
            <CustomCard>asd</CustomCard>
            <CustomCard>asd</CustomCard>
            <CustomCard>asd</CustomCard>
          </Box>
        </Box>
        <Box sx={{ width: "40%" }}>
          <Typography variant="h5" fontWeight={600}>
            Calendario
          </Typography>
          <CustomCard sx={{ mt: 2, p: 1 }}>
            <LocalizationProvider
              dateAdapter={AdapterDayjs}
              adapterLocale="pt-br"
            >
              <DateCalendar
                value={date}
                onChange={(newDate) => {
                  if (newDate) {
                    setDate(newDate)
                    setModalState({ open: true, mode: "create", entity: "client" });
                  };
                }}
                sx={{
                  width: "100%",
                  color: "text.primary",
                  "& .MuiDayCalendar-weekDayLabel": {
                    color: "text.primary",
                  },
                }}
              />
            </LocalizationProvider>
          </CustomCard>
        </Box>
      </Box>

      <AppointmentModal
        open={modalState.open}
        mode={modalState.open ? modalState.mode : "create"}
        onClose={() => setModalState({ open: false })}
        step={step}
        setStep={setStep}
        
      />
    </Box>
  );
};

export default Dashboard;
