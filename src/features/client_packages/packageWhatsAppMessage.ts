import type { ClientPackage } from "./types";
import { formatServiceLabel } from "../../utils/formatServiceLabel";

export interface BuildPackageWhatsAppMessageParams {
  pkg: ClientPackage;
  petshopName?: string | null;
  clientName?: string | null;
}

/**
 * Constrói o texto formatado para envio do status/saldo do pacote via WhatsApp.
 * Centralizado aqui para que qualquer alteração de mensagem seja refletida
 * tanto nos pacotes ativos quanto no histórico de pacotes do cliente.
 */
export const buildPackageWhatsAppMessage = ({
  pkg,
  petshopName,
  clientName,
}: BuildPackageWhatsAppMessageParams): string => {
  const headerShop = petshopName ? `*${petshopName}*\n` : "";
  const recipient = clientName || pkg.client?.name || "Cliente";
  const petsNames =
    pkg.pets && pkg.pets.length > 0
      ? pkg.pets.map((p) => p.name).join(", ")
      : "";
  const petsText = petsNames ? ` para os pets *${petsNames}*` : "";

  const purchaseDate = pkg.created_at
    ? new Date(pkg.created_at).toLocaleDateString("pt-BR")
    : "";
  const expirationDate = pkg.expires_at
    ? new Date(pkg.expires_at).toLocaleDateString("pt-BR")
    : null;

  let text = `${headerShop}`;
  text += `Olá, *${recipient}*!\n\n`;
  text += `Aqui está o saldo do pacote *${pkg.package_name}*${petsText}:\n`;
  if (purchaseDate) {
    text += `*Data da compra:* ${purchaseDate}\n`;
  }
  if (expirationDate) {
    text += `*Validade do pacote:* ${expirationDate}\n`;
  }
  text += `\n*Status dos itens:*\n`;

  const credits = pkg.credits || [];
  const usages = pkg.usages || [];

  credits.forEach((credit) => {
    const creditUsages = usages
      .filter((u) => u.credit_id === credit.id && u.change_qty > 0)
      .sort(
        (a, b) =>
          new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
      );

    for (let i = 0; i < credit.total_qty; i++) {
      const isUsed = i < credit.used_qty;
      const usage = isUsed ? creditUsages[i] : null;
      const serviceName = credit.service
        ? formatServiceLabel(credit.service)
        : credit.service_name;

      if (isUsed) {
        const dateStr = usage
          ? ` em ${new Date(usage.created_at).toLocaleDateString("pt-BR")}`
          : "";
        text += `~${serviceName}~ (Utilizado${dateStr})\n`;
      } else {
        text += `*${serviceName}* (A utilizar)\n`;
      }
    }
  });

  text += `\nAgradecemos a preferência!`;
  return text;
};

/**
 * Monta o link do WhatsApp e abre em uma nova aba.
 */
export const sharePackageViaWhatsApp = (
  pkg: ClientPackage,
  clientPhone?: string | null,
  petshopName?: string | null,
  clientName?: string | null,
): { success: boolean; error?: string } => {
  if (!clientPhone) {
    return { success: false, error: "Telefone do cliente não cadastrado." };
  }

  const cleanPhone = clientPhone.replace(/\D/g, "");
  if (!cleanPhone) {
    return { success: false, error: "Telefone do cliente inválido." };
  }

  const phoneWithCountry =
    cleanPhone.startsWith("55") && cleanPhone.length > 11
      ? cleanPhone
      : `55${cleanPhone}`;

  const message = buildPackageWhatsAppMessage({
    pkg,
    petshopName,
    clientName,
  });

  const url = `https://wa.me/${phoneWithCountry}?text=${encodeURIComponent(message)}`;
  window.open(url, "_blank");
  return { success: true };
};
