import { useState, useMemo, useEffect, useRef } from "react";
import {
  Box,
  Typography,
  IconButton,
  Switch,
  FormControlLabel,
  RadioGroup,
  Radio,
  Select,
  MenuItem,
  Chip,
} from "@mui/material";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { DesktopTimePicker } from "@mui/x-date-pickers/DesktopTimePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { ptBR as ptBRPickers } from "@mui/x-date-pickers/locales";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import dayjs from "dayjs";
import "dayjs/locale/pt-br";
import { Controller, useFieldArray, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Calendar,
  Clock,
  User,
  Plus,
  Trash2,
  ChevronRight,
  ArrowLeft,
  ArrowRight,
  CheckCircle,
  AlertCircle,
  Repeat,
} from "lucide-react";
import { Button } from "../../../components/Button/Button";
import CustomTextField from "../../../components/Textfield/CustomTextfield";
import type { Client } from "../../clients/types";
import type { Pet } from "../../pets/types";
import type { Service } from "../../tenant_services/types";
import type { AppointmentFormData } from "../types";
import { appointmentSchema } from "../schemas";
import { useAuth } from "../../../hooks/useAuth";
import { usePets } from "../../../hooks/usePets";
import { useQuery } from "@tanstack/react-query";
import { listClientPackagesByClient } from "../../../api/services/client_packages";
import { formatPrice } from "../../../utils/formatServiceLabel";
import { CustomDay } from "../../dashboard/DashboardCalendar";
import { getHighlightedDays } from "../../../api/services/appointments";
import ClientPickerDrawer from "./ClientPickerDrawer";
import ServicePickerDrawer from "./ServicePickerDrawer";
import PetPickerDrawer from "./PetPickerDrawer";

dayjs.locale("pt-br");

function CustomDatePickerToolbar() {
  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        pt: 1.5,
        pb: 0.5,
        px: 2,
        backgroundColor: "#FFFFFF",
      }}
    >
      <Typography variant="subtitle1" fontWeight={700} color="text.primary">
        Selecionar Data
      </Typography>
    </Box>
  );
}

type Props = {
  defaultValues?: Partial<AppointmentFormData>;
  clients?: Client[];
  services?: Service[];
  pets?: Pet[];
  setClientId: (id: number) => void;
  selectedClient?: Client;
  selectedPet?: Pet;
  onSubmit: (data: AppointmentFormData) => void;
  mode?: "create" | "edit";
  isSubmitting?: boolean;
  onCreateClient?: () => void;
  onCreatePet?: (index: number, clientId: number) => void;
  onCreateService?: (index: number) => void;
  autoSelectClientId?: number;
  autoSelectPet?: { index: number; id: number };
  autoSelectService?: { index: number; id: number };
  initialDate?: string;
  loadedClientId?: number;
  onClose?: () => void;
};

