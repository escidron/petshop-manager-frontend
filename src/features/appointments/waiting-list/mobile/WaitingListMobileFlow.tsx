import { useState, useMemo, useEffect } from "react";
import {
  Box,
  Typography,
  IconButton,
  Chip,
  LinearProgress,
} from "@mui/material";
import {
  Plus,
  User,
  Trash2,
  ChevronRight,
  ArrowLeft,
  Calendar,
  Clock,
  AlertCircle,
  Sun,
  Sunrise,
  Sunset,
  Moon,
  Sparkles,
  CheckCircle2,
} from "lucide-react";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import dayjs from "dayjs";
import "dayjs/locale/pt-br";
import { useForm, useFieldArray, useWatch, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "../../../../components/Button/Button";
import CustomTextField from "../../../../components/Textfield/CustomTextfield";
import { useAuth } from "../../../../hooks/useAuth";
import { usePets } from "../../../../hooks/usePets";
import { formatPrice } from "../../../../utils/formatServiceLabel";
import { waitingListSchema, type WaitingListFormData } from "../schemas";
import type { Client } from "../../../clients/types";
import type { Pet } from "../../../pets/types";
import type { Service } from "../../../tenant_services/types";
import type { WaitingListEntry, WaitingListPeriod } from "../types";

import ClientPickerDrawer from "../../mobile/ClientPickerDrawer";
import ServicePickerDrawer from "../../mobile/ServicePickerDrawer";
import PetPickerDrawer from "../../mobile/PetPickerDrawer";

dayjs.locale("pt-br");

type Props = {
  initialData?: WaitingListEntry;
  clients: Client[];
  services: Service[];
  pets: Pet[];
  onClientIdChange: (id: number) => void;
  onSubmit: (data: WaitingListFormData) => void;
  isSubmitting: boolean;
  onCreateClient?: () => void;
  onCreatePet?: (index: number, clientId: number) => void;
  onCreateService?: (index: number) => void;
  onClose?: () => void;
};

const PERIOD_OPTIONS: { value: WaitingListPeriod; label: string; icon: any }[] = [
  { value: "any", label: "Qualquer", icon: Sun },
  { value: "morning", label: "Manhã", icon: Sunrise },
  { value: "afternoon", label: "Tarde", icon: Sunset },
  { value: "evening", label: "Noite", icon: Moon },
];

export default function WaitingListMobileFlow({
  initialData,
  clients = [],
  services = [],
  pets = [],
  onClientIdChange,
  onSubmit,
  isSubmitting = false,
  onCreateClient,
  onCreatePet,
  onCreateService,
}: Props) {
  const { tenant } = useAuth();
  const { pets: allPets } = usePets();
  const workingHours = tenant?.working_hours ?? null;

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [clientPickerOpen, setClientPickerOpen] = useState(false);
  const [petPickerOpen, setPetPickerOpen] = useState(false);
  const [servicePickerOpen, setServicePickerOpen] = useState(false);
  const [activePetIndex, setActivePetIndex] = useState<number>(0);

  const [preferredDate, setPreferredDate] = useState<dayjs.Dayjs | null>(
    initialData?.preferred_date ? dayjs(initialData.preferred_date) : null
  );

  const form = useForm<WaitingListFormData>({
    resolver: zodResolver(waitingListSchema) as any,
    defaultValues: {
      client_id: initialData?.client_id || 0,
      items: initialData?.items.map((item) => ({
        pet_id: item.pet_id,
        service_ids: item.services.map((s) => s.id),
      })) || [{ pet_id: 0, service_ids: [] }],
      preferred_date: initialData?.preferred_date || null,
      preferred_period: (initialData?.preferred_period as WaitingListPeriod) || "any",
      notes: initialData?.notes || "",
    },
  });

  const { control, handleSubmit, setValue } = form;

  const watchedClientId = useWatch({ control, name: "client_id" });
  const watchedPeriod = useWatch({ control, name: "preferred_period" }) || "any";
  const items = useWatch({ control, name: "items" }) || [];
  const { fields, append, remove, replace } = useFieldArray({ control, name: "items" });

  const [step1Error, setStep1Error] = useState<string | null>(null);
  const [step2Error, setStep2Error] = useState<string | null>(null);

  // Sync date picker with form
  useEffect(() => {
    setValue("preferred_date", preferredDate?.isValid() ? preferredDate.format("YYYY-MM-DD") : null);
  }, [preferredDate, setValue]);

  // Current client and pets
  const currentClient = useMemo(
    () => clients.find((c) => c.id === watchedClientId),
    [clients, watchedClientId]
  );

  const currentClientPets = useMemo(() => {
    if (!watchedClientId) return [];
    return allPets?.filter((p) => p.client_id === watchedClientId) || pets || [];
  }, [watchedClientId, allPets, pets]);

  // When client changes in create mode, auto-populate all pets if items are empty/unconfigured
  useEffect(() => {
    if (!initialData && watchedClientId && currentClientPets.length > 0) {
      const isInitialUnset =
        fields.length === 0 ||
        (fields.length === 1 && (!fields[0].pet_id || fields[0].pet_id === 0));

      if (isInitialUnset) {
        const newItems = currentClientPets.map((pet) => ({
          pet_id: pet.id,
          service_ids: [],
        }));
        replace(newItems);
      }
    }
  }, [watchedClientId, currentClientPets, fields, replace, initialData]);

  // Handle client selection
  const handleSelectClient = (client: Client) => {
    setValue("client_id", client.id);
    onClientIdChange(client.id);
    setStep1Error(null);

    const clientPets = allPets?.filter((p) => p.client_id === client.id) || [];
    if (clientPets.length > 0) {
      const newItems = clientPets.map((p) => ({
        pet_id: p.id,
        service_ids: [],
      }));
      replace(newItems);
    } else {
      replace([]);
    }
  };

  // Add pet to items
  const handleAddPet = (pet: Pet) => {
    if (fields.some((f, idx) => (items[idx]?.pet_id || f.pet_id) === pet.id)) {
      return;
    }
    append({ pet_id: pet.id, service_ids: [] });
    setStep2Error(null);
  };

  // Pets not yet added
  const availableUnselectedPets = useMemo(() => {
    const selectedPetIds = items.map((i) => i.pet_id).filter(Boolean);
    return currentClientPets.filter((p) => !selectedPetIds.includes(p.id));
  }, [currentClientPets, items]);

  // Service updates for active pet
  const handleConfirmServices = (selectedServiceIds: number[]) => {
    setValue(`items.${activePetIndex}.service_ids`, selectedServiceIds);
    setStep2Error(null);
  };

  // Active pet object
  const activePetObj = useMemo(() => {
    const petId = items[activePetIndex]?.pet_id || fields[activePetIndex]?.pet_id;
    return pets.find((p) => p.id === petId) || allPets?.find((p) => p.id === petId);
  }, [items, fields, activePetIndex, pets, allPets]);

  // Validate step 1
  const handleNextFromStep1 = () => {
    if (!watchedClientId || watchedClientId === 0) {
      setStep1Error("Por favor, selecione o cliente para continuar.");
      return;
    }
    setStep1Error(null);
    setStep(2);
  };

  // Validate step 2: allow proceeding if at least 1 pet has services selected
  const handleNextFromStep2 = () => {
    if (fields.length === 0) {
      setStep2Error("Adicione ao menos um pet para continuar.");
      return;
    }

    const validItems = items.filter(
      (item) => item.pet_id && item.service_ids && item.service_ids.length > 0
    );

    if (validItems.length === 0) {
      setStep2Error("Selecione ao menos um serviço para o pet para avançar.");
      return;
    }

    setStep2Error(null);
    setStep(3);
  };

  // Calculate totals
  const totalServicesCents = useMemo(() => {
    let total = 0;
    items.forEach((item) => {
      const sIds = item.service_ids || [];
      sIds.forEach((sId) => {
        const s = services.find((serv) => serv.id === sId);
        if (s) total += s.price_cents;
      });
    });
    return total;
  }, [items, services]);

  // Form submit: filter only pets with selected services
  const handleFormSubmit = (data: WaitingListFormData) => {
    const validItems = data.items.filter(
      (item) => item.pet_id && item.service_ids && item.service_ids.length > 0
    );

    if (validItems.length === 0) {
      setStep2Error("Adicione ao menos um serviço para o pet antes de confirmar.");
      setStep(2);
      return;
    }

    onSubmit({
      ...data,
      items: validItems,
    });
  };

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        maxHeight: "100dvh",
        bgcolor: "#F8FAFC",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Progress Bar & Step Header */}
      <Box sx={{ bgcolor: "#FFFFFF", borderBottom: "1px solid", borderColor: "divider", flexShrink: 0 }}>
        <LinearProgress
          variant="determinate"
          value={step === 1 ? 33 : step === 2 ? 66 : 100}
          sx={{
            height: 3,
            bgcolor: "#EEF2F6",
            "& .MuiLinearProgress-bar": { bgcolor: "primary.main" },
          }}
        />

        <Box sx={{ px: 2, py: 1.25, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Box
              sx={{
                width: 24,
                height: 24,
                borderRadius: "50%",
                bgcolor: "primary.main",
                color: "#FFFFFF",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "0.75rem",
                fontWeight: 800,
              }}
            >
              {step}
            </Box>
            <Typography variant="subtitle2" fontWeight={700} color="text.primary">
              {step === 1 && "Cliente e Preferências"}
              {step === 2 && "Pets e Serviços"}
              {step === 3 && "Revisão e Observações"}
            </Typography>
          </Box>

          <Typography variant="caption" fontWeight={600} color="text.secondary">
            Etapa {step} de 3
          </Typography>
        </Box>
      </Box>

      {/* Main Content Area */}
      <Box
        sx={{
          flex: 1,
          overflowY: "auto",
          WebkitOverflowScrolling: "touch",
          overscrollBehavior: "contain",
          p: 2,
          pb: 12,
        }}
      >
        {/* ============================================================ */}
        {/* ETAPA 1: CLIENTE E PREFERÊNCIAS */}
        {/* ============================================================ */}
        {step === 1 && (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
            {/* Cliente */}
            <Box>
              <Typography variant="caption" fontWeight={700} color="text.secondary" sx={{ mb: 1, display: "block" }}>
                CLIENTE
              </Typography>

              <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
                <Box
                  onClick={() => setClientPickerOpen(true)}
                  sx={{
                    flex: 1,
                    minHeight: 46,
                    px: 1.5,
                    py: 0.75,
                    bgcolor: "#FFFFFF",
                    border: "1.5px solid",
                    borderColor: currentClient ? "primary.main" : "#CBD5E1",
                    borderRadius: 2,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    boxShadow: currentClient ? "0 1px 4px rgba(49, 52, 133, 0.06)" : "none",
                    cursor: "pointer",
                    transition: "all 0.15s ease",
                    "&:hover": { borderColor: "primary.main", bgcolor: "#F8FAFC" },
                  }}
                >
                  {currentClient ? (
                    <Box sx={{ minWidth: 0, flex: 1 }}>
                      <Typography
                        variant="caption"
                        sx={{
                          color: "text.secondary",
                          fontSize: "0.78rem",
                          display: "block",
                          lineHeight: 1.2,
                        }}
                        noWrap
                      >
                        {currentClient.name}
                      </Typography>
                      <Typography
                        variant="body2"
                        sx={{
                          fontWeight: 700,
                          color: "text.primary",
                          fontSize: "0.92rem",
                          lineHeight: 1.3,
                        }}
                        noWrap
                      >
                        🐾 {currentClientPets.length > 0 ? currentClientPets.map((p) => p.name).join(", ") : "Sem pets cadastrados"}
                      </Typography>
                    </Box>
                  ) : (
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <User size={18} color="#64748B" />
                      <Typography variant="body2" color="text.secondary" fontWeight={600}>
                        Toque para selecionar o cliente
                      </Typography>
                    </Box>
                  )}
                  <ChevronRight size={18} color="#94A3B8" />
                </Box>

                {onCreateClient && (
                  <IconButton
                    onClick={onCreateClient}
                    color="primary"
                    sx={{
                      width: 46,
                      height: 46,
                      border: "1.5px solid",
                      borderColor: "divider",
                      borderRadius: 2,
                      flexShrink: 0,
                      bgcolor: "#FFFFFF",
                    }}
                  >
                    <Plus size={20} />
                  </IconButton>
                )}
              </Box>
            </Box>

            {/* Data Preferencial */}
            <Box>
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1 }}>
                <Typography variant="caption" fontWeight={700} color="text.secondary">
                  DATA PREFERENCIAL (OPCIONAL)
                </Typography>
                {preferredDate && (
                  <Typography
                    variant="caption"
                    color="primary.main"
                    fontWeight={600}
                    sx={{ cursor: "pointer", userSelect: "none" }}
                    onClick={() => setPreferredDate(null)}
                  >
                    Limpar data
                  </Typography>
                )}
              </Box>

              <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="pt-br">
                <DatePicker
                  value={preferredDate}
                  onChange={(newDate) => setPreferredDate(newDate)}
                  format="DD/MM/YYYY"
                  shouldDisableDate={(date) => {
                    if (!workingHours) return false;
                    return workingHours[String(date.day())]?.is_open === false;
                  }}
                  dayOfWeekFormatter={(day: dayjs.Dayjs) => {
                    const days = ["dom", "seg", "ter", "qua", "qui", "sex", "sab"];
                    return days[day.day()];
                  }}
                  slotProps={{
                    textField: {
                      fullWidth: true,
                      size: "small",
                      placeholder: "Qualquer data / Sem preferência",
                      sx: {
                        bgcolor: "#FFFFFF",
                        "& .MuiOutlinedInput-root": {
                          borderRadius: 2,
                          "& fieldset": { borderColor: preferredDate ? "primary.main" : "#CBD5E1" },
                        },
                      },
                    },
                    popper: {
                      sx: {
                        "& .MuiDayCalendar-weekDayLabel": {
                          color: "#3d4048 !important",
                          fontWeight: 700,
                          fontSize: "0.75rem",
                        },
                        "& .MuiPickersDay-root": {
                          color: "#3d4048 !important",
                          fontSize: "0.85rem",
                          "&.MuiPickersDay-today:not(.Mui-selected)": {
                            border: "none !important",
                            backgroundColor: "#e0e0e0 !important",
                          },
                          "&.Mui-selected": {
                            color: "white !important",
                            backgroundColor: "primary.main !important",
                          },
                          "&.Mui-disabled": {
                            color: "#b8bbc2 !important",
                            opacity: 0.4,
                          },
                        },
                        "& .MuiPickersCalendarHeader-label": {
                          color: "#3d4048 !important",
                          fontWeight: 600,
                          fontSize: "0.9rem",
                        },
                        "& .MuiPickersArrowSwitcher-button": {
                          color: "#3d4048 !important",
                        },
                      },
                    },
                  }}
                />
              </LocalizationProvider>
            </Box>

            {/* Período Preferencial */}
            <Box>
              <Typography variant="caption" fontWeight={700} color="text.secondary" sx={{ mb: 1, display: "block" }}>
                PERÍODO PREFERENCIAL
              </Typography>

              <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 1 }}>
                {PERIOD_OPTIONS.map((opt) => {
                  const isSelected = watchedPeriod === opt.value;
                  const Icon = opt.icon;

                  return (
                    <Box
                      key={opt.value}
                      onClick={() => setValue("preferred_period", opt.value)}
                      sx={{
                        p: 1.5,
                        borderRadius: 2,
                        bgcolor: isSelected ? "rgba(49, 52, 133, 0.08)" : "#FFFFFF",
                        border: "1.5px solid",
                        borderColor: isSelected ? "primary.main" : "#E2E8F0",
                        display: "flex",
                        alignItems: "center",
                        gap: 1.25,
                        cursor: "pointer",
                        transition: "all 0.15s ease",
                      }}
                    >
                      <Box
                        sx={{
                          width: 32,
                          height: 32,
                          borderRadius: 1.5,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          bgcolor: isSelected ? "primary.main" : "#F1F5F9",
                          color: isSelected ? "#FFFFFF" : "#64748B",
                        }}
                      >
                        <Icon size={18} />
                      </Box>
                      <Typography
                        variant="body2"
                        sx={{
                          fontWeight: isSelected ? 700 : 600,
                          color: isSelected ? "primary.main" : "text.primary",
                        }}
                      >
                        {opt.label}
                      </Typography>
                    </Box>
                  );
                })}
              </Box>
            </Box>

            {step1Error && (
              <Box sx={{ display: "flex", alignItems: "center", gap: 1, p: 1.5, bgcolor: "error.light", borderRadius: 2 }}>
                <AlertCircle size={18} color="#D32F2F" />
                <Typography variant="body2" color="error.dark" fontWeight={600}>
                  {step1Error}
                </Typography>
              </Box>
            )}
          </Box>
        )}

        {/* ============================================================ */}
        {/* ETAPA 2: PETS E SERVIÇOS */}
        {/* ============================================================ */}
        {step === 2 && (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <Typography variant="caption" fontWeight={700} color="text.secondary">
                PETS DE {currentClient?.name?.toUpperCase() || "CLIENTE"}
              </Typography>
            </Box>

            {fields.length === 0 ? (
              <Box sx={{ textAlign: "center", py: 5, bgcolor: "#FFFFFF", borderRadius: 2.5, p: 3, border: "1px dashed #CBD5E1" }}>
                <Typography variant="body1" fontWeight={700} color="text.primary">
                  Nenhum pet selecionado
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, mb: 2 }}>
                  {currentClientPets.length > 0
                    ? "Escolha um dos pets do cliente para continuar."
                    : "Este cliente ainda não tem pets cadastrados."}
                </Typography>
                <Button
                  variant="contained"
                  startIcon={<Plus size={18} />}
                  onClick={() => {
                    if (currentClientPets.length > 0) {
                      setPetPickerOpen(true);
                    } else if (onCreatePet) {
                      onCreatePet(0, watchedClientId ?? 0);
                    }
                  }}
                >
                  {currentClientPets.length > 0 ? "Selecionar Pet" : "Cadastrar Pet"}
                </Button>
              </Box>
            ) : (
              <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
                {fields.map((fieldItem, index) => {
                  const petId = items[index]?.pet_id || fieldItem.pet_id;
                  const petObj = pets.find((p) => p.id === petId) || allPets?.find((p) => p.id === petId);
                  const selectedServiceIds = items[index]?.service_ids || [];
                  const petServices = services.filter((s) => selectedServiceIds.includes(s.id));

                  const petSubtotalCents = petServices.reduce((acc, s) => acc + s.price_cents, 0);

                  return (
                    <Box
                      key={fieldItem.id}
                      sx={{
                        bgcolor: "#FFFFFF",
                        border: "1.5px solid",
                        borderColor: petServices.length > 0 ? "primary.main" : "#E2E8F0",
                        borderRadius: 2.5,
                        p: 2,
                        boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
                        display: "flex",
                        flexDirection: "column",
                        gap: 1.5,
                      }}
                    >
                      {/* Pet Header */}
                      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                          <Typography variant="h6" fontWeight={800} color="text.primary" sx={{ fontSize: "1.05rem" }}>
                            🐾 {petObj?.name || "Pet"}
                          </Typography>
                          {petObj?.breed && (
                            <Typography variant="caption" color="text.secondary">
                              ({petObj.breed})
                            </Typography>
                          )}
                        </Box>

                        {fields.length > 1 && (
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => remove(index)}
                            title="Remover pet"
                          >
                            <Trash2 size={18} />
                          </IconButton>
                        )}
                      </Box>

                      {/* Services List */}
                      <Box>
                        {petServices.length === 0 ? (
                          <Typography variant="body2" color="text.secondary" sx={{ fontStyle: "italic" }}>
                            Nenhum serviço selecionado ainda.
                          </Typography>
                        ) : (
                          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.75 }}>
                            {petServices.map((s) => (
                              <Chip
                                key={s.id}
                                label={s.name}
                                size="small"
                                sx={{
                                  bgcolor: "rgba(49, 52, 133, 0.08)",
                                  color: "primary.dark",
                                  fontWeight: 700,
                                  fontSize: "0.75rem",
                                }}
                              />
                            ))}
                          </Box>
                        )}
                      </Box>

                      {/* Action Row */}
                      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", pt: 1, borderTop: "1px dashed #E2E8F0" }}>
                        <Button
                          variant="outlined"
                          size="small"
                          onClick={() => {
                            setActivePetIndex(index);
                            setServicePickerOpen(true);
                          }}
                          sx={{
                            borderRadius: 1.5,
                            textTransform: "none",
                            fontWeight: 700,
                            fontSize: "0.82rem",
                          }}
                        >
                          {petServices.length > 0 ? "Alterar Serviços" : "+ Adicionar Serviços"}
                        </Button>

                        {petServices.length > 0 && (
                          <Typography variant="body2" fontWeight={800} color="primary.main">
                            Subtotal: {formatPrice(petSubtotalCents)}
                          </Typography>
                        )}
                      </Box>
                    </Box>
                  );
                })}

                {/* Add Another Pet Button */}
                {availableUnselectedPets.length > 0 && (
                  <Button
                    variant="outlined"
                    startIcon={<Plus size={18} />}
                    onClick={() => setPetPickerOpen(true)}
                    sx={{
                      py: 1.25,
                      borderRadius: 2,
                      borderStyle: "dashed",
                      fontWeight: 700,
                    }}
                  >
                    Adicionar Outro Pet do Cliente
                  </Button>
                )}
              </Box>
            )}

            {step2Error && (
              <Box sx={{ display: "flex", alignItems: "center", gap: 1, p: 1.5, bgcolor: "error.light", borderRadius: 2 }}>
                <AlertCircle size={18} color="#D32F2F" />
                <Typography variant="body2" color="error.dark" fontWeight={600}>
                  {step2Error}
                </Typography>
              </Box>
            )}
          </Box>
        )}

        {/* ============================================================ */}
        {/* ETAPA 3: REVISÃO E OBSERVAÇÕES */}
        {/* ============================================================ */}
        {step === 3 && (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
            {/* Resumo */}
            <Box
              sx={{
                bgcolor: "#FFFFFF",
                borderRadius: 2.5,
                p: 2,
                border: "1px solid",
                borderColor: "#E2E8F0",
                boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
              }}
            >
              <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1.5 }}>
                <Sparkles size={18} color="#313485" />
                <Typography variant="subtitle2" fontWeight={800} color="primary.main">
                  Resumo da Fila de Espera
                </Typography>
              </Box>

              <Box sx={{ display: "flex", flexDirection: "column", gap: 1.25 }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <User size={16} color="#64748B" />
                  <Typography variant="body2" fontWeight={600} color="text.primary">
                    {currentClient?.name}
                  </Typography>
                </Box>

                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <Calendar size={16} color="#64748B" />
                  <Typography variant="body2" color="text.secondary">
                    Data:{" "}
                    <strong style={{ color: "#1E293B" }}>
                      {preferredDate ? preferredDate.format("DD/MM/YYYY") : "Qualquer data"}
                    </strong>
                  </Typography>
                </Box>

                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <Clock size={16} color="#64748B" />
                  <Typography variant="body2" color="text.secondary">
                    Período:{" "}
                    <strong style={{ color: "#1E293B" }}>
                      {PERIOD_OPTIONS.find((p) => p.value === watchedPeriod)?.label || "Qualquer"}
                    </strong>
                  </Typography>
                </Box>
              </Box>

              {/* Pets e Serviços incluídos */}
              <Box sx={{ mt: 2, pt: 1.5, borderTop: "1px dashed #E2E8F0" }}>
                <Typography variant="caption" fontWeight={700} color="text.secondary" sx={{ mb: 1, display: "block" }}>
                  PETS E SERVIÇOS INCLUÍDOS
                </Typography>

                {items
                  .filter((item) => item.pet_id && item.service_ids && item.service_ids.length > 0)
                  .map((item, idx) => {
                    const petObj = pets.find((p) => p.id === item.pet_id) || allPets?.find((p) => p.id === item.pet_id);
                    const petServices = services.filter((s) => item.service_ids.includes(s.id));

                    return (
                      <Box key={idx} sx={{ mb: 1.25, "&:last-child": { mb: 0 } }}>
                        <Typography variant="body2" fontWeight={700} color="text.primary">
                          🐾 {petObj?.name || "Pet"}
                        </Typography>
                        <Box sx={{ pl: 2, mt: 0.25 }}>
                          {petServices.map((s) => (
                            <Box key={s.id} sx={{ display: "flex", justifyContent: "space-between" }}>
                              <Typography variant="caption" color="text.secondary">
                                • {s.name}
                              </Typography>
                              <Typography variant="caption" fontWeight={600} color="text.primary">
                                {formatPrice(s.price_cents)}
                              </Typography>
                            </Box>
                          ))}
                        </Box>
                      </Box>
                    );
                  })}

                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    mt: 1.5,
                    pt: 1.25,
                    borderTop: "1px solid #E2E8F0",
                  }}
                >
                  <Typography variant="body2" fontWeight={800} color="text.primary">
                    Total Estimado
                  </Typography>
                  <Typography variant="h6" fontWeight={800} color="primary.main">
                    {formatPrice(totalServicesCents)}
                  </Typography>
                </Box>
              </Box>
            </Box>

            {/* Observações */}
            <Box>
              <Typography variant="caption" fontWeight={700} color="text.secondary" sx={{ mb: 1, display: "block" }}>
                OBSERVAÇÕES (OPCIONAL)
              </Typography>
              <Controller
                name="notes"
                control={control}
                render={({ field }) => (
                  <CustomTextField
                    {...field}
                    multiline
                    rows={3}
                    fullWidth
                    placeholder="Adicionais, comportamento, restrições ou preferências..."
                    sx={{ bgcolor: "#FFFFFF", borderRadius: 2 }}
                  />
                )}
              />
            </Box>
          </Box>
        )}
      </Box>

      {/* Sticky Bottom Bar */}
      <Box
        sx={{
          position: "fixed",
          bottom: 0,
          left: 0,
          right: 0,
          bgcolor: "#FFFFFF",
          borderTop: "1px solid",
          borderColor: "divider",
          p: 2,
          pb: "calc(16px + env(safe-area-inset-bottom, 0px))",
          boxShadow: "0 -4px 16px rgba(0,0,0,0.06)",
          zIndex: 10,
          display: "flex",
          gap: 1.5,
        }}
      >
        {step > 1 && (
          <Button
            variant="outlined"
            onClick={() => setStep((s) => ((s - 1) as 1 | 2))}
            startIcon={<ArrowLeft size={18} />}
            sx={{ minHeight: 48, borderRadius: 2, fontWeight: 700 }}
          >
            Voltar
          </Button>
        )}

        {step === 1 && (
          <Button
            fullWidth
            variant="contained"
            onClick={handleNextFromStep1}
            endIcon={<ChevronRight size={18} />}
            sx={{ minHeight: 48, borderRadius: 2, fontWeight: 700, fontSize: "1rem" }}
          >
            Próximo (Pets e Serviços)
          </Button>
        )}

        {step === 2 && (
          <Button
            fullWidth
            variant="contained"
            onClick={handleNextFromStep2}
            endIcon={<ChevronRight size={18} />}
            sx={{ minHeight: 48, borderRadius: 2, fontWeight: 700, fontSize: "1rem" }}
          >
            Próximo (Revisão)
          </Button>
        )}

        {step === 3 && (
          <Button
            fullWidth
            variant="contained"
            onClick={handleSubmit(handleFormSubmit)}
            loading={isSubmitting}
            disabled={isSubmitting}
            startIcon={<CheckCircle2 size={18} />}
            sx={{
              minHeight: 48,
              borderRadius: 2,
              fontWeight: 800,
              fontSize: "1rem",
              boxShadow: "0 4px 12px rgba(49, 52, 133, 0.25)",
            }}
          >
            {initialData ? "Salvar Alterações" : "Adicionar à Fila"}
          </Button>
        )}
      </Box>

      {/* Drawers */}
      <ClientPickerDrawer
        open={clientPickerOpen}
        clients={clients}
        allPets={allPets}
        selectedClientId={watchedClientId}
        onClose={() => setClientPickerOpen(false)}
        onSelectClient={handleSelectClient}
        onCreateClient={onCreateClient}
      />

      <PetPickerDrawer
        open={petPickerOpen}
        availablePets={availableUnselectedPets}
        client={currentClient}
        onClose={() => setPetPickerOpen(false)}
        onSelectPet={handleAddPet}
        onCreatePet={() => {
          if (onCreatePet && watchedClientId) {
            onCreatePet(fields.length, watchedClientId);
          }
        }}
      />

      <ServicePickerDrawer
        open={servicePickerOpen}
        services={services}
        initialSelectedServiceIds={items[activePetIndex]?.service_ids || []}
        pet={activePetObj}
        onClose={() => setServicePickerOpen(false)}
        onConfirm={handleConfirmServices}
        onCreateService={onCreateService ? () => onCreateService(activePetIndex) : undefined}
      />
    </Box>
  );
}
