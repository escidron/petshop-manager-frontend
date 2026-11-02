import { useMemo, useState } from "react";
import {
  Autocomplete,
  Box,
  Checkbox,
  FormControlLabel,
  TextField,
  Typography,
} from "@mui/material";
import { Trash } from "lucide-react";

import { Button } from "../../components/Button/Button";
import { formatBRLFromCents } from "../../utils/masks";
import { formatServiceLabel } from "../../utils/formatServiceLabel";
import { getServicesForPet } from "../../utils/serviceMatcher";

import type { Pet } from "../pets/types";
import type { Service } from "../tenant_services/types";

export type DaycareBathItemData = {
  id: string;
  pet_id: number | null;
  service_ids: number[];
  showAllServices?: boolean;
};

type Props = {
  index: number;
  item: DaycareBathItemData;
  watchedClientId: number | null | undefined;
  pets: Pet[];
  services: Service[];
  selectedPetIds: number[];
  onChangePet: (index: number, petId: number | null) => void;
  onChangeServices: (index: number, serviceIds: number[]) => void;
  onChangeShowAllServices: (index: number, showAll: boolean) => void;
  onRemove: (index: number) => void;
  isOnlyPet: boolean;
};

export default function DaycareBathPetItem({
  index,
  item,
  watchedClientId,
  pets,
  services,
  selectedPetIds,
  onChangePet,
  onChangeServices,
  onChangeShowAllServices,
  onRemove,
  isOnlyPet,
}: Props) {
  const [petListLimit, setPetListLimit] = useState(20);
  const [serviceListLimit, setServiceListLimit] = useState(20);

  const currentPet = useMemo(
    () => pets.find((p) => p.id === item.pet_id),
    [pets, item.pet_id]
  );

  const availablePets = useMemo(() => {
    return (pets ?? []).filter(
      (pet) =>
        (!selectedPetIds.includes(pet.id) || pet.id === item.pet_id) &&
        (!pet.is_deceased || pet.id === item.pet_id)
    );
  }, [pets, selectedPetIds, item.pet_id]);

  const sortedAndFilteredServices = useMemo(() => {
    const activeServices = (services ?? []).filter((s) => s.is_active);
    if (item.showAllServices || !currentPet) {
      return activeServices;
    }
    const compatibleServices = getServicesForPet(activeServices, currentPet);
    const selectedIncompatible = activeServices.filter(
      (s) =>
        item.service_ids.includes(s.id) &&
        !compatibleServices.some((c) => c.id === s.id)
    );
    return [...compatibleServices, ...selectedIncompatible];
  }, [services, currentPet, item.showAllServices, item.service_ids]);

  const selectedServices = useMemo(() => {
    return (services ?? []).filter((s) => item.service_ids.includes(s.id));
  }, [services, item.service_ids]);

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        gap: 1.5,
        p: { xs: 1.5, sm: 2 },
        border: "1px solid",
        borderColor: "divider",
        borderRadius: 2,
        bgcolor: "#FFFFFF",
      }}
    >
      {/* LINHA 1: PET */}
      <Autocomplete<Pet>
        fullWidth
        options={availablePets}
        filterOptions={(options, state) => {
          const input = state.inputValue.toLowerCase().trim();
          if (!input) return options.slice(0, petListLimit);
          return options
            .filter((option) =>
              `${option.name} ${option.breed ?? ""} ${option.size ?? ""}`
                .toLowerCase()
                .includes(input)
            )
            .slice(0, petListLimit);
        }}
        noOptionsText={
          watchedClientId
            ? "Nenhum pet cadastrado"
            : "Selecione um cliente primeiro"
        }
        size="small"
        value={currentPet ?? null}
        getOptionLabel={(option) => option.name}
        isOptionEqualToValue={(option, value) => option?.id === value?.id}
        onInputChange={(_, __, reason) => {
          if (reason === "input") setPetListLimit(20);
        }}
        slotProps={{
          popper: {
            sx: { zIndex: 1400 },
          },
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
          },
        }}
        renderOption={(props, option) => {
          const { key, ...optionProps } = props;
          const sizeText = option.size ? `Porte ${option.size}` : null;
          const details = [option.breed, sizeText].filter(Boolean).join(" - ");

          return (
            <Box component="li" key={key} {...optionProps}>
              <Box sx={{ display: "flex", flexDirection: "column" }}>
                <Typography variant="body2" color="text.primary">
                  {option.name}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {details || "Sem raça"}
                </Typography>
              </Box>
            </Box>
          );
        }}
        onChange={(_, value) => {
          onChangePet(index, value?.id ?? null);
        }}
        renderInput={(params) => (
          <TextField
            {...params}
            placeholder={
              watchedClientId
                ? "Selecionar pet"
                : "Selecione um cliente primeiro"
            }
          />
        )}
      />

      {/* LINHA 2: SERVIÇOS ADICIONAIS (MÚLTIPLO) */}
      <Autocomplete<Service, true>
        multiple
        disableCloseOnSelect
        fullWidth
        sx={{
          "& .MuiAutocomplete-tag": {
            maxWidth: "160px",
            textOverflow: "ellipsis",
            overflow: "hidden",
            whiteSpace: "nowrap",
          },
        }}
        disabled={!currentPet}
        options={sortedAndFilteredServices}
        filterOptions={(options, state) => {
          const input = state.inputValue.toLowerCase().trim();
          if (!input) return options.slice(0, serviceListLimit);
          return options
            .filter((option) =>
              `${option.name} ${option.sizes?.join(" ") ?? ""} ${
                option.size ?? ""
              } ${option.coat_types?.join(" ") ?? ""} ${
                option.coat_type ?? ""
              } ${option.description ?? ""}`
                .toLowerCase()
                .includes(input)
            )
            .slice(0, serviceListLimit);
        }}
        noOptionsText={
          currentPet
            ? "Nenhum serviço disponível"
            : "Selecione um pet primeiro"
        }
        size="small"
        value={selectedServices}
        getOptionLabel={(option) => formatServiceLabel(option)}
        isOptionEqualToValue={(option, value) => option?.id === value?.id}
        onInputChange={(_, __, reason) => {
          if (reason === "input") setServiceListLimit(20);
        }}
        slotProps={{
          popper: {
            sx: { zIndex: 1400 },
          },
          paper: {
            sx: {
              borderRadius: 2,
              boxShadow: "0 6px 24px rgba(0,0,0,0.12)",
              overflow: "hidden",
            },
          },
        }}
        onChange={(_, value) => {
          onChangeServices(
            index,
            value.map((v) => v.id)
          );
        }}
        renderOption={(props, option, { selected }) => {
          const { key, ...optionProps } = props;
          return (
            <Box
              component="li"
              key={key}
              {...optionProps}
              sx={{
                display: "flex !important",
                alignItems: "center",
                justifyContent: "space-between",
                width: "100%",
                px: 1.5,
                py: 0.75,
                cursor: "pointer",
              }}
            >
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 1,
                  minWidth: 0,
                  flex: 1,
                  overflow: "hidden",
                }}
              >
                <Checkbox
                  checked={selected}
                  disableRipple
                  size="small"
                  sx={{ color: "primary.main", p: 0 }}
                />
                <Box sx={{ minWidth: 0, overflow: "hidden" }}>
                  <Typography
                    noWrap
                    sx={{
                      fontWeight: 600,
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
                        color: "text.secondary",
                        opacity: 0.8,
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
                  color: "primary.main",
                  whiteSpace: "nowrap",
                  ml: 1,
                  flexShrink: 0,
                }}
              >
                R$ {formatBRLFromCents(option.price_cents)}
              </Box>
            </Box>
          );
        }}
        renderInput={(params) => (
          <TextField
            {...params}
            placeholder={
              currentPet
                ? "Selecionar serviços"
                : "Selecione um pet primeiro"
            }
            disabled={!currentPet}
          />
        )}
      />

      {/* LINHA 3: MOSTRAR TODOS OS SERVIÇOS */}
      <FormControlLabel
        sx={{ width: "fit-content", my: 0 }}
        control={
          <Checkbox
            disableRipple
            size="small"
            sx={{ color: "primary.main", py: 0 }}
            checked={Boolean(item.showAllServices)}
            onChange={(e) => onChangeShowAllServices(index, e.target.checked)}
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

      {/* BOTÃO REMOVER PET */}
      {!isOnlyPet && (
        <Button
          startIcon={<Trash size={15} />}
          variant="outlined"
          color="error"
          sx={{ width: "fit-content", mx: "auto", mt: 0.5 }}
          onClick={() => onRemove(index)}
        >
          Remover Pet
        </Button>
      )}
    </Box>
  );
}

