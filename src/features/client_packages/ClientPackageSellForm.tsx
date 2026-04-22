import {
  Autocomplete,
  Box,
  FormControl,
  FormLabel,
  TextField,
  Typography,
} from "@mui/material";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { clientPackageSellSchema, type ClientPackageSellFormData } from "./schemas";
import { Button } from "../../components/Button/Button";
import type { Pet } from "../pets/types";
import type { Package } from "../packages/types";
import { formatPrice, formatServiceLabel } from "../../utils/formatServiceLabel";

type Props = {
  pets: Pet[];
  packages: Package[];
  defaultPetId?: number;
  onSubmit: (data: ClientPackageSellFormData) => void;
  loading?: boolean;
};

export default function ClientPackageSellForm({
  pets,
  packages,
  defaultPetId,
  onSubmit,
  loading,
}: Props) {
  const { control, handleSubmit } = useForm<ClientPackageSellFormData>({
    resolver: zodResolver(clientPackageSellSchema),
    defaultValues: {
      pet_id: defaultPetId ?? 0,
      package_id: 0,
    },
  });

  return (
    <Box
      component="form"
      onSubmit={handleSubmit(onSubmit)}
      sx={{ display: "flex", flexDirection: "column", gap: 2 }}
    >
      <FormControl>
        <FormLabel sx={{ color: "text.primary", mb: 0.5 }}>Pet</FormLabel>
        <Controller
          name="pet_id"
          control={control}
          render={({ field, fieldState }) => (
            <Autocomplete<Pet>
              options={pets}
              size="small"
              value={pets.find((p) => p.id === field.value) ?? null}
              getOptionLabel={(o) => o.name}
              isOptionEqualToValue={(o, v) => o.id === v.id}
              onChange={(_, v) => field.onChange(v?.id ?? 0)}
              renderInput={(params) => (
                <TextField
                  {...params}
                  placeholder="Selecionar pet"
                  error={!!fieldState.error}
                  helperText={fieldState.error?.message}
                />
              )}
            />
          )}
        />
      </FormControl>

      <FormControl>
        <FormLabel sx={{ color: "text.primary", mb: 0.5 }}>Pacote</FormLabel>
        <Controller
          name="package_id"
          control={control}
          render={({ field, fieldState }) => (
            <Autocomplete<Package>
              options={packages.filter((p) => p.is_active)}
              size="small"
              value={packages.find((p) => p.id === field.value) ?? null}
              getOptionLabel={(o) => o.name}
              isOptionEqualToValue={(o, v) => o.id === v.id}
              onChange={(_, v) => field.onChange(v?.id ?? 0)}
              renderOption={(props, option) => {
                const { ...rest } = props;
                return (
                  <li {...rest} key={option.id}>
                    <Box
                      sx={{
                        display: "flex",
                        justifyContent: "space-between",
                        width: "100%",
                      }}
                    >
                      <Box>
                        <Typography variant="body2" fontWeight={700} color="primary">
                          {option.name}
                        </Typography>
                        <Typography variant="caption" color="text.primary" sx={{ display: 'block', mt: 0.5 }}>
                          {option.items.map(item => {
                            const name = item.service 
                              ? formatServiceLabel(item.service) 
                              : item.product?.name;
                            return `${item.quantity}x ${name || 'Item'}`;
                          }).join(", ")}
                        </Typography>
                      </Box>
                      <Typography variant="body2" fontWeight={600}>
                        {formatPrice(option.price_cents)}
                      </Typography>
                    </Box>
                  </li>
                );
              }}
              renderInput={(params) => (
                <TextField
                  {...params}
                  placeholder="Selecionar pacote"
                  error={!!fieldState.error}
                  helperText={fieldState.error?.message}
                />
              )}
            />
          )}
        />
      </FormControl>

      <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
        <Button type="submit" loading={loading}>
          Vender Pacote
        </Button>
      </Box>
    </Box>
  );
}
