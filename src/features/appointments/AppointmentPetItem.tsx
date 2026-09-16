import { useMemo, useState } from "react";
import {
  Autocomplete,
  Box,
  Checkbox,
  FormControlLabel,
  TextField,
  Typography,
} from "@mui/material";
import { Button } from "../../components/Button/Button";
import { Plus, Trash } from "lucide-react";
import { Controller, type Control, type UseFormSetValue } from "react-hook-form";
import type { Pet } from "../pets/types";
import type { Service } from "../tenant_services/types";
import type { AppointmentFormData } from "./types";
import { getServicesForPet } from "../../utils/serviceMatcher";
import { formatPrice, formatServiceLabel } from "../../utils/formatServiceLabel";
import type { ClientPackage } from "../client_packages/types";

type Props = {
  index: number;
  control: Control<AppointmentFormData>;
  errors: any;
  setValue: UseFormSetValue<AppointmentFormData>;
  watchedClientId: number | null | undefined;
  pets: Pet[];
  services: Service[];
  items: { pet_id: number; service_ids: number[] }[];
  clientPackages: ClientPackage[];
  onCreatePet?: (index: number, clientId: number) => void;
  onCreateService?: (index: number) => void;
  onRemove: () => void;
  isOnlyPet: boolean;
};

export default function AppointmentPetItem({
  index,
  control,
  errors,
  setValue,
  watchedClientId,
  pets,
  services,
  items,
  clientPackages,
  onCreatePet,
  onCreateService,
  onRemove,
  isOnlyPet,
}: Props) {
  const [petListLimit, setPetListLimit] = useState(20);
  const [serviceListLimit, setServiceListLimit] = useState(20);
  const [showAllServices, setShowAllServices] = useState(false);
  const itemError = errors.items?.[index];

  // Watch the selected pet_id for this specific row using the items prop
  const currentPetId = items[index]?.pet_id;
  const currentPet = pets?.find((p) => p.id === currentPetId);

  // Calculate available packages and credits dynamically
  const packageCreditsByServiceId = useMemo(() => {
    // 1. Initialize global available credits map: credit.id -> remaining_qty
    const globalCredits = new Map<number, number>();
    clientPackages.forEach((pkg) => {
      if (!pkg.is_active) return;
      pkg.credits.forEach((credit) => {
        if (credit.service_id && credit.remaining_qty > 0) {
          globalCredits.set(credit.id, credit.remaining_qty);
        }
      });
    });

    // 2. Simulate consumption for all pets EXCEPT this one, up to the current index
    for (let i = 0; i < index; i++) {
      const prevItem = items[i];
      if (!prevItem || !prevItem.pet_id) continue;
      
      const prevPetPkgs = clientPackages.filter((pkg) => pkg.is_active && pkg.pets.some((p) => p.id === prevItem.pet_id));
      const prevServices = prevItem.service_ids || [];
      
      prevServices.forEach((serviceId) => {
        for (const pkg of prevPetPkgs) {
          const credit = pkg.credits.find((c) => c.service_id === serviceId && globalCredits.has(c.id) && globalCredits.get(c.id)! > 0);
          if (credit) {
            globalCredits.set(credit.id, globalCredits.get(credit.id)! - 1);
            break; 
          }
        }
      });
    }

    // 3. Sum up what's available for THIS pet
    const map = new Map<number, number>();
    const thisPetPkgs = clientPackages.filter((pkg) => pkg.is_active && pkg.pets.some((p) => p.id === currentPetId));
    
    thisPetPkgs.forEach((pkg) => {
      pkg.credits.forEach((credit) => {
        if (credit.service_id) {
          const available = globalCredits.get(credit.id) || 0;
          if (available > 0) {
            const current = map.get(credit.service_id) || 0;
            map.set(credit.service_id, current + available);
          }
        }
      });
    });
    
    return map;
  }, [clientPackages, items, index, currentPetId]);

  // Derived filtered services (matching size/coat type + prioritizing packages)
  const sortedAndFilteredServices = useMemo(() => {
    let baseServices = (services ?? []).filter((s) => s.is_active);
    if (!showAllServices) {
      const selectedIds = items?.[index]?.service_ids ?? [];
      const compatibleServices = getServicesForPet(baseServices, currentPet);
      const selectedIncompatible = baseServices.filter(
        (s) => selectedIds.includes(s.id) && !compatibleServices.some((c) => c.id === s.id)
      );
      baseServices = [...compatibleServices, ...selectedIncompatible];
    }

    // Move package-covered services to the top
    const covered: Service[] = [];
    const notCovered: Service[] = [];

    baseServices.forEach((s) => {
      if (packageCreditsByServiceId.has(s.id)) {
        covered.push(s);
      } else {
        notCovered.push(s);
      }
    });

    return [...covered, ...notCovered];
  }, [services, currentPet, showAllServices, packageCreditsByServiceId, items, index]);

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        gap: 1,
        mb: 2,
        p: 2,
        border: "1px solid #eee",
        borderRadius: 2,
      }}
    >
      {/* PET */}
      <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
        <Controller
          name={`items.${index}.pet_id`}
          control={control}
          render={({ field }) => {
            const selectedPetIds =
              items?.map((i) => i.pet_id).filter((id) => id && id !== field.value) ?? [];
            const availablePets =
              pets?.filter(
                (pet) =>
                  !selectedPetIds.includes(pet.id) &&
                  (!pet.is_deceased || pet.id === field.value)
              ) ?? [];
            return (
              <Autocomplete<Pet>
                sx={{ flex: 1 }}
                options={availablePets}
                filterOptions={(options, state) => {
                  const input = state.inputValue.toLowerCase();
                  return options
                    .filter((option) => option.name.toLowerCase().includes(input))
                    .slice(0, petListLimit);
                }}
                noOptionsText="Nenhum pet cadastrado"
                size="small"
                value={pets?.find((p) => p.id === field.value) ?? null}
                getOptionLabel={(option) => option.name}
                isOptionEqualToValue={(o, v) => o.id === v.id}
                onInputChange={(_, __, reason) => {
                  if (reason === 'input') setPetListLimit(20);
                }}
                ListboxProps={{
                  onScroll: (event: React.SyntheticEvent) => {
                    const listboxNode = event.currentTarget;
                    if (
                      listboxNode.scrollTop + listboxNode.clientHeight >=
                      listboxNode.scrollHeight - 10
                    ) {
                      setPetListLimit((prev) => prev + 20);
                    }
                  }
                }}
                renderOption={(props, option) => {
                  const sizeText = option.size ? `Porte ${option.size}` : null;
                  const details = [option.breed, sizeText].filter(Boolean).join(" - ");
                  
                  return (
                    <li {...props} key={option.id}>
                      <Box sx={{ display: "flex", flexDirection: "column" }}>
                        <Typography variant="body2" color="text.primary">{option.name}</Typography>
                        <Typography variant="caption" color="text.primary">
                          {details || "Sem raça"}
                        </Typography>
                      </Box>
                    </li>
                  );
                }}
                onChange={(_, value) => {
                  field.onChange(value?.id ?? 0);
                  setValue(`items.${index}.service_ids`, []);
                }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    placeholder={
                      watchedClientId ? "Selecionar pet" : "Selecione um cliente primeiro"
                    }
                  />
                )}
              />
            );
          }}
        />
        <Button
          variant="outlined"
          sx={{
            minWidth: { xs: "40px", sm: "120px" },
            width: { xs: "40px", sm: "auto" },
            height: "40px",
            p: { xs: 0, sm: "6px 16px" },
            flexShrink: 0,
          }}
          onClick={() => onCreatePet?.(index, watchedClientId ?? 0)}
          title="Criar Pet"
        >
          <Plus size={18} />
          <Box component="span" sx={{ display: { xs: "none", sm: "inline" }, ml: 0.5 }}>
            Criar Pet
          </Box>
        </Button>
      </Box>

      {/* SERVIÇOS */}
      <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
        <Controller
          name={`items.${index}.service_ids`}
          control={control}
          render={({ field }) => (
            <Autocomplete
              sx={{
                flex: 1,
                "& .MuiAutocomplete-tag": {
                  maxWidth: "150px",
                  textOverflow: "ellipsis",
                  overflow: "hidden",
                  whiteSpace: "nowrap",
                },
              }}
              disabled={!currentPet}
              noOptionsText="Nenhum serviço cadastrado"
              multiple
              options={sortedAndFilteredServices}
              filterOptions={(options, state) => {
                const input = state.inputValue.toLowerCase();
                return options.filter((option) =>
                  `${option.name} ${option.size ?? ""} ${option.coat_type ?? ""}`
                    .toLowerCase()
                    .includes(input)
                ).slice(0, serviceListLimit);
              }}
              disableCloseOnSelect
              size="small"
              value={
                (services ?? []).filter((s) => field.value?.includes(s.id)) ?? []
              }
              getOptionLabel={(option) => formatServiceLabel(option)}
              isOptionEqualToValue={(option, value) => option.id === value.id}
              onInputChange={(_, __, reason) => {
                if (reason === 'input') setServiceListLimit(20);
              }}
              ListboxProps={{
                sx: {
                  maxHeight: "280px",
                },
                onScroll: (event: React.SyntheticEvent) => {
                  const listboxNode = event.currentTarget;
                  if (
                    listboxNode.scrollTop + listboxNode.clientHeight >=
                    listboxNode.scrollHeight - 10
                  ) {
                    setServiceListLimit((prev) => prev + 20);
                  }
                },
              }}
              slotProps={{
                paper: {
                  sx: {
                    borderRadius: 2,
                    boxShadow: "0 6px 24px rgba(0,0,0,0.12)",
                    overflow: "hidden",
                  },
                },
              }}
              onChange={(_, value) => field.onChange(value.map((v) => v.id))}
              renderOption={(props, option, { selected }) => {
                const { ...rest } = props;
                const remainingQty = packageCreditsByServiceId.get(option.id) || 0;
                const isPackageCovered = remainingQty > 0;

                return (
                  <li
                    {...rest}
                    key={option.id}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      width: "100%",
                      padding: "8px 12px",
                      backgroundColor: isPackageCovered
                        ? "rgba(46, 125, 50, 0.04)"
                        : "transparent",
                    }}
                  >
                    <Box
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        minWidth: 0,
                        flex: 1,
                        overflow: "hidden",
                      }}
                    >
                      <Checkbox
                        checked={selected}
                        disableRipple
                        sx={{ color: "primary.main", p: 0 }}
                      />
                      <Box sx={{ minWidth: 0, overflow: "hidden" }}>
                        <Typography
                          noWrap
                          sx={{
                            fontWeight: 500,
                            fontSize: { xs: "0.85rem", sm: "0.9rem" },
                            lineHeight: 1.2,
                          }}
                        >
                          {formatServiceLabel(option)}
                        </Typography>
                        {option.description && (
                          <Typography
                            variant="caption"
                            noWrap
                            sx={{
                              fontSize: "0.72rem",
                              color: "text.primary",
                              opacity: 0.6,
                              display: "block",
                            }}
                          >
                            {option.description}
                          </Typography>
                        )}
                      </Box>
                    </Box>
                    
                    {isPackageCovered ? (
                      <Box
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          color: "success.main",
                          fontWeight: 700,
                          fontSize: "0.75rem",
                          whiteSpace: "nowrap",
                          ml: 1,
                          flexShrink: 0,
                        }}
                      >
                        Pacote ({remainingQty}x)
                      </Box>
                    ) : (
                      <Box
                        sx={{
                          fontWeight: 700,
                          fontSize: { xs: "0.82rem", sm: "0.88rem" },
                          color: "text.primary",
                          whiteSpace: "nowrap",
                          ml: 1,
                          flexShrink: 0,
                        }}
                      >
                        {formatPrice(option.price_cents)}
                      </Box>
                    )}
                  </li>
                );
              }}
              renderInput={(params) => (
                <TextField
                  {...params}
                  placeholder={currentPet ? "Selecionar serviços" : "Selecione um pet primeiro"}
                  disabled={!currentPet}
                  error={!!itemError?.service_ids}
                  helperText={itemError?.service_ids?.message}
                />
              )}
            />
          )}
        />
        <Button
          variant="outlined"
          sx={{
            minWidth: { xs: "40px", sm: "130px" },
            width: { xs: "40px", sm: "auto" },
            height: "40px",
            p: { xs: 0, sm: "6px 16px" },
            flexShrink: 0,
          }}
          onClick={() => onCreateService?.(index)}
          title="Criar Serviço"
        >
          <Plus size={18} />
          <Box component="span" sx={{ display: { xs: "none", sm: "inline" }, ml: 0.5 }}>
            Criar Serviço
          </Box>
        </Button>
      </Box>

      <FormControlLabel
        sx={{ width: "fit-content", my: 0 }}
        control={
          <Checkbox
            disableRipple
            size="small"
            sx={{ color: "primary.main", py: 0 }}
            checked={showAllServices}
            onChange={(e) => setShowAllServices(e.target.checked)}
          />
        }
        label="Mostrar todos os serviços"
        slotProps={{
          typography: {
            sx: {
              fontSize: { xs: "0.72rem", sm: "0.78rem" },
              color: "text.primary",
              opacity: 0.85,
              whiteSpace: "nowrap",
            },
          },
        }}
      />

      {!isOnlyPet && (
        <Button
          startIcon={<Trash size={15} />}
          variant="outlined"
          color="error"
          sx={{ width: "fit-content", mx: "auto" }}
          onClick={onRemove}
        >
          Remover Pet do Agendamento
        </Button>
      )}
    </Box>
  );
}
