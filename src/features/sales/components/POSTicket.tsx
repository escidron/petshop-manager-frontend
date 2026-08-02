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
  Switch,
  alpha,
  Collapse,
} from "@mui/material";
import { ShoppingCart, Trash2, Plus, Minus, Eye, EyeOff, CheckCircle } from "lucide-react";
import { useState } from "react";
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

// ── Read-only row (client view) ───────────────────────────────────────────────
function ClientItemRow({ item, petName }: { item: SaleItem; petName?: string | null }) {
  return (
    <Box>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", py: 1.25, gap: 1.5 }}>
        <Box sx={{ flex: 1 }}>
          <Typography variant="body2" sx={{ fontWeight: 700, color: "text.primary", lineHeight: 1.3 }}>
            {petName && (
              <Typography component="span" sx={{ fontWeight: 800, color: "primary.main", mr: 0.5, fontSize: "0.75rem" }}>
                {petName} •
              </Typography>
            )}
            {item.name}
          </Typography>
          {item.quantity > 1 && (
            <Typography variant="caption" sx={{ color: "text.primary", opacity: 0.55, fontWeight: 600 }}>
              {item.quantity} × R$ {item.unit_price.toFixed(2).replace(".", ",")}
            </Typography>
          )}
        </Box>
        <Typography variant="body2" sx={{ fontWeight: 800, color: "text.primary", whiteSpace: "nowrap" }}>
          R$ {item.subtotal.toFixed(2).replace(".", ",")}
        </Typography>
      </Box>
      <Divider sx={{ opacity: 0.25 }} />
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
  onUpdateQuantity,
  onSetQuantity,
  onRemoveItem,
  onDiscountCentsChange,
  onDiscountPctChange,
  onClearCart,
  onCheckout,
}: POSTicketProps) {
  const [clientMode, setClientMode] = useState(false);

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
        borderColor: clientMode ? "primary.main" : "divider",
        bgcolor: "background.paper",
        transition: "border-color 0.3s ease",
      }}
    >
      {/* ── Header ── */}
      <Box
        sx={{
          px: 2.5,
          py: 1.75,
          borderBottom: "1px solid",
          borderColor: "divider",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          bgcolor: clientMode ? (theme) => alpha(theme.palette.primary.main, 0.04) : "transparent",
          transition: "background-color 0.3s ease",
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
          <Typography variant="h6" sx={{ fontWeight: 800, color: "text.primary" }}>
            {clientMode ? "Conferência" : "Ticket de Venda"}
          </Typography>
          {cart.length > 0 && !clientMode && (
            <Chip
              label={`${cart.reduce((a, i) => a + i.quantity, 0)} iten${cart.reduce((a, i) => a + i.quantity, 0) === 1 ? "" : "s"}`}
              size="small"
              sx={{ fontWeight: 700, fontSize: "0.7rem", height: 22 }}
            />
          )}
        </Box>

        {/* Client Mode toggle */}
        <Tooltip title={clientMode ? "Voltar para modo operador" : "Modo Cliente — vista limpa para conferência"}>
          <Box
            onClick={() => setClientMode((p) => !p)}
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 0.75,
              cursor: "pointer",
              px: 1.25,
              py: 0.5,
              borderRadius: 2,
              border: "1px solid",
              borderColor: clientMode ? "primary.main" : "divider",
              bgcolor: clientMode ? (theme) => alpha(theme.palette.primary.main, 0.08) : "transparent",
              color: clientMode ? "primary.main" : "text.primary",
              transition: "all 0.2s ease",
              userSelect: "none",
              "&:hover": {
                borderColor: "primary.main",
                bgcolor: (theme) => alpha(theme.palette.primary.main, 0.06),
              },
            }}
          >
            {clientMode ? <Eye size={14} /> : <EyeOff size={14} />}
            <Typography variant="caption" sx={{ fontWeight: 700, fontSize: "0.65rem", whiteSpace: "nowrap" }}>
              {clientMode ? "Cliente" : "Cliente"}
            </Typography>
            <Switch
              size="small"
              checked={clientMode}
              onChange={(e) => setClientMode(e.target.checked)}
              onClick={(e) => e.stopPropagation()}
              sx={{ ml: -0.5, "& .MuiSwitch-thumb": { width: 10, height: 10 }, "& .MuiSwitch-switchBase": { py: "7px" } }}
            />
          </Box>
        </Tooltip>
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

              return clientMode ? (
                <ClientItemRow key={`${item.item_type}-${item.item_id}-${index}`} item={item} petName={petName} />
              ) : (
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
          bgcolor: clientMode ? (theme) => alpha(theme.palette.primary.main, 0.02) : "transparent",
          transition: "background-color 0.3s ease",
        }}
      >
        {/* Summary */}
        <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5, mb: 1.5 }}>

          {/* Subtotal — hide in client mode if no discount */}
          {(!clientMode || discountAmount > 0) && (
            <Box sx={{ display: "flex", justifyContent: "space-between" }}>
              <Typography variant="body2" color="text.primary" sx={{ opacity: 0.6 }}>Subtotal</Typography>
              <Typography variant="body2" sx={{ fontWeight: 600, color: "text.primary" }}>
                R$ {cartTotal.toFixed(2).replace(".", ",")}
              </Typography>
            </Box>
          )}

          {/* Discount field (operator only) */}
          {!clientMode && allowDiscount && cart.length > 0 && (
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", minHeight: 36 }}>
              <Typography variant="body2" color="text.primary" sx={{ opacity: 0.6 }}>Desconto</Typography>
              <Box sx={{ display: "flex", gap: 0.5, position: "relative" }}>
                <TextField
                  value={discountCents === 0 ? "" : formatBRLFromCents(discountCents)}
                  size="small"
                  placeholder="0,00"
                  onFocus={(e) => e.target.select()}
                  onChange={(e) => handleDiscountCentsChange(e.target.value)}
                  slotProps={{
                    input: {
                      startAdornment: (
                        <InputAdornment position="start">
                          <Typography sx={{ color: "text.disabled", fontWeight: 500, fontSize: "0.7rem" }}>R$</Typography>
                        </InputAdornment>
                      ),
                    },
                    htmlInput: { style: { textAlign: "right", fontWeight: 700, fontSize: "0.8rem", padding: "3px 6px" } },
                  }}
                  sx={{ width: 90 }}
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
                        <InputAdornment position="end">
                          <Typography sx={{ color: "text.disabled", fontWeight: 500, fontSize: "0.7rem" }}>%</Typography>
                        </InputAdornment>
                      ),
                    },
                    htmlInput: { style: { textAlign: "right", fontWeight: 700, fontSize: "0.8rem", padding: "3px 6px" } },
                  }}
                  sx={{ width: 65 }}
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

          {/* Discount line in client mode */}
          {clientMode && discountAmount > 0 && (
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <Typography variant="body2" color="text.primary" sx={{ opacity: 0.6 }}>Desconto</Typography>
              <Typography variant="body2" sx={{ fontWeight: 700, color: "success.main" }}>
                − R$ {discountAmount.toFixed(2).replace(".", ",")}
              </Typography>
            </Box>
          )}

          <Box sx={{ height: isDiscountExceeded ? 10 : 0, transition: "height 0.2s" }} />
          <Divider sx={{ my: 0.5 }} />

          {/* Total — big in client mode */}
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mt: clientMode ? 1 : 0.5 }}>
            <Typography
              variant={clientMode ? "h6" : "subtitle2"}
              sx={{ fontWeight: 800, color: "text.primary" }}
            >
              Total
            </Typography>
            <Typography
              variant={clientMode ? "h4" : "h5"}
              color="primary"
              sx={{ fontWeight: 900, transition: "font-size 0.3s ease" }}
            >
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
          startIcon={clientMode ? <CheckCircle size={20} /> : <ShoppingCart size={20} />}
          sx={{
            borderRadius: 2.5,
            height: clientMode ? 58 : 52,
            fontWeight: 800,
            fontSize: clientMode ? "1.05rem" : "0.95rem",
            textTransform: "uppercase",
            letterSpacing: 0.5,
            boxShadow: clientMode ? "0 6px 20px rgba(0,0,0,0.18)" : "0 4px 14px rgba(0,0,0,0.15)",
            transition: "all 0.3s ease",
          }}
        >
          {clientMode ? "CONFIRMAR PAGAMENTO" : `COBRAR R$ ${(cartTotal - discountAmount).toFixed(2).replace(".", ",")}`}
        </Button>

        {/* Operator-only controls */}
        <Collapse in={!clientMode}>
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
        </Collapse>
      </Box>
    </Paper>
  );
}
