import {
  Box,
  Paper,
  Typography,
  List,
  ListItem,
  Divider,
  InputAdornment,
  TextField,
  IconButton,
  Tooltip,
  Chip,
} from "@mui/material";
import { ShoppingCart, Trash2, Plus, Minus } from "lucide-react";
import { Button } from "../../../components/Button/Button";
import { formatBRLFromCents } from "../../../utils/masks";
import type { SaleItem } from "../schemas";

interface POSTicketProps {
  cart: SaleItem[];
  cartTotal: number;
  discountCents: number;
  discountPctInput: string;
  isDiscountExceeded: boolean;
  allowDiscount: boolean;
  maxDiscountPercentage: number;
  clientPetNames?: Record<number, string>;
  cashControl?: React.ReactNode;
  activeComandaId?: number | null;
  comandaSyncStatus?: "idle" | "saving" | "saved" | "error";
  onUpdateQuantity: (index: number, delta: number) => void;
  onSetQuantity: (index: number, value: number) => void;
  onRemoveItem: (index: number) => void;
  onDiscountCentsChange: (cents: number) => void;
  onDiscountPctChange: (pct: string) => void;
  onClearCart: () => void;
  onCheckout: () => void;
}

// ── Editable row (operator view) ──────────────────────────────────────────────
function CartItemRow({
  item,
  index,
  petName,
  onUpdateQuantity,
  onSetQuantity,
  onRemoveItem,
}: {
  item: SaleItem;
  index: number;
  petName?: string | null;
  onUpdateQuantity: (i: number, d: number) => void;
  onSetQuantity: (i: number, v: number) => void;
  onRemoveItem: (i: number) => void;
}) {
  return (
    <Box>
      <ListItem sx={{ flexDirection: "column", alignItems: "stretch", py: 1.25, px: 0 }}>
        <Box sx={{ display: "flex", justifyContent: "space-between", mb: 0.5, gap: 1 }}>
          <Typography variant="body2" sx={{ fontWeight: 700, flex: 1, color: "text.primary", lineHeight: 1.3 }}>
            {petName && (
              <Typography component="span" sx={{ fontWeight: 800, color: "primary.main", mr: 0.5, fontSize: "0.75rem" }}>
                {petName} •
              </Typography>
            )}
            {item.name}
          </Typography>
          <Typography variant="body2" sx={{ fontWeight: 800, color: "text.primary", whiteSpace: "nowrap" }}>
            R$ {item.subtotal.toFixed(2).replace(".", ",")}
          </Typography>
        </Box>
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <Box sx={{ display: "flex", alignItems: "center", bgcolor: "action.hover", borderRadius: 1.5, px: 0.5 }}>
            <IconButton size="small" onClick={() => onUpdateQuantity(index, -1)}>
              <Minus size={14} />
            </IconButton>
            <input
              type="number"
              value={item.quantity}
              onChange={(e) => {
                const val = parseInt(e.target.value);
                if (!isNaN(val)) onSetQuantity(index, val);
              }}
              min={1}
              style={{ width: "32px", textAlign: "center", border: "none", background: "transparent", fontWeight: 700, outline: "none", fontSize: "0.78rem" }}
            />
            <Typography variant="caption" sx={{ fontWeight: 700, fontSize: "0.65rem", opacity: 0.6, mr: 0.25 }}>
              {item.unit || "UN"}
            </Typography>
            <IconButton size="small" onClick={() => onUpdateQuantity(index, 1)}>
              <Plus size={14} />
            </IconButton>
          </Box>
          <Tooltip title="Remover item">
            <IconButton size="small" color="error" onClick={() => onRemoveItem(index)}>
              <Trash2 size={14} />
            </IconButton>
          </Tooltip>
        </Box>
      </ListItem>
      <Divider sx={{ borderStyle: "dashed", opacity: 0.5 }} />
    </Box>
  );
}

