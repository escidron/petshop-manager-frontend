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
import { useQuery } from "@tanstack/react-query";
import type { Pet } from "../pets/types";
import type { Service } from "../tenant_services/types";
import type { AppointmentFormData } from "./types";
import { getServicesForPet } from "../../utils/serviceMatcher";
import { formatPrice, formatServiceLabel } from "../../utils/formatServiceLabel";
import { listClientPackagesByPet } from "../../api/services/client_packages";

type Props = {
  index: number;
  control: Control<AppointmentFormData>;
  errors: any;
  setValue: UseFormSetValue<AppointmentFormData>;
  watchedClientId: number | null | undefined;
  pets: Pet[];
  services: Service[];
  items: { pet_id: number; service_ids: number[] }[];
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
  onCreatePet,
  onCreateService,
  onRemove,
  isOnlyPet,
}: Props) {
  const [showAllServices, setShowAllServices] = useState(false);
  const itemError = errors.items?.[index];

  // Watch the selected pet_id for this specific row using the items prop
  const currentPetId = items[index]?.pet_id;
  const currentPet = pets?.find((p) => p.id === currentPetId);

  // Fetch packages for the selected pet
  const { data: petPackages = [] } = useQuery({
    queryKey: ["clientPackages", "pet", currentPetId],
    queryFn: () => listClientPackagesByPet(currentPetId!),
    enabled: !!currentPetId,
  });

  // Calculate available packages and credits
  const packageCreditsByServiceId = useMemo(() => {
    const map = new Map<number, number>();
    petPackages.forEach((pkg) => {
      // Only consider active unexpired packages
      if (!pkg.is_active) return;
      pkg.credits.forEach((credit) => {
        if (credit.service_id && credit.remaining_qty > 0) {
          const current = map.get(credit.service_id) || 0;
          map.set(credit.service_id, current + credit.remaining_qty);
        }
      });
    });
    return map;
  }, [petPackages]);

  // Derived filtered services (matching size/coat type + prioritizing packages)
  const sortedAndFilteredServices = useMemo(() => {
    let baseServices = (services ?? []).filter((s) => s.is_active);
    if (!showAllServices) {
      baseServices = getServicesForPet(baseServices, currentPet);
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
  }, [services, currentPet, showAllServices, packageCreditsByServiceId]);

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
                noOptionsText="Nenhum pet cadastrado"
                size="small"
                value={pets?.find((p) => p.id === field.value) ?? null}
                getOptionLabel={(option) => option.name}
                isOptionEqualToValue={(o, v) => o.id === v.id}
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
          sx={{ width: "150px", height: "40px", flexShrink: 0 }}
          startIcon={<Plus size={14} />}
          onClick={() => onCreatePet?.(index, watchedClientId ?? 0)}
        >
          Criar Pet
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
                );
              }}
              disableCloseOnSelect
              size="small"
              value={
                sortedAndFilteredServices.filter((s) => field.value?.includes(s.id)) ?? []
              }
              getOptionLabel={(option) => formatServiceLabel(option)}
              isOptionEqualToValue={(option, value) => option.id === value.id}
              slotProps={{ paper: { sx: { width: "635px", maxWidth: "90vw" } } }}
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
                      backgroundColor: isPackageCovered
                        ? "rgba(46, 125, 50, 0.04)"
                        : "transparent",
                    }}
                  >
                    <Box
                      style={{ display: "flex", alignItems: "center", gap: 8 }}
                    >
                      <Checkbox
                        checked={selected}
                        disableRipple
                        sx={{ color: "primary.main", py: 0 }}
                      />
                      <Box>
                        <Typography sx={{ fontWeight: 500, fontSize: "0.95rem" }}>
                          {formatServiceLabel(option)}
                        </Typography>
                        {option.description && (
                          <div
                            style={{
                              fontSize: 12,
                              opacity: 0.6,
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              display: "-webkit-box",
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: "vertical",
                              lineHeight: "1.3",
                              maxWidth: "380px",
                              wordBreak: "break-word",
                            }}
                          >
                            {option.description}
                          </div>
                        )}
                      </Box>
                    </Box>
                    
                    {isPackageCovered ? (
                      <Box
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          gap: 0.5,
                          color: "success.main",
                          fontWeight: 700,
                          fontSize: "0.8rem",
                        }}
                      >
                        Pacote ({remainingQty}x)
                      </Box>
                    ) : (
                      <Box style={{ fontWeight: 600 }}>
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
          sx={{ width: "150px", height: "40px", flexShrink: 0 }}
          startIcon={<Plus size={14} />}
          onClick={() => onCreateService?.(index)}
        >
          Criar Serviço
        </Button>
      </Box>

      <FormControlLabel
        sx={{ width: "fit-content" }}
        control={
          <Checkbox
            disableRipple
            size="small"
            sx={{ color: "primary.main", py: 0 }}
            checked={showAllServices}
            onChange={(e) => setShowAllServices(e.target.checked)}
          />
        }
        label="Mostrar todos os serviços (ignorar porte e pelagem)"
        slotProps={{ typography: { sx: { fontSize: 12 } } }}
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