export default function AppointmentMobileFlow({
  defaultValues,
  clients = [],
  services = [],
  pets = [],
  setClientId,
  selectedClient,
  selectedPet,
  onSubmit,
  mode = "create",
  isSubmitting = false,
  onCreateClient,
  onCreatePet,
  onCreateService,
  autoSelectClientId,
  autoSelectPet,
  autoSelectService,
  initialDate,
  loadedClientId,
  onClose,
}: Props) {
  const { tenant } = useAuth();
  const { pets: allPets } = usePets();
  const workingHours = tenant?.working_hours ?? null;

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [clientPickerOpen, setClientPickerOpen] = useState(false);
  const [petPickerOpen, setPetPickerOpen] = useState(false);
  const [servicePickerOpen, setServicePickerOpen] = useState(false);
  const [activePetIndex, setActivePetIndex] = useState<number>(0);

  const [scheduledDate, setScheduledDate] = useState<dayjs.Dayjs | null>(
    defaultValues?.scheduled_at
      ? dayjs(defaultValues.scheduled_at)
      : initialDate
      ? dayjs(initialDate)
      : dayjs()
  );
  const [scheduledTime, setScheduledTime] = useState<dayjs.Dayjs | null>(
    defaultValues?.scheduled_at
      ? dayjs(defaultValues.scheduled_at)
      : null
  );
  const [timePickerOpen, setTimePickerOpen] = useState(false);
  const pendingTimeCloseRef = useRef(false);

  const [calendarMonth, setCalendarMonth] = useState<dayjs.Dayjs>(
    (scheduledDate || dayjs()).startOf("month")
  );

  const startDate = calendarMonth.subtract(1, "month").startOf("month").format("YYYY-MM-DD");
  const endDate = calendarMonth.add(1, "month").endOf("month").format("YYYY-MM-DD");

  const { data: highlightedData = [] } = useQuery({
    queryKey: ["appointments", "highlights", calendarMonth.format("YYYY-MM")],
    queryFn: () => getHighlightedDays(startDate, endDate),
    staleTime: 1000 * 60 * 5,
  });

  const highlightedDays = useMemo(() => new Set<string>(highlightedData), [highlightedData]);

  const [isRecurrent, setIsRecurrent] = useState(Boolean(defaultValues?.recurrence));
  const [recurrenceEndType, setRecurrenceEndType] = useState<"occurrences" | "date" | "never">(
    "occurrences"
  );

  const form = useForm<AppointmentFormData>({
    resolver: zodResolver(appointmentSchema) as any,
    defaultValues: {
      ...defaultValues,
      scheduled_at: defaultValues?.scheduled_at || "",
      recurrence: defaultValues?.recurrence || { frequency: "weekly", occurrences: 4 },
    },
  });

  const {
    control,
    handleSubmit,
    setValue,
  } = form;

  const watchedClientId = useWatch({ control, name: "client_id" });
  const items = useWatch({ control, name: "items" }) || [];
  const { fields, append, remove, replace } = useFieldArray({ control, name: "items" });

  // Pre-select pet if selectedPet is provided
  useEffect(() => {
    if (selectedPet && fields.length === 0) {
      append({ pet_id: selectedPet.id, service_ids: [] });
    }
  }, [selectedPet, fields.length, append]);

  const { data: clientPackages = [] } = useQuery({
    queryKey: ["clientPackages", "client", watchedClientId],
    queryFn: () => listClientPackagesByClient(watchedClientId!),
    enabled: !!watchedClientId,
  });

  // Keep scheduled_at in sync with date and time pickers
  useEffect(() => {
    if (scheduledDate?.isValid() && scheduledTime?.isValid()) {
      const merged = scheduledDate
        .hour(scheduledTime.hour())
        .minute(scheduledTime.minute())
        .second(0)
        .millisecond(0);
      setValue("scheduled_at", merged.toISOString(), { shouldValidate: true });
    }
  }, [scheduledDate, scheduledTime, setValue]);

  // Initial client prefill
  useEffect(() => {
    if (selectedClient && !watchedClientId) {
      setValue("client_id", selectedClient.id);
      setClientId(selectedClient.id);
    } else if (autoSelectClientId && !watchedClientId) {
      setValue("client_id", autoSelectClientId);
      setClientId(autoSelectClientId);
    }
  }, [selectedClient, autoSelectClientId, watchedClientId, setValue, setClientId]);

  // Client's pets
  const currentClientPets = useMemo(() => {
    if (!watchedClientId) return [];
    if (loadedClientId === watchedClientId) {
      return pets.filter((p) => p.client_id === watchedClientId && !p.is_deceased);
    }
    const clientPets = allPets.filter((p) => p.client_id === watchedClientId && !p.is_deceased);
    if (clientPets.length > 0) return clientPets;
    return pets.filter((p) => p.client_id === watchedClientId && !p.is_deceased);
  }, [allPets, pets, watchedClientId, loadedClientId]);

  // Auto-populate all client pets when client is selected in create mode
  const populatedClientIdRef = useRef<number | undefined>(defaultValues?.client_id);
  useEffect(() => {
    if (watchedClientId && mode === "create") {
      if (
        (watchedClientId !== populatedClientIdRef.current &&
          (watchedClientId === loadedClientId || currentClientPets.length > 0)) ||
        fields.length === 0
      ) {
        if (currentClientPets.length > 0) {
          populatedClientIdRef.current = watchedClientId;
          replace(currentClientPets.map((p) => ({ pet_id: p.id, service_ids: [] })));
        }
      }
    }
  }, [watchedClientId, loadedClientId, currentClientPets, fields.length, mode, replace]);

  // Handle autoSelectPet and autoSelectService
  useEffect(() => {
    if (autoSelectPet) {
      setValue(`items.${autoSelectPet.index}.pet_id`, autoSelectPet.id);
    }
  }, [autoSelectPet, setValue]);

  useEffect(() => {
    if (autoSelectService) {
      const currentServices = form.getValues(`items.${autoSelectService.index}.service_ids`) || [];
      if (!currentServices.includes(autoSelectService.id)) {
        setValue(`items.${autoSelectService.index}.service_ids`, [
          ...currentServices,
          autoSelectService.id,
        ]);
      }
    }
  }, [autoSelectService, setValue, form]);

  const currentClient = useMemo(() => {
    return selectedClient ?? clients.find((c) => c.id === watchedClientId);
  }, [selectedClient, clients, watchedClientId]);

  // Available pets for PetPickerDrawer (pets not currently in the appointment items)
  const availableUnselectedPets = useMemo(() => {
    const selectedPetIds = items.map((i) => i.pet_id).filter(Boolean);
    return currentClientPets.filter((p) => !selectedPetIds.includes(p.id));
  }, [currentClientPets, items]);

  // Calculate package credits for a specific pet
  const getPackageCreditsForPet = (petId?: number, itemIdx: number = 0) => {
    if (!petId) return new Map<number, number>();

    const globalCredits = new Map<number, number>();
    clientPackages.forEach((pkg) => {
      if (!pkg.is_active) return;
      pkg.credits.forEach((credit) => {
        if (credit.service_id && credit.remaining_qty > 0) {
          globalCredits.set(credit.id, credit.remaining_qty);
        }
      });
    });

    for (let i = 0; i < itemIdx; i++) {
      const prevItem = items[i];
      if (!prevItem?.pet_id) continue;
      const prevPetPkgs = clientPackages.filter(
        (pkg) => pkg.is_active && pkg.pets.some((p) => p.id === prevItem.pet_id)
      );
      (prevItem.service_ids || []).forEach((serviceId) => {
        for (const pkg of prevPetPkgs) {
          const credit = pkg.credits.find(
            (c) => c.service_id === serviceId && (globalCredits.get(c.id) || 0) > 0
          );
          if (credit) {
            globalCredits.set(credit.id, globalCredits.get(credit.id)! - 1);
            break;
          }
        }
      });
    }

    const map = new Map<number, number>();
    const thisPetPkgs = clientPackages.filter(
      (pkg) => pkg.is_active && pkg.pets.some((p) => p.id === petId)
    );
    thisPetPkgs.forEach((pkg) => {
      pkg.credits.forEach((credit) => {
        if (credit.service_id) {
          const avail = globalCredits.get(credit.id) || 0;
          if (avail > 0) {
            map.set(credit.service_id, (map.get(credit.service_id) || 0) + avail);
          }
        }
      });
    });
    return map;
  };

  // Grand total in cents
  const totalAppointmentCents = useMemo(() => {
    return items.reduce((total, item, idx) => {
      const creditsMap = getPackageCreditsForPet(item.pet_id, idx);
      const petTotal = (item.service_ids || []).reduce((acc, serviceId) => {
        const serv = services.find((s) => s.id === serviceId);
        if (!serv) return acc;
        const isPackage = (creditsMap.get(serviceId) || 0) > 0;
        return acc + (isPackage ? 0 : serv.price_cents);
      }, 0);
      return total + petTotal;
    }, 0);
  }, [items, services, clientPackages]);

  // Step 1 validation
  const [step1Error, setStep1Error] = useState<string | null>(null);
  const handleNextFromStep1 = () => {
    if (!watchedClientId) {
      setStep1Error("Por favor, selecione um cliente para continuar.");
      return;
    }
    if (!scheduledDate?.isValid() || !scheduledTime?.isValid()) {
      setStep1Error("Por favor, selecione a data e o horário.");
      return;
    }
    setStep1Error(null);

    // If client has pets and none added yet, add the first pet
    if (fields.length === 0) {
      if (currentClientPets.length > 0) {
        append({ pet_id: currentClientPets[0].id, service_ids: [] });
      }
    }
    setStep(2);
  };

  // Step 2 validation
  const [step2Error, setStep2Error] = useState<string | null>(null);
  const handleNextFromStep2 = () => {
    const validItems = items.filter(
      (item) => item.pet_id && item.service_ids && item.service_ids.length > 0
    );
    if (validItems.length === 0) {
      setStep2Error("Selecione ao menos um serviço para continuar.");
      return;
    }
    setStep2Error(null);
    setStep(3);
  };

  const handleFormSubmit = (data: any) => {
    const validItems = (data.items || []).filter(
      (i: any) => i.pet_id && i.service_ids && i.service_ids.length > 0
    );
    if (!isRecurrent) {
      delete data.recurrence;
    }
    onSubmit({
      ...data,
      items: validItems,
    } as AppointmentFormData);
  };

  return (
    <Box
      component="form"
      onSubmit={handleSubmit(handleFormSubmit)}
      sx={{
        display: "flex",
        flexDirection: "column",
        flex: 1,
        minHeight: "100%",
        bgcolor: "#F8FAFC",
      }}
    >
      {/* Step Progress Bar */}
      <Box
        sx={{
          px: 2,
          py: 1.25,
          bgcolor: "#FFFFFF",
          borderBottom: "1px solid",
          borderColor: "divider",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          boxShadow: "0 1px 2px rgba(0,0,0,0.03)",
        }}
      >
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
              fontWeight: 800,
              fontSize: "0.75rem",
            }}
          >
            {step}
          </Box>
          <Typography variant="body2" fontWeight={700} color="text.primary">
            {step === 1 && "Etapa 1 de 3 • Cliente e Horário"}
            {step === 2 && "Etapa 2 de 3 • Pets e Serviços"}
            {step === 3 && "Etapa 3 de 3 • Revisão e Finalizar"}
          </Typography>
        </Box>

        <Box sx={{ display: "flex", gap: 0.5 }}>
          {[1, 2, 3].map((s) => (
            <Box
              key={s}
              sx={{
                width: 18,
                height: 4,
                borderRadius: 1,
                bgcolor: s <= step ? "primary.main" : "#CBD5E1",
                transition: "all 0.2s ease",
              }}
            />
          ))}
        </Box>
      </Box>

      {/* Main Content Area */}
      <Box
        sx={{
          flex: 1,
          p: 2,
          pb: { xs: 12, sm: 10 },
          overflowY: "auto",
          WebkitOverflowScrolling: "touch",
        }}
      >
        {/* ============================================================ */}
        {/* ETAPA 1: CLIENTE E HORÁRIO */}
        {/* ============================================================ */}
        {step === 1 && (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
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
                      bgcolor: "#FFFFFF",
                      flexShrink: 0,
                    }}
                    title="Criar Novo Cliente"
                  >
                    <Plus size={20} />
                  </IconButton>
                )}
              </Box>
            </Box>

            {/* Data e Horário */}
            <Box sx={{ mt: 1.5 }}>
              <Typography
                variant="caption"
                fontWeight={700}
                color="text.secondary"
                sx={{ mb: 1.25, display: "block" }}
              >
                DATA E HORÁRIO
              </Typography>
              <LocalizationProvider
                dateAdapter={AdapterDayjs}
                adapterLocale="pt-br"
                localeText={ptBRPickers.components.MuiLocalizationProvider.defaultProps.localeText}
              >
                <Box sx={{ display: "flex", flexDirection: "column", gap: 1.75 }}>
                  <DatePicker
                    label="Data do Agendamento"
                    format="DD/MM/YYYY"
                    value={scheduledDate}
                    orientation="portrait"
                    onChange={(newDate) => setScheduledDate(newDate)}
                    onMonthChange={(newMonth) => setCalendarMonth(newMonth.startOf("month"))}
                    shouldDisableDate={(date) => {
                      if (!workingHours) return false;
                      return workingHours[String(date.day())]?.is_open === false;
                    }}
                    dayOfWeekFormatter={(day: dayjs.Dayjs) => {
                      const days = ["dom", "seg", "ter", "qua", "qui", "sex", "sab"];
                      return days[day.day()];
                    }}
                    slots={{
                      day: CustomDay,
                      toolbar: CustomDatePickerToolbar,
                    }}
                    slotProps={{
                      day: {
                        highlightedDays,
                      } as any,
                      layout: {
                        sx: {
                          display: "flex",
                          flexDirection: "column",
                          overflow: "hidden",
                        },
                      },
                      dialog: {
                        sx: {
                          "& .MuiDialog-paper": {
                            borderRadius: 3,
                            overflow: "hidden",
                            maxWidth: "calc(100vw - 32px)",
                            m: "auto",
                          },
                          "& .MuiPickersLayout-root": {
                            display: "flex",
                            flexDirection: "column",
                            overflow: "hidden",
                            maxWidth: "100%",
                          },
                          "& .MuiPickersLayout-contentWrapper": {
                            overflow: "hidden",
                            display: "flex",
                            justifyContent: "center",
                          },
                          "& .MuiDateCalendar-root": {
                            width: "100%",
                            maxWidth: 320,
                            margin: "0 auto",
                          },
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
                      textField: {
                        size: "medium",
                        fullWidth: true,
                        sx: { bgcolor: "#FFFFFF", borderRadius: 2 },
                      },
                    }}
                  />

                  <DesktopTimePicker
                    label="Horário"
                    value={scheduledTime}
                    ampm={false}
                    referenceDate={dayjs().hour(8).minute(0)}
                    minutesStep={5}
                    minTime={(() => {
                      if (!workingHours || !scheduledDate?.isValid()) return undefined;
                      const s = workingHours[String(scheduledDate.day())];
                      if (!s?.is_open) return undefined;
                      const [h, m] = s.open.split(":").map(Number);
                      return dayjs().hour(h).minute(m).second(0);
                    })()}
                    maxTime={(() => {
                      if (!workingHours || !scheduledDate?.isValid()) return undefined;
                      const s = workingHours[String(scheduledDate.day())];
                      if (!s?.is_open) return undefined;
                      const [h, m] = s.close.split(":").map(Number);
                      return dayjs().hour(h).minute(m).second(0);
                    })()}
                    open={timePickerOpen}
                    onOpen={() => {
                      pendingTimeCloseRef.current = false;
                      setTimePickerOpen(true);
                    }}
                    onClose={() => setTimePickerOpen(false)}
                    onChange={(newTime) => {
                      setScheduledTime(newTime);
                      if (pendingTimeCloseRef.current) {
                        setTimePickerOpen(false);
                      }
                    }}
                    onAccept={() => {
                      setTimePickerOpen(false);
                      pendingTimeCloseRef.current = false;
                    }}
                    slotProps={{
                      textField: {
                        size: "medium",
                        fullWidth: true,
                        placeholder: "--:--",
                        sx: {
                          bgcolor: "#FFFFFF",
                          borderRadius: 2,
                          "& .MuiInputBase-input": {
                            color: "#1E293B",
                            WebkitTextFillColor: "#1E293B",
                          },
                        },
                      },
                      actionBar: { actions: [] },
                      popper: {
                        onClick: () => {
                          if (pendingTimeCloseRef.current) {
                            setTimePickerOpen(false);
                            pendingTimeCloseRef.current = false;
                          }
                        },
                        sx: {
                          zIndex: 1400,
                          "& .MuiMultiSectionDigitalClock-root": {
                            maxHeight: 260,
                            backgroundColor: "#FFFFFF",
                          },
                          "& .MuiMultiSectionDigitalClockSection-root": {
                            maxHeight: 260,
                            width: 60,
                            scrollbarWidth: "none",
                            msOverflowStyle: "none",
                            "&::-webkit-scrollbar": { display: "none" },
                          },
                          "& .MuiMultiSectionDigitalClockSection-item": {
                            minHeight: "unset",
                            py: "5px",
                            fontSize: "0.85rem",
                            color: "#1E293B",
                            "&.Mui-selected": {
                              backgroundColor: "primary.main",
                              color: "#FFFFFF",
                              fontWeight: 700,
                            },
                            "&.Mui-disabled": {
                              color: "#94A3B8",
                            },
                          },
                          "& .MuiPaper-root": {
                            maxHeight: 300,
                            backgroundColor: "#FFFFFF",
                            boxShadow: "0px 8px 24px rgba(0, 0, 0, 0.12)",
                            borderRadius: 2,
                            border: "1px solid #E2E8F0",
                          },
                        },
                      },
                    }}
                  />
                </Box>
              </LocalizationProvider>
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
                  const petObj = pets.find((p) => p.id === petId) || allPets.find((p) => p.id === petId);
                  const selectedServiceIds = items[index]?.service_ids || [];
                  const petServices = services.filter((s) => selectedServiceIds.includes(s.id));
                  const creditsMap = getPackageCreditsForPet(petId, index);

                  const petSubtotalCents = petServices.reduce((acc, s) => {
                    const isPackage = (creditsMap.get(s.id) || 0) > 0;
                    return acc + (isPackage ? 0 : s.price_cents);
                  }, 0);

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

                      {/* Services summary */}
                      <Box>
                        {petServices.length === 0 ? (
                          <Typography variant="body2" color="error.main" sx={{ fontStyle: "italic", fontSize: "0.85rem" }}>
                            Nenhum serviço selecionado ainda.
                          </Typography>
                        ) : (
                          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.75 }}>
                            {petServices.map((serv) => {
                              const isPackage = (creditsMap.get(serv.id) || 0) > 0;
                              return (
                                <Chip
                                  key={serv.id}
                                  size="small"
                                  label={`${serv.name} • ${isPackage ? "Pacote" : formatPrice(serv.price_cents)}`}
                                  sx={{
                                    bgcolor: isPackage ? "rgba(46, 125, 50, 0.08)" : "rgba(49, 52, 133, 0.08)",
                                    color: isPackage ? "success.dark" : "primary.dark",
                                    fontWeight: 700,
                                    fontSize: "0.75rem",
                                  }}
                                />
                              );
                            })}
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
        {/* ETAPA 3: REVISÃO E FINALIZAR */}
        {/* ============================================================ */}
        {step === 3 && (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
            {/* Card de Resumo */}
            <Box
              sx={{
                bgcolor: "#FFFFFF",
                border: "1.5px solid",
                borderColor: "primary.main",
                borderRadius: 2.5,
                p: 2,
                boxShadow: "0 4px 14px rgba(49, 52, 133, 0.08)",
                display: "flex",
                flexDirection: "column",
                gap: 1.5,
              }}
            >
              <Typography variant="h6" fontWeight={800} color="primary.main" sx={{ fontSize: "1.05rem" }}>
                Resumo do Agendamento
              </Typography>

              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <User size={18} color="#64748B" />
                <Typography variant="body2" fontWeight={700} color="text.primary">
                  {currentClient?.name}
                </Typography>
                {currentClient?.phone && (
                  <Typography variant="caption" color="text.secondary">
                    ({currentClient.phone})
                  </Typography>
                )}
              </Box>

              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <Calendar size={18} color="#64748B" />
                <Typography variant="body2" fontWeight={600} color="text.primary">
                  {scheduledDate?.format("dddd, DD/MM/YYYY")}
                </Typography>
                <Clock size={16} color="#64748B" style={{ marginLeft: 8 }} />
                <Typography variant="body2" fontWeight={700} color="text.primary">
                  {scheduledTime?.format("HH:mm")}
                </Typography>
              </Box>

              <Box sx={{ pt: 1, borderTop: "1px dashed #E2E8F0" }}>
                <Typography variant="caption" fontWeight={700} color="text.secondary" sx={{ mb: 0.5, display: "block" }}>
                  PETS E SERVIÇOS:
                </Typography>
                {items
                  .filter((item) => item.service_ids && item.service_ids.length > 0)
                  .map((item, idx) => {
                    const pet = pets.find((p) => p.id === item.pet_id) || allPets.find((p) => p.id === item.pet_id);
                    const selectedServs = services.filter((s) => (item.service_ids || []).includes(s.id));
                    return (
                      <Box key={idx} sx={{ mb: 1 }}>
                        <Typography variant="body2" fontWeight={700} color="text.primary">
                          🐾 {pet?.name || "Pet"}
                        </Typography>
                        {selectedServs.map((s) => (
                          <Typography key={s.id} variant="caption" color="text.secondary" sx={{ display: "block", pl: 2 }}>
                            • {s.name} ({formatPrice(s.price_cents)})
                          </Typography>
                        ))}
                      </Box>
                    );
                  })}
              </Box>

              <Box sx={{ pt: 1, borderTop: "1px solid #E2E8F0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <Typography variant="body1" fontWeight={800} color="text.primary">
                  Valor Total Previsto:
                </Typography>
                <Typography variant="h6" fontWeight={900} color="primary.main">
                  {formatPrice(totalAppointmentCents)}
                </Typography>
              </Box>
            </Box>

            {/* Observações */}
            <Box>
              <Typography variant="caption" fontWeight={700} color="text.secondary" sx={{ mb: 0.5, display: "block" }}>
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
                    placeholder="Anotações especiais sobre o pet ou agendamento..."
                    fullWidth
                    sx={{ bgcolor: "#FFFFFF", borderRadius: 2 }}
                  />
                )}
              />
            </Box>

            {/* Recorrência */}
            <Box sx={{ bgcolor: "#FFFFFF", p: 2, borderRadius: 2.5, border: "1px solid #E2E8F0" }}>
              <FormControlLabel
                control={
                  <Switch
                    checked={isRecurrent}
                    onChange={(e) => {
                      const checked = e.target.checked;
                      setIsRecurrent(checked);
                      if (!checked) {
                        setValue("recurrence", undefined);
                      } else {
                        setValue("recurrence", defaultValues?.recurrence || { frequency: "weekly", occurrences: 4 });
                      }
                    }}
                    color="primary"
                  />
                }
                label={
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <Repeat size={18} color="#313485" />
                    <Typography variant="body2" fontWeight={700}>
                      Repetir agendamento
                    </Typography>
                  </Box>
                }
              />

              {isRecurrent && (
                <Box sx={{ mt: 1.5, pl: 4, display: "flex", flexDirection: "column", gap: 1.5 }}>
                  <Box>
                    <Typography variant="caption" fontWeight={600} color="text.secondary">
                      Frequência:
                    </Typography>
                    <Controller
                      name="recurrence.frequency"
                      control={control}
                      render={({ field }) => (
                        <Select {...field} size="small" fullWidth sx={{ mt: 0.5 }}>
                          <MenuItem value="weekly">Semanal</MenuItem>
                          <MenuItem value="biweekly">Quinzenal</MenuItem>
                          <MenuItem value="monthly">Mensal</MenuItem>
                        </Select>
                      )}
                    />
                  </Box>

                  <Box>
                    <Typography variant="caption" fontWeight={600} color="text.secondary">
                      Término:
                    </Typography>
                    <RadioGroup
                      value={recurrenceEndType}
                      onChange={(e) => {
                        const val = e.target.value as "occurrences" | "never";
                        setRecurrenceEndType(val);
                        if (val === "never") {
                          const freq = form.getValues("recurrence.frequency") || "weekly";
                          const max = freq === "weekly" ? 52 : freq === "biweekly" ? 26 : 12;
                          setValue("recurrence.occurrences", max);
                        } else {
                          setValue("recurrence.occurrences", 4);
                        }
                      }}
                    >
                      <FormControlLabel
                        value="occurrences"
                        control={<Radio size="small" />}
                        label={
                          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                            <Typography variant="body2">Após</Typography>
                            <Controller
                              name="recurrence.occurrences"
                              control={control}
                              render={({ field }) => (
                                <Select
                                  {...field}
                                  size="small"
                                  disabled={recurrenceEndType !== "occurrences"}
                                  sx={{ width: 80, height: 32 }}
                                >
                                  {[2, 3, 4, 6, 8, 12].map((num) => (
                                    <MenuItem key={num} value={num}>
                                      {num}x
                                    </MenuItem>
                                  ))}
                                </Select>
                              )}
                            />
                            <Typography variant="body2">repetições</Typography>
                          </Box>
                        }
                      />
                      <FormControlLabel
                        value="never"
                        control={<Radio size="small" />}
                        label={<Typography variant="body2">Nunca (contínuo)</Typography>}
                      />
                    </RadioGroup>
                  </Box>
                </Box>
              )}
            </Box>
          </Box>
        )}
      </Box>

      {/* Sticky Bottom Action Bar */}
      <Box
        sx={{
          position: "fixed",
          bottom: 0,
          left: 0,
          right: 0,
          bgcolor: "#FFFFFF",
          borderTop: "1px solid",
          borderColor: "divider",
          p: 1.5,
          pb: "calc(12px + env(safe-area-inset-bottom, 0px))",
          boxShadow: "0 -4px 16px rgba(0,0,0,0.06)",
          zIndex: 1100,
          display: "flex",
          alignItems: "center",
          gap: 1.5,
        }}
      >
        {step === 1 && (
          <>
            {onClose && (
              <Button
                variant="outlined"
                onClick={onClose}
                sx={{ minWidth: 90, minHeight: 48, borderRadius: 2 }}
              >
                Cancelar
              </Button>
            )}
            <Button
              fullWidth
              variant="contained"
              onClick={handleNextFromStep1}
              endIcon={<ArrowRight size={18} />}
              sx={{
                minHeight: 48,
                borderRadius: 2,
                fontWeight: 700,
                fontSize: "1rem",
                boxShadow: "0 4px 12px rgba(49, 52, 133, 0.25)",
              }}
            >
              Próximo (Pets & Serviços)
            </Button>
          </>
        )}

        {step === 2 && (
          <>
            <Button
              variant="outlined"
              onClick={() => setStep(1)}
              startIcon={<ArrowLeft size={18} />}
              sx={{ minWidth: 90, minHeight: 48, borderRadius: 2 }}
            >
              Voltar
            </Button>
            <Button
              fullWidth
              variant="contained"
              onClick={handleNextFromStep2}
              endIcon={<ArrowRight size={18} />}
              sx={{
                minHeight: 48,
                borderRadius: 2,
                fontWeight: 700,
                fontSize: "1rem",
                boxShadow: "0 4px 12px rgba(49, 52, 133, 0.25)",
              }}
            >
              Próximo (Revisão)
            </Button>
          </>
        )}

        {step === 3 && (
          <>
            <Button
              variant="outlined"
              onClick={() => setStep(2)}
              startIcon={<ArrowLeft size={18} />}
              disabled={isSubmitting}
              sx={{ minWidth: 90, minHeight: 48, borderRadius: 2 }}
            >
              Voltar
            </Button>
            <Button
              fullWidth
              variant="contained"
              loading={isSubmitting}
              type="submit"
              startIcon={<CheckCircle size={18} />}
              sx={{
                minHeight: 48,
                borderRadius: 2,
                fontWeight: 700,
                fontSize: "1rem",
                boxShadow: "0 4px 12px rgba(49, 52, 133, 0.25)",
              }}
            >
              {mode === "create" ? "Criar Agendamento" : "Salvar Alterações"}
            </Button>
          </>
        )}
      </Box>

      {/* Sub-modals/Drawers */}
      <ClientPickerDrawer
        open={clientPickerOpen}
        onClose={() => setClientPickerOpen(false)}
        clients={clients}
        allPets={allPets}
        selectedClientId={watchedClientId}
        onSelectClient={(client) => {
          setValue("client_id", client.id);
          setClientId(client.id);
          setStep1Error(null);
          const clientPets = allPets.filter((p) => p.client_id === client.id && !p.is_deceased);
          if (clientPets.length > 0) {
            populatedClientIdRef.current = client.id;
            replace(clientPets.map((p) => ({ pet_id: p.id, service_ids: [] })));
          } else {
            replace([]);
          }
        }}
        onCreateClient={onCreateClient}
      />

      <PetPickerDrawer
        open={petPickerOpen}
        onClose={() => setPetPickerOpen(false)}
        client={currentClient}
        availablePets={availableUnselectedPets}
        onSelectPet={(pet) => {
          append({ pet_id: pet.id, service_ids: [] });
          setStep2Error(null);
        }}
        onCreatePet={() => {
          if (onCreatePet) {
            onCreatePet(fields.length, watchedClientId ?? 0);
          }
        }}
      />

      <ServicePickerDrawer
        open={servicePickerOpen}
        onClose={() => setServicePickerOpen(false)}
        pet={pets.find((p) => p.id === items[activePetIndex]?.pet_id)}
        services={services}
        initialSelectedServiceIds={items[activePetIndex]?.service_ids || []}
        packageCreditsByServiceId={getPackageCreditsForPet(items[activePetIndex]?.pet_id, activePetIndex)}
        onConfirm={(serviceIds) => {
          setValue(`items.${activePetIndex}.service_ids`, serviceIds);
          setStep2Error(null);
        }}
        onCreateService={() => {
          if (onCreateService) {
            onCreateService(activePetIndex);
          }
        }}
      />
    </Box>
  );
}
