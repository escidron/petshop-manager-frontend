import jsPDF from "jspdf";
import dayjs from "dayjs";
import type { CommissionEntry } from "./types";
import type { Employee } from "../employees/types";
import type { Tenant } from "../tenants/types";
import { maskDocument, maskPhone } from "../../utils/masks";

const ROLE_LABELS: Record<string, string> = {
  groomer: "Tosador(a)",
  bather: "Banhista",
  vet: "Veterinário(a)",
  salesperson: "Vendedor(a)",
  receptionist: "Recepcionista",
  driver: "Motorista",
  other: "Outro",
};

export interface GenerateReceiptOptions {
  tenant: Tenant | null;
  entries: CommissionEntry[];
  employees: Employee[];
  employeeMap: Record<number, string>;
  filterFrom?: string | null;
  filterTo?: string | null;
}

export const generateCommissionReceiptPDF = async ({
  tenant,
  entries,
  employees,
  employeeMap,
  filterFrom,
  filterTo,
}: GenerateReceiptOptions): Promise<{ pdf: jsPDF; fileName: string }> => {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const pageWidth = 210;
  const pageHeight = 297;
  const margin = 14;
  const contentWidth = pageWidth - margin * 2; // 182 mm
  const maxY = pageHeight - 16; // Deixar 16mm para rodapé

  // Dados do Tenant / Pet Shop
  const tenantName = tenant?.name || "Pet Shop";
  const tenantDoc = tenant?.document ? maskDocument(tenant.document) : null;
  const tenantPhone = tenant?.phone ? maskPhone(tenant.phone) : null;
  const tenantAddress = tenant?.street
    ? `${tenant.street}${tenant.number ? `, ${tenant.number}` : ""}${tenant.neighborhood ? ` - ${tenant.neighborhood}` : ""}${tenant.city ? `/${tenant.state || ""}` : (tenant.state ? `/${tenant.state}` : "")}`
    : null;

  const employeeObjMap = Object.fromEntries(employees.map((e) => [e.id, e]));

  // Agrupar entradas por funcionário
  const entriesByEmployee: Record<number, CommissionEntry[]> = {};
  entries.forEach((entry) => {
    if (!entriesByEmployee[entry.employee_id]) {
      entriesByEmployee[entry.employee_id] = [];
    }
    entriesByEmployee[entry.employee_id].push(entry);
  });

  const employeeIds = Object.keys(entriesByEmployee).map(Number);

  // Formatação do período
  let periodText = "Todos os períodos cadastrados";
  if (filterFrom && filterTo) {
    periodText = `${dayjs(filterFrom).format("DD/MM/YYYY")} até ${dayjs(filterTo).format("DD/MM/YYYY")}`;
  } else if (filterFrom) {
    periodText = `A partir de ${dayjs(filterFrom).format("DD/MM/YYYY")}`;
  } else if (filterTo) {
    periodText = `Até ${dayjs(filterTo).format("DD/MM/YYYY")}`;
  }

  // Larguras das colunas da tabela (sem Origem, somando 182 mm)
  // Data: 32mm, Base: 36mm, Tipo: 36mm, Comissão: 44mm, Status: 34mm
  const colWidths = {
    date: 32,
    base: 36,
    type: 36,
    commission: 44,
    status: 34,
  };

  const drawTableHeader = (y: number) => {
    doc.setFillColor(49, 52, 133); // Brand #313485
    doc.rect(margin, y, contentWidth, 7, "F");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(255, 255, 255);

    let currentX = margin;

    // Coluna 1: Data / Hora
    doc.text("DATA / HORA", currentX + 2, y + 4.8);
    currentX += colWidths.date;

    // Coluna 2: Base
    doc.text("BASE CÁLCULO", currentX + colWidths.base - 2, y + 4.8, { align: "right" });
    currentX += colWidths.base;

    // Coluna 3: Tipo / Taxa
    doc.text("TIPO / TAXA", currentX + colWidths.type / 2, y + 4.8, { align: "center" });
    currentX += colWidths.type;

    // Coluna 4: Comissão
    doc.text("COMISSÃO", currentX + colWidths.commission - 2, y + 4.8, { align: "right" });
    currentX += colWidths.commission;

    // Coluna 5: Status
    doc.text("STATUS", currentX + colWidths.status / 2, y + 4.8, { align: "center" });

    return y + 7;
  };

  let isFirstEmployee = true;

  for (const empId of employeeIds) {
    const empEntries = entriesByEmployee[empId];
    const empObj = employeeObjMap[empId];
    const empName = employeeMap[empId] || empObj?.name || `Funcionário #${empId}`;
    const empRole = empObj?.role ? (ROLE_LABELS[empObj.role] || empObj.role) : "Colaborador";

    if (!isFirstEmployee) {
      doc.addPage();
    }
    isFirstEmployee = false;

    let y = margin;

    // ── Cabeçalho Principal da Empresa ──
    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    doc.setTextColor(49, 52, 133);
    doc.text(tenantName, margin, y + 4);

    // Lado direito: Título do documento
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(30, 41, 59);
    doc.text("DEMONSTRATIVO DE COMISSÕES", pageWidth - margin, y + 4, { align: "right" });

    // Informações da Empresa
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(100, 116, 139);

    const subInfoParts: string[] = [];
    if (tenantDoc) subInfoParts.push(`CNPJ/CPF: ${tenantDoc}`);
    if (tenantPhone) subInfoParts.push(`Tel: ${tenantPhone}`);
    if (subInfoParts.length > 0) {
      doc.text(subInfoParts.join("   •   "), margin, y + 9);
    }
    if (tenantAddress) {
      doc.text(tenantAddress, margin, y + 13);
    }

    doc.text(`Emissão: ${dayjs().format("DD/MM/YYYY HH:mm")}`, pageWidth - margin, y + 9, { align: "right" });

    y += tenantAddress ? 17 : 13;

    // Linha divisória suave
    doc.setDrawColor(49, 52, 133);
    doc.setLineWidth(0.6);
    doc.line(margin, y, pageWidth - margin, y);
    y += 4;

    // ── Card de Identificação do Funcionário & Período ──
    const cardHeight = 16;
    doc.setFillColor(248, 250, 252); // #F8FAFC
    doc.setDrawColor(226, 232, 240); // #E2E8F0
    doc.setLineWidth(0.4);
    doc.roundedRect(margin, y, contentWidth, cardHeight, 1.5, 1.5, "FD");

    // Lado Esquerdo do Card: Colaborador e Função
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8.5);
    doc.setTextColor(30, 41, 59);
    doc.text("Colaborador:", margin + 4, y + 5.5);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(9.5);
    doc.setTextColor(49, 52, 133);
    doc.text(empName, margin + 25, y + 5.5);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text(`Função: ${empRole}`, margin + 4, y + 11.5);

    // Lado Direito do Card: Período e Qtd
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(30, 41, 59);
    doc.text("Período:", pageWidth - margin - 85, y + 5.5);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(71, 85, 105);
    doc.text(periodText, pageWidth - margin - 72, y + 5.5);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(30, 41, 59);
    doc.text("Lançamentos:", pageWidth - margin - 85, y + 11.5);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(71, 85, 105);
    doc.text(`${empEntries.length} registro(s)`, pageWidth - margin - 63, y + 11.5);

    y += cardHeight + 4;

    // ── Tabela de Lançamentos ──
    y = drawTableHeader(y);

    const rowHeight = 6.2;
    let totalBase = 0;
    let totalComissao = 0;
    let totalPago = 0;
    let totalPendente = 0;

    for (let i = 0; i < empEntries.length; i++) {
      const entry = empEntries[i];
      const baseNum = Number(entry.base_amount || 0);
      const comissaoNum = Number(entry.commission_amount || 0);

      totalBase += baseNum;
      totalComissao += comissaoNum;
      if (entry.status === "paid") {
        totalPago += comissaoNum;
      } else {
        totalPendente += comissaoNum;
      }

      // Se não couber a linha atual + espaço mínimo para rodapé
      if (y + rowHeight > maxY - 20) {
        doc.addPage();
        y = margin;
        // Mini cabeçalho de continuação
        doc.setFont("helvetica", "bold");
        doc.setFontSize(8.5);
        doc.setTextColor(49, 52, 133);
        doc.text(`Demonstrativo de Comissões - ${empName} (Continuação)`, margin, y + 3);
        y += 6;
        y = drawTableHeader(y);
      }

      // Linha zebrada
      if (i % 2 === 1) {
        doc.setFillColor(248, 250, 252);
        doc.rect(margin, y, contentWidth, rowHeight, "F");
      }

      // Borda inferior discreta
      doc.setDrawColor(241, 245, 249);
      doc.setLineWidth(0.2);
      doc.line(margin, y + rowHeight, pageWidth - margin, y + rowHeight);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(7.5);
      doc.setTextColor(30, 41, 59);

      let currentX = margin;

      // 1. Data/Hora
      const dateStr = dayjs(entry.created_at).format("DD/MM/YYYY HH:mm");
      doc.text(dateStr, currentX + 2, y + 4.2);
      currentX += colWidths.date;

      // 2. Base de Cálculo
      doc.text(`R$ ${baseNum.toFixed(2).replace(".", ",")}`, currentX + colWidths.base - 2, y + 4.2, {
        align: "right",
      });
      currentX += colWidths.base;

      // 3. Tipo / Taxa
      const rateStr =
        entry.commission_type === "percentage"
          ? `${Number(entry.rate).toFixed(2).replace(".", ",")}%`
          : `Fixo R$ ${Number(entry.rate).toFixed(2).replace(".", ",")}`;
      doc.text(rateStr, currentX + colWidths.type / 2, y + 4.2, { align: "center" });
      currentX += colWidths.type;

      // 4. Valor Comissão
      doc.setFont("helvetica", "bold");
      doc.setTextColor(49, 52, 133);
      doc.text(`R$ ${comissaoNum.toFixed(2).replace(".", ",")}`, currentX + colWidths.commission - 2, y + 4.2, {
        align: "right",
      });
      doc.setFont("helvetica", "normal");
      doc.setTextColor(30, 41, 59);
      currentX += colWidths.commission;

      // 5. Status
      const isPaid = entry.status === "paid";
      if (isPaid) {
        doc.setTextColor(21, 128, 61); // Verde #15803D
        doc.setFont("helvetica", "bold");
        doc.text("Pago", currentX + colWidths.status / 2, y + 4.2, { align: "center" });
      } else {
        doc.setTextColor(180, 83, 9); // Âmbar #B45309
        doc.setFont("helvetica", "bold");
        doc.text("Pendente", currentX + colWidths.status / 2, y + 4.2, { align: "center" });
      }

      y += rowHeight;
    }

    // ── Verificação de espaço para Totais, Declaração e Assinaturas (~62mm necessários) ──
    const requiredBottomSpace = 62;
    if (y + requiredBottomSpace > maxY) {
      doc.addPage();
      y = margin;
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8.5);
      doc.setTextColor(49, 52, 133);
      doc.text(`Demonstrativo de Comissões - ${empName} (Fechamento e Assinaturas)`, margin, y + 3);
      y += 8;
    } else {
      y += 4;
    }

    // ── Quadro de Resumo Financeiro ──
    const summaryHeight = 16;
    doc.setFillColor(241, 245, 249); // #F1F5F9
    doc.setDrawColor(203, 213, 225); // #CBD5E1
    doc.setLineWidth(0.4);
    doc.roundedRect(margin, y, contentWidth, summaryHeight, 1.5, 1.5, "FD");

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(71, 85, 105);
    doc.text(`Total Base de Vendas/Serviços: R$ ${totalBase.toFixed(2).replace(".", ",")}`, margin + 4, y + 5.5);
    doc.text(`Comissões Pagas: R$ ${totalPago.toFixed(2).replace(".", ",")}`, margin + 4, y + 11.5);

    doc.text(`Comissões Pendentes: R$ ${totalPendente.toFixed(2).replace(".", ",")}`, margin + 70, y + 11.5);

    // Destaque do Total Geral
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8.5);
    doc.setTextColor(30, 41, 59);
    doc.text("TOTAL DE COMISSÕES:", pageWidth - margin - 55, y + 6);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(49, 52, 133);
    doc.text(`R$ ${totalComissao.toFixed(2).replace(".", ",")}`, pageWidth - margin - 4, y + 12, {
      align: "right",
    });

    y += summaryHeight + 5;

    // ── Declaração de Quitação / Recibo ──
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7.5);
    doc.setTextColor(71, 85, 105);
    doc.text("TERMO DE CONFERÊNCIA E QUITAÇÃO:", margin, y);
    y += 3.5;

    doc.setFont("helvetica", "italic");
    doc.setFontSize(7.5);
    doc.setTextColor(100, 116, 139);
    const termo =
      `Declaro ter conferido e recebido o montante discriminado neste demonstrativo a título de comissão referente às atividades prestadas no período indicado, conferindo plena, geral e irrevogável quitação.`;
    const splitTermo = doc.splitTextToSize(termo, contentWidth);
    doc.text(splitTermo, margin, y);
    y += splitTermo.length * 3.5 + 8;

    // ── Campos de Assinatura ──
    const signatureWidth = 76;
    const signCol1 = margin + 5;
    const signCol2 = pageWidth - margin - signatureWidth - 5;

    // Linhas de assinatura
    doc.setDrawColor(148, 163, 184); // #94A3B8
    doc.setLineWidth(0.4);
    doc.line(signCol1, y, signCol1 + signatureWidth, y);
    doc.line(signCol2, y, signCol2 + signatureWidth, y);

    // Texto Colaborador
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(30, 41, 59);
    doc.text(empName, signCol1 + signatureWidth / 2, y + 4, { align: "center" });

    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.setTextColor(100, 116, 139);
    doc.text("Assinatura do Colaborador", signCol1 + signatureWidth / 2, y + 7.5, { align: "center" });
    doc.text("CPF: ______________________  Data: ___/___/______", signCol1 + signatureWidth / 2, y + 11.5, {
      align: "center",
    });

    // Texto Empresa
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(30, 41, 59);
    doc.text(tenantName, signCol2 + signatureWidth / 2, y + 4, { align: "center" });

    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.setTextColor(100, 116, 139);
    doc.text("Responsável / Gestão do Pet Shop", signCol2 + signatureWidth / 2, y + 7.5, { align: "center" });
    doc.text("Data: _____ / _____ / _________", signCol2 + signatureWidth / 2, y + 11.5, { align: "center" });
  }

  // ── Numeração de Páginas e Rodapé em todas as páginas ──
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);

    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.3);
    doc.line(margin, pageHeight - 11, pageWidth - margin, pageHeight - 11);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.setTextColor(148, 163, 184);
    doc.text(
      `Petshop Manager • Documento gerado eletronicamente em ${dayjs().format("DD/MM/YYYY [às] HH:mm")}`,
      margin,
      pageHeight - 7,
    );

    doc.text(`Página ${i} de ${totalPages}`, pageWidth - margin, pageHeight - 7, { align: "right" });
  }

  // Nome do arquivo de saída
  let fileName = `recibo-comissoes-${dayjs().format("YYYYMMDD-HHmm")}.pdf`;
  if (employeeIds.length === 1) {
    const singleName = (employeeMap[employeeIds[0]] || "colaborador")
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]/g, "-");
    fileName = `recibo-comissoes-${singleName}-${dayjs().format("YYYYMMDD")}.pdf`;
  }

  return { pdf: doc, fileName };
};
