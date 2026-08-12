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
import type { Service } from "../tenant_services/types";
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
      pet_ids: defaultPetId ? [defaultPetId] : [],
      package_id: defaultPackageId ?? 0,
    },
  });

  const [showAllPackages, setShowAllPackages] = useState(false);
  const [packageLimit, setPackageLimit] = useState(20);
  const watchedPetIds = watch("pet_ids");
  const watchedPackageId = watch("package_id");

  useEffect(() => {
    clearErrors("package_id");
  }, [watchedPetIds, watchedPackageId, clearErrors]);

  const selectedPets = useMemo(
    () => pets.filter((p) => watchedPetIds.includes(p.id)),
    [pets, watchedPetIds]
  );

  const getIncompatibleServices = (pkg: Package, pet?: Pet) => {
    if (!pet) return [];
    return pkg.items
      .filter((item) => item.service)
      .map((item) => item.service!)
      .filter((s) => !isServiceCompatibleWithPet(s, pet));
  };

  const getIncompatibilitiesForPackage = (pkg: Package, selPets: Pet[]) => {
    const issues: { pet: Pet; services: Service[] }[] = [];
    selPets.forEach((p) => {
      const inc = getIncompatibleServices(pkg, p);
      if (inc.length > 0) issues.push({ pet: p, services: inc });
    });
    return issues;
  };

  const compatiblePackages = useMemo(() => {
    return packages.filter((pkg) => {
      if (!pkg.is_active) return false;
      if (showAllPackages) return true;
      const issues = getIncompatibilitiesForPackage(pkg, selectedPets);
      return issues.length === 0;
    });
  }, [packages, selectedPets, showAllPackages]);

  const handleFormSubmit = (data: ClientPackageSellFormData) => {
    const formPets = pets.filter((p) => data.pet_ids.includes(p.id));
    const pkg = packages.find((p) => p.id === data.package_id);
    if (!showAllPackages && formPets.length > 0 && pkg) {
      const issues = getIncompatibilitiesForPackage(pkg, formPets);
      if (issues.length > 0) {
        const message = issues
          .map((i) => `Incompatível com ${i.pet.name}: ${i.services.map((s) => `${s.name}${s.size ? ` (${s.size})` : ""}`).join(", ")}`)
          .join(" | ");
        setError("package_id", {
          type: "manual",
          message,
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
        <FormLabel sx={{ color: "text.primary", mb: 0.5 }}>Para quais pets é este pacote?</FormLabel>
        <Controller
          name="pet_ids"
          control={control}
          render={({ field, fieldState }) => (
            <Autocomplete<Pet, true>
              multiple
              options={pets}
              size="small"
              value={pets.filter((p) => field.value.includes(p.id))}
              getOptionLabel={(o) => `${o.name} (${o.breed || "Sem Raça"} • ${o.size || "?"})`}
              isOptionEqualToValue={(o, v) => o.id === v.id}
              onChange={(_, val) => field.onChange(val.map((v) => v.id))}
              renderInput={(params) => (
                <TextField
                  {...params}
                  placeholder="Selecionar pets"
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
              filterOptions={(options, state) => {
                const input = state.inputValue.toLowerCase();
                return options.filter((option) =>
                  option.name.toLowerCase().includes(input)
                ).slice(0, packageLimit);
              }}
              onInputChange={(_, __, reason) => {
                if (reason === "input") setPackageLimit(20);
              }}
              ListboxProps={{
                onScroll: (event: React.SyntheticEvent) => {
                  const listboxNode = event.currentTarget;
                  if (listboxNode.scrollTop + listboxNode.clientHeight >= listboxNode.scrollHeight - 10) {
                    setPackageLimit((prev) => prev + 20);
                  }
                }
              }}
              size="small"
              value={packages.find((p) => p.id === field.value) ?? null}
              getOptionLabel={(o) => o.name}
              isOptionEqualToValue={(o, v) => o.id === v.id}
              onChange={(_, v) => field.onChange(v?.id ?? 0)}
              renderOption={(props, option) => {
                const { ...rest } = props;
                const issues = getIncompatibilitiesForPackage(option, selectedPets);
                const hasIncompatible = issues.length > 0;

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
                        {hasIncompatible && issues.map((issue) => (
                          <Typography key={issue.pet.id} variant="caption" color="error.main" sx={{ display: 'block', mt: 0.5, fontWeight: 600 }}>
                            {issue.pet.name}: {issue.services.map((s) => `${s.name}${s.size ? ` (${s.size})` : ""}`).join(", ")}
                          </Typography>
                        ))}
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

