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
  CircularProgress,
  Chip,
} from "@mui/material";
import { useMemo, useState, useEffect } from "react";
import { Plus, Search, Edit2, Trash2 } from "lucide-react";
import { useEmployees } from "../hooks/useEmployees";
import EmployeeFormModal from "../features/employees/EmployeeFormModal";
import { deleteEmployee } from "../api/services/employees";
import { useToast } from "../hooks/useToast";
import type { Employee } from "../features/employees/types";
import { Button } from "../components/Button/Button";

const ROLE_LABELS: Record<string, string> = {
  groomer: "Tosador(a)",
  vet: "Veterinário(a)",
  salesperson: "Vendedor(a)",
  other: "Outro",
};

export default function EmployeesPage() {
  const [search, setSearch] = useState("");
  const { employees, loading, getEmployees } = useEmployees();
  const toast = useToast();
  const [modalOpen, setModalOpen] = useState(false);
  const [employeeToEdit, setEmployeeToEdit] = useState<Employee | undefined>(undefined);

  useEffect(() => {
    getEmployees();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filteredRows = useMemo(() => {
    if (!search) return employees;
    return employees.filter((e) =>
      e.name.toLowerCase().includes(search.toLowerCase()),
    );
  }, [employees, search]);

  const handleDelete = async (id: number) => {
    if (confirm("Tem certeza que deseja excluir este funcionário?")) {
      try {
        await deleteEmployee(id);
        toast.success("Funcionário excluído!");
        getEmployees();
      } catch {
        toast.error("Erro ao excluir funcionário.");
      }
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

      <TableContainer component={Paper}>
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
              <TableRow key={row.id}>
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
                  <IconButton size="small" onClick={() => handleDelete(row.id)} color="error">
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
            {loading && (
              <TableRow>
                <TableCell colSpan={5} align="center" sx={{ py: 6 }}>
                  <CircularProgress />
                </TableCell>
              </TableRow>
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
    </Box>
  );
}
