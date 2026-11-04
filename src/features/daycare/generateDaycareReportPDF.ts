import jsPDF from "jspdf";
import dayjs from "dayjs";
import type { DaycareStay, DaycareReportData } from "./types";
import type { Tenant } from "../tenants/types";
import type { Client } from "../clients/types";
import type { Pet } from "../pets/types";
import type { Appointment } from "../appointments/types";
import { maskDocument, maskPhone } from "../../utils/masks";

export interface GenerateDaycareReportOptions {
  tenant: Tenant | null;
  stay: DaycareStay;
  client?: Client | null;
  pet?: Pet | null;
  appointment?: Appointment | null;
}

const FEEDING_LABELS: Record<string, { label: string; color: [number, number, number] }> = {
  ate_all: { label: "Comeu tudo", color: [22, 163, 74] }, // Verde
  ate_half: { label: "Comeu metade", color: [217, 119, 6] }, // Âmbar
  ate_little: { label: "Comeu pouco", color: [234, 88, 12] }, // Laranja
  did_not_eat: { label: "Nao comeu", color: [220, 38, 38] }, // Vermelho
};


const MEDICATION_LABELS: Record<string, string> = {
  took_all: "Tomou tudo com sucesso",
  with_food: "Administrado com petisco / alimento",
  refused: "Recusou medicacao",
  not_needed: "Nao precisou / Sem medicacao",
};

const PEE_LABELS: Record<string, string> = {
  normal: "Normal",
  little: "Pouco",
  none: "Nao fez",
};

const POOP_LABELS: Record<string, string> = {
  normal: "Normal / Firme",
  loose: "Pastoso",
  none: "Nao fez",
};

