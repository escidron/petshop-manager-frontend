import { Box } from "@mui/material";
import ClientsToolbar from "../features/clients/ClientsToolbar";
import ClientsTable from "../features/clients/ClientsTable";


export default function ClientsPage() {
  return (
    <Box p={3}>
        <ClientsToolbar />
        <ClientsTable />
    </Box>
  );
}
