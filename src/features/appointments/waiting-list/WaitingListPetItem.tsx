import { useMemo, useState } from "react";
import {
  Autocomplete,
  Box,
  Checkbox,
  FormControlLabel,
  TextField,
  Typography,
} from "@mui/material";
import { Button } from "../../../components/Button/Button";
import { Plus, Trash } from "lucide-react";
import { Controller, type Control, type UseFormSetValue } from "react-hook-form";
import type { Pet } from "../../pets/types";
import type { Service } from "../../tenant_services/types";
import { getServicesForPet } from "../../../utils/serviceMatcher";
import { formatPrice, formatServiceLabel } from "../../../utils/formatServiceLabel";

type Props = {
  index: number;
  control: Control<any>;
  setValue: UseFormSetValue<any>;
  pets: Pet[];
  services: Service[];
  items: { pet_id: number; service_ids: number[] }[];
  onCreatePet?: () => void;
  onCreateService?: () => void;
  onRemove: () => void;
  isOnlyPet: boolean;
};

export default function WaitingListPetItem({
  index,
  control,
  setValue,
  pets,
  services,
  items,
  onCreatePet,
  onCreateService,
  onRemove,
  isOnlyPet,
}: Props) {
  const [showAllServices, setShowAllServices] = useState(false);

  const currentPetId = items[index]?.pet_id;
  const currentPet = pets?.find((p) => p.id === currentPetId);

  const sortedAndFilteredServices = useMemo(() => {
    let baseServices = services ?? [];
    if (!showAllServices) {
      baseServices = getServicesForPet(baseServices, currentPet);
    }
    return baseServices;
  }, [services, currentPet, showAllServices]);

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
            const availablePets = pets?.filter((pet) => !selectedPetIds.includes(pet.id)) ?? [];
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
                  <TextField {...params} placeholder="Selecionar pet" />
                )}
              />
            );
          }}
        />
        <Button
          variant="outlined"
          sx={{ width: "150px", height: "40px", flexShrink: 0 }}
          startIcon={<Plus size={14} />}
          onClick={onCreatePet}
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
              sx={{ flex: 1 }}
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
              value={sortedAndFilteredServices.filter((s) => field.value?.includes(s.id)) ?? []}
              getOptionLabel={(option) => formatServiceLabel(option)}
              isOptionEqualToValue={(option, value) => option.id === value.id}
              onChange={(_, value) => field.onChange(value.map((v: Service) => v.id))}
              renderOption={(props, option, { selected }) => {
                const { key, ...rest } = props as any;
                return (
                  <Box
                    component="li"
                    key={key}
                    {...rest}
                    sx={{
                      display: "flex !important",
                      alignItems: "center !important",
                      justifyContent: "space-between !important",
                      width: "100%",
                      gap: 1,
                    }}
                  >
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
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
                          <div style={{ fontSize: 12, opacity: 0.6 }}>{option.description}</div>
                        )}
                      </Box>
                    </Box>
                    <Box sx={{ fontWeight: 600, flexShrink: 0, color: "text.primary" }}>
                      {formatPrice(option.price_cents)}
                    </Box>
                  </Box>
                );
              }}
              renderInput={(params) => (
                <TextField
                  {...params}
                  placeholder={currentPet ? "Selecionar serviços" : "Selecione um pet primeiro"}
                  disabled={!currentPet}
                />
              )}
            />
          )}
        />
        <Button
          variant="outlined"
          sx={{ width: "150px", height: "40px", flexShrink: 0 }}
          startIcon={<Plus size={14} />}
          onClick={onCreateService}
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
          Remover Pet da Lista
        </Button>
      )}
    </Box>
  );
}
