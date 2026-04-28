import type { Product, ProductFormData } from "./types";

export const productToFormData = (product: Product): ProductFormData => {
  return {
    name: product.name,
    sku: product.sku || "",
    description: product.description || "",
    category: product.category || "",
    price_cents: product.price_cents,
    cost_cents: product.cost_cents || 0,
    quantity: product.quantity,
    min_stock: product.min_stock,
    barcode: product.barcode || "",
    ncm: product.ncm || "",
    cest: product.cest || "",
    cfop: product.cfop || "",
    csosn: product.csosn || "",
    cst_pis: product.cst_pis || "",
    cst_cofins: product.cst_cofins || "",
    supplier_id: product.supplier_id ?? null,
    is_active: product.is_active,
  };
};
