/**
 * Tradutor universal e robusto de erros do Pagar.me (V5) e operadoras de cartão para Português.
 * Lida com:
 * 1. Objeto de erro da API do Pagar.me: { message: "The request is invalid.", errors: { card: ["The number field is not a valid card number"] } }
 * 2. Erros de Axios: err.response.data
 * 3. Strings com JSON embutido: "Erro ao salvar cartão: { ... }"
 * 4. Strings diretas de erro em inglês
 */
export function translatePagarmeError(err: any): string {
  if (!err) return "Erro ao processar dados do cartão. Verifique e tente novamente.";

  // Se for string, tenta fazer parse de JSON se contiver chaves
  if (typeof err === "string") {
    // Se contiver JSON dentro de uma string de erro (ex: "Erro ao salvar cartão: {...}")
    const jsonMatch = err.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      try {
        const parsed = JSON.parse(jsonMatch[0]);
        return translatePagarmeError(parsed);
      } catch {
        // ignora se não for JSON válido
      }
    }
    return translateSingleMessage(err);
  }

  // Se for erro do Axios
  if (err.response?.data) {
    return translatePagarmeError(err.response.data);
  }

  // 1. Tenta extrair primeiro de `errors` (onde estão os detalhes específicos dos campos)
  if (err.errors && typeof err.errors === "object") {
    for (const [field, messages] of Object.entries(err.errors)) {
      const msgsArray = Array.isArray(messages) ? messages : [messages];

      for (const rawMsg of msgsArray) {
        if (!rawMsg) continue;
        const translated = translateSingleMessage(String(rawMsg), field);
        if (translated) {
          return translated;
        }
      }
    }
  }

  // 2. Se não encontrou em `errors`, inspeciona `message`
  if (err.message && typeof err.message === "string") {
    const mainMsg = err.message.trim();
    // Se não for a mensagem genérica em inglês "The request is invalid."
    if (mainMsg.toLowerCase() !== "the request is invalid." && mainMsg.toLowerCase() !== "the request is invalid") {
      return translateSingleMessage(mainMsg);
    }
  }

  // 3. Fallback inteligente para dados de cartão
  return "Dados do cartão inválidos. Verifique os dados preenchidos.";
}

/**
 * Traduz uma mensagem individual e/ou campo específico para uma mensagem clara em português.
 */
function translateSingleMessage(rawMsg: string, field: string = ""): string {
  const m = rawMsg.toLowerCase().trim();
  const f = field.toLowerCase().trim();

  // 1. Validade / Expirado (testa ANTES de qualquer verificação de número)
  if (
    m.includes("expired") ||
    m.includes("expirado") ||
    m.includes("vencid") ||
    m.includes("expiration") ||
    m.includes("exp_month") ||
    m.includes("exp_year") ||
    f.includes("exp_month") ||
    f.includes("exp_year") ||
    f.includes("expiration")
  ) {
    if (m.includes("expired") || m.includes("expirad") || m.includes("vencid")) {
      return "Cartão expirado. Verifique a data de validade informada.";
    }
    return "Data de validade do cartão inválida.";
  }

  // 2. CVV / Código de segurança
  if (m.includes("cvv") || m.includes("security code") || f.includes("cvv")) {
    return "Código de segurança (CVV) inválido.";
  }

  // 3. Número do cartão
  if (
    m.includes("not a valid card number") ||
    m.includes("invalid card number") ||
    (m.includes("number") && !m.includes("phone")) ||
    f === "card.number" ||
    f === "number" ||
    f === "card_number"
  ) {
    return "Número de cartão inválido. Verifique os dígitos informados.";
  }

  // 4. Nome do titular
  if (
    m.includes("holder") ||
    m.includes("holder_name") ||
    f.includes("holder") ||
    f.includes("holder_name")
  ) {
    return "Nome impresso no cartão inválido ou incompleto.";
  }

  // 5. Bandeira
  if (m.includes("brand") || f.includes("brand")) {
    return "Bandeira do cartão não suportada ou inválida.";
  }

  // 6. Endereço / CEP
  if (m.includes("zip_code") || m.includes("zip") || m.includes("postal_code") || f.includes("zip")) {
    return "CEP do endereço de cobrança inválido.";
  }
  if (m.includes("address") || f.includes("address")) {
    return "Endereço de cobrança inválido.";
  }

  // 7. Documento / CPF / CNPJ
  if (m.includes("document") || m.includes("cpf") || m.includes("cnpj") || f.includes("document")) {
    return "CPF ou CNPJ do titular inválido.";
  }

  // 8. Saldo insuficiente
  if (m.includes("insufficient funds") || m.includes("saldo")) {
    return "Saldo ou limite insuficiente no cartão.";
  }

  // 9. Bloqueios do banco emissor
  if (m.includes("card blocked") || m.includes("bloquead")) {
    return "Cartão bloqueado. Entre em contato com seu banco emissor.";
  }

  // 10. Recusas e não autorização
  if (
    m.includes("card declined") ||
    m.includes("declined") ||
    m.includes("not authorized") ||
    m.includes("refused") ||
    m.includes("recusad") ||
    m.includes("acquirer")
  ) {
    return "Transação não autorizada pela operadora do cartão.";
  }

  // 11. Se for erro genérico
  if (m.includes("the request is invalid")) {
    return "Dados do cartão inválidos. Verifique os números digitados.";
  }

  return rawMsg;
}
