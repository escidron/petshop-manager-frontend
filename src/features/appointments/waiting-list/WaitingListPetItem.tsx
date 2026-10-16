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
import { Trash } from "lucide-react";
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
  onRemove,
  isOnlyPet,
}: Props) {
  const [showAllServices, setShowAllServices] = useState(false);
  const [petLimit, setPetLimit] = useState(20);
  const [serviceLimit, setServiceLimit] = useState(20);

  const currentPetId = items[index]?.pet_id;
  const currentPet = pets?.find((p) => p.id === currentPetId);

  const sortedAndFilteredServices = useMemo(() => {
    let baseServices = services ?? [];
    if (!showAllServices) {
      const selectedIds = items?.[index]?.service_ids ?? [];
      const compatibleServices = getServicesForPet(baseServices, currentPet);
      const selectedIncompatible = baseServices.filter(
        (s) => selectedIds.includes(s.id) && !compatibleServices.some((c) => c.id === s.id)
      );
      baseServices = [...compatibleServices, ...selectedIncompatible];
    }
    return baseServices;
  }, [services, currentPet, showAllServices, items, index]);

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
                    .slice(0, petLimit);
                }}
                noOptionsText="Nenhum pet cadastrado"
                size="small"
                onInputChange={(_, __, reason) => {
                  if (reason === "input") setPetLimit(20);
                }}
                ListboxProps={{
                  onScroll: (event: React.SyntheticEvent) => {
                    const listboxNode = event.currentTarget;
                    if (
                      listboxNode.scrollTop + listboxNode.clientHeight >=
                      listboxNode.scrollHeight - 10
                    ) {
                      setPetLimit((prev) => prev + 20);
                    }
                  }
                }}
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
                  `${option.name} ${option.sizes?.join(" ") ?? ""} ${option.size ?? ""} ${option.coat_types?.join(" ") ?? ""} ${option.coat_type ?? ""}`
                    .toLowerCase()
                    .includes(input)
                ).slice(0, serviceLimit);
              }}
              onInputChange={(_, __, reason) => {
                if (reason === "input") setServiceLimit(20);
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
                    setServiceLimit((prev) => prev + 20);
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
              disableCloseOnSelect
              size="small"
              value={
                (services ?? []).filter((s) => field.value?.includes(s.id)) ?? []
              }
              getOptionLabel={(option) => formatServiceLabel(option)}
              isOptionEqualToValue={(option, value) => option.id === value.id}
              onChange={(_, value) => field.onChange(value.map((v: Service) => v.id))}
              renderOption={(props, option, { selected }) => {
                const { key, ...rest } = props as any;
                return (
                  <li
                    {...rest}
                    key={key || option.id}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      width: "100%",
                      padding: "8px 12px",
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
                  </li>
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
          Remover Pet da Lista
        </Button>
      )}
    </Box>
  );
}