export default function POSTicket({
  cart,
  cartTotal,
  discountCents,
  discountPctInput,
  isDiscountExceeded,
  allowDiscount,
  maxDiscountPercentage,
  clientPetNames,
  cashControl,
  onUpdateQuantity,
  onSetQuantity,
  onRemoveItem,
  onDiscountCentsChange,
  onDiscountPctChange,
  onClearCart,
  onCheckout,
}: POSTicketProps) {
  const discountAmount = discountCents / 100;

  const handleDiscountCentsChange = (value: string) => {
    const digits = value.replace(/\D/g, "");
    const cents = digits === "" ? 0 : Number(digits);
    const maxCents = Math.round(cartTotal * 100);
    const finalCents = Math.min(maxCents, cents);
    onDiscountCentsChange(finalCents);
    if (cartTotal > 0) {
      onDiscountPctChange(Number(((finalCents / 100 / cartTotal) * 100).toFixed(2)).toString());
    } else {
      onDiscountPctChange("0");
    }
  };

  const handleDiscountPctChange = (value: string) => {
    let val = value.replace(/[^0-9.,]/g, "").replace(",", ".");
    const parts = val.split(".");
    if (parts.length > 2) val = parts[0] + "." + parts.slice(1).join("");
    onDiscountPctChange(val);
    const pct = parseFloat(val) || 0;
    const newCents = Math.round((pct / 100) * cartTotal * 100);
    const maxCents = Math.round(cartTotal * 100);
    onDiscountCentsChange(Math.min(maxCents, newCents));
  };

  return (
    <Paper
      elevation={0}
      sx={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        borderRadius: 3,
        overflow: "hidden",
        border: "1.5px solid",
        borderColor: "divider",
        bgcolor: "background.paper",
      }}
    >
      {/* ── Header ── */}
      <Box
        sx={{
          px: { xs: 1.5, sm: 2 },
          py: 1.25,
          borderBottom: "1px solid",
          borderColor: "divider",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 1,
          flexShrink: 0,
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: { xs: 0.75, sm: 1 }, minWidth: 0, flex: 1, flexWrap: "wrap" }}>
          <Typography
            variant="subtitle1"
            sx={{
              fontWeight: 800,
              color: "text.primary",
              fontSize: { xs: "0.9rem", sm: "1.05rem" },
              whiteSpace: "nowrap",
            }}
          >
            Ticket de Venda
          </Typography>


          {cart.length > 0 && (
            <Chip
              label={`${cart.reduce((a, i) => a + i.quantity, 0)} ${cart.reduce((a, i) => a + i.quantity, 0) === 1 ? "item" : "itens"}`}
              size="small"
              sx={{ fontWeight: 700, fontSize: "0.65rem", height: 20, flexShrink: 0 }}
            />
          )}
        </Box>

        {/* Right side: Cash Control Pill */}
        {cashControl && (
          <Box sx={{ display: "flex", alignItems: "center", flexShrink: 0 }}>
            {cashControl}
          </Box>
        )}
      </Box>

      {/* ── Items List ── */}
      <Box sx={{ flexGrow: 1, overflowY: "auto", px: 2, py: 1, minHeight: 0 }}>
        {cart.length === 0 ? (
          <Box sx={{ height: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", opacity: 0.3, py: 8 }}>
            <ShoppingCart size={40} style={{ opacity: 0.3 }} />
            <Typography variant="body2" sx={{ mt: 1 }}>Carrinho Vazio</Typography>
          </Box>
        ) : (
          <List sx={{ pt: 0.5 }}>
            {cart.map((item, index) => {
              const petId = item.pet_ids?.[0];
              const petName = petId && clientPetNames ? clientPetNames[petId] : null;

              return (
                <CartItemRow
                  key={`${item.item_type}-${item.item_id}-${index}`}
                  item={item}
                  index={index}
                  petName={petName}
                  onUpdateQuantity={onUpdateQuantity}
                  onSetQuantity={onSetQuantity}
                  onRemoveItem={onRemoveItem}
                />
              );
            })}
          </List>
        )}
      </Box>

      {/* ── Footer ── */}
      <Box
        sx={{
          px: 2,
          py: 2,
          borderTop: "1px solid",
          borderColor: "divider",
          bgcolor: "transparent",
        }}
      >
        {/* Summary */}
        <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5, mb: 1.5 }}>
          {/* Subtotal */}
          <Box sx={{ display: "flex", justifyContent: "space-between" }}>
            <Typography variant="body2" color="text.primary" sx={{ opacity: 0.6 }}>Subtotal</Typography>
            <Typography variant="body2" sx={{ fontWeight: 600, color: "text.primary" }}>
              R$ {cartTotal.toFixed(2).replace(".", ",")}
            </Typography>
          </Box>

          {/* Discount field */}
          {allowDiscount && cart.length > 0 && (
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", minHeight: 36 }}>
              <Typography variant="body2" color="text.primary" sx={{ opacity: 0.6 }}>Desconto</Typography>
              <Box sx={{ display: "flex", gap: 1, position: "relative" }}>
                <TextField
                  value={discountCents === 0 ? "" : formatBRLFromCents(discountCents)}
                  size="small"
                  placeholder="0,00"
                  onFocus={(e) => e.target.select()}
                  onChange={(e) => handleDiscountCentsChange(e.target.value)}
                  slotProps={{
                    input: {
                      startAdornment: (
                        <InputAdornment position="start" sx={{ mr: 0.5 }}>
                          <Typography sx={{ color: "text.disabled", fontWeight: 600, fontSize: "0.72rem" }}>R$</Typography>
                        </InputAdornment>
                      ),
                    },
                    htmlInput: { style: { textAlign: "right", fontWeight: 700, fontSize: "0.825rem", padding: "4px 8px" } },
                  }}
                  sx={{ width: 105 }}
                  error={isDiscountExceeded}
                />
                <TextField
                  value={discountPctInput === "0" ? "" : discountPctInput}
                  size="small"
                  placeholder="0"
                  onFocus={(e) => e.target.select()}
                  onChange={(e) => handleDiscountPctChange(e.target.value)}
                  slotProps={{
                    input: {
                      endAdornment: (
                        <InputAdornment position="end" sx={{ ml: 0.5 }}>
                          <Typography sx={{ color: "text.disabled", fontWeight: 600, fontSize: "0.72rem" }}>%</Typography>
                        </InputAdornment>
                      ),
                    },
                    htmlInput: { style: { textAlign: "right", fontWeight: 700, fontSize: "0.825rem", padding: "4px 8px" } },
                  }}
                  sx={{ width: 75 }}
                  error={isDiscountExceeded}
                />
                {isDiscountExceeded && (
                  <Typography color="error" sx={{ position: "absolute", top: "100%", right: 0, whiteSpace: "nowrap", margin: 0, fontSize: "0.62rem", zIndex: 10, mt: 0.5 }}>
                    {`Máx: R$ ${((cartTotal * maxDiscountPercentage) / 100).toFixed(2)} (${maxDiscountPercentage}%)`}
                  </Typography>
                )}
              </Box>
            </Box>
          )}

          <Box sx={{ height: isDiscountExceeded ? 10 : 0, transition: "height 0.2s" }} />
          <Divider sx={{ my: 0.5 }} />

          {/* Total */}
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mt: 0.5 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 800, color: "text.primary" }}>
              Total
            </Typography>
            <Typography variant="h5" color="primary" sx={{ fontWeight: 900 }}>
              R$ {(cartTotal - discountAmount).toFixed(2).replace(".", ",")}
            </Typography>
          </Box>
        </Box>

        {/* Action buttons */}
        <Button
          variant="contained"
          color="primary"
          fullWidth
          size="large"
          disabled={cart.length === 0 || isDiscountExceeded}
          onClick={onCheckout}
          startIcon={<ShoppingCart size={20} />}
          sx={{
            borderRadius: 2.5,
            height: 52,
            fontWeight: 800,
            fontSize: "0.95rem",
            textTransform: "uppercase",
            letterSpacing: 0.5,
            boxShadow: "0 4px 14px rgba(0,0,0,0.15)",
          }}
        >
          {`COBRAR R$ ${(cartTotal - discountAmount).toFixed(2).replace(".", ",")}`}
        </Button>

        {cart.length > 0 && (
          <Button
            color="secondary"
            fullWidth
            onClick={onClearCart}
            sx={{ mt: 1, borderRadius: 2, height: 36, fontWeight: 600, fontSize: "0.8rem", opacity: 0.5, "&:hover": { opacity: 1 } }}
          >
            Limpar itens
          </Button>
        )}
      </Box>
    </Paper>
  );
}
