import {
  Dialog,
  DialogContent,
  DialogActions,
  Typography,
  Box,
  IconButton,
  Button as MuiButton,
  Divider,
  CircularProgress,
} from "@mui/material";
import { X, Printer, FileDown } from "lucide-react";
import { useState } from "react";
import dayjs from "dayjs";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import type { SaleResponse } from "./schemas";
import { formatPaymentMethod } from "../../utils/formatPaymentMethod";
import { maskPhone, maskDocument } from "../../utils/masks";
import { Button } from "../../components/Button/Button";
import { useAuth } from "../../hooks/useAuth";
import { useToast } from "../../hooks/useToast";
import { printThermalReceipt } from "../../utils/printThermalReceipt";

interface SaleReceiptModalProps {
  open: boolean;
  onClose: () => void;
  sale: SaleResponse | null;
  clientName?: string | null;
  clientPhone?: string | null;
  tenantName?: string;
}

export default function SaleReceiptModal({
  open,
  onClose,
  sale,
  clientName: propClientName,
  tenantName: propTenantName,
}: SaleReceiptModalProps) {
  const { tenant, user } = useAuth();
  const toast = useToast();

  const effectiveTenantName = propTenantName || tenant?.name || "Petshop";
  const effectiveTenantDocument = tenant?.document ? maskDocument(tenant.document) : null;
  const effectiveTenantAddress = tenant?.street
    ? `${tenant.street}${tenant.number ? `, ${tenant.number}` : ""}${tenant.neighborhood ? ` - ${tenant.neighborhood}` : ""}${tenant.city ? `/${tenant.state || ""}` : (tenant.state ? `/${tenant.state}` : "")}`
    : null;
  const effectiveTenantPhone = tenant?.phone ? maskPhone(tenant.phone) : null;
  const operatorName = user?.name || "Administrador Local";
  const [printedAt] = useState(() => dayjs().format("DD/MM/YYYY HH:mm:ss"));

  const getPetLabel = (item?: any) => {
    const pName = item?.pet_name || item?.pet?.name || sale?.pet?.name;
    return pName ? `[${pName}] ` : "";
  };

  const formatPaymentBenchmark = (method: string, amount: number) => {
    let label = "Outro";
    switch (method) {
      case "debit_card":
        label = "Débito";
        break;
      case "credit_card":
        label = "Crédito";
        break;
      case "money":
        label = "Dinheiro";
        break;
      case "pix":
        label = "PIX";
        break;
      case "package":
        label = "Pacote";
        break;
      default:
        label = formatPaymentMethod(method);
        break;
    }
    return `${label}( R$ ${amount.toFixed(2).replace(".", ",")} )`;
  };

  const resolvedClientName =
    propClientName ||
    sale?.client?.name ||
    sale?.appointment?.client?.name ||
    "Consumidor Final";

  if (!sale) return null;

  const safeItems = sale.items || [];
  const subtotal = safeItems.reduce((acc, it) => acc + (Number(it.subtotal) || 0), 0);
  const discount = Number(sale.discount_amount) || 0;
  const total = Number(sale.total_amount) || Math.max(0, subtotal - discount);

  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);

  // ── Helper: Gera o arquivo PDF com proporção e escala natural de leitura ───
  const generateReceiptPDF = async () => {
    const receiptElem = document.getElementById("sale-receipt-print-area");
    if (!receiptElem) return null;

    // Adiciona margem de segurança na altura para evitar corte subpixel no rodapé
    const fullHeight = receiptElem.scrollHeight + 20;
    const fullWidth = receiptElem.offsetWidth || 340;

    const canvas = await html2canvas(receiptElem, {
      scale: 2.5, // 2.5x para máxima nitidez
      backgroundColor: "#ffffff",
      useCORS: true,
      logging: false,
      scrollX: 0,
      scrollY: 0,
      width: fullWidth,
      height: fullHeight,
      windowWidth: document.documentElement.offsetWidth,
      windowHeight: Math.max(window.innerHeight, fullHeight + 500),
      onclone: (clonedDoc) => {
        const clonedElem = clonedDoc.getElementById("sale-receipt-print-area");
        if (clonedElem) {
          clonedElem.style.fontFamily = "'Courier New', Courier, 'Lucida Console', Monaco, monospace";
          const allDescendants = clonedElem.querySelectorAll("*");
          allDescendants.forEach((child) => {
            (child as HTMLElement).style.fontFamily = "'Courier New', Courier, 'Lucida Console', Monaco, monospace";
          });
          clonedElem.style.maxHeight = "none";
          clonedElem.style.height = "auto";
          clonedElem.style.overflow = "visible";
          clonedElem.style.boxShadow = "none";
          clonedElem.style.border = "none";
          clonedElem.style.outline = "none";
          clonedElem.style.borderRadius = "0";
          clonedElem.style.paddingBottom = "24px";

          let parent: HTMLElement | null = clonedElem.parentElement;
          while (parent && parent !== clonedDoc.body) {
            parent.style.maxHeight = "none";
            parent.style.height = "auto";
            parent.style.overflow = "visible";
            parent = parent.parentElement;
          }
          clonedDoc.body.style.maxHeight = "none";
          clonedDoc.body.style.height = "auto";
          clonedDoc.body.style.overflow = "visible";
        }
      },
    });

    const imgData = canvas.toDataURL("image/png");

    // Formato de página A4 padrão (210mm) com cupom centralizado de 95mm de largura:
    // Evita o efeito "zoom gigante" onde o navegador esticava 80mm para 1920px na tela inteira.
    const pageWidth = 210;
    const receiptWidth = 115; // 11.5 cm de largura no papel para leitura e nitidez perfeitas
    const receiptHeight = (fullHeight / fullWidth) * receiptWidth;
    const pageHeight = Math.max(297, receiptHeight + 30);
    const posX = (pageWidth - receiptWidth) / 2;
    const posY = 15;

    const pdf = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: [pageWidth, pageHeight],
    });

    // Define modo de exibição em tamanho real (100%)
    pdf.setDisplayMode("100%", "continuous");

    pdf.addImage(imgData, "PNG", posX, posY, receiptWidth, receiptHeight, undefined, "FAST");

    const pdfBlob = pdf.output("blob");
    const fileName = `comprovante-${dayjs(sale.created_at).format("YYYYMMDD-HHmm")}.pdf`;

    return { pdf, pdfBlob, fileName };
  };

  // ── Baixar PDF Diretamente ───────────────────────────────────────────
  const handleDownloadPDF = async () => {
    try {
      setIsGeneratingPDF(true);
      const result = await generateReceiptPDF();
      if (!result) throw new Error("Falha ao gerar o PDF");

      result.pdf.save(result.fileName);
      toast.success("Comprovante PDF baixado com sucesso!");
    } catch (err: any) {
      console.error("Erro ao baixar PDF:", err);
      toast.error("Erro ao gerar o arquivo PDF.");
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  // ── Imprimir diretamente em impressora térmica (ou navegador) ───────
  const handlePrint = () => {
    printThermalReceipt("sale-receipt-print-area", `Comprovante - Venda #${sale.id}`);
  };



  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
          p: 1,
          bgcolor: "#ffffff",
          boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
        },
      }}
    >
      {/* Estilo para impressão térmica isolada */}
      <style>{`
        @media print {
          body * {
            visibility: hidden !important;
          }
          #sale-receipt-print-area, #sale-receipt-print-area * {
            visibility: visible !important;
            font-family: 'Courier New', Courier, 'Lucida Console', Monaco, monospace !important;
          }
          #sale-receipt-print-area {
            position: fixed !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            max-width: 80mm !important;
            margin: 0 !important;
            padding: 4mm !important;
            border: none !important;
            box-shadow: none !important;
            background: #ffffff !important;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>

      {/* Header do modal */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          px: 2,
          pt: 1.5,
          pb: 1,
        }}
        className="no-print"
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <Box
            sx={{
              width: 36,
              height: 36,
              borderRadius: "10px",
              bgcolor: "#EEF2FF",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#313485",
            }}
          >
            <Printer size={20} />
          </Box>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 800, color: "#111827", lineHeight: 1.2 }}>
              Comprovante de Venda
            </Typography>
            <Typography variant="caption" sx={{ color: "#6B7280" }}>
              Venda finalizada com sucesso
            </Typography>
          </Box>
        </Box>
        <IconButton
          onClick={onClose}
          size="small"
          sx={{ color: "#6B7280", "&:hover": { color: "#111827" } }}
        >
          <X size={20} />
        </IconButton>
      </Box>

      <Divider sx={{ borderColor: "#E5E7EB", my: 1 }} className="no-print" />



      <DialogContent sx={{ p: { xs: 1.5, sm: 2 }, pt: 1, maxHeight: "72vh", overflowY: "auto", bgcolor: "#F9FAFB" }}>
        {/* Moldura de exibição para a pré-visualização no modal */}
        <Box
          sx={{
            maxWidth: "430px",
            mx: "auto",
            bgcolor: "#ffffff",
            p: 1,
            border: "1px solid #E5E7EB",
            borderRadius: 2.5,
            boxShadow: "0 1px 3px rgba(0, 0, 0, 0.05)",
          }}
        >
          {/* Printable Thermal Receipt Box */}
          <Box
            id="sale-receipt-print-area"
            sx={{
              fontFamily: "'Courier New', Courier, 'Lucida Console', Monaco, monospace !important",
              "&, & *": {
                fontFamily: "'Courier New', Courier, 'Lucida Console', Monaco, monospace !important",
              },
              bgcolor: "#ffffff",
              p: { xs: 2, sm: 2.5 },
              border: "none",
              borderRadius: 0,
              width: "100%",
              mx: "auto",
              color: "#000000",
              lineHeight: 1.4,
              fontSize: "0.92rem",
              boxShadow: "none",
              boxSizing: "border-box",
              height: "fit-content",
              minHeight: "fit-content",
              "@media print": {
                border: "none",
                p: 0,
                width: "100%",
                maxWidth: "100%",
                boxShadow: "none",
              },
            }}
          >
            {/* Cabeçalho superior: Data e Link do Sistema */}
            <Box
              className="receipt-flex-row"
              style={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%", marginBottom: "16px", paddingBottom: "4px" }}
              sx={{
                fontSize: "0.72rem",
                fontFamily: "inherit",
                color: "#374151",
              }}
            >
              <span>{dayjs().format("DD/MM/YYYY, HH:mm")}</span>
              <span style={{ maxWidth: "230px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {typeof window !== "undefined" ? window.location.host : "app.datapet.com.br"}
              </span>
            </Box>

          {/* Cabeçalho do Estabelecimento */}
          <Box className="receipt-text-center" style={{ textAlign: "center", width: "100%", marginBottom: "6px" }}>
            <Box sx={{ fontWeight: 800, fontSize: "1rem", textTransform: "uppercase", lineHeight: 1.25, color: "#000000" }}>
              {effectiveTenantName}
            </Box>
            {effectiveTenantDocument && (
              <Box sx={{ fontSize: "0.92rem", mt: 0.25, fontWeight: 600, color: "#000000" }}>
                {effectiveTenantDocument}
              </Box>
            )}
            {effectiveTenantAddress && (
              <Box sx={{ fontSize: "0.88rem", mt: 0.25, color: "#000000" }}>
                {effectiveTenantAddress}
              </Box>
            )}
          </Box>

          <Box className="receipt-divider-dashed" style={{ borderBottom: "1px dashed #000000", width: "100%", margin: "8px 0" }} />

          {/* Datas & Identificação Fiscal */}
          <Box className="receipt-text-center" style={{ textAlign: "center", width: "100%", margin: "8px 0" }} sx={{ fontSize: "0.9rem", color: "#000000" }}>
            <Box>Venda realizada em {dayjs(sale.created_at).format("DD/MM/YYYY")}</Box>
            <Box sx={{ mt: 0.25 }}>Impresso em {printedAt}</Box>

            <Box sx={{ mt: 1.5, fontWeight: 700 }}>SIMPLES CONFERENCIA DA COMPRA</Box>
            <Box sx={{ fontWeight: 700 }}>*** NAO E DOCUMENTO FISCAL ***</Box>
          </Box>

          <Box className="receipt-divider-dashed" style={{ borderBottom: "1px dashed #000000", width: "100%", margin: "8px 0" }} />

          {/* Cabeçalho da Tabela de Itens */}
          <Box
            className="receipt-flex-row"
            style={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%" }}
            sx={{ fontSize: "0.9rem", fontWeight: 700, px: 0.5, color: "#000000" }}
          >
            <span>ITEM / QTD / V.UNIT</span>
            <span>TOTAL(R$)</span>
          </Box>

          <Box className="receipt-divider-dashed" style={{ borderBottom: "1px dashed #000000", width: "100%", margin: "8px 0" }} />

          {/* Lista de Itens */}
          <Box sx={{ mb: 1 }}>
            {safeItems.map((item, idx) => {
              const itemUnitPrice = Number(item.unit_price) || 0;
              const itemSubtotal = Number(item.subtotal) || 0;
              const petPrefix = getPetLabel(item);

              return (
                <Box key={idx} sx={{ mb: 1.25, fontSize: "0.9rem", px: 0.5, color: "#000000" }}>
                  <Box sx={{ fontWeight: 600 }}>
                    {petPrefix}{item.name}
                  </Box>
                  <Box
                    className="receipt-flex-row"
                    style={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%", marginTop: "4px" }}
                  >
                    <span>
                      {item.quantity} &nbsp;x R$ &nbsp;{itemUnitPrice.toFixed(2).replace(".", ",")}
                    </span>
                    <span style={{ fontWeight: 700 }}>
                      {itemSubtotal.toFixed(2).replace(".", ",")}
                    </span>
                  </Box>
                </Box>
              );
            })}
          </Box>

          <Box className="receipt-divider-dashed" style={{ borderBottom: "1px dashed #000000", width: "100%", margin: "8px 0" }} />

          {/* Desconto (se houver) e TOTAL */}
          <Box sx={{ fontSize: "0.9rem", my: 1, px: 0.5, color: "#000000" }}>
            {discount > 0 && (
              <Box
                className="receipt-flex-row"
                style={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%", marginBottom: "4px" }}
              >
                <span>DESCONTO:</span>
                <span>- {discount.toFixed(2).replace(".", ",")}</span>
              </Box>
            )}
            <Box
              className="receipt-flex-row"
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                width: "100%",
                whiteSpace: "nowrap",
              }}
              sx={{
                fontWeight: 700,
                fontSize: "0.92rem",
              }}
            >
              <span style={{ whiteSpace: "nowrap" }}>
                <strong>TOTAL ..........:</strong>
              </span>
              <span style={{ whiteSpace: "nowrap" }}>
                <strong>{total.toFixed(2).replace(".", ",")}</strong>
              </span>
            </Box>
          </Box>

          {/* Formas de Pagamento */}
          <Box className="receipt-text-center" style={{ textAlign: "center", width: "100%", margin: "16px 0" }} sx={{ fontSize: "0.9rem", fontWeight: 600, color: "#000000" }}>
            {sale.payments && sale.payments.length > 1 ? (
              sale.payments.map((p, idx) => (
                <Box key={idx} sx={{ mb: 0.35 }}>
                  {formatPaymentBenchmark(p.payment_method, Number(p.amount) || 0)}
                </Box>
              ))
            ) : (
              <Box>
                {formatPaymentBenchmark(sale.payment_method, total)}
              </Box>
            )}
          </Box>

          {/* Fatura / Operador / Cliente */}
          <Box className="receipt-text-center" style={{ textAlign: "center", width: "100%", margin: "16px 0" }} sx={{ fontSize: "0.9rem", color: "#000000" }}>
            <Box sx={{ fontSize: "0.9rem", mb: 1.5, color: "#000000" }}>
              Fatura #{sale.id}
            </Box>
            <Box sx={{ fontSize: "0.9rem", mb: 1.5, color: "#000000" }}>
              Operador Caixa: {operatorName}
            </Box>
            <Box sx={{ fontSize: "0.9rem", mb: 1.5, color: "#000000" }}>
              Cliente: {resolvedClientName}
            </Box>

            {effectiveTenantPhone && (
              <Box sx={{ fontSize: "0.9rem", mt: 1.5, color: "#000000" }}>
                {effectiveTenantPhone}
              </Box>
            )}
            <Box sx={{ fontSize: "0.9rem", fontWeight: 700, mt: 0.5, color: "#000000" }}>
              Obrigado e Volte Sempre!
            </Box>
          </Box>
        </Box>
      </Box>
    </DialogContent>

      <Divider sx={{ borderColor: "#E5E7EB" }} className="no-print" />

      <DialogActions
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          px: 2.5,
          py: 1.5,
          gap: 1.5,
          flexWrap: "wrap",
        }}
        className="no-print"
      >
        <MuiButton
          onClick={onClose}
          sx={{
            color: "#4B5563",
            textTransform: "none",
            fontWeight: 700,
            fontSize: "0.85rem",
            px: 2,
            py: 0.85,
            borderRadius: 2,
            "&:hover": { bgcolor: "#F3F4F6", color: "#111827" },
          }}
        >
          Fechar
        </MuiButton>

        <Box sx={{ display: "flex", gap: 1.5, alignItems: "center" }}>
          <MuiButton
            variant="outlined"
            onClick={handleDownloadPDF}
            disabled={isGeneratingPDF}
            startIcon={
              isGeneratingPDF ? (
                <CircularProgress size={16} color="inherit" />
              ) : (
                <FileDown size={17} />
              )
            }
            sx={{
              borderColor: "#D1D5DB",
              color: "#374151",
              textTransform: "none",
              fontWeight: 700,
              fontSize: "0.85rem",
              px: 2,
              py: 0.85,
              borderRadius: 2,
              "&:hover": { borderColor: "#9CA3AF", bgcolor: "#F9FAFB" },
            }}
          >
            {isGeneratingPDF ? "Gerando..." : "Baixar PDF"}
          </MuiButton>

          <Button
            variant="contained"
            onClick={handlePrint}
            startIcon={<Printer size={17} />}
            sx={{
              bgcolor: "#313485",
              color: "#ffffff",
              fontWeight: 700,
              fontSize: "0.85rem",
              px: 2.5,
              py: 0.85,
              borderRadius: 2,
              "&:hover": { bgcolor: "#252869" },
            }}
          >
            Imprimir Comprovante
          </Button>
        </Box>
      </DialogActions>
    </Dialog>
  );
}
