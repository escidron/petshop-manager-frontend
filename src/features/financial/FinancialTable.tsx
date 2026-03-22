import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  Box,
  Chip,
} from "@mui/material";
import CustomCard from "../../components/Card/CustomCard";
import dayjs from "dayjs";
import type { Appointment } from "../appointments/types";
import type { SaleResponse } from "../../features/sales/schemas";
import { formatPaymentMethod } from "../../utils/formatPaymentMethod";

type Transaction = {
  id: string;
  date: string;
  client: string;
  type: "Agendamento" | "Venda PDV";
  amount_cents: number;
  payment_method: string;
  original: Appointment | SaleResponse;
};

type Props = {
  transactions: Transaction[];
};

export default function FinancialTable({ transactions }: Props) {
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
              <TableCell sx={{ fontWeight: 600 }}>Tipo</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Cliente</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Forma de Pagto</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Detalhes</TableCell>
              <TableCell sx={{ fontWeight: 600 }} align="right">
                Valor
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {transactions.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                  <Typography color="text.disabled">
                    Nenhum registro encontrado para o período.
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              transactions.map((t) => {
                let details = "";
                if (t.type === "Agendamento") {
                  const apt = t.original as Appointment;
                  details = apt.items
                    .flatMap((i) => i.services.map((s) => s.name))
                    .join(", ");
                } else {
                  const sale = t.original as SaleResponse;
                  details = sale.items.map((i) => i.name).join(", ");
                }

                return (
                  <TableRow key={t.id} hover>
                    <TableCell>
                      {dayjs(t.date).format("DD/MM/YYYY HH:mm")}
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={t.type}
                        size="small"
                        color={t.type === "Agendamento" ? "primary" : "info"}
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell sx={{ fontWeight: 500 }}>{t.client}</TableCell>
                    <TableCell>
                      <Chip
                        label={formatPaymentMethod(t.payment_method)}
                        size="small"
                        variant="filled"
                        sx={{
                          fontSize: "0.65rem",
                          fontWeight: 700,
                          bgcolor:
                            t.payment_method === "Pendente"
                              ? "error.light"
                              : "action.selected",
                          color:
                            t.payment_method === "Pendente"
                              ? "error.contrastText"
                              : "text.primary",
                        }}
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" noWrap sx={{ maxWidth: 300 }}>
                        {details}
                      </Typography>
                    </TableCell>
                    <TableCell align="right" sx={{ fontWeight: 600 }}>
                      {(t.amount_cents / 100).toLocaleString("pt-BR", {
                        style: "currency",
                        currency: "BRL",
                      })}
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
