import { Box, Divider, Popover, Typography } from "@mui/material";
import type { Appointment } from "./types";
import { Dot, List, X } from "lucide-react";
import { getAppointmentTotal } from "../../utils/getAppointmentTotalPrice";
import theme from "../../theme";
import CustomCard from "../../components/Card/CustomCard";

type Props = {
  open: boolean;
  anchorEl: null | HTMLElement;
  handleClose: () => void;
  appointment: Appointment;
};
const AppointmentServiceList = ({
  open,
  anchorEl,
  handleClose,
  appointment,
}: Props) => {
  const totalCents = getAppointmentTotal(appointment);

  const formattedTotal = (totalCents / 100).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
  return (
    <Popover
      open={open}
      anchorEl={anchorEl}
      onClose={handleClose}
      anchorOrigin={{
        vertical: "bottom",
        horizontal: "left",
      }}
      slotProps={{
        paper: {
          elevation: 1,
          sx: {
            p: 2,
            borderRadius: 2,
            minWidth: 500,
          },
        },
      }}
    >
      <Box
        sx={{
          display: "flex",
          gap: 2,
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <Box sx={{ display: "flex", gap: 2, alignItems: "center" }}>
          <List size={20} />
          <Typography variant="h6">Serviços à realizar</Typography>
          <Typography variant="h6"> {formattedTotal}</Typography>
        </Box>
        <Box sx={{ cursor: "pointer" }} onClick={handleClose}>
          <X size={20} />
        </Box>
      </Box>
      <Divider sx={{ my: 1 }} />
      <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
        {appointment.items.map((item, index) => {
          return (
            <CustomCard key={item.id} sx={{ p: 1 }}>
              <Typography variant="h6" fontWeight={600}>{item.pet.name}</Typography>
              <Box>
                {item.services.map((s) => (
                  <Box
                    key={s.id}
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      py: 0.5,
                    }}
                  >
                    {/* Nome do serviço */}
                    <Box
                      sx={{ display: "flex", alignItems: "center", gap: 0.5 }}
                    >
                      <Dot color={theme.palette.text.disabled} size={16} />
                      <Typography variant="body2">{s.name}</Typography>
                    </Box>

                    {/* Preço */}
                    <Typography variant="body2">
                      {(s.price_cents / 100).toLocaleString("pt-BR", {
                        style: "currency",
                        currency: "BRL",
                      })}
                    </Typography>
                  </Box>
                ))}

                {/* Linha separadora */}
                <Divider sx={{ my: 1 }} />

                {/* Total */}
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    fontWeight: 600,
                  }}
                >
                  <Typography variant="body2" fontWeight={600}>
                    Total
                  </Typography>
                  <Typography variant="body2" fontWeight={600}>
                    {item.services
                      .reduce((acc, s) => acc + s.price_cents / 100, 0)
                      .toLocaleString("pt-BR", {
                        style: "currency",
                        currency: "BRL",
                      })}
                  </Typography>
                </Box>
              </Box>
              {index !== appointment.items.length - 1 && (
                <Divider sx={{ my: 1 }} />
              )}
            </CustomCard>
          );
        })}
      </Box>
    </Popover>
  );
};

export default AppointmentServiceList;
