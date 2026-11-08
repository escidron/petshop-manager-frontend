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

type BadgeStyle = {
  label: string;
  bg: [number, number, number];
  text: [number, number, number];
};

const FEEDING_BADGES: Record<string, BadgeStyle> = {
  ate_all: { label: "Comeu tudo", bg: [22, 163, 74], text: [255, 255, 255] },
  ate_half: { label: "Metade", bg: [202, 138, 4], text: [255, 255, 255] },
  ate_little: { label: "Pouco", bg: [234, 88, 12], text: [255, 255, 255] },
  did_not_eat: { label: "Não comeu", bg: [220, 38, 38], text: [255, 255, 255] },
};

const MEDICATION_BADGES: Record<string, BadgeStyle> = {
  took_all: { label: "Tomou tudo", bg: [22, 163, 74], text: [255, 255, 255] },
  with_food: { label: "Com petisco", bg: [202, 138, 4], text: [255, 255, 255] },
  refused: { label: "Recusou", bg: [220, 38, 38], text: [255, 255, 255] },
  not_needed: { label: "Não precisou", bg: [100, 116, 139], text: [255, 255, 255] },
};

const PEE_BADGES: Record<string, BadgeStyle> = {
  normal: { label: "Normal", bg: [220, 252, 231], text: [21, 128, 61] },
  little: { label: "Pouco", bg: [254, 243, 199], text: [180, 83, 9] },
  none: { label: "Não fez", bg: [241, 245, 249], text: [71, 85, 105] },
};

const POOP_BADGES: Record<string, BadgeStyle> = {
  normal: { label: "Normal", bg: [220, 252, 231], text: [21, 128, 61] },
  loose: { label: "Pastoso", bg: [254, 243, 199], text: [180, 83, 9] },
  none: { label: "Não fez", bg: [241, 245, 249], text: [71, 85, 105] },
};

const UNREGISTERED_BADGE: BadgeStyle = {
  label: "Não registrado",
  bg: [241, 245, 249],
  text: [100, 116, 139],
};

