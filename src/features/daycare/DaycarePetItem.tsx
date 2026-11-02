import { useMemo, useState } from "react";
import {
  Autocomplete,
  Box,
  Checkbox,
  FormControlLabel,
  TextField,
  Typography,
} from "@mui/material";
import { Plus, Trash } from "lucide-react";

import { Button } from "../../components/Button/Button";
import { formatBRLFromCents } from "../../utils/masks";

import type { Pet } from "../pets/types";
import type { DaycareModality } from "./types";

export type DaycarePetItemData = {
  id: string;
  pet_id: number | null;
  modality_id: number | null;
  showAllServices?: boolean;
};

type Props = {
  index: number;
  item: DaycarePetItemData;
  watchedClientId: number | null | undefined;
  pets: Pet[];
  modalities: DaycareModality[];
  selectedPetIds: number[];
  onChangePet: (index: number, petId: number | null) => void;
  onChangeModality: (index: number, modalityId: number | null) => void;
  onChangeShowAllServices: (index: number, showAll: boolean) => void;
  onCreatePet?: (index: number, clientId: number) => void;
  onCreateService?: (index: number) => void;
  onRemove: (index: number) => void;
  isOnlyPet: boolean;
};

export default function DaycarePetItem({
  index,
  item,
  watchedClientId,
  pets,
  modalities,
  selectedPetIds,
  onChangePet,
  onChangeModality,
  onChangeShowAllServices,
  onCreatePet,
  onCreateService,
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
    return pets.filter(
      (pet) =>
        (!selectedPetIds.includes(pet.id) || pet.id === item.pet_id) &&
        (!pet.is_deceased || pet.id === item.pet_id)
    );
  }, [pets, selectedPetIds, item.pet_id]);

  const activeModalities = useMemo(() => {
    return (modalities || []).filter((m) => m.is_active !== false);
  }, [modalities]);

  const sortedAndFilteredModalities = useMemo(() => {
    if (item.showAllServices || !currentPet) {
      return activeModalities;
    }

    const petSize = currentPet.size?.trim().toUpperCase();
    const petSpecies = (currentPet as any).species?.trim().toLowerCase();

    const matchesPet = (m: DaycareModality) => {
      const sizeMatch =
        !m.sizes ||
        m.sizes.length === 0 ||
        (petSize && m.sizes.some((s) => s.trim().toUpperCase() === petSize));

      const speciesMatch =
        !m.species ||
        m.species.length === 0 ||
        (petSpecies && m.species.some((sp) => sp.trim().toLowerCase() === petSpecies));

      return sizeMatch && speciesMatch;
    };

    const matching = activeModalities.filter(matchesPet);
    // Se não encontrar nenhuma compatível com o porte/espécie, retorna todas ativas para não travar a lista
    if (matching.length === 0) {
      return activeModalities;
    }

    const nonMatching = activeModalities.filter((m) => !matchesPet(m));
    return [...matching, ...nonMatching];
  }, [activeModalities, currentPet, item.showAllServices]);

  const selectedModality = useMemo(() => {
    return activeModalities.find((m) => m.id === item.modality_id) ?? null;
  }, [activeModalities, item.modality_id]);

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        gap: 1.5,
        mb: 2,
        p: 2,
        border: "1px solid #eee",
        borderRadius: 2,
        bgcolor: "#FFFFFF",
      }}
    >
      {/* LINHA 1: PET */}
      <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
        <Autocomplete<Pet>
          sx={{ flex: 1 }}
          options={availablePets}
          disabled={!watchedClientId}
          filterOptions={(options, state) => {
            const input = state.inputValue.toLowerCase();
            return options
              .filter((option) => option.name.toLowerCase().includes(input))
              .slice(0, petListLimit);
          }}
          noOptionsText={
            watchedClientId
              ? "Nenhum pet cadastrado para este cliente"
              : "Selecione um cliente primeiro"
          }
          size="small"
          value={currentPet ?? null}
          getOptionLabel={(option) => option.name}
          isOptionEqualToValue={(o, v) => o.id === v.id}
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
        <Button
          variant="outlined"
          sx={{
            minWidth: { xs: "40px", sm: "120px" },
            width: { xs: "40px", sm: "auto" },
            height: "40px",
            p: { xs: 0, sm: "6px 16px" },
            flexShrink: 0,
          }}
          disabled={!watchedClientId}
          onClick={() => onCreatePet?.(index, watchedClientId ?? 0)}
          title="Criar Pet"
        >
          <Plus size={18} />
          <Box
            component="span"
            sx={{ display: { xs: "none", sm: "inline" }, ml: 0.5 }}
          >
            Criar Pet
          </Box>
        </Button>
      </Box>

      {/* LINHA 2: SERVIÇO DE CRECHE */}
      <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
        <Autocomplete<DaycareModality>
          sx={{ flex: 1 }}
          disabled={!currentPet}
          options={sortedAndFilteredModalities}
          filterOptions={(options, state) => {
            const input = state.inputValue.toLowerCase().trim();
            if (!input) return options.slice(0, serviceListLimit);
            return options
              .filter((option) =>
                `${option.name} ${option.sizes?.join(" ") ?? ""} ${
                  option.species?.join(" ") ?? ""
                } ${option.description ?? ""}`
                  .toLowerCase()
                  .includes(input)
              )
              .slice(0, serviceListLimit);
          }}
          noOptionsText={
            currentPet
              ? "Nenhum serviço de creche disponível"
              : "Selecione um pet primeiro"
          }
          size="small"
          value={selectedModality}
          getOptionLabel={(option) => {
            if (!option) return "";
            return `${option.name} - R$ ${formatBRLFromCents(option.price_cents)}`;
          }}
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
            onChangeModality(index, value ? value.id : null);
          }}
          renderOption={(props, option) => {
            const { key, ...optionProps } = props;
            const extraDetails = [
              option.max_hours ? `Duração: ${option.max_hours}h` : null,
              option.sizes?.length ? `Porte: ${option.sizes.join(", ")}` : null,
              option.species?.length
                ? `Espécies: ${option.species.join(", ")}`
                : null,
            ]
              .filter(Boolean)
              .join(" • ");

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
                  px: 2,
                  py: 1,
                  cursor: "pointer",
                }}
              >
                <Box sx={{ minWidth: 0, flex: 1, pr: 1.5 }}>
                  <Typography
                    noWrap
                    sx={{
                      fontWeight: 600,
                      fontSize: { xs: "0.85rem", sm: "0.9rem" },
                      lineHeight: 1.2,
                    }}
                  >
                    {option.name}
                  </Typography>
                  {extraDetails && (
                    <Typography
                      variant="caption"
                      noWrap
                      sx={{
                        fontSize: "0.74rem",
                        color: "text.secondary",
                        display: "block",
                      }}
                    >
                      {extraDetails}
                    </Typography>
                  )}
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
                <Box
                  sx={{
                    fontWeight: 700,
                    fontSize: { xs: "0.82rem", sm: "0.88rem" },
                    color: "primary.main",
                    whiteSpace: "nowrap",
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
                  ? "Selecione o serviço de creche"
                  : "Selecione um pet primeiro"
              }
              disabled={!currentPet}
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
          <Box
            component="span"
            sx={{ display: { xs: "none", sm: "inline" }, ml: 0.5 }}
          >
            Criar Serviço
          </Box>
        </Button>
      </Box>

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

      {/* BOTÃO REMOVER PET SE HOUVER MAIS DE UM */}
      {!isOnlyPet && (
        <Button
          startIcon={<Trash size={15} />}
          variant="outlined"
          color="error"
          sx={{ width: "fit-content", mx: "auto", mt: 0.5 }}
          onClick={() => onRemove(index)}
        >
          Remover Pet do Agendamento
        </Button>
      )}
    </Box>
  );
}
