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

export const DEFAULT_PRODUCT_FORM: ProductFormData = {
  name: "",
  sku: "",
  description: "",
  category: "",
  price_cents: 0,
  cost_cents: 0,
  quantity: 0,
  min_stock: 0,
};