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
  TextField,
  InputAdornment,
  Typography,
  Chip,
  LinearProgress,
  Skeleton,
} from "@mui/material";
import { useMemo, useState, useEffect } from "react";
import { Plus, Search, Edit2, Trash2 } from "lucide-react";
import { useEmployees } from "../hooks/useEmployees";
import EmployeeFormModal from "../features/employees/EmployeeFormModal";
import EmployeeDeleteModal from "../features/employees/EmployeeDeleteModal";
import { deleteEmployee } from "../api/services/employees";
import { useToast } from "../hooks/useToast";
import type { Employee } from "../features/employees/types";
import { Button } from "../components/Button/Button";

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
    <Box sx={{ width: "100%", mx: "auto", p: 3, maxWidth: "1200px" }}>
      <Box sx={{ display: "flex", justifyContent: "space-between", mb: 3 }}>
        <TextField
          size="small"
          placeholder="Pesquisar funcionário"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <Search size={20} color="gray" />
                </InputAdornment>
              ),
            },
          }}
        />
        <Button variant="contained" startIcon={<Plus size={20} />} onClick={handleOpenCreate}>
          Novo Funcionário
        </Button>
      </Box>

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
            {filteredRows.map((row) => (
              <TableRow
                key={row.id}
                sx={{
                  opacity: row.is_active ? 1 : 0.6,
                  backgroundColor: row.is_active
                    ? "transparent"
                    : "rgba(0,0,0,0.02)",
                }}
              >
                <TableCell>{row.name}</TableCell>
                <TableCell>{ROLE_LABELS[row.role] ?? row.role}</TableCell>
                <TableCell>{row.phone || "-"}</TableCell>
                <TableCell>
                  <Chip
                    label={row.is_active ? "Ativo" : "Inativo"}
                    color={row.is_active ? "success" : "default"}
                    size="small"
                  />
                </TableCell>
                <TableCell align="right">
                  <IconButton size="small" onClick={() => handleEdit(row)} color="primary">
                    <Edit2 size={16} />
                  </IconButton>
                  <IconButton size="small" onClick={() => handleDeleteClick(row)} color="error">
                    <Trash2 size={16} />
                  </IconButton>
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
          </TableBody>
        </Table>
      </TableContainer>

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
