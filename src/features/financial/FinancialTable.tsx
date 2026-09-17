import { useState } from "react";
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
  Skeleton,
  Tooltip,
} from "@mui/material";
import CustomCard from "../../components/Card/CustomCard";
import dayjs from "dayjs";
import type { Appointment } from "../appointments/types";
import type { SaleResponse } from "../../features/sales/schemas";
import { formatPaymentMethod } from "../../utils/formatPaymentMethod";
import SaleDetailsModal from "../sales/SaleDetailsModal";
import { Eye } from "lucide-react";
import { Button } from "../../components/Button/Button";

type Transaction = {
  id: string;
  date: string;
  client: string;
  type: "Agendamento" | "Venda PDV" | "Venda Pacote" | "Pago via Pacote";
  amount_cents: number;
  payment_method: string;
  original: Appointment | SaleResponse;
};

type Props = {
  transactions: Transaction[];
  isLoading?: boolean;
};

export default function FinancialTable({ transactions, isLoading = false }: Props) {
  const [selectedSaleId, setSelectedSaleId] = useState<number | null>(null);

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
              <TableCell sx={{ fontWeight: 600 }} align="center">
                Ação
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: 7 }).map((_, j) => (
                    <TableCell key={j}>
                      <Skeleton variant="text" width={j === 5 ? 60 : "80%"} />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : transactions.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                  <Typography color="text.disabled">
                    Nenhum registro encontrado para o período.
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              transactions.map((t) => {
                const isPackage = t.type === "Pago via Pacote";
                let details = "";
                if ("scheduled_at" in t.original) {
                  // Appointment não pago ainda
                  const apt = t.original as Appointment;
                  details = apt.items
                    .flatMap((i) =>
                      i.services.map((s) =>
                        s.is_package_covered ? `${s.name} (pacote)` : s.name,
                      ),
                    )
                    .join(", ");
                } else {
                  // SaleResponse (PDV ou agendamento já pago pelo caixa)
                  const sale = t.original as SaleResponse;
                  details = sale.items.map((i) => i.name).join(", ");
                }

                return (
                  <TableRow
                    key={t.id}
                    hover
                    sx={{ opacity: isPackage ? 0.75 : 1 }}
                  >
                    <TableCell>
                      {dayjs(t.date).format("DD/MM/YYYY HH:mm")}
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={t.type}
                        size="small"
                        color={
                          isPackage
                            ? "success"
                            : t.type === "Agendamento"
                              ? "primary"
                              : t.type === "Venda Pacote"
                                ? "warning"
                                : "info"
                        }
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell sx={{ fontWeight: 500 }}>{t.client}</TableCell>
                    <TableCell>
                      {(() => {
                        const salePayments = (t.original as any)?.payments as any[];
                        if (salePayments && salePayments.length > 1) {
                          return (
                            <Box sx={{ display: "flex", flexDirection: "column", gap: 0.25 }}>
                              <Chip
                                label="Múltiplo"
                                size="small"
                                sx={{
                                  fontSize: "0.65rem",
                                  fontWeight: 700,
                                  bgcolor: "#F3E8FF",
                                  color: "#7E22CE",
                                  width: "fit-content",
                                }}
                              />
                              <Typography variant="caption" sx={{ color: "text.secondary", fontSize: "0.7rem" }}>
                                {salePayments.map((p) => `${formatPaymentMethod(p.payment_method)}: R$ ${Number(p.amount).toFixed(2)}`).join(" • ")}
                              </Typography>
                            </Box>
                          );
                        }
                        return (
                          <Chip
                            label={
                              isPackage
                                ? "Pacote"
                                : formatPaymentMethod(t.payment_method)
                            }
                            size="small"
                            variant="filled"
                            sx={{
                              fontSize: "0.65rem",
                              fontWeight: 700,
                              bgcolor: isPackage
                                ? "success.light"
                                : t.payment_method === "Pendente"
                                  ? "error.light"
                                  : "action.selected",
                              color: isPackage
                                ? "success.contrastText"
                                : t.payment_method === "Pendente"
                                  ? "error.contrastText"
                                  : "text.primary",
                            }}
                          />
                        );
                      })()}
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" noWrap sx={{ maxWidth: 300 }}>
                        {details}
                      </Typography>
                    </TableCell>
                    <TableCell
                      align="right"
                      sx={{
                        fontWeight: 600,
                        color: isPackage ? "text.disabled" : "text.primary",
                        textDecoration: isPackage ? "line-through" : "none",
                      }}
                    >
                      {(t.amount_cents / 100).toLocaleString("pt-BR", {
                        style: "currency",
                        currency: "BRL",
                      })}
                    </TableCell>
                    <TableCell align="center">
                      {!isPackage && !("scheduled_at" in t.original) ? (
                        <Tooltip title="Ver detalhes e ações da venda">
                          <Button
                            size="small"
                            variant="outlined"
                            startIcon={<Eye size={13} />}
                            onClick={() => setSelectedSaleId((t.original as SaleResponse).id)}
                            sx={{
                              fontSize: "0.72rem",
                              py: 0.25,
                              px: 1,
                              whiteSpace: "nowrap",
                            }}
                          >
                            Detalhes
                          </Button>
                        </Tooltip>
                      ) : (
                        <Typography variant="caption" color="text.disabled">—</Typography>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {selectedSaleId && (
        <SaleDetailsModal
          open={Boolean(selectedSaleId)}
          saleId={selectedSaleId}
          onClose={() => setSelectedSaleId(null)}
        />
      )}
    </CustomCard>
  );
}
