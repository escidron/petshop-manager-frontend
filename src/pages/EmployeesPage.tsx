import {
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Typography,
  Chip,
  LinearProgress,
  Skeleton,
  TableFooter,
  TablePagination,
  Avatar,
  useTheme,
  useMediaQuery,
} from "@mui/material";
import { TablePaginationActions } from "../components/TablePaginationActions";
import { useMemo, useState, useEffect } from "react";
import {
  Plus,
  Search,
  Pencil,
  Trash2,
  MessageCircle,
  Phone,
  Mail,
  ChevronRight,
  ChevronLeft,
} from "lucide-react";
import { useEmployees } from "../hooks/useEmployees";
import EmployeeFormModal from "../features/employees/EmployeeFormModal";
import EmployeeDeleteModal from "../features/employees/EmployeeDeleteModal";
import { deleteEmployee } from "../api/services/employees";
import { useToast } from "../hooks/useToast";
import type { Employee } from "../features/employees/types";
import { Button } from "../components/Button/Button";
import CustomTextField from "../components/Textfield/CustomTextfield";
import { maskPhone } from "../utils/masks";

const ROLE_LABELS: Record<string, string> = {
  groomer: "Tosador(a)",
  bather: "Banhista",
  vet: "Veterinário(a)",
  salesperson: "Vendedor(a)",
  receptionist: "Recepcionista",
  driver: "Entregador/Motorista",
  other: "Outro",
};

