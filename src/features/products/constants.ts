import type { ProductFormData } from "./types";

export const PRODUCT_CATEGORIES = [
  "Ração",
  "Acessórios",
  "Higiene",
  "Brinquedos",
  "Medicamentos",
  "Petiscos",
  "Camas e Casinhas",
  "Roupas",
  "Aquarismo",
  "Aves",
  "Outros",
];

export const PRODUCT_UNITS = [
  { value: "UN", label: "Unidade (UN)" },
  { value: "g", label: "Grama (g)" },
  { value: "kg", label: "Quilograma (kg)" },
  { value: "ml", label: "Mililitro (ml)" },
  { value: "L", label: "Litro (L)" },
  { value: "PAQ", label: "Pacote (PAQ)" },
  { value: "CX", label: "Caixa (CX)" },
];

export const DEFAULT_PRODUCT_FORM: ProductFormData = {
  name: "",
  sku: "",
  description: "",
  category: "",
  price_cents: 0,
  cost_cents: 0,
  quantity: 0,
  min_stock: 0,
  is_active: true,
  is_internal_use: false,
  unit: "UN",
};