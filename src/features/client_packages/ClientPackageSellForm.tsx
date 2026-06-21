import {
  Autocomplete,
  Box,
  FormControl,
  FormLabel,
  TextField,
  Typography,
  FormControlLabel,
  Checkbox,
} from "@mui/material";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { clientPackageSellSchema, type ClientPackageSellFormData } from "./schemas";
import { Button } from "../../components/Button/Button";
import type { Pet } from "../pets/types";
import type { Package } from "../packages/types";
import { formatPrice, formatServiceLabel } from "../../utils/formatServiceLabel";
import { isServiceCompatibleWithPet } from "../../utils/serviceMatcher";
import { useEffect, useMemo, useState } from "react";

type Props = {
  pets: Pet[];
  packages: Package[];
  defaultPetId?: number;
  defaultPackageId?: number;
  onSubmit: (data: ClientPackageSellFormData) => void;
  loading?: boolean;
};

export default function ClientPackageSellForm({
  pets,
  packages,
  defaultPetId,
  defaultPackageId,
  onSubmit,
  loading,
}: Props) {
  const { control, handleSubmit, watch, setError, clearErrors, formState: { errors } } = useForm<ClientPackageSellFormData>({
    resolver: zodResolver(clientPackageSellSchema),
    defaultValues: {
      pet_id: defaultPetId ?? 0,
      package_id: defaultPackageId ?? 0,
    },
  });

  const [showAllPackages, setShowAllPackages] = useState(false);
  const watchedPetId = watch("pet_id");
  const watchedPackageId = watch("package_id");

  useEffect(() => {
    clearErrors("package_id");
  }, [watchedPetId, watchedPackageId, clearErrors]);

  const pet = pets.find((p) => p.id === watchedPetId);

  const getIncompatibleServices = (pkg: Package, pet?: Pet) => {
    if (!pet) return [];
    return pkg.items
      .filter((item) => item.service)
      .map((item) => item.service!)
      .filter((s) => !isServiceCompatibleWithPet(s, pet));
  };

  const compatiblePackages = useMemo(() => {
    return packages.filter((pkg) => {
      if (!pkg.is_active) return false;
      if (showAllPackages) return true;
      const incompatible = getIncompatibleServices(pkg, pet);
      return incompatible.length === 0;
    });
  }, [packages, pet, showAllPackages]);

  const handleFormSubmit = (data: ClientPackageSellFormData) => {
    const selectedPet = pets.find((p) => p.id === data.pet_id);
    const pkg = packages.find((p) => p.id === data.package_id);
    if (!showAllPackages && selectedPet && pkg) {
      const incompatible = getIncompatibleServices(pkg, selectedPet);
      if (incompatible.length > 0) {
        setError("package_id", {
          type: "manual",
          message: `Incompatível com ${selectedPet.name}: ${incompatible.map((s) => `${s.name}${s.size ? ` (${s.size})` : ""}`).join(", ")}`,
        });
        return;
      }
    }
    onSubmit(data);
  };

  return (
    <Box
      component="form"
      onSubmit={handleSubmit(handleFormSubmit)}
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
              options={compatiblePackages}
              size="small"
              value={packages.find((p) => p.id === field.value) ?? null}
              getOptionLabel={(o) => o.name}
              isOptionEqualToValue={(o, v) => o.id === v.id}
              onChange={(_, v) => field.onChange(v?.id ?? 0)}
              renderOption={(props, option) => {
                const { ...rest } = props;
                const incompatible = getIncompatibleServices(option, pet);
                const hasIncompatible = incompatible.length > 0;

                return (
                  <li {...rest} key={option.id} style={{ opacity: hasIncompatible ? 0.65 : 1 }}>
                    <Box
                      sx={{
                        display: "flex",
                        justifyContent: "space-between",
                        width: "100%",
                        alignItems: "center",
                      }}
                    >
                      <Box sx={{ flex: 1, mr: 2 }}>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                          <Typography variant="body2" fontWeight={700} color="primary">
                            {option.name}
                          </Typography>
                          {hasIncompatible && (
                            <Typography
                              variant="caption"
                              color="error.main"
                              sx={{
                                bgcolor: "#fee2e2",
                                px: 1,
                                py: 0.2,
                                borderRadius: 1,
                                fontWeight: 700,
                                fontSize: "0.65rem",
                                border: "1px solid",
                                borderColor: "#fecaca",
                              }}
                            >
                              Incompatível
                            </Typography>
                          )}
                        </Box>
                        <Typography variant="caption" color="text.primary" sx={{ display: 'block', mt: 0.5 }}>
                          {option.items.map(item => {
                            const name = item.service 
                              ? formatServiceLabel(item.service) 
                              : item.product?.name;
                            return `${item.quantity}x ${name || 'Item'}`;
                          }).join(", ")}
                        </Typography>
                        {hasIncompatible && (
                          <Typography variant="caption" color="error.main" sx={{ display: 'block', mt: 0.5, fontWeight: 600 }}>
                            Incompatível: {incompatible.map((s) => `${s.name}${s.size ? ` (${s.size})` : ""}`).join(", ")}
                          </Typography>
                        )}
                      </Box>
                      <Typography variant="body2" fontWeight={600} color="text.primary">
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
                  error={!!fieldState.error || !!errors.package_id}
                  helperText={fieldState.error?.message || errors.package_id?.message}
                />
              )}
            />
          )}
        />
      </FormControl>

      <FormControlLabel
        control={
          <Checkbox
            disableRipple
            size="small"
            checked={showAllPackages}
            onChange={(e) => setShowAllPackages(e.target.checked)}
            sx={{ color: "primary.main", py: 0 }}
          />
        }
        label={
          <Typography variant="body2" color="text.primary" sx={{ userSelect: "none" }}>
            Mostrar todos os pacotes (incluindo incompatíveis)
          </Typography>
        }
        sx={{ mt: -1 }}
      />

      <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
        <Button type="submit" loading={loading}>
          Vender Pacote
        </Button>
      </Box>
    </Box>
  );
}