export default function EmployeesPage() {
  const [search, setSearch] = useState("");
  const { employees, loading, getEmployees } = useEmployees();
  const toast = useToast();
  const [modalOpen, setModalOpen] = useState(false);
  const [employeeToEdit, setEmployeeToEdit] = useState<Employee | undefined>(undefined);
  const [employeeToDelete, setEmployeeToDelete] = useState<Employee | undefined>(undefined);
  const [isDeleting, setIsDeleting] = useState(false);

  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  const handleChangePage = (
    _event: React.MouseEvent<HTMLButtonElement> | null,
    newPage: number,
  ) => setPage(newPage);

  const handleChangeRowsPerPage = (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleShareCalendar = (employee: Employee) => {
    if (!employee.schedule_token) {
      toast.error("Funcionário sem token de agenda.");
      return;
    }
    const url = `${window.location.origin}/shared-schedule/${employee.schedule_token}`;
    const text = `Olá! Segue o link para visualizar a agenda de ${employee.name}: ${url}`;
    
    let whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
    
    if (employee.phone) {
      const cleanPhone = employee.phone.replace(/\D/g, "");
      if (cleanPhone.length > 0) {
        const formattedPhone = cleanPhone.startsWith("55") || cleanPhone.length > 11
          ? cleanPhone
          : `55${cleanPhone}`;
        whatsappUrl += `&phone=${formattedPhone}`;
      }
    }
    
    window.open(whatsappUrl, "_blank");
  };

  useEffect(() => {
    getEmployees();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filteredRows = useMemo(() => {
    if (!search) return employees;
    const term = search.toLowerCase();
    const normalizedTerm = term.replace(/\D/g, "");

    return employees.filter((e) => {
      const nameMatch = e.name.toLowerCase().includes(term);
      const emailMatch = e.email?.toLowerCase().includes(term);

      const normalizedPhone = e.phone?.replace(/\D/g, "") || "";
      const phoneMatch = normalizedTerm
        ? normalizedPhone.includes(normalizedTerm)
        : false;

      return (
        nameMatch ||
        emailMatch ||
        phoneMatch ||
        e.phone?.toLowerCase().includes(term)
      );
    });
  }, [employees, search]);

  const paginatedRows = useMemo(() => {
    return rowsPerPage > 0
      ? filteredRows.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
      : filteredRows;
  }, [filteredRows, page, rowsPerPage]);

  const emptyRows =
    page > 0 ? Math.max(0, (1 + page) * rowsPerPage - filteredRows.length) : 0;

  useEffect(() => {
    setPage(0);
  }, [search, employees]);

  const handleDeleteClick = (employee: Employee) => {
    setEmployeeToDelete(employee);
  };

  const handleConfirmDelete = async () => {
    if (!employeeToDelete) return;
    setIsDeleting(true);
    try {
      await deleteEmployee(employeeToDelete.id);
      toast.success("Funcionário excluído!");
      setEmployeeToDelete(undefined);
      getEmployees();
    } catch {
      toast.error("Erro ao excluir funcionário.");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleEdit = (employee: Employee) => {
    setEmployeeToEdit(employee);
    setModalOpen(true);
  };

  const handleOpenCreate = () => {
    setEmployeeToEdit(undefined);
    setModalOpen(true);
  };

  const headerCellSx = {
    backgroundColor: "secondary.main",
    fontWeight: 600,
    color: "text.primary",
    py: 1.25,
    fontSize: "0.875rem",
  };

  return (
    <Box
      sx={{
        width: "100%",
        mx: "auto",
        p: { xs: 1.5, sm: 2.5, md: 3 },
        pb: { xs: "calc(32px + env(safe-area-inset-bottom, 0px))", md: 3 },
        maxWidth: "1200px",
      }}
    >
      <Box
        mb={2}
        display="flex"
        flexDirection={{ xs: "column", sm: "row" }}
        justifyContent="space-between"
        alignItems={{ xs: "stretch", sm: "center" }}
        gap={1.5}
        sx={{ width: "100%" }}
      >
        <Box sx={{ flex: 1, width: "100%", maxWidth: { sm: "420px" } }}>
          <CustomTextField
            fullWidth
            icon={<Search size={18} />}
            placeholder="Pesquisar funcionário..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </Box>
        <Button
          startIcon={<Plus size={18} />}
          onClick={handleOpenCreate}
          sx={{
            minHeight: 42,
            fontWeight: 700,
            borderRadius: 2,
            whiteSpace: "nowrap",
            px: 2,
          }}
        >
          Novo Funcionário
        </Button>
      </Box>

      {isMobile ? (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
          {loading && filteredRows.length === 0 ? (
            Array.from({ length: 5 }).map((_, i) => (
              <Paper key={i} sx={{ p: 2, borderRadius: 2.5 }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 1.5 }}>
                  <Skeleton variant="circular" width={40} height={40} />
                  <Box sx={{ flex: 1 }}>
                    <Skeleton variant="text" width="60%" height={24} />
                    <Skeleton variant="text" width="40%" height={18} />
                  </Box>
                </Box>
                <Skeleton variant="rectangular" height={32} sx={{ borderRadius: 1.5 }} />
              </Paper>
            ))
          ) : filteredRows.length === 0 ? (
            <Paper sx={{ p: 4, textAlign: "center", borderRadius: 2.5 }}>
              <Typography color="text.disabled" variant="body1">
                Nenhum funcionário cadastrado ainda.
              </Typography>
            </Paper>
          ) : (
            paginatedRows.map((emp) => {
              const initials = emp.name
                ? emp.name
                    .split(" ")
                    .filter(Boolean)
                    .map((n) => n[0])
                    .slice(0, 2)
                    .join("")
                    .toUpperCase()
                : "FU";

              return (
                <Paper
                  key={emp.id}
                  onClick={() => handleEdit(emp)}
                  elevation={0}
                  sx={{
                    p: 1.75,
                    borderRadius: 2.5,
                    border: "1.5px solid",
                    borderColor: "divider",
                    bgcolor: "#FFFFFF",
                    cursor: "pointer",
                    display: "flex",
                    flexDirection: "column",
                    gap: 1.25,
                    opacity: emp.is_active ? 1 : 0.6,
                    transition: "all 0.15s ease",
                    "&:active": {
                      bgcolor: "action.hover",
                      transform: "scale(0.99)",
                    },
                  }}
                >
                  {/* Linha 1: Avatar, Nome, Cargo e Status */}
                  <Box sx={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 1 }}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1.25, minWidth: 0, flex: 1 }}>
                      <Avatar
                        sx={{
                          width: 38,
                          height: 38,
                          bgcolor: "rgba(49, 52, 133, 0.1)",
                          color: "primary.main",
                          fontWeight: 700,
                          fontSize: "0.85rem",
                        }}
                      >
                        {initials}
                      </Avatar>
                      <Box sx={{ minWidth: 0, flex: 1 }}>
                        <Typography
                          variant="body1"
                          fontWeight={700}
                          color="text.primary"
                          noWrap
                          sx={{ fontSize: "0.95rem" }}
                        >
                          {emp.name}
                        </Typography>
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          sx={{ display: "block", mt: 0.1 }}
                        >
                          {ROLE_LABELS[emp.role] ?? emp.role}
                        </Typography>
                      </Box>
                    </Box>

                    <Chip
                      label={emp.is_active ? "Ativo" : "Inativo"}
                      size="small"
                      sx={{
                        bgcolor: emp.is_active ? "success.main" : "grey.300",
                        color: emp.is_active ? "#FFFFFF" : "text.secondary",
                        fontWeight: 700,
                        height: 22,
                        fontSize: "0.7rem",
                      }}
                    />
                  </Box>

                  {/* Linha 2: Contatos (Telefone e Email) */}
                  {(emp.phone || emp.email) && (
                    <Box
                      sx={{
                        bgcolor: "#F8FAFC",
                        borderRadius: 1.5,
                        p: 1,
                        display: "flex",
                        flexDirection: "column",
                        gap: 0.5,
                      }}
                    >
                      {emp.phone && (
                        <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
                          <Phone size={13} color="#64748B" style={{ flexShrink: 0 }} />
                          <Typography variant="caption" color="text.secondary" fontWeight={500} noWrap>
                            {maskPhone(emp.phone)}
                          </Typography>
                        </Box>
                      )}

                      {emp.email && (
                        <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
                          <Mail size={13} color="#64748B" style={{ flexShrink: 0 }} />
                          <Typography variant="caption" color="text.secondary" fontWeight={500} noWrap>
                            {emp.email}
                          </Typography>
                        </Box>
                      )}
                    </Box>
                  )}

                  {/* Linha 3: Ações e Compartilhar Agenda */}
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      pt: 0.75,
                      borderTop: "1px dashed #E2E8F0",
                    }}
                  >
                    {emp.is_active ? (
                      <Button
                        variant="outlined"
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleShareCalendar(emp);
                        }}
                        startIcon={<MessageCircle size={14} />}
                        sx={{
                          py: 0.4,
                          px: 1.2,
                          fontSize: "0.72rem",
                          color: "#128C7E",
                          borderColor: "#25D366",
                          backgroundColor: "transparent",
                          borderRadius: 1.5,
                          "&:hover": {
                            borderColor: "#128C7E",
                            backgroundColor: "rgba(37, 211, 102, 0.08)",
                          },
                        }}
                      >
                        Agenda
                      </Button>
                    ) : (
                      <Box />
                    )}

                    <Box sx={{ display: "flex", gap: 0.5 }} onClick={(e) => e.stopPropagation()}>
                      <IconButton
                        size="small"
                        sx={{ color: "text.secondary" }}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEdit(emp);
                        }}
                      >
                        <Pencil size={16} />
                      </IconButton>
                      <IconButton
                        size="small"
                        color="error"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteClick(emp);
                        }}
                      >
                        <Trash2 size={16} />
                      </IconButton>
                    </Box>
                  </Box>
                </Paper>
              );
            })
          )}

          {/* Mobile Pagination */}
          {filteredRows.length > 0 && (
            <Paper
              elevation={0}
              sx={{
                p: 1,
                borderRadius: 2,
                border: "1px solid",
                borderColor: "divider",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                bgcolor: "#FFFFFF",
              }}
            >
              <Typography variant="caption" color="text.secondary" fontWeight={600}>
                {page * rowsPerPage + 1}–{Math.min((page + 1) * rowsPerPage, filteredRows.length)} de {filteredRows.length}
              </Typography>

              <Box sx={{ display: "flex", gap: 0.5, alignItems: "center" }}>
                <IconButton
                  size="small"
                  onClick={(e) => handleChangePage(e, page - 1)}
                  disabled={page === 0}
                >
                  <ChevronLeft size={18} />
                </IconButton>
                <Typography variant="caption" fontWeight={700} color="primary.main">
                  {page + 1} / {Math.max(1, Math.ceil(filteredRows.length / rowsPerPage))}
                </Typography>
                <IconButton
                  size="small"
                  onClick={(e) => handleChangePage(e, page + 1)}
                  disabled={page >= Math.ceil(filteredRows.length / rowsPerPage) - 1}
                >
                  <ChevronRight size={18} />
                </IconButton>
              </Box>
            </Paper>
          )}
        </Box>
      ) : (
        <TableContainer component={Paper} sx={{ position: "relative" }}>
          {loading && filteredRows.length > 0 && (
            <LinearProgress
              sx={{
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                zIndex: 1,
              }}
            />
          )}
          <Table>
            <TableHead>
              <TableRow>
                <TableCell sx={headerCellSx}>Nome</TableCell>
                <TableCell sx={headerCellSx}>Cargo</TableCell>
                <TableCell sx={headerCellSx}>Telefone</TableCell>
                <TableCell sx={headerCellSx}>Status</TableCell>
                <TableCell align="right" sx={headerCellSx} />
              </TableRow>
            </TableHead>
            <TableBody>
              {paginatedRows.map((row) => (
                <TableRow
                  key={row.id}
                  onClick={() => handleEdit(row)}
                  sx={{
                    cursor: "pointer",
                    opacity: row.is_active ? 1 : 0.6,
                    backgroundColor: row.is_active
                      ? "transparent"
                      : "rgba(0,0,0,0.02)",
                    "&:hover": {
                      backgroundColor: "secondary.main",
                    },
                  }}
                >
                  <TableCell>{row.name}</TableCell>
                  <TableCell>{ROLE_LABELS[row.role] ?? row.role}</TableCell>
                  <TableCell>{row.phone ? maskPhone(row.phone) : "-"}</TableCell>
                  <TableCell>
                    <Chip
                      label={row.is_active ? "Ativo" : "Inativo"}
                      color={row.is_active ? "success" : "default"}
                      size="small"
                    />
                  </TableCell>
                  <TableCell align="right">
                    <Box sx={{ display: "flex", gap: 1, justifyContent: "flex-end", alignItems: "center" }}>
                      {row.is_active && (
                        <Button
                          variant="outlined"
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleShareCalendar(row);
                          }}
                          startIcon={<MessageCircle size={14} />}
                          sx={{
                            py: 0.5,
                            px: 1.5,
                            fontSize: "0.75rem",
                            color: "#128C7E",
                            borderColor: "#25D366",
                            backgroundColor: "transparent",
                            "&:hover": {
                              borderColor: "#128C7E",
                              backgroundColor: "rgba(37, 211, 102, 0.08)",
                            },
                          }}
                        >
                          Compartilhar Agenda
                        </Button>
                      )}
                      <IconButton
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEdit(row);
                        }}
                        color="primary"
                      >
                        <Pencil size={16} />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteClick(row);
                        }}
                        color="error"
                      >
                        <Trash2 size={16} />
                      </IconButton>
                    </Box>
                  </TableCell>
                </TableRow>
              ))}
              {filteredRows.length === 0 && !loading && (
                <TableRow>
                  <TableCell colSpan={5} align="center" sx={{ py: 6 }}>
                    <Typography color="text.disabled" variant="body1">
                      Nenhum funcionário cadastrado ainda.
                    </Typography>
                  </TableCell>
                </TableRow>
              )}
              {loading && filteredRows.length === 0 && (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={`skeleton-${i}`}>
                    <TableCell><Skeleton variant="text" /></TableCell>
                    <TableCell><Skeleton variant="text" /></TableCell>
                    <TableCell><Skeleton variant="text" /></TableCell>
                    <TableCell><Skeleton variant="rectangular" width={60} height={24} sx={{ borderRadius: 1 }} /></TableCell>
                    <TableCell align="right"><Skeleton variant="rectangular" width={60} height={24} sx={{ display: "inline-block" }} /></TableCell>
                  </TableRow>
                ))
              )}
              {emptyRows > 0 && (
                <TableRow style={{ height: 53 * emptyRows }}>
                  <TableCell colSpan={5} />
                </TableRow>
              )}
            </TableBody>
            <TableFooter>
              <TableRow>
                <TablePagination
                  rowsPerPageOptions={[5, 10, 25, { label: "All", value: -1 }]}
                  colSpan={5}
                  count={filteredRows.length}
                  rowsPerPage={rowsPerPage}
                  page={page}
                  onPageChange={handleChangePage}
                  onRowsPerPageChange={handleChangeRowsPerPage}
                  ActionsComponent={TablePaginationActions}
                  slotProps={{
                    select: {
                      inputProps: { "aria-label": "rows per page" },
                      native: true,
                    },
                  }}
                />
              </TableRow>
            </TableFooter>
          </Table>
        </TableContainer>
      )}

      <EmployeeFormModal
        open={modalOpen}
        mode={employeeToEdit ? "edit" : "create"}
        employee={employeeToEdit}
        onClose={() => setModalOpen(false)}
        onSuccess={() => {
          setModalOpen(false);
          getEmployees();
        }}
      />

      {employeeToDelete && (
        <EmployeeDeleteModal
          open={!!employeeToDelete}
          employee={employeeToDelete}
          loading={isDeleting}
          onCancel={() => setEmployeeToDelete(undefined)}
          onConfirm={handleConfirmDelete}
        />
      )}
    </Box>
  );
}
