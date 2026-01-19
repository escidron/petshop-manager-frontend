import * as React from "react";
import { useTheme } from "@mui/material/styles";
import Box from "@mui/material/Box";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableFooter from "@mui/material/TableFooter";
import TableHead from "@mui/material/TableHead";
import TablePagination from "@mui/material/TablePagination";
import TableRow from "@mui/material/TableRow";
import Paper from "@mui/material/Paper";
import IconButton from "@mui/material/IconButton";
import FirstPageIcon from "@mui/icons-material/FirstPage";
import KeyboardArrowLeft from "@mui/icons-material/KeyboardArrowLeft";
import KeyboardArrowRight from "@mui/icons-material/KeyboardArrowRight";
import LastPageIcon from "@mui/icons-material/LastPage";
import CircularProgress from "@mui/material/CircularProgress";
import apiClient from "../../api/apiClient";
import { Chip } from "@mui/material";
import { Pencil, Trash2 } from "lucide-react";

interface TablePaginationActionsProps {
  count: number;
  page: number;
  rowsPerPage: number;
  onPageChange: (
    event: React.MouseEvent<HTMLButtonElement>,
    newPage: number,
  ) => void;
}

function TablePaginationActions(props: TablePaginationActionsProps) {
  const theme = useTheme();
  const { count, page, rowsPerPage, onPageChange } = props;

  return (
    <Box sx={{ flexShrink: 0, ml: 2.5 }}>
      <IconButton
        onClick={(e) => onPageChange(e, 0)}
        disabled={page === 0}
        aria-label="first page"
      >
        {theme.direction === "rtl" ? <LastPageIcon /> : <FirstPageIcon />}
      </IconButton>
      <IconButton
        onClick={(e) => onPageChange(e, page - 1)}
        disabled={page === 0}
        aria-label="previous page"
      >
        {theme.direction === "rtl" ? (
          <KeyboardArrowRight />
        ) : (
          <KeyboardArrowLeft />
        )}
      </IconButton>
      <IconButton
        onClick={(e) => onPageChange(e, page + 1)}
        disabled={page >= Math.ceil(count / rowsPerPage) - 1}
        aria-label="next page"
      >
        {theme.direction === "rtl" ? (
          <KeyboardArrowLeft />
        ) : (
          <KeyboardArrowRight />
        )}
      </IconButton>
      <IconButton
        onClick={(e) =>
          onPageChange(e, Math.max(0, Math.ceil(count / rowsPerPage) - 1))
        }
        disabled={page >= Math.ceil(count / rowsPerPage) - 1}
        aria-label="last page"
      >
        {theme.direction === "rtl" ? <FirstPageIcon /> : <LastPageIcon />}
      </IconButton>
    </Box>
  );
}

interface Client {
  id: number;
  name: string;
  email: string | null;
  phone: string | null;
  is_active: boolean;
}

export default function ClientsTable() {
  const [page, setPage] = React.useState(0);
  const [rowsPerPage, setRowsPerPage] = React.useState(5);
  const [rows, setRows] = React.useState<Client[]>([]);
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    fetchClients();
  }, []);

  const fetchClients = async () => {
    try {
      setLoading(true);
      const TENANT_ID = 1;
      const response = await apiClient.get<Client[]>("/api/v1/clients/", {
        params: { tenant_id: TENANT_ID },
      });
      setRows(response.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

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

  const emptyRows =
    page > 0 ? Math.max(0, (1 + page) * rowsPerPage - rows.length) : 0;

  return (
    <TableContainer
      component={Paper}
      sx={{ borderRadius: 2, overflow: "hidden" }} // borda arredondada
    >
      {loading ? (
        <Box display="flex" justifyContent="center" p={2}>
          <CircularProgress />
        </Box>
      ) : (
        <Table sx={{ minWidth: 500 }} aria-label="clients table">
          <TableHead>
            <TableRow>
              <TableCell
                align="left"
                sx={{
                  backgroundColor: "secondary.main",
                  fontWeight: 600,
                  color: "text.primary",
                  py: 1.25, // padding vertical (top + bottom)
                  fontSize: "0.875rem", // tamanho de fonte menor (opcional)
                }}
              >
                Nome
              </TableCell>
              <TableCell
                align="left"
                sx={{
                  backgroundColor: "secondary.main",
                  fontWeight: 600,
                  color: "text.primary",
                  py: 1.25,
                  fontSize: "0.875rem",
                }}
              >
                Email
              </TableCell>
              <TableCell
                align="left"
                sx={{
                  backgroundColor: "secondary.main",
                  fontWeight: 600,
                  color: "text.primary",
                  py: 1.25,
                  fontSize: "0.875rem",
                }}
              >
                Telefone
              </TableCell>
              <TableCell
                align="right"
                sx={{
                  backgroundColor: "secondary.main",
                  fontWeight: 600,
                  color: "text.primary",
                  py: 1.25,
                  fontSize: "0.875rem",
                }}
              >
                Status
              </TableCell>
              <TableCell
                align="right"
                sx={{
                  backgroundColor: "secondary.main",
                  fontWeight: 600,
                  color: "text.primary",
                  py: 1.25,
                  fontSize: "0.875rem",
                }}
              >
                {}
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {(rowsPerPage > 0
              ? rows.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
              : rows
            ).map((row) => (
              <TableRow
                key={row.id}
                sx={{
                  cursor: "pointer",
                  transition: "background-color 0.2s ease",
                  "&:hover": {
                    backgroundColor: "secondary.main",
                  },
                }}
              >
                <TableCell component="th" scope="row">
                  {row.name}
                </TableCell>
                <TableCell align="left">{row.email ?? "-"}</TableCell>
                <TableCell align="left">{row.phone ?? "-"}</TableCell>
                <TableCell align="right">
                  <Chip
                    label={row.is_active ? "Ativo" : "Inativo"}
                    sx={{
                      bgcolor: row.is_active ? "success.light" : "error.light",
                      color: "text.secondary",
                      height: "20px",
                    }}
                  />
                </TableCell>
                <TableCell align="right">
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "flex-end",
                      gap: 1,
                    }}
                  >
                    <IconButton
                      size="small"
                      sx={{
                        color: "primary.main",
                      }}
                      onClick={() => row}
                    >
                      <Pencil size={16} />
                    </IconButton>

                    <IconButton
                      size="small"
                      sx={{
                        color: "error.main",
                      }}
                      onClick={() => row}
                    >
                      <Trash2 size={16} />
                    </IconButton>
                  </Box>
                </TableCell>
              </TableRow>
            ))}
            {emptyRows > 0 && (
              <TableRow style={{ height: 53 * emptyRows }}>
                <TableCell colSpan={4} />
              </TableRow>
            )}
          </TableBody>
          <TableFooter>
            <TableRow>
              <TablePagination
                rowsPerPageOptions={[5, 10, 25, { label: "All", value: -1 }]}
                colSpan={4}
                count={rows.length}
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
      )}
    </TableContainer>
  );
}
