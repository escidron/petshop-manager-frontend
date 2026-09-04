const PAYMENT_METHOD_LABEL: Record<string, string> = {
  pix: "Pix",
  credit_card: "Cartão de Crédito",
  debit_card: "Cartão de Débito",
  money: "Dinheiro",
  other: "Outro",
  package: "Pacote",
  multiple: "Múltiplos Métodos",
};

export function formatPaymentMethod(method: string): string {
  return PAYMENT_METHOD_LABEL[method] ?? method;
}