function drawSectionHeader(
  doc: jsPDF,
  x: number,
  y: number,
  width: number,
  title: string
) {
  doc.setFillColor(241, 245, 249);
  doc.roundedRect(x, y, width, 7.5, 2, 2, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.setTextColor(49, 52, 133);
  doc.text(title, x + 4, y + 5.1);
}

function drawBadge(
  doc: jsPDF,
  x: number,
  y: number,
  badge: BadgeStyle,
  minWidth = 28
): number {
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  const labelText = badge.label.toUpperCase();
  const computedWidth = Math.max(minWidth, doc.getTextWidth(labelText) + 7);
  doc.setFillColor(badge.bg[0], badge.bg[1], badge.bg[2]);
  doc.roundedRect(x, y, computedWidth, 6, 1.5, 1.5, "F");
  doc.setTextColor(badge.text[0], badge.text[1], badge.text[2]);
  doc.text(labelText, x + computedWidth / 2, y + 4.2, { align: "center" });
  return computedWidth;
}

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
    ? `${tenant.street}${tenant.number ? `, ${tenant.number}` : ""}${tenant.neighborhood ? ` - ${tenant.neighborhood}` : ""}${tenant.city ? `/${tenant.state || ""}` : tenant.state ? `/${tenant.state}` : ""}`
    : null;

  let y = margin;

  // ── CABEÇALHO PRINCIPAL DA EMPRESA ──
  doc.setFillColor(49, 52, 133); // Brand Purple #313485
  doc.rect(margin, y, contentWidth, 2, "F");
  y += 5;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(15);
  doc.setTextColor(49, 52, 133);
  doc.text(tenantName.toUpperCase(), margin, y + 4);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.setTextColor(249, 115, 22); // Orange #F97316
  doc.text("BOLETIM DIÁRIO DA CRECHE", pageWidth - margin, y + 4, { align: "right" });

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

  // ── CARD 1: IDENTIFICAÇÃO DO PET & TUTOR ──
  const petCardHeight = 26;
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.4);
  doc.roundedRect(margin, y, contentWidth, petCardHeight, 2, 2, "FD");

  // Coluna 1: Pet
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12.5);
  doc.setTextColor(30, 41, 59);
  const petName = pet?.name || "Pet";
  doc.text(petName, margin + 4, y + 6.5);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  const speciesLabel =
    pet?.species?.toLowerCase() === "dog"
      ? "Canino"
      : pet?.species?.toLowerCase() === "cat"
      ? "Felino"
      : pet?.species;
  const breedSpecies = [pet?.breed, speciesLabel].filter(Boolean).join(" • ") || "Pet";
  const petDetails = [
    breedSpecies,
    pet?.gender === "male" ? "Macho" : pet?.gender === "female" ? "Fêmea" : null,
    pet?.size ? `Porte: ${pet.size}` : null,
    pet?.age ? `${pet.age} ${pet.age_unit || "ano(s)"}` : null,
  ]
    .filter(Boolean)
    .join("  |  ");
  doc.text(petDetails, margin + 4, y + 11.5);

  // Coluna 2: Tutor
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);
  doc.text("Tutor(a):", margin + 72, y + 6.5);
  doc.setFont("helvetica", "normal");
  doc.text(client?.name || "Não informado", margin + 87, y + 6.5);

  if (client?.phone) {
    doc.setFont("helvetica", "bold");
    doc.text("Contato:", margin + 72, y + 11.5);
    doc.setFont("helvetica", "normal");
    doc.text(maskPhone(client.phone), margin + 87, y + 11.5);
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
  doc.text("Horário:", pageWidth - margin - 52, y + 6.5);
  doc.setFont("helvetica", "normal");
  doc.text(`${checkInTime} às ${checkOutTime}`, pageWidth - margin - 38, y + 6.5);

  doc.setFont("helvetica", "bold");
  doc.text("Modalidade:", pageWidth - margin - 52, y + 11.5);
  doc.setFont("helvetica", "normal");
  const modName =
    stay.package?.name ||
    stay.modality?.name ||
    stay.service?.name ||
    (stay.stay_type === "multi_day"
      ? "Hospedagem"
      : stay.stay_type === "daily"
      ? "Diária"
      : "Meio Período");
  doc.text(modName, pageWidth - margin - 33, y + 11.5);

  // Linha divisória suave antes do status
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.25);
  doc.line(margin + 4, y + 15, pageWidth - margin - 4, y + 15);

  // Status da Estadia no rodapé do card
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  doc.setTextColor(71, 85, 105);
  doc.text("Status da Estadia:", margin + 4, y + 21);
  doc.setFont("helvetica", "bold");
  const statusLabel =
    stay.status === "checked_out"
      ? "Finalizada (Check-out realizado)"
      : stay.status === "checked_in"
      ? "Em andamento na Creche"
      : stay.status === "absent"
      ? "Não compareceu"
      : stay.status === "canceled"
      ? "Cancelada"
      : "Pendente (Aguardando check-in)";

  if (stay.status === "checked_out") {
    doc.setTextColor(22, 163, 74);
  } else if (stay.status === "checked_in") {
    doc.setTextColor(234, 88, 12);
  } else if (stay.status === "absent" || stay.status === "canceled") {
    doc.setTextColor(220, 38, 38);
  } else {
    doc.setTextColor(202, 138, 4);
  }
  doc.text(statusLabel, margin + 31, y + 21);

  y += petCardHeight + 5;

  // ── LINHA 2 (GRID 2 COLUNAS): ALIMENTAÇÃO (ESQ) + NECESSIDADES FISIOLÓGICAS (DIR) ──
  const colGap = 6;
  const colWidth = (contentWidth - colGap) / 2; // 88 mm cada coluna
  const leftX = margin;
  const rightX = margin + colWidth + colGap;

  const hasFeedObs = Boolean(report.feeding_obs && report.feeding_obs.trim().length > 0);
  const hasFoodInfo = Boolean(stay.food_info && stay.food_info.trim().length > 0);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  const feedObsLines = hasFeedObs
    ? doc.splitTextToSize(report.feeding_obs!.trim(), colWidth - 24)
    : [];

  let leftContentHeight = 19;
  if (hasFoodInfo) leftContentHeight += 5.5;
  if (feedObsLines.length > 0) leftContentHeight += feedObsLines.length * 4 + 2.5;

  const row2Height = Math.max(24, leftContentHeight);

  // Card Esquerdo: Alimentação
  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.4);
  doc.roundedRect(leftX, y, colWidth, row2Height, 2, 2, "FD");
  drawSectionHeader(doc, leftX, y, colWidth, "ALIMENTAÇÃO");

  const feedingBadge = report.feeding_status
    ? FEEDING_BADGES[report.feeding_status] || UNREGISTERED_BADGE
    : UNREGISTERED_BADGE;

  let feedCurY = y + 11;

  // Label "Comeu:" + Badge
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(51, 65, 85);
  doc.text("Comeu:", leftX + 4, feedCurY + 4.2);
  drawBadge(doc, leftX + 17, feedCurY, feedingBadge, 26);
  feedCurY += 9.5;

  if (hasFoodInfo) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(51, 65, 85);
    doc.text("Refeição:", leftX + 4, feedCurY);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(71, 85, 105);
    const foodLines = doc.splitTextToSize(stay.food_info!.trim(), colWidth - 22);
    doc.text(foodLines[0], leftX + 19, feedCurY);
    feedCurY += 5.5;
  }

  if (feedObsLines.length > 0) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(51, 65, 85);
    doc.text("Observação:", leftX + 4, feedCurY);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(71, 85, 105);
    doc.text(feedObsLines, leftX + 23, feedCurY);
  }

  // Card Direito: Necessidades Fisiológicas (Xixi e Cocô com pílulas visuais)
  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(rightX, y, colWidth, row2Height, 2, 2, "FD");
  drawSectionHeader(doc, rightX, y, colWidth, "NECESSIDADES FISIOLÓGICAS");

  const peeBadge = report.pee_status
    ? PEE_BADGES[report.pee_status] || UNREGISTERED_BADGE
    : UNREGISTERED_BADGE;
  const poopBadge = report.poop_status
    ? POOP_BADGES[report.poop_status] || UNREGISTERED_BADGE
    : UNREGISTERED_BADGE;

  const itemCenterY = y + 11;

  // Bloco Xixi
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(51, 65, 85);
  doc.text("Xixi:", rightX + 4, itemCenterY + 4.2);
  drawBadge(doc, rightX + 13, itemCenterY, peeBadge, 24);

  // Bloco Cocô
  const poopStartX = rightX + colWidth / 2 + 1;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(51, 65, 85);
  doc.text("Cocô:", poopStartX, itemCenterY + 4.2);
  drawBadge(doc, poopStartX + 11, itemCenterY, poopBadge, 24);

  y += row2Height + 5;

  // ── LINHA 3: HUMOR & COMPORTAMENTO ──
  const moodBoxHeight = 20;
  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(margin, y, contentWidth, moodBoxHeight, 2, 2, "FD");
  drawSectionHeader(doc, margin, y, contentWidth, "HUMOR E COMPORTAMENTO");

  const tags = report.mood_tags && report.mood_tags.length > 0 ? report.mood_tags : [];

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(51, 65, 85);
  doc.text("Humor do dia:", margin + 4, y + 14.5);

  if (tags.length > 0) {
    let tagX = margin + 27;
    const tagY = y + 10.5;
    tags.forEach((tag) => {
      const cleanTag = tag.trim();
      doc.setFont("helvetica", "bold");
      doc.setFontSize(7.5);
      const tagWidth = doc.getTextWidth(cleanTag) + 6;
      doc.setFillColor(254, 242, 242);
      doc.setDrawColor(254, 205, 211);
      doc.roundedRect(tagX, tagY, tagWidth, 5.5, 1.5, 1.5, "FD");

      doc.setTextColor(225, 29, 72);
      doc.text(cleanTag, tagX + 3, tagY + 3.9);

      tagX += tagWidth + 3;
    });
  } else {
    drawBadge(doc, margin + 27, y + 10.3, UNREGISTERED_BADGE, 28);
  }

  y += moodBoxHeight + 5;

  // ── LINHA 4 (CONDICIONAL): MEDICAÇÃO & CUIDADOS ADICIONAIS ──
  const allTasks = stay.tasks || [];
  const medTasks = allTasks.filter((t) => t.task_type === "medication");
  const otherTasks = allTasks.filter((t) => t.task_type !== "medication");
  const hasMedObs = Boolean(report.medication_obs && report.medication_obs.trim().length > 0);
  const hasMedSection =
    medTasks.length > 0 || Boolean(report.medication_status) || hasMedObs;
  const hasAppointment = Boolean(appointment);
  const showCareCard = hasMedSection || otherTasks.length > 0 || hasAppointment;

  if (showCareCard) {
    // Calcula altura dinâmica da seção
    let calcHeight = 11;
    if (hasMedSection) {
      calcHeight += 8.5;
      if (medTasks.length > 0) calcHeight += medTasks.length * 5.5;
      if (hasMedObs) calcHeight += 5.5;
    }
    if (otherTasks.length > 0) {
      calcHeight += otherTasks.length * 6.5;
    }
    if (hasAppointment) {
      calcHeight += 7;
    }
    const routineBoxHeight = Math.max(22, calcHeight + 2.5);

    doc.setFillColor(255, 255, 255);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(margin, y, contentWidth, routineBoxHeight, 2, 2, "FD");
    drawSectionHeader(doc, margin, y, contentWidth, "MEDICAÇÃO E CUIDADOS ADICIONAIS");

    let curY = y + 11;

    // 1. Medicação unificada com labels claros (Medicação:, Remédio:, Horário:, Observação:)
    if (hasMedSection) {
      let medBadge: BadgeStyle;
      if (report.medication_status && MEDICATION_BADGES[report.medication_status]) {
        medBadge = MEDICATION_BADGES[report.medication_status];
      } else if (medTasks.length > 0 && medTasks.every((t) => t.is_completed)) {
        medBadge = { label: "Tomou tudo", bg: [22, 163, 74], text: [255, 255, 255] };
      } else if (medTasks.length > 0) {
        medBadge = { label: "Pendente", bg: [254, 243, 199], text: [180, 83, 9] };
      } else {
        medBadge = UNREGISTERED_BADGE;
      }

      // Label "Medicação:" + Badge
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8);
      doc.setTextColor(51, 65, 85);
      doc.text("Medicação:", margin + 4, curY + 4.2);
      drawBadge(doc, margin + 22, curY, medBadge, 28);

      curY += 9.5;

      // Lista cada remédio com "Remédio:" e "Horário:"
      medTasks.forEach((t) => {
        doc.setFont("helvetica", "bold");
        doc.setFontSize(8);
        doc.setTextColor(51, 65, 85);
        doc.text("Remédio:", margin + 4, curY);

        doc.setFont("helvetica", "normal");
        doc.setTextColor(71, 85, 105);
        doc.text(t.title, margin + 19, curY);

        doc.setFont("helvetica", "bold");
        doc.setTextColor(51, 65, 85);
        doc.text("Horário:", margin + 85, curY);

        doc.setFont("helvetica", "normal");
        doc.setTextColor(71, 85, 105);
        doc.text(t.scheduled_time, margin + 99, curY);

        curY += 5.5;
      });

      if (hasMedObs) {
        doc.setFont("helvetica", "bold");
        doc.setFontSize(8);
        doc.setTextColor(51, 65, 85);
        doc.text("Observação:", margin + 4, curY);

        doc.setFont("helvetica", "normal");
        doc.setTextColor(71, 85, 105);
        doc.text(report.medication_obs!.trim(), margin + 23, curY);
        curY += 5.5;
      }
    }

    // 2. Outras tarefas de rotina (não-medicação)
    otherTasks.forEach((t) => {
      const taskBadge: BadgeStyle = t.is_completed
        ? { label: "Concluído", bg: [220, 252, 231], text: [21, 128, 61] }
        : { label: "Pendente", bg: [254, 243, 199], text: [180, 83, 9] };

      doc.setFont("helvetica", "bold");
      doc.setFontSize(8);
      doc.setTextColor(51, 65, 85);
      doc.text("Atividade:", margin + 4, curY + 3.2);

      doc.setFont("helvetica", "normal");
      doc.setTextColor(71, 85, 105);
      doc.text(t.title, margin + 20, curY + 3.2);

      doc.setFont("helvetica", "bold");
      doc.setTextColor(51, 65, 85);
      doc.text("Horário:", margin + 85, curY + 3.2);

      doc.setFont("helvetica", "normal");
      doc.setTextColor(71, 85, 105);
      doc.text(t.scheduled_time, margin + 99, curY + 3.2);

      doc.setFont("helvetica", "bold");
      doc.setTextColor(51, 65, 85);
      doc.text("Status:", margin + 125, curY + 3.2);
      drawBadge(doc, margin + 137, curY - 1, taskBadge, 24);

      curY += 6.5;
    });

    // 3. Banho & Tosa no mesmo dia
    if (hasAppointment && appointment) {
      const bathDone =
        (appointment.status as string) === "done" ||
        appointment.status === "completed";
      const bathBadge: BadgeStyle = bathDone
        ? { label: "Realizado", bg: [220, 252, 231], text: [21, 128, 61] }
        : { label: "Agendado", bg: [237, 233, 254], text: [109, 40, 217] };

      const bathTime = dayjs(appointment.scheduled_at).format("HH:mm");
      const serviceNames = appointment.items
        .flatMap((it) => it.services.map((s) => s.name))
        .join(", ");

      doc.setFont("helvetica", "bold");
      doc.setFontSize(8);
      doc.setTextColor(51, 65, 85);
      doc.text("Banho & Tosa:", margin + 4, curY + 3.2);
      const w = drawBadge(doc, margin + 26, curY - 1, bathBadge, 24);

      doc.setFont("helvetica", "bold");
      doc.setTextColor(51, 65, 85);
      doc.text("Horário:", margin + 31 + w, curY + 3.2);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(71, 85, 105);
      doc.text(bathTime, margin + 44 + w, curY + 3.2);

      doc.setFont("helvetica", "bold");
      doc.setTextColor(51, 65, 85);
      doc.text("Serviço:", margin + 60 + w, curY + 3.2);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(71, 85, 105);
      doc.text(serviceNames, margin + 74 + w, curY + 3.2);
    }

    y += routineBoxHeight + 5;
  }

  // ── LINHA 5: OBSERVAÇÕES ──
  const hasCustomNotes = Boolean(
    report.caretaker_notes && report.caretaker_notes.trim().length > 0
  );
  const message = hasCustomNotes
    ? report.caretaker_notes!.trim()
    : "Sem observações adicionais registradas.";

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  const splitMessage = doc.splitTextToSize(message, contentWidth - 8);
  const noteBoxHeight = Math.max(22, 12 + splitMessage.length * 4.2 + 4);

  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(margin, y, contentWidth, noteBoxHeight, 2, 2, "FD");
  drawSectionHeader(doc, margin, y, contentWidth, "OBSERVAÇÕES");

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  if (hasCustomNotes) {
    doc.setTextColor(51, 65, 85);
  } else {
    doc.setTextColor(148, 163, 184);
  }
  doc.text(splitMessage, margin + 4, y + 13);

  // ── RODAPÉ ──
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.4);
  doc.line(margin, pageHeight - 14, pageWidth - margin, pageHeight - 14);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(148, 163, 184);
  doc.text(
    `${tenantName} • Cuidando do seu pet com amor e segurança • Emitido via Petshop Manager`,
    margin,
    pageHeight - 9
  );
  doc.text("Página 1 de 1", pageWidth - margin, pageHeight - 9, { align: "right" });

  const safePetName = (petName || "pet")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]/g, "-");
  const fileName = `boletim-creche-${safePetName}-${dayjs(stay.scheduled_start_at).format("YYYYMMDD")}.pdf`;

  return { pdf: doc, fileName };
};
