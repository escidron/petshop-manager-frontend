import * as React from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableFooter,
  TableHead,
  TablePagination,
  TableRow,
  Paper,
  CircularProgress,
  Box,
} from "@mui/material";
import TablePaginationActions from "@mui/material/TablePaginationActions";

export interface Column<T> {
  field: keyof T;
  label: string;
  align?: "left" | "right" | "center";
  width?: number;
  render?: (value: T[keyof T], row: T) => React.ReactNode;
}

interface PaginatedTableProps<T> {
  columns: Column<T>[];
  rows: T[];
  rowsPerPageOptions?: number[];
  loading?: boolean;
}

export function PaginatedTable<T>({
  columns,
  rows,
  rowsPerPageOptions = [5, 10, 25],
  loading = false,
}: PaginatedTableProps<T>) {
  const [page, setPage] = React.useState(0);
  const [rowsPerPage, setRowsPerPage] = React.useState(rowsPerPageOptions[0]);

  const paginatedRows =
    rowsPerPage > 0
      ? rows.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
      : rows;

  const emptyRows =
    page > 0 ? Math.max(0, (1 + page) * rowsPerPage - rows.length) : 0;
  function renderCellValue(value: unknown): React.ReactNode {
    if (value === null || value === undefined) return "—";

    if (
      typeof value === "string" ||
      typeof value === "number" ||
      typeof value === "boolean"
    ) {
      return String(value);
    }

    if (React.isValidElement(value)) {
      return value;
    }

    return "—";
  }
  return (
    <TableContainer component={Paper}>
      <Table sx={{ minWidth: 500 }}>
        {/* HEADER */}
        <TableHead>
          <TableRow>
            {columns.map((col) => (
              <TableCell
                key={String(col.field)}
                align={col.align ?? "left"}
                sx={{
                  fontWeight: 600,
                  color: "text.secondary",
                  borderBottom: "none",
                }}
              >
                {col.label}
              </TableCell>
            ))}
          </TableRow>
        </TableHead>

        {/* BODY */}
        <TableBody>
          {!loading &&
            paginatedRows.map((row, index) => (
              <TableRow
                key={index}
                sx={{
                  "& td": { borderBottom: "none" },
                }}
              >
                <TableCell colSpan={columns.length} sx={{ py: 1 }}>
                  <Paper
                    elevation={0}
                    sx={{
                      border: "1px solid",
                      borderColor: "divider",
                      borderRadius: 2,
                      px: 2,
                      py: 1,
                      transition: "all .2s",
                      "&:hover": {
                        boxShadow: 3,
                        borderColor: "primary.light",
                      },
                    }}
                  >
                    <Table size="small">
                      <TableBody>
                        <TableRow>
                          {columns.map((col) => {
                            const value = row[col.field];
                            return (
                              <TableCell
                                key={String(col.field)}
                                align={col.align ?? "left"}
                                sx={{
                                  borderBottom: "none",
                                  width: col.width,
                                }}
                              >
                                {col.render
                                  ? col.render(value, row)
                                  : renderCellValue(value)}
                              </TableCell>
                            );
                          })}
                        </TableRow>
                      </TableBody>
                    </Table>
                  </Paper>
                </TableCell>
              </TableRow>
            ))}
        </TableBody>

        {/* FOOTER */}
        <TableFooter>
          <TableRow>
            <TablePagination
              rowsPerPageOptions={[
                ...rowsPerPageOptions,
                { label: "All", value: -1 },
              ]}
              colSpan={columns.length}
              count={rows.length}
              rowsPerPage={rowsPerPage}
              page={page}
              onPageChange={(_, newPage) => setPage(newPage)}
              onRowsPerPageChange={(e) => {
                setRowsPerPage(parseInt(e.target.value, 10));
                setPage(0);
              }}
              ActionsComponent={TablePaginationActions}
            />
          </TableRow>
        </TableFooter>
      </Table>
    </TableContainer>
  );
}
