import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  Box,
} from "@mui/material";
import CustomCard from "../../components/Card/CustomCard";
import type { Appointment } from "../appointments/types";
import { getAppointmentTotal } from "../../utils/getAppointmentTotalPrice";
import dayjs from "dayjs";
import { AppointmentStatusChip } from "../appointments/AppointmentStatusChip";

type Props = {
  appointments: Appointment[];
};

export default function FinancialTable({ appointments }: Props) {
  return (
    <CustomCard sx={{ p: 0, overflow: "hidden" }}>
      <Box sx={{ p: 2, borderBottom: "1px solid", borderColor: "divider" }}>
        <Typography variant="h6">Detalhamento de Recebimentos</Typography>
      </Box>
      <TableContainer>
        <Table>
          <TableHead sx={{ backgroundColor: "secondary.main" }}>
            <TableRow>
              <TableCell sx={{ fontWeight: 600 }}>Data/Hora</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Cliente</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Pet(s)</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Serviços</TableCell>
              <TableCell sx={{ fontWeight: 600 }} align="right">
                Valor
              </TableCell>
              <TableCell sx={{ fontWeight: 600 }} align="center">
                Status
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {appointments.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                  <Typography color="text.disabled">
                    Nenhum registro encontrado para o período.
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              appointments.map((appointment) => {
                const total = getAppointmentTotal(appointment);
                const allPets = appointment.items
                  .map((i) => i.pet.name)
                  .join(", ");
                const allServices = appointment.items
                  .flatMap((i) => i.services.map((s) => s.name))
                  .join(", ");

                return (
                  <TableRow key={appointment.id} hover>
                    <TableCell>
                      {dayjs(appointment.scheduled_at).format(
                        "DD/MM/YYYY HH:mm",
                      )}
                    </TableCell>
                    <TableCell sx={{ fontWeight: 500 }}>
                      {appointment.client.name}
                    </TableCell>
                    <TableCell>{allPets}</TableCell>
                    <TableCell>
                      <Typography variant="body2" noWrap sx={{ maxWidth: 250 }}>
                        {allServices}
                      </Typography>
                    </TableCell>
                    <TableCell align="right" sx={{ fontWeight: 600 }}>
                      {(total / 100).toLocaleString("pt-BR", {
                        style: "currency",
                        currency: "BRL",
                      })}
                    </TableCell>
                    <TableCell align="center">
                      <AppointmentStatusChip status={appointment.status} />
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </CustomCard>
  );
}
