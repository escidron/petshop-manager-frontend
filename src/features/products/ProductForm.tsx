import { Box, FormControl, FormLabel } from "@mui/material";
import CustomTextField from "../../components/Textfield/CustomTextfield";

export type ProductFormData = {
  name: string;
  sku?: string;
  description?: string;
  category?: string;
  price: number;
  cost?: number;
  quantity: number;
  min_stock: number;
};

type Props = {
  product: ProductFormData;
  onChange: (data: ProductFormData) => void;
};

const ProductForm = ({ product, onChange }: Props) => {
  const setFieldValue = <K extends keyof ProductFormData>(
    field: K,
    value: ProductFormData[K],
  ) => {
    onChange({
      ...product,
      [field]: value,
    });
  };

  const handleChange =
    (field: keyof ProductFormData) =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setFieldValue(field, e.target.value);
    };

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
      <FormControl>
        <FormLabel sx={{ color: "text.primary", mb: 0.5 }}>Codigo</FormLabel>

        <CustomTextField
          value={product.sku}
          onChange={handleChange("sku")}
          required
        />
      </FormControl>

      <FormControl>
        <FormLabel sx={{ color: "text.primary", mb: 0.5 }}>Categoria</FormLabel>

        <CustomTextField
          value={product.category}
          onChange={handleChange("category")}
          required
        />
      </FormControl>

      <FormControl>
        <FormLabel sx={{ color: "text.primary", mb: 0.5 }}>Nome</FormLabel>

        <CustomTextField
          value={product.name}
          onChange={handleChange("name")}
          required
        />
      </FormControl>

      <FormControl>
        <FormLabel sx={{ color: "text.primary", mb: 0.5 }}>Descrição</FormLabel>

        <CustomTextField
          multiline
          rows={4}
          value={product.description}
          onChange={handleChange("description")}
          required
        />
      </FormControl>
      <Box sx={{ display: "flex", justifyContent: "space-between", gap: 2 }}>
        <FormControl sx={{ width: "50%" }}>
          <FormLabel sx={{ color: "text.primary", mb: 0.5 }}>Custo</FormLabel>

          <CustomTextField
            type="number"
            value={product.cost}
            onChange={handleChange("cost")}
            required
          />
        </FormControl>
        <FormControl sx={{ width: "50%" }}>
          <FormLabel sx={{ color: "text.primary", mb: 0.5 }}>Preço</FormLabel>

          <CustomTextField
            value={product.price}
            onChange={handleChange("price")}
            required
          />
        </FormControl>
      </Box>
      <Box sx={{ display: "flex", justifyContent: "space-between", gap: 2 }}>
        <FormControl sx={{ width: "50%" }}>
          <FormLabel sx={{ color: "text.primary", mb: 0.5 }}>
            Quantidade
          </FormLabel>

          <CustomTextField
            type="number"
            value={product.quantity}
            onChange={handleChange("quantity")}
            required
            sx={{ width: "100%" }}
          />
        </FormControl>
        <FormControl sx={{ width: "50%" }}>
          <FormLabel sx={{ color: "text.primary", mb: 0.5 }}>
            Estoque Minimo
          </FormLabel>

          <CustomTextField
            value={product.min_stock}
            onChange={handleChange("min_stock")}
            required
          />
        </FormControl>
      </Box>
    </Box>
  );
};

export default ProductForm;
