export function brDateToISO(date?: string | null) {
  if (!date) return undefined;

  const cleaned = date.replace(/\D/g, "");

  if (cleaned.length !== 8) return undefined;

  const day = cleaned.slice(0, 2);
  const month = cleaned.slice(2, 4);
  const year = cleaned.slice(4, 8);

  return `${year}-${month}-${day}`;
}

export function isoToBrDate(date?: string | null) {
  if (!date) return "";

  const cleaned = date.trim();

  const match = cleaned.match(/^(\d{4})-(\d{2})-(\d{2})$/);

  if (!match) return "";

  const [, year, month, day] = match;

  return `${day}/${month}/${year}`;
}