export const generateDaycareReportPDF = async ({
  tenant,
  stay,
  client: propClient,
  pet: propPet,
  appointment,
}: GenerateDaycareReportOptions): Promise<{ pdf: jsPDF; fileName: string }> => {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const pageWidth = 210;
  const pageHeight = 297;
  const margin = 14;
  const contentWidth = pageWidth - margin * 2; // 182 mm

  const client = propClient || stay.client;
  const pet = propPet || stay.pet;
  const report: DaycareReportData = stay.report_data || {};

  // Tenant Info
  const tenantName = tenant?.name || "Pet Shop & Creche";
  const tenantDoc = tenant?.document ? maskDocument(tenant.document) : null;
  const tenantPhone = tenant?.phone ? maskPhone(tenant.phone) : null;
  const tenantAddress = tenant?.street
    ? `${tenant.street}${tenant.number ? `, ${tenant.number}` : ""}${tenant.neighborhood ? ` - ${tenant.neighborhood}` : ""}${tenant.city ? `/${tenant.state || ""}` : (tenant.state ? `/${tenant.state}` : "")}`
    : null;

  let y = margin;

  // ── CABEÇALHO PRINCIPAL DA EMPRESA ──
  // Faixa decorativa no topo
  doc.setFillColor(49, 52, 133); // Brand Purple #313485
  doc.rect(margin, y, contentWidth, 2, "F");
  y += 5;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(15);
  doc.setTextColor(49, 52, 133);
  doc.text(tenantName.toUpperCase(), margin, y + 4);

  // Título do documento no lado direito
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.setTextColor(249, 115, 22); // Orange #F97316
  doc.text("BOLETIM DIARIO DA CRECHE", pageWidth - margin, y + 4, { align: "right" });

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

  const stayDateFormatted = stay.scheduled_start_at
    ? dayjs(stay.scheduled_start_at).format("DD/MM/YYYY")
    : dayjs().format("DD/MM/YYYY");

  doc.text(`Data da Estadia: ${stayDateFormatted}`, pageWidth - margin, y + 9, { align: "right" });
  doc.text(`Gerado em: ${dayjs().format("DD/MM/YYYY HH:mm")}`, pageWidth - margin, y + 13, { align: "right" });

  y += tenantAddress ? 17 : 14;

  // Linha separadora
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.4);
  doc.line(margin, y, pageWidth - margin, y);
  y += 4;

  // ── CARD 1: IDENTIFICAÇÃO DO PELUDINHO & TUTOR ──
  const petCardHeight = 26;
  doc.setFillColor(248, 250, 252); // #F8FAFC
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.4);
  doc.roundedRect(margin, y, contentWidth, petCardHeight, 2, 2, "FD");

  // Coluna 1: Pet
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.setTextColor(30, 41, 59);
  const petName = pet?.name || "Peludinho";
  doc.text(petName, margin + 4, y + 6);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  const breedSpecies = [pet?.breed, pet?.species].filter(Boolean).join(" • ") || "Pet";
  const petDetails = [
    breedSpecies,
    pet?.gender === "male" ? "Macho" : pet?.gender === "female" ? "Femea" : null,
    pet?.size ? `Porte: ${pet.size}` : null,
    pet?.age ? `${pet.age} ${pet.age_unit || "ano(s)"}` : null,
  ].filter(Boolean).join("  |  ");
  doc.text(petDetails, margin + 4, y + 11);

  // Coluna 2: Tutor
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);
  doc.text("Tutor(a):", margin + 75, y + 6);
  doc.setFont("helvetica", "normal");
  doc.text(client?.name || "Nao informado", margin + 90, y + 6);

  if (client?.phone) {
    doc.setFont("helvetica", "bold");
    doc.text("Contato:", margin + 75, y + 11);
    doc.setFont("helvetica", "normal");
    doc.text(maskPhone(client.phone), margin + 90, y + 11);
  }

  // Coluna 3: Horários & Modalidade
  const checkInTime = stay.check_in_at
    ? dayjs(stay.check_in_at).format("HH:mm")
    : dayjs(stay.scheduled_start_at).format("HH:mm");
  const checkOutTime = stay.check_out_at
    ? dayjs(stay.check_out_at).format("HH:mm")
    : dayjs(stay.scheduled_end_at).format("HH:mm");

  doc.setFont("helvetica", "bold");
  doc.setTextColor(71, 85, 105);
  doc.text("Horarios:", pageWidth - margin - 50, y + 6);
  doc.setFont("helvetica", "normal");
  doc.text(`${checkInTime} as ${checkOutTime}`, pageWidth - margin - 35, y + 6);

  doc.setFont("helvetica", "bold");
  doc.text("Modalidade:", pageWidth - margin - 50, y + 11);
  doc.setFont("helvetica", "normal");
  const modName = stay.modality?.name || stay.service?.name || (stay.stay_type === "daily" ? "Diaria" : "Meio Periodo");
  doc.text(modName, pageWidth - margin - 30, y + 11);

  // Status Badge no rodapé do card
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  doc.text("Status da Estadia:", margin + 4, y + 20);
  doc.setFont("helvetica", "normal");
  const statusLabel =
    stay.status === "checked_out"
      ? "Finalizada (Check-out realizado)"
      : stay.status === "checked_in"
      ? "Em andamento na Creche"
      : "Agendada";
  doc.setTextColor(22, 163, 74);
  doc.text(statusLabel, margin + 35, y + 20);

  y += petCardHeight + 5;

  // ── SEÇÃO 2: ALIMENTAÇÃO & HIDRATAÇÃO ──
  const feedBoxHeight = 30;
  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(margin, y, contentWidth, feedBoxHeight, 2, 2, "D");

  // Barra de título da seção
  doc.setFillColor(241, 245, 249);
  doc.roundedRect(margin, y, contentWidth, 7, 2, 2, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.setTextColor(49, 52, 133);
  doc.text("ALIMENTACAO E HIDRATACAO", margin + 4, y + 4.8);

  const feedingInfo = report.feeding_status
    ? FEEDING_LABELS[report.feeding_status] || { label: report.feeding_status, color: [71, 85, 105] }
    : { label: "Nao registrado", color: [148, 163, 184] };

  // Status Badge Pílula
  const badgeX = margin + 4;
  const badgeY = y + 10;
  doc.setFillColor(feedingInfo.color[0], feedingInfo.color[1], feedingInfo.color[2]);
  doc.roundedRect(badgeX, badgeY, 34, 6, 1.5, 1.5, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  doc.setTextColor(255, 255, 255);
  doc.text(feedingInfo.label.toUpperCase(), badgeX + 17, badgeY + 4.2, { align: "center" });

  // Detalhes da alimentação
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);

  const foodDescription = stay.food_info ? `Alimento fornecido: ${stay.food_info}` : "Racao habitual do pet";
  doc.text(foodDescription, margin + 42, badgeY + 4.2);

  // Observações da alimentação
  const feedObs = report.feeding_obs
    ? `Observacao: ${report.feeding_obs}`
    : "Observacao: Se alimentou no horario programado.";
  doc.text(feedObs, margin + 4, y + 21);

  // Hidratação
  doc.setFont("helvetica", "italic");
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.text("Hidratacao: Agua fresca e filtrada disponivel a vontade ao longo de todo o dia.", margin + 4, y + 26);

  y += feedBoxHeight + 5;

  // ── SEÇÃO 3: NECESSIDADES FISIOLÓGICAS ──
  const needsBoxHeight = 22;
  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(margin, y, contentWidth, needsBoxHeight, 2, 2, "D");

  doc.setFillColor(241, 245, 249);
  doc.roundedRect(margin, y, contentWidth, 7, 2, 2, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.setTextColor(49, 52, 133);
  doc.text("NECESSIDADES FISIOLOGICAS", margin + 4, y + 4.8);

  const peeText = report.pee_status ? PEE_LABELS[report.pee_status] || report.pee_status : "Normal";
  const poopText = report.poop_status ? POOP_LABELS[report.poop_status] || report.poop_status : "Normal / Firme";

  // Card Xixi
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(30, 41, 59);
  doc.text("Xixi:", margin + 6, y + 14);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(22, 163, 74);
  doc.text(peeText, margin + 18, y + 14);

  // Card Cocô
  doc.setFont("helvetica", "bold");
  doc.setTextColor(30, 41, 59);
  doc.text("Coco:", margin + 90, y + 14);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(22, 163, 74);
  doc.text(poopText, margin + 105, y + 14);

  y += needsBoxHeight + 5;

  // ── SEÇÃO 4: COMPORTAMENTO, HUMOR & SOCIALIZAÇÃO ──
  const moodBoxHeight = 26;
  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(margin, y, contentWidth, moodBoxHeight, 2, 2, "D");

  doc.setFillColor(241, 245, 249);
  doc.roundedRect(margin, y, contentWidth, 7, 2, 2, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.setTextColor(49, 52, 133);
  doc.text("COMPORTAMENTO, HUMOR E SOCIALIZACAO", margin + 4, y + 4.8);

  // Humor tags
  const tags = report.mood_tags && report.mood_tags.length > 0
    ? report.mood_tags
    : ["Brincalhao", "Sociável", "Alegre"];

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);
  doc.text("Humor do dia:", margin + 4, y + 13);

  let tagX = margin + 28;
  const tagY = y + 10;
  tags.forEach((tag) => {
    const cleanTag = tag.replace(/^[^\w\s]+/g, "").trim();
    const tagWidth = doc.getTextWidth(cleanTag) + 6;
    doc.setFillColor(254, 242, 242); // Soft rose/orange
    doc.setDrawColor(254, 205, 211);
    doc.roundedRect(tagX, tagY, tagWidth, 5, 1.5, 1.5, "FD");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(7);
    doc.setTextColor(225, 29, 72); // Rose
    doc.text(cleanTag, tagX + 3, tagY + 3.6);

    tagX += tagWidth + 3;
  });

  doc.setFont("helvetica", "italic");
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.text("Interagiu muito bem em grupo e aproveitou com alegria todos os momentos recreativos da matilha.", margin + 4, y + 22);

  y += moodBoxHeight + 5;

  // ── SEÇÃO 5: ROTINA DE CUIDADOS & SERVIÇOS ──
  const tasks = stay.tasks || [];
  const hasAppointment = !!appointment;
  const routineBoxHeight = 34;

  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(margin, y, contentWidth, routineBoxHeight, 2, 2, "D");

  doc.setFillColor(241, 245, 249);
  doc.roundedRect(margin, y, contentWidth, 7, 2, 2, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.setTextColor(49, 52, 133);
  doc.text("CUIDADOS E SERVICOS ADICIONAIS", margin + 4, y + 4.8);

  let routineY = y + 12;

  // Medicamento registrado no boletim
  if (report.medication_status) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7.5);
    doc.setTextColor(30, 41, 59);
    const medText = MEDICATION_LABELS[report.medication_status] || report.medication_status;
    const medObs = report.medication_obs ? ` (${report.medication_obs})` : "";
    doc.text(`Medicacao: ${medText}${medObs}`, margin + 4, routineY);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(22, 163, 74);
    doc.text("✓ Registrado", margin + 110, routineY);
    routineY += 5;
  }

  // Tarefas (alimentação / medicação)
  if (tasks.length > 0) {
    tasks.forEach((t) => {
      if (routineY <= y + routineBoxHeight - 6) {
        doc.setFont("helvetica", "bold");
        doc.setFontSize(7.5);
        doc.setTextColor(30, 41, 59);
        const taskTypeLabel = t.task_type === "medication" ? "[MEDICACAO]" : "[ROTINA]";
        doc.text(`${t.scheduled_time} - ${taskTypeLabel} ${t.title}`, margin + 4, routineY);

        doc.setFont("helvetica", "normal");
        doc.setTextColor(22, 163, 74);
        doc.text(t.is_completed ? "✓ Concluido" : "Pendente", margin + 110, routineY);
        routineY += 5;
      }
    });
  } else if (!report.medication_status) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text("Nenhuma medicacao especial solicitada para este dia.", margin + 4, routineY);
    routineY += 5;
  }

  // Banho no mesmo dia
  if (hasAppointment) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7.5);
    doc.setTextColor(49, 52, 133);
    const bathTime = dayjs(appointment.scheduled_at).format("HH:mm");
    const serviceNames = appointment.items.flatMap((it) => it.services.map((s) => s.name)).join(", ");
    doc.text(`Banho & Tosa as ${bathTime}: ${serviceNames}`, margin + 4, routineY);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(22, 163, 74);
    doc.text("✓ Realizado", margin + 110, routineY);
  }

  y += routineBoxHeight + 5;

  // ── SEÇÃO 6: RECADINHO DOS TIOS / MONITORES ──
  const noteBoxHeight = 32;
  doc.setFillColor(254, 252, 232); // Amarelinho aconchegante #FEFCE8
  doc.setDrawColor(254, 240, 138); // Borda suave
  doc.roundedRect(margin, y, contentWidth, noteBoxHeight, 2, 2, "FD");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.setTextColor(161, 98, 7); // Tom dourado/amber escuro
  doc.text("RECADINHO DOS TIOS DA CRECHE", margin + 4, y + 6);

  const defaultNote =
    `${petName} teve um dia fantastico na creche! Brincou com os amiguinhos, gastou bastante energia no patio e recebeu muito carinho de toda a nossa equipe. Ja estamos com saudades!`;
  const message = report.caretaker_notes && report.caretaker_notes.trim().length > 0
    ? report.caretaker_notes.trim()
    : defaultNote;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);
  const splitMessage = doc.splitTextToSize(message, contentWidth - 8);
  doc.text(splitMessage, margin + 4, y + 12);

  y += noteBoxHeight + 8;

  // ── RODAPÉ ──
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.4);
  doc.line(margin, pageHeight - 14, pageWidth - margin, pageHeight - 14);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(148, 163, 184);
  doc.text(
    `${tenantName} • Cuidando do seu pet com amor e seguranca • Emitido via Petshop Manager`,
    margin,
    pageHeight - 9
  );
  doc.text("Pagina 1 de 1", pageWidth - margin, pageHeight - 9, { align: "right" });

  const safePetName = (petName || "pet")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]/g, "-");
  const fileName = `boletim-creche-${safePetName}-${dayjs(stay.scheduled_start_at).format("YYYYMMDD")}.pdf`;

  return { pdf: doc, fileName };
};

