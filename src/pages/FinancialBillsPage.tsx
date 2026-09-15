import React, { useState } from "react";
import {
  Box,
  Paper,
  Typography,
  Button,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  IconButton,
  Tooltip,
  CircularProgress,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  useTheme,
  alpha,
} from "@mui/material";
import {
  RefreshCw,
  MoreVertical,
  CheckCircle2,
  Edit2,
  Trash2,
  ArrowUpRight,
  ArrowDownLeft,
  Copy,
  Barcode,
  WalletCards,
  FileSpreadsheet,
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import dayjs from "dayjs";
import { toast } from "react-toastify";

import {
  getFinancialBills,
  getFinancialBillsSummary,
  createFinancialBill,
  updateFinancialBill,
  settleFinancialBill,
  cancelFinancialBill,
  deleteFinancialBill,
  exportFinancialBillsExcel,
  type FinancialBill,
  type BillFilters,
  type BillType,
  type FinancialBillCreate,
  type FinancialBillUpdate,
  type FinancialBillSettle,
} from "../api/services/financialBills";
import { listDREAccounts } from "../api/services/financial";
import { getSuppliers } from "../api/services/suppliers";
import { fetchClients } from "../api/services/clients";

import BillsSummaryCards from "../features/financial/bills/BillsSummaryCards";
import BillFilterBar from "../features/financial/bills/BillFilterBar";
import BillFormModal from "../features/financial/bills/BillFormModal";
import BillSettleModal from "../features/financial/bills/BillSettleModal";
import BillDeleteModal from "../features/financial/bills/BillDeleteModal";

const fmtBRL = (val: number = 0) =>
  val.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export default function FinancialBillsPage() {
  const theme = useTheme();
  const queryClient = useQueryClient();

  // Filtros
  const [filters, setFilters] = useState<BillFilters>({
    bill_type: "all",
    status: "all",
    start_date: dayjs().startOf("month").format("YYYY-MM-DD"),
    end_date: dayjs().endOf("month").format("YYYY-MM-DD"),
    page: 1,
    page_size: 25,
    sort_by: "due_date",
    sort_dir: "asc",
  });

  // Modais
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formDefaultType, setFormDefaultType] = useState<BillType>("payable");
  const [editingBill, setEditingBill] = useState<FinancialBill | null>(null);

  const [settleBillTarget, setSettleBillTarget] = useState<FinancialBill | null>(null);
  const [deleteBillTarget, setDeleteBillTarget] = useState<FinancialBill | null>(null);

  // Menu de Ações por Linha
  const [actionAnchor, setActionAnchor] = useState<null | HTMLElement>(null);
  const [actionBill, setActionBill] = useState<FinancialBill | null>(null);

  // Queries
  const {
    data: billsData,
    isLoading: isLoadingBills,
    refetch: refetchBills,
    isFetching: isFetchingBills,
  } = useQuery({
    queryKey: ["financial-bills", filters],
    queryFn: () => getFinancialBills(filters),
    staleTime: 60 * 1000,
  });

  const { data: summaryData } = useQuery({
    queryKey: [
      "financial-bills-summary",
      filters.start_date,
      filters.end_date,
      filters.category_id,
    ],
    queryFn: () =>
      getFinancialBillsSummary({
        start_date: filters.start_date,
        end_date: filters.end_date,
        category_id: filters.category_id,
      }),
    staleTime: 60 * 1000,
  });

  const { data: categories = [] } = useQuery({
    queryKey: ["dre-accounts"],
    queryFn: listDREAccounts,
    staleTime: 5 * 60 * 1000,
  });

  const { data: suppliers = [] } = useQuery({
    queryKey: ["suppliers"],
    queryFn: getSuppliers,
    staleTime: 5 * 60 * 1000,
  });

  const { data: clients = [] } = useQuery({
    queryKey: ["clients"],
    queryFn: fetchClients,
    staleTime: 5 * 60 * 1000,
  });

  // Mutations
  const invalidateQueries = () => {
    queryClient.invalidateQueries({ queryKey: ["financial-bills"] });
    queryClient.invalidateQueries({ queryKey: ["financial-bills-summary"] });
  };

  const createMutation = useMutation({
    mutationFn: (data: FinancialBillCreate) => createFinancialBill(data),
    onSuccess: (res) => {
      toast.success(
        res.length > 1
          ? `${res.length} parcelas cadastradas com sucesso!`
          : "Conta cadastrada com sucesso!"
      );
      invalidateQueries();
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.detail || "Erro ao criar conta.");
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: FinancialBillUpdate }) =>
      updateFinancialBill(id, data),
    onSuccess: () => {
      toast.success("Conta atualizada com sucesso!");
      invalidateQueries();
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.detail || "Erro ao atualizar conta.");
    },
  });

  const settleMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: FinancialBillSettle }) =>
      settleFinancialBill(id, data),
    onSuccess: () => {
      invalidateQueries();
    },
  });

  const cancelMutation = useMutation({
    mutationFn: (id: number) => cancelFinancialBill(id),
    onSuccess: () => {
      invalidateQueries();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => deleteFinancialBill(id),
    onSuccess: () => {
      invalidateQueries();
    },
  });

  // Handlers
  const handleOpenCreate = (type: BillType) => {
    setFormDefaultType(type);
    setEditingBill(null);
    setIsFormOpen(true);
  };

  const handleOpenEdit = (bill: FinancialBill) => {
    setEditingBill(bill);
    setIsFormOpen(true);
    handleCloseMenu();
  };

  const handleOpenSettle = (bill: FinancialBill) => {
    setSettleBillTarget(bill);
    handleCloseMenu();
  };

  const handleOpenDelete = (bill: FinancialBill) => {
    setDeleteBillTarget(bill);
    handleCloseMenu();
  };

  const handleSaveBill = async (
    data: FinancialBillCreate | FinancialBillUpdate,
    isEdit: boolean
  ) => {
    if (isEdit && editingBill) {
      await updateMutation.mutateAsync({
        id: editingBill.id,
        data: data as FinancialBillUpdate,
      });
    } else {
      await createMutation.mutateAsync(data as FinancialBillCreate);
    }
  };

  const handleOpenMenu = (
    event: React.MouseEvent<HTMLElement>,
    bill: FinancialBill
  ) => {
    setActionAnchor(event.currentTarget);
    setActionBill(bill);
  };

  const handleCloseMenu = () => {
    setActionAnchor(null);
    setActionBill(null);
  };

  const handleExportExcel = async () => {
    try {
      toast.info("Gerando planilha de Contas a Pagar e Receber...");
      const blob = await exportFinancialBillsExcel(filters);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Contas_Pagar_Receber_${dayjs().format("YYYYMMDD")}.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success("Download do Excel concluído!");
    } catch {
      toast.error("Erro ao exportar planilha.");
    }
  };

  const copyBarcode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast.info("Código de barras copiado para a área de transferência!");
  };

  // Helper de badge de status
  const renderStatusChip = (status: string) => {
    switch (status) {
      case "paid":
        return (
          <Chip
            label="Liquidado"
            size="small"
            sx={{
              bgcolor: alpha("#10B981", 0.12),
              color: "#059669",
              fontWeight: 700,
              fontSize: "0.72rem",
            }}
          />
        );
      case "overdue":
        return (
          <Chip
            label="Vencido"
            size="small"
            sx={{
              bgcolor: alpha("#EF4444", 0.12),
              color: "#DC2626",
              fontWeight: 800,
              fontSize: "0.72rem",
            }}
          />
        );
      case "canceled":
        return (
          <Chip
            label="Cancelado"
            size="small"
            sx={{
              bgcolor: "#F1F5F9",
              color: "text.secondary",
              fontWeight: 600,
              fontSize: "0.72rem",
            }}
          />
        );
      default:
        return (
          <Chip
            label="A Vencer"
            size="small"
            sx={{
              bgcolor: alpha("#F59E0B", 0.12),
              color: "#D97706",
              fontWeight: 700,
              fontSize: "0.72rem",
            }}
          />
        );
    }
  };

  const today = dayjs();

  return (
    <Box
      sx={{
        width: "100%",
        maxWidth: "100%",
        minHeight: "100%",
        display: "flex",
        flexDirection: "column",
        p: { xs: 1.5, sm: 2, md: 2.5 },
        pb: { xs: "calc(16px + env(safe-area-inset-bottom, 0px))", md: 2.5 },
        boxSizing: "border-box",
      }}
    >
      {/* Cabeçalho & Ações Rápidas */}
      <Box
        sx={{
          display: "flex",
          flexDirection: { xs: "column", md: "row" },
          justifyContent: "space-between",
          alignItems: { xs: "flex-start", md: "center" },
          gap: 1.5,
          mb: 2,
          flexShrink: 0,
        }}
      >
        <Box>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
            <Typography variant="h5" fontWeight={800} color="text.primary">
              Contas a Pagar e Receber
            </Typography>
            <Chip
              label="Gestão Financeira"
              size="small"
              color="primary"
              variant="outlined"
              sx={{ fontWeight: 600 }}
            />
          </Box>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            Controle de compromissos com fornecedores, receitas previstas, fluxo de caixa e conciliação.
          </Typography>
        </Box>

        {/* Toolbar de Ações */}
        <Box
          sx={{
            display: "flex",
            flexWrap: "wrap",
            alignItems: "center",
            gap: 1,
          }}
        >
          <Tooltip title="Atualizar dados">
            <IconButton
              size="small"
              onClick={() => {
                refetchBills();
                invalidateQueries();
              }}
              disabled={isFetchingBills}
              sx={{ border: "1px solid", borderColor: "divider", borderRadius: 2 }}
            >
              <RefreshCw size={16} className={isFetchingBills ? "animate-spin" : ""} />
            </IconButton>
          </Tooltip>

          <Button
            variant="outlined"
            size="small"
            startIcon={<FileSpreadsheet size={16} />}
            onClick={handleExportExcel}
            sx={{ textTransform: "none", borderRadius: 2, fontWeight: 600 }}
          >
            Exportar Excel
          </Button>

          <Button
            variant="contained"
            size="small"
            startIcon={<ArrowUpRight size={16} />}
            onClick={() => handleOpenCreate("payable")}
            sx={{
              textTransform: "none",
              borderRadius: 2,
              fontWeight: 700,
              bgcolor: "#DC2626",
              "&:hover": { bgcolor: "#B91C1C" },
            }}
          >
            + Conta a Pagar
          </Button>

          <Button
            variant="contained"
            size="small"
            startIcon={<ArrowDownLeft size={16} />}
            onClick={() => handleOpenCreate("receivable")}
            sx={{
              textTransform: "none",
              borderRadius: 2,
              fontWeight: 700,
              bgcolor: "#059669",
              "&:hover": { bgcolor: "#047857" },
            }}
          >
            + Conta a Receber
          </Button>
        </Box>
      </Box>

      {/* Cards de Resumo Executivo (KPIs) */}
      <BillsSummaryCards summary={summaryData} />

      {/* Barra de Filtros */}
      <BillFilterBar
        filters={filters}
        onFilterChange={(newFilters) => setFilters((prev) => ({ ...prev, ...newFilters }))}
        categories={categories}
        suppliers={suppliers}
      />

      {/* Tabela de Contas */}
      <TableContainer
        component={Paper}
        elevation={0}
        sx={{
          border: "1px solid",
          borderColor: "divider",
          borderRadius: 2.5,
          overflow: "auto",
          flex: 1,
        }}
      >
        <Table size="small" stickyHeader>
          <TableHead>
            <TableRow sx={{ bgcolor: "action.hover" }}>
              <TableCell sx={{ fontWeight: 800, fontSize: "0.78rem", py: 1.25, width: 90 }}>
                TIPO
              </TableCell>
              <TableCell sx={{ fontWeight: 800, fontSize: "0.78rem", py: 1.25 }}>
                DESCRIÇÃO / DOCUMENTO
              </TableCell>
              <TableCell sx={{ fontWeight: 800, fontSize: "0.78rem", py: 1.25 }}>
                CATEGORIA (DRE)
              </TableCell>
              <TableCell sx={{ fontWeight: 800, fontSize: "0.78rem", py: 1.25 }}>
                FORNECEDOR / CLIENTE
              </TableCell>
              <TableCell sx={{ fontWeight: 800, fontSize: "0.78rem", py: 1.25, maxWidth: 180 }}>
                OBSERVAÇÃO
              </TableCell>
              <TableCell sx={{ fontWeight: 800, fontSize: "0.78rem", py: 1.25, width: 140 }}>
                VENCIMENTO
              </TableCell>
              <TableCell align="right" sx={{ fontWeight: 800, fontSize: "0.78rem", py: 1.25, width: 130 }}>
                VALOR NOMINAL
              </TableCell>
              <TableCell align="right" sx={{ fontWeight: 800, fontSize: "0.78rem", py: 1.25, width: 130 }}>
                VALOR PAGO
              </TableCell>
              <TableCell align="center" sx={{ fontWeight: 800, fontSize: "0.78rem", py: 1.25, width: 110 }}>
                STATUS
              </TableCell>
              <TableCell align="center" sx={{ fontWeight: 800, fontSize: "0.78rem", py: 1.25, width: 110 }}>
                AÇÕES
              </TableCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {isLoadingBills ? (
              <TableRow>
                <TableCell colSpan={10} align="center" sx={{ py: 6 }}>
                  <CircularProgress size={32} />
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                    Carregando contas...
                  </Typography>
                </TableCell>
              </TableRow>
            ) : !billsData?.items || billsData.items.length === 0 ? (
              <TableRow>
                <TableCell colSpan={10} align="center" sx={{ py: 8 }}>
                  <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 1 }}>
                    <WalletCards size={40} color="#9CA3AF" />
                    <Typography variant="subtitle1" fontWeight={700} color="text.primary">
                      Nenhuma conta encontrada
                    </Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ maxWidth: 360 }}>
                      Não há lançamentos para os filtros e período selecionados. Clique em "+ Conta a Pagar" ou "+ Conta a Receber" para lançar.
                    </Typography>
                  </Box>
                </TableCell>
              </TableRow>
            ) : (
              billsData.items.map((bill) => {
                const isPayable = bill.bill_type === "payable";
                const isPaid = bill.status === "paid";
                const isOverdue = bill.status === "overdue";
                const diffDays = dayjs(bill.due_date).diff(today, "day");

                return (
                  <TableRow
                    key={bill.id}
                    hover
                    sx={{
                      bgcolor: isOverdue ? alpha("#EF4444", 0.02) : "inherit",
                      "&:last-child td, &:last-child th": { border: 0 },
                    }}
                  >
                    {/* Tipo */}
                    <TableCell>
                      <Box
                        sx={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 0.5,
                          px: 1,
                          py: 0.25,
                          borderRadius: 1.5,
                          bgcolor: isPayable ? alpha("#EF4444", 0.1) : alpha("#10B981", 0.1),
                          color: isPayable ? "#DC2626" : "#059669",
                          fontWeight: 800,
                          fontSize: "0.72rem",
                        }}
                      >
                        {isPayable ? <ArrowUpRight size={12} /> : <ArrowDownLeft size={12} />}
                        {isPayable ? "Pagar" : "Receber"}
                      </Box>
                    </TableCell>

                    {/* Descrição & Documento */}
                    <TableCell>
                      <Box>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
                          <Typography variant="body2" fontWeight={700} color="text.primary">
                            {bill.description}
                          </Typography>
                          {bill.total_installments > 1 && (
                            <Chip
                              label={`${bill.installment_number}/${bill.total_installments}`}
                              size="small"
                              sx={{ height: 18, fontSize: "0.65rem", fontWeight: 700 }}
                            />
                          )}
                        </Box>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1, mt: 0.25 }}>
                          {bill.document_number && (
                            <Typography variant="caption" color="text.secondary">
                              Doc: <strong>{bill.document_number}</strong>
                            </Typography>
                          )}
                          {bill.barcode && (
                            <Tooltip title="Copiar código de barras">
                              <Box
                                component="span"
                                onClick={() => copyBarcode(bill.barcode!)}
                                sx={{
                                  display: "inline-flex",
                                  alignItems: "center",
                                  gap: 0.4,
                                  cursor: "pointer",
                                  color: "primary.main",
                                  fontSize: "0.7rem",
                                  fontWeight: 600,
                                }}
                              >
                                <Barcode size={12} />
                                Boleto
                              </Box>
                            </Tooltip>
                          )}
                        </Box>
                      </Box>
                    </TableCell>

                    {/* Categoria DRE */}
                    <TableCell>
                      <Typography variant="body2" color="text.secondary" sx={{ fontSize: "0.82rem" }}>
                        {bill.category_name || "-"}
                      </Typography>
                    </TableCell>

                    {/* Fornecedor / Cliente */}
                    <TableCell>
                      <Typography variant="body2" fontWeight={600} color="text.primary" sx={{ fontSize: "0.82rem" }}>
                        {isPayable ? bill.supplier_name || "-" : bill.client_name || "-"}
                      </Typography>
                    </TableCell>

                    {/* Observação */}
                    <TableCell sx={{ maxWidth: 180 }}>
                      {bill.notes ? (
                        <Tooltip title={bill.notes} arrow placement="top">
                          <Typography
                            variant="body2"
                            color="text.secondary"
                            sx={{
                              fontSize: "0.8rem",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                              maxWidth: 170,
                              display: "block",
                              cursor: "default",
                            }}
                          >
                            {bill.notes}
                          </Typography>
                        </Tooltip>
                      ) : (
                        <Typography variant="body2" color="text.disabled" sx={{ fontSize: "0.8rem" }}>
                          -
                        </Typography>
                      )}
                    </TableCell>

                    {/* Vencimento */}
                    <TableCell>
                      <Box>
                        <Typography variant="body2" fontWeight={700} color={isOverdue ? "#DC2626" : "text.primary"}>
                          {dayjs(bill.due_date).format("DD/MM/YYYY")}
                        </Typography>
                        {!isPaid && bill.status !== "canceled" && (
                          <Typography
                            variant="caption"
                            sx={{
                              fontSize: "0.7rem",
                              fontWeight: 600,
                              color: isOverdue ? "#DC2626" : diffDays === 0 ? "#D97706" : "text.secondary",
                            }}
                          >
                            {isOverdue
                              ? `Venceu há ${Math.abs(diffDays)}d`
                              : diffDays === 0
                              ? "Vence hoje!"
                              : `Em ${diffDays} dias`}
                          </Typography>
                        )}
                      </Box>
                    </TableCell>

                    {/* Valor Nominal */}
                    <TableCell align="right">
                      <Typography
                        variant="body2"
                        fontWeight={800}
                        color={isPayable ? "#DC2626" : "#059669"}
                        sx={{ fontSize: "0.88rem" }}
                      >
                        {fmtBRL(bill.amount)}
                      </Typography>
                    </TableCell>

                    {/* Valor Pago / Data */}
                    <TableCell align="right">
                      {isPaid ? (
                        <Box>
                          <Typography variant="body2" fontWeight={700} color="text.primary">
                            {fmtBRL(bill.paid_amount)}
                          </Typography>
                          {bill.payment_date && (
                            <Typography variant="caption" color="text.secondary">
                              {dayjs(bill.payment_date).format("DD/MM/YYYY")}
                            </Typography>
                          )}
                        </Box>
                      ) : (
                        <Typography variant="caption" color="text.secondary">
                          -
                        </Typography>
                      )}
                    </TableCell>

                    {/* Status */}
                    <TableCell align="center">
                      {renderStatusChip(bill.status)}
                    </TableCell>

                    {/* Ações */}
                    <TableCell align="center">
                      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 0.5 }}>
                        {!isPaid && bill.status !== "canceled" && (
                          <Tooltip title={isPayable ? "Dar baixa (pagar)" : "Confirmar recebimento"}>
                            <IconButton
                              size="small"
                              onClick={() => handleOpenSettle(bill)}
                              sx={{
                                color: isPayable ? "#10B981" : "#3B82F6",
                                bgcolor: alpha(isPayable ? "#10B981" : "#3B82F6", 0.08),
                                "&:hover": {
                                  bgcolor: alpha(isPayable ? "#10B981" : "#3B82F6", 0.18),
                                },
                              }}
                            >
                              <CheckCircle2 size={16} />
                            </IconButton>
                          </Tooltip>
                        )}

                        <IconButton
                          size="small"
                          onClick={(e) => handleOpenMenu(e, bill)}
                          sx={{ color: "text.secondary" }}
                        >
                          <MoreVertical size={16} />
                        </IconButton>
                      </Box>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Paginação */}
      {billsData && (
        <TablePagination
          component="div"
          count={billsData.total}
          page={(filters.page || 1) - 1}
          onPageChange={(_, newPage) => setFilters((prev) => ({ ...prev, page: newPage + 1 }))}
          rowsPerPage={filters.page_size || 25}
          onRowsPerPageChange={(e) =>
            setFilters((prev) => ({
              ...prev,
              page_size: parseInt(e.target.value, 10),
              page: 1,
            }))
          }
          rowsPerPageOptions={[10, 25, 50, 100]}
          labelRowsPerPage="Linhas por página:"
          labelDisplayedRows={({ from, to, count }) => `${from}-${to} de ${count}`}
          sx={{ borderTop: "1px solid", borderColor: "divider", mt: 1 }}
        />
      )}

      {/* Menu Contextual da Linha */}
      <Menu
        anchorEl={actionAnchor}
        open={Boolean(actionAnchor)}
        onClose={handleCloseMenu}
        PaperProps={{
          elevation: 4,
          sx: { borderRadius: 2, minWidth: 160 },
        }}
      >
        {actionBill && !actionBill.payment_date && actionBill.status !== "canceled" && (
          <MenuItem onClick={() => handleOpenSettle(actionBill)}>
            <ListItemIcon>
              <CheckCircle2 size={16} color="#10B981" />
            </ListItemIcon>
            <ListItemText primary={actionBill.bill_type === "payable" ? "Dar Baixa (Pago)" : "Receber"} />
          </MenuItem>
        )}

        {actionBill && (
          <MenuItem onClick={() => handleOpenEdit(actionBill)}>
            <ListItemIcon>
              <Edit2 size={16} />
            </ListItemIcon>
            <ListItemText primary="Editar" />
          </MenuItem>
        )}

        {actionBill?.barcode && (
          <MenuItem
            onClick={() => {
              copyBarcode(actionBill.barcode!);
              handleCloseMenu();
            }}
          >
            <ListItemIcon>
              <Copy size={16} />
            </ListItemIcon>
            <ListItemText primary="Copiar Boleto" />
          </MenuItem>
        )}

        {actionBill && (
          <MenuItem onClick={() => handleOpenDelete(actionBill)} sx={{ color: "error.main" }}>
            <ListItemIcon>
              <Trash2 size={16} color={theme.palette.error.main} />
            </ListItemIcon>
            <ListItemText primary="Cancelar / Excluir" />
          </MenuItem>
        )}
      </Menu>

      {/* Modal de Criação / Edição */}
      <BillFormModal
        open={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSave={handleSaveBill}
        editingBill={editingBill}
        categories={categories}
        suppliers={suppliers}
        clients={clients}
        defaultType={formDefaultType}
      />

      {/* Modal de Liquidação / Baixa */}
      <BillSettleModal
        open={Boolean(settleBillTarget)}
        onClose={() => setSettleBillTarget(null)}
        bill={settleBillTarget}
        onSettle={async (id, data) => {
          await settleMutation.mutateAsync({ id, data });
        }}
      />

      {/* Modal de Cancelamento / Exclusão */}
      <BillDeleteModal
        open={Boolean(deleteBillTarget)}
        onClose={() => setDeleteBillTarget(null)}
        bill={deleteBillTarget}
        onDelete={async (id) => {
          await deleteMutation.mutateAsync(id);
        }}
        onCancelBill={async (id) => {
          await cancelMutation.mutateAsync(id);
        }}
      />
    </Box>
  );
}
