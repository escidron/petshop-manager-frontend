import {
  Card,
  CardContent,
  Typography,
  List,
  ListItem,
  ListItemText,
  Box,
  Chip,
  Divider,
} from "@mui/material";
import { useQuery } from "@tanstack/react-query";
import { getLowStockProducts } from "../../api/services/products";
import { AlertTriangle } from "lucide-react";

export default function InventoryAlerts() {
  const { data: lowStockProducts = [], isLoading } = useQuery({
    queryKey: ["products", "low-stock"],
    queryFn: getLowStockProducts,
    refetchInterval: 60000, // Refresh every minute
  });

  if (isLoading) return null;
  if (lowStockProducts.length === 0) return null;

  return (
    <Card
      sx={{
        borderTop: "4px solid",
        borderTopColor: "warning.main",
      }}
    >
      <CardContent>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
          <AlertTriangle color="#ed6c02" />
          <Typography variant="h6">Alertas de Estoque Baixo</Typography>
        </Box>
        <Divider sx={{ mb: 1 }} />
        <List sx={{ pt: 0 }}>
          {lowStockProducts.map((product) => (
            <ListItem key={product.id} disableGutters sx={{ py: 0.5 }}>
              <ListItemText
                primary={product.name}
                secondary={
                  <Box
                    component="span"
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 1,
                      mt: 0.5,
                    }}
                  >
                    <Chip
                      size="small"
                      label={`${product.quantity} em estoque`}
                      color="error"
                      variant="outlined"
                    />
                    <Typography variant="caption" color="text.secondary">
                      Mínimo: {product.min_stock}
                    </Typography>
                  </Box>
                }
              />
            </ListItem>
          ))}
        </List>
      </CardContent>
    </Card>
  );
}
