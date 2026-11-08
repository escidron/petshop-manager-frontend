import { useState, useEffect, useMemo, useRef } from "react";
import {
  Autocomplete,
  Box,
  Checkbox,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  FormControlLabel,
  FormLabel,
  IconButton,
  Switch,
  TextField,
  Typography,
  alpha,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { DesktopTimePicker } from "@mui/x-date-pickers/DesktopTimePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { ptBR as ptBRPickers } from "@mui/x-date-pickers/locales";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import {
  BedDouble,
  CalendarRange,
  Pill,
  Plus,
  Sun,
  Trash2,
  Utensils,
  X,
} from "lucide-react";
import dayjs, { type Dayjs } from "dayjs";
import "dayjs/locale/pt-br";
import { useQuery, useQueryClient } from "@tanstack/react-query";

import {
  createDaycareStay,
  listDaycareHighlightedDays,
  listDaycareModalities,
  listDaycarePackages,
  updateDaycareStay,
} from "../../api/services/daycare";
import { useClients } from "../../hooks/useClients";
import { useClient } from "../../hooks/useClient";
import { usePets } from "../../hooks/usePets";
import { useToast } from "../../hooks/useToast";
import { Button } from "../../components/Button/Button";
import CustomTextField from "../../components/Textfield/CustomTextfield";
import { CustomDay } from "../dashboard/DashboardCalendar";
import { formatBRLFromCents } from "../../utils/masks";

import ClientFormModal from "../clients/ClientFormModal";
import PetFormModal from "../pets/PetFormModal";
import DaycareServiceFormModal from "./DaycareServiceFormModal";
import DaycarePackageFormModal from "./DaycarePackageFormModal";

import type {
  DaycareModality,
  DaycarePackage,
  DaycareStay,
  DaycareStayType,
  DaycareTaskCreatePayload,
} from "./types";
import type { Client } from "../clients/types";
import type { Pet } from "../pets/types";

dayjs.locale("pt-br");

type BookingMode = "single" | "package" | "hotel";

const WEEKDAY_OPTIONS = [
  { day: 1, label: "Seg", fullName: "Segunda-feira" },
  { day: 2, label: "Ter", fullName: "Terça-feira" },
  { day: 3, label: "Qua", fullName: "Quarta-feira" },
  { day: 4, label: "Qui", fullName: "Quinta-feira" },
  { day: 5, label: "Sex", fullName: "Sexta-feira" },
  { day: 6, label: "Sáb", fullName: "Sábado" },
  { day: 0, label: "Dom", fullName: "Domingo" },
];

const BOOKING_MODES: {
  id: BookingMode;
  title: string;
  subtitle: string;
  icon: typeof Sun;
  color: string;
}[] = [
  {
    id: "single",
    title: "Diária Avulsa",
    subtitle: "1 dia ou adaptação",
    icon: Sun,
    color: "#ea580c",
  },
  {
    id: "package",
    title: "Pacote Mensal",
    subtitle: "Dias fixos na semana",
    icon: CalendarRange,
    color: "#4f46e5",
  },
  {
    id: "hotel",
    title: "Hospedagem / Hotel",
    subtitle: "Pernoite / vários dias",
    icon: BedDouble,
    color: "#0284c7",
  },
];

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

function parseTimeToDayjs(timeStr?: string): Dayjs | null {
  if (!timeStr || !timeStr.includes(":")) return null;
  const [h, m] = timeStr.split(":").map(Number);
  if (Number.isNaN(h) || Number.isNaN(m)) return null;
  return dayjs().hour(h).minute(m).second(0).millisecond(0);
}

type Props = {
  open: boolean;
  mode: "create" | "edit";
  stay?: DaycareStay | null;
  initialDate?: string;
  onClose: () => void;
  onSuccess: () => void;
};

export default function DaycareModal({
  open,
  mode,
  stay,
  initialDate,
  onClose,
  onSuccess,
}: Props) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const toast = useToast();
  const queryClient = useQueryClient();

  const { clients } = useClients();
  const { pets: allPets } = usePets();

  const [clientListLimit, setClientListLimit] = useState(20);
  const [petListLimit, setPetListLimit] = useState(20);
  const [serviceListLimit, setServiceListLimit] = useState(20);
  const clientInputRef = useRef<HTMLInputElement>(null);

  // 1. Cliente & Pet (1 Pet por agendamento)
  const [selectedClientId, setSelectedClientId] = useState<number | null>(
    stay?.client_id ?? null
  );
  const [selectedPetId, setSelectedPetId] = useState<number | null>(
    stay?.pet_id ?? null
  );

  const { pets, setClientId, refetchPets, loadedClientId } = useClient(
    selectedClientId ?? undefined
  );

  const clientPets = useMemo(
    () => (pets || []).filter((p) => !p.is_deceased || p.id === selectedPetId),
    [pets, selectedPetId]
  );

  const currentPet = useMemo(
    () => clientPets.find((p) => p.id === selectedPetId) ?? null,
    [clientPets, selectedPetId]
  );

  // 2. Tipo de Atendimento (Avulso | Pacote Mensal | Hospedagem) — nenhum marcado por padrão na criação
  const [bookingMode, setBookingMode] = useState<BookingMode | null>(null);

  // 3. Modalidade ou Pacote selecionado
  const [selectedModalityId, setSelectedModalityId] = useState<number | null>(
    stay?.modality_id ?? null
  );
  const [selectedPackageId, setSelectedPackageId] = useState<number | null>(
    stay?.package_id ?? null
  );
  const [showAllModalities, setShowAllModalities] = useState<boolean>(false);

  // 4. Datas e Horários
  const [scheduledDate, setScheduledDate] = useState<Dayjs | null>(dayjs());
  const [checkoutDate, setCheckoutDate] = useState<Dayjs | null>(
    dayjs().add(1, "day")
  );
  const [entryTime, setEntryTime] = useState<Dayjs | null>(
    dayjs().hour(8).minute(0).second(0)
  );
  const [exitTime, setExitTime] = useState<Dayjs | null>(
    dayjs().hour(18).minute(0).second(0)
  );

  const [calendarMonth, setCalendarMonth] = useState<Dayjs>(
    dayjs().startOf("month")
  );

  // 5. Dias da semana (Modo Pacote Mensal)
  const [selectedWeekdays, setSelectedWeekdays] = useState<number[]>([]);

  // 6. Observações e Rotina (simplificados para o Pet selecionado)
  const [notes, setNotes] = useState<string>("");
  const [hasRoutine, setHasRoutine] = useState<boolean>(false);
  const [tasks, setTasks] = useState<DaycareTaskCreatePayload[]>([]);

  // Submodais de criação rápida
  const [clientModalOpen, setClientModalOpen] = useState(false);
  const [petModalOpen, setPetModalOpen] = useState(false);
  const [serviceModalOpen, setServiceModalOpen] = useState(false);
  const [packageModalOpen, setPackageModalOpen] = useState(false);

  const [submitting, setSubmitting] = useState(false);

  const { data: modalities = [] } = useQuery<DaycareModality[]>({
    queryKey: ["daycare", "modalities"],
    queryFn: () => listDaycareModalities(false),
    enabled: open,
  });

  const { data: daycarePackages = [] } = useQuery<DaycarePackage[]>({
    queryKey: ["daycare", "packages"],
    queryFn: () => listDaycarePackages(true),
    enabled: open,
  });

  const activeModalities = useMemo(
    () => (modalities || []).filter((m) => m.is_active !== false),
    [modalities]
  );

  const activePackages = useMemo(
    () =>
      (daycarePackages || []).filter(
        (p) => p.is_active !== false && p.is_monthly !== false
      ),
    [daycarePackages]
  );

  const sortedAndFilteredModalities = useMemo(() => {
    if (showAllModalities || !currentPet) {
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
        (petSpecies &&
          m.species.some((sp) => sp.trim().toLowerCase() === petSpecies));

      return sizeMatch && speciesMatch;
    };

    const matching = activeModalities.filter(matchesPet);
    if (matching.length === 0) {
      return activeModalities;
    }

    const nonMatching = activeModalities.filter((m) => !matchesPet(m));
    return [...matching, ...nonMatching];
  }, [activeModalities, currentPet, showAllModalities]);

  const selectedModality = useMemo(
    () => activeModalities.find((m) => m.id === selectedModalityId) ?? null,
    [activeModalities, selectedModalityId]
  );

  const selectedPackage = useMemo(
    () => activePackages.find((p) => p.id === selectedPackageId) ?? null,
    [activePackages, selectedPackageId]
  );

  const startDate = calendarMonth
    .subtract(1, "month")
    .startOf("month")
    .format("YYYY-MM-DD");
  const endDate = calendarMonth
    .add(1, "month")
    .endOf("month")
    .format("YYYY-MM-DD");

  const { data: highlightedData = [] } = useQuery({
    queryKey: ["daycare", "highlights", calendarMonth.format("YYYY-MM")],
    queryFn: () => listDaycareHighlightedDays(startDate, endDate),
    staleTime: 1000 * 60 * 5,
    enabled: open,
  });

  const highlightedDays = useMemo(
    () => new Set<string>(highlightedData),
    [highlightedData]
  );

  // Autofoco no campo cliente ao abrir modal em modo criar
  useEffect(() => {
    if (open && mode === "create" && !selectedClientId) {
      const timer = setTimeout(() => {
        clientInputRef.current?.focus();
      }, 70);
      return () => clearTimeout(timer);
    }
  }, [open, mode, selectedClientId]);

  // Inicialização ao abrir modal ou trocar stay
  useEffect(() => {
    if (!open) return;

    if (mode === "edit" && stay) {
      setSelectedClientId(stay.client_id);
      setClientId(stay.client_id);
      setSelectedPetId(stay.pet_id);
      setSelectedModalityId(stay.modality_id ?? null);
      setSelectedPackageId(stay.package_id ?? null);
      setShowAllModalities(false);

      const start = dayjs(stay.scheduled_start_at);
      const end = dayjs(stay.scheduled_end_at);
      setScheduledDate(start);
      setCheckoutDate(end.isAfter(start, "day") ? end : start.add(1, "day"));
      setEntryTime(start);
      setExitTime(end);
      setCalendarMonth(start.startOf("month"));

      if (stay.stay_type === "multi_day" || end.isAfter(start, "day")) {
        setBookingMode("hotel");
      } else if (stay.package_id) {
        setBookingMode("package");
      } else {
        setBookingMode("single");
      }

      setNotes(stay.notes || "");

      const mappedTasks: DaycareTaskCreatePayload[] = (stay.tasks || []).map(
        (t) => ({
          task_type: t.task_type,
          scheduled_time: t.scheduled_time,
          title: t.title,
          notes: t.notes ?? undefined,
        })
      );
      setTasks(mappedTasks);
      setHasRoutine(Boolean(stay.food_info || mappedTasks.length > 0));
    } else {
      const base = initialDate ? dayjs(initialDate) : dayjs();
      setSelectedClientId(null);
      setSelectedPetId(null);
      setBookingMode(null);
      setSelectedModalityId(null);
      setSelectedPackageId(null);
      setShowAllModalities(false);
      setScheduledDate(base);
      setCheckoutDate(base.add(1, "day"));
      setEntryTime(base.hour(8).minute(0).second(0));
      setExitTime(base.hour(18).minute(0).second(0));
      setCalendarMonth(base.startOf("month"));
      setNotes("");
      setTasks([]);
      setHasRoutine(false);
      setSelectedWeekdays([]);
    }
  }, [open, mode, stay, initialDate, setClientId]);

  // Auto-seleciona o primeiro pet do cliente quando o cliente é escolhido
  const populatedClientIdRef = useRef<number | null>(null);
  useEffect(() => {
    if (!open || mode !== "create") return;
    if (!selectedClientId) {
      populatedClientIdRef.current = null;
      return;
    }

    if (
      loadedClientId === selectedClientId &&
      populatedClientIdRef.current !== selectedClientId
    ) {
      populatedClientIdRef.current = selectedClientId;
      const available = (pets || []).filter((p) => !p.is_deceased);
      if (available.length > 0) {
        setSelectedPetId(available[0].id);
      } else {
        setSelectedPetId(null);
      }
    }
  }, [selectedClientId, loadedClientId, pets, mode, open]);

  // Ajusta horários padrão ao alternar entre Creche e Hotel
  const handleSelectBookingMode = (nextMode: BookingMode) => {
    setBookingMode(nextMode);
    if (nextMode === "hotel") {
      if (
        scheduledDate &&
        (!checkoutDate || !checkoutDate.isAfter(scheduledDate, "day"))
      ) {
        setCheckoutDate(scheduledDate.add(1, "day"));
      }
      setEntryTime((prev) => (prev ? prev.hour(9).minute(0) : dayjs().hour(9).minute(0)));
      setExitTime((prev) => (prev ? prev.hour(11).minute(0) : dayjs().hour(11).minute(0)));
    } else {
      setEntryTime((prev) => (prev ? prev.hour(8).minute(0) : dayjs().hour(8).minute(0)));
      setExitTime((prev) => (prev ? prev.hour(18).minute(0) : dayjs().hour(18).minute(0)));
    }
  };

  // Quando seleciona um pacote mensal, se houver mais dias marcados do que a frequência do pacote, ajusta
  const handleChangePackage = (pkg: DaycarePackage | null) => {
    setSelectedPackageId(pkg ? pkg.id : null);
    if (pkg?.is_monthly && pkg.frequency && selectedWeekdays.length > pkg.frequency) {
      setSelectedWeekdays((prev) => prev.slice(0, pkg.frequency!));
    }
  };

  const snapDateToNextAllowedWeekday = (
    baseDate: Dayjs | null,
    allowedDays: number[]
  ): Dayjs => {
    const start = baseDate?.isValid() ? baseDate : dayjs();
    if (allowedDays.length === 0) return start;
    if (allowedDays.includes(start.day())) return start;
    for (let i = 1; i <= 7; i++) {
      const candidate = start.add(i, "day");
      if (allowedDays.includes(candidate.day())) {
        return candidate;
      }
    }
    return start;
  };

  const toggleWeekday = (dayNum: number) => {
    setSelectedWeekdays((prev) => {
      let next: number[];
      if (prev.includes(dayNum)) {
        next = prev.filter((d) => d !== dayNum);
      } else {
        if (
          selectedPackage?.is_monthly &&
          selectedPackage.frequency &&
          prev.length >= selectedPackage.frequency
        ) {
          toast.info(
            `Este pacote permite até ${selectedPackage.frequency} dia(s) por semana. Desmarque um dia para escolher outro.`
          );
          return prev;
        }
        next = [...prev, dayNum].sort((a, b) => a - b);
      }

      if (next.length > 0) {
        setScheduledDate((cur) => snapDateToNextAllowedWeekday(cur, next));
      }
      return next;
    });
  };

  // Cálculo de diárias/noites no modo Hospedagem / Hotel
  const hotelNights = useMemo(() => {
    if (!scheduledDate?.isValid() || !checkoutDate?.isValid()) return 1;
    const diff = checkoutDate
      .startOf("day")
      .diff(scheduledDate.startOf("day"), "day");
    return Math.max(1, diff);
  }, [scheduledDate, checkoutDate]);

  // Sincronização de horário de entrada e saída (modo dia único / pacote)
  const handleEntryTimeChange = (newTime: Dayjs | null) => {
    setEntryTime(newTime);
    if (
      bookingMode !== "hotel" &&
      newTime &&
      exitTime &&
      !exitTime.isAfter(newTime)
    ) {
      setExitTime(newTime.add(4, "hour"));
    }
  };

  // Criações rápidas via submodais
  const handleClientCreated = (client: Client) => {
    queryClient.invalidateQueries({ queryKey: ["clients"] });
    setSelectedClientId(client.id);
    setClientId(client.id);
    populatedClientIdRef.current = null;
  };

  const handlePetCreated = (pet: Pet) => {
    queryClient.invalidateQueries({ queryKey: ["pets"] });
    refetchPets();
    setSelectedPetId(pet.id);
  };

  const handleServiceCreated = (modality: DaycareModality) => {
    queryClient.invalidateQueries({ queryKey: ["daycare", "modalities"] });
    setSelectedModalityId(modality.id);
  };

  const handlePackageCreated = (pkg: DaycarePackage) => {
    queryClient.invalidateQueries({ queryKey: ["daycare", "packages"] });
    handleChangePackage(pkg);
  };

  // Rotina de Alimentação e Medicação
  const feedingTasks = useMemo(
    () => tasks.filter((t) => t.task_type === "feeding"),
    [tasks]
  );

  const medicationTasks = useMemo(
    () => tasks.filter((t) => t.task_type === "medication"),
    [tasks]
  );

  const handleToggleRoutine = (enabled: boolean) => {
    setHasRoutine(enabled);
    if (enabled) {
      setTasks((prev) => {
        const hasFeeding = prev.some((t) => t.task_type === "feeding");
        const hasMed = prev.some((t) => t.task_type === "medication");
        const next = [...prev];
        if (!hasFeeding) {
          next.unshift({
            task_type: "feeding",
            scheduled_time: "12:00",
            title: "",
            notes: "",
          });
        }
        if (!hasMed) {
          next.push({
            task_type: "medication",
            scheduled_time: "14:00",
            title: "",
            notes: "",
          });
        }
        return next;
      });
    }
  };

  const handleAddFeedingTask = () => {
    setTasks((prev) => [
      ...prev,
      {
        task_type: "feeding",
        scheduled_time: "12:00",
        title: "",
        notes: "",
      },
    ]);
  };

  const handleAddMedicationTask = () => {
    setTasks((prev) => [
      ...prev,
      {
        task_type: "medication",
        scheduled_time: "14:00",
        title: "",
        notes: "",
      },
    ]);
  };

  const handleUpdateFeedingTask = (
    subIndex: number,
    field: "scheduled_time" | "title" | "notes",
    value: string
  ) => {
    setTasks((prev) => {
      let count = 0;
      return prev.map((item) => {
        if (item.task_type === "feeding") {
          if (count === subIndex) {
            count++;
            return { ...item, [field]: value };
          }
          count++;
        }
        return item;
      });
    });
  };

  const handleRemoveFeedingTask = (subIndex: number) => {
    setTasks((prev) => {
      let count = 0;
      return prev.filter((item) => {
        if (item.task_type === "feeding") {
          const match = count === subIndex;
          count++;
          return !match;
        }
        return true;
      });
    });
  };

  const handleUpdateMedicationTask = (
    subIndex: number,
    field: "scheduled_time" | "title" | "notes",
    value: string
  ) => {
    setTasks((prev) => {
      let count = 0;
      return prev.map((item) => {
        if (item.task_type === "medication") {
          if (count === subIndex) {
            count++;
            return { ...item, [field]: value };
          }
          count++;
        }
        return item;
      });
    });
  };

  const handleRemoveMedicationTask = (subIndex: number) => {
    setTasks((prev) => {
      let count = 0;
      return prev.filter((item) => {
        if (item.task_type === "medication") {
          const match = count === subIndex;
          count++;
          return !match;
        }
        return true;
      });
    });
  };

  // Submissão do agendamento
  const handleSubmit = async () => {
    if (!selectedClientId) {
      toast.error("Selecione um cliente.");
      return;
    }

    if (!selectedPetId) {
      toast.error("Selecione o pet.");
      return;
    }

    if (!bookingMode) {
      toast.error("Selecione o tipo de atendimento.");
      return;
    }

    if (!scheduledDate?.isValid()) {
      toast.error("Informe a data de entrada/início.");
      return;
    }

    if (bookingMode !== "package") {
      if (!entryTime?.isValid()) {
        toast.error("Informe o horário de entrada.");
        return;
      }

      if (!exitTime?.isValid()) {
        toast.error("Informe o horário de saída.");
        return;
      }
    }

    if (bookingMode === "package") {
      if (!selectedPackageId || !selectedPackage) {
        toast.error("Selecione um pacote da creche.");
        return;
      }
      if (selectedWeekdays.length === 0) {
        toast.error("Selecione os dias da semana do pacote.");
        return;
      }
      if (
        selectedPackage.is_monthly &&
        selectedPackage.frequency &&
        selectedWeekdays.length !== selectedPackage.frequency
      ) {
        toast.error(
          `O pacote "${selectedPackage.name}" exige exatamente ${selectedPackage.frequency} dia(s) na semana.`
        );
        return;
      }
    } else {
      if (!selectedModalityId || !selectedModality) {
        toast.error("Selecione o serviço / modalidade.");
        return;
      }
    }

    const effEntryHour =
      bookingMode === "package" ? 8 : entryTime?.hour() ?? 8;
    const effEntryMin =
      bookingMode === "package" ? 0 : entryTime?.minute() ?? 0;
    const effExitHour =
      bookingMode === "package" ? 18 : exitTime?.hour() ?? 18;
    const effExitMin =
      bookingMode === "package" ? 0 : exitTime?.minute() ?? 0;

    const startMoment = scheduledDate
      .hour(effEntryHour)
      .minute(effEntryMin)
      .second(0)
      .millisecond(0);

    const endBaseDate =
      bookingMode === "hotel" && checkoutDate?.isValid()
        ? checkoutDate
        : scheduledDate;

    const endMoment = endBaseDate
      .hour(effExitHour)
      .minute(effExitMin)
      .second(0)
      .millisecond(0);

    if (!endMoment.isAfter(startMoment)) {
      toast.error(
        bookingMode === "hotel"
          ? "A data/hora de check-out deve ser posterior ao check-in."
          : "O horário de saída deve ser posterior ao horário de entrada."
      );
      return;
    }

    const validTasks = hasRoutine
      ? tasks.filter(
          (t) => t.scheduled_time.trim() !== "" && t.title.trim() !== ""
        )
      : [];

    const petFoodInfo = hasRoutine
      ? validTasks
          .filter((t) => t.task_type === "feeding")
          .map(
            (t) =>
              `${t.scheduled_time} - ${t.title}${
                t.notes ? ` (${t.notes})` : ""
              }`
          )
          .join("; ") || null
      : null;

    const stayType: DaycareStayType =
      bookingMode === "hotel" ? "multi_day" : "daily";
    const quantity = bookingMode === "hotel" ? hotelNights : 1;

    try {
      setSubmitting(true);

      if (mode === "edit" && stay) {
        await updateDaycareStay(stay.id, {
          modality_id: bookingMode === "package" ? null : selectedModalityId,
          package_id: bookingMode === "package" ? selectedPackageId : null,
          stay_type: stayType,
          quantity,
          unit_price_cents:
            bookingMode === "package" ? 0 : selectedModality?.price_cents ?? 0,
          scheduled_start_at: startMoment.format("YYYY-MM-DDTHH:mm:ssZ"),
          scheduled_end_at: endMoment.format("YYYY-MM-DDTHH:mm:ssZ"),
          food_info: petFoodInfo,
          notes: notes.trim() || null,
          tasks: validTasks,
        });
        toast.success("Agendamento atualizado com sucesso!");
      } else {
        await createDaycareStay({
          client_id: selectedClientId,
          pet_id: selectedPetId,
          modality_id: bookingMode === "package" ? null : selectedModalityId,
          package_id: bookingMode === "package" ? selectedPackageId : null,
          stay_type: stayType,
          quantity,
          unit_price_cents:
            bookingMode === "package" ? 0 : selectedModality?.price_cents ?? 0,
          scheduled_start_at: startMoment.format("YYYY-MM-DDTHH:mm:ssZ"),
          scheduled_end_at: endMoment.format("YYYY-MM-DDTHH:mm:ssZ"),
          food_info: petFoodInfo,
          notes: notes.trim() || null,
          tasks: validTasks,
          recurrence:
            bookingMode === "package"
              ? {
                  frequency: "custom",
                  weekdays: selectedWeekdays,
                  weeks_count: 4,
                  is_continuous: true,
                }
              : undefined,
        });

        if (bookingMode === "package") {
          toast.success(
            "Pacote agendado na Creche e enviado para a comanda no Caixa!"
          );
        } else if (bookingMode === "hotel") {
          toast.success("Hospedagem agendada com sucesso!");
        } else {
          toast.success("Agendamento de creche criado com sucesso!");
        }
      }

      queryClient.invalidateQueries({ queryKey: ["daycare"] });
      onSuccess();
      onClose();
    } catch (err: any) {
      toast.error(
        err?.response?.data?.detail || "Não foi possível salvar o agendamento."
      );
    } finally {
      setSubmitting(false);
    }
  };

  const sharedDatePickerSlotProps = {
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
      },
    },
    popper: {
      sx: {
        zIndex: 1400,
        "& .MuiDayCalendar-weekDayLabel": {
          color: "#3d4048 !important",
          fontWeight: 700,
          fontSize: "0.75rem",
        },
        "& .MuiPickersDay-root": {
          color: "#3d4048 !important",
          "&.Mui-selected": {
            color: "white !important",
          },
          "&.Mui-disabled": {
            color: "#b8bbc2 !important",
            opacity: 0.4,
          },
        },
      },
    },
    textField: {
      size: "small" as const,
      fullWidth: true,
      placeholder: "DD/MM/AAAA",
      inputMode: "numeric" as const,
      sx: {
        backgroundColor: theme.palette.common.white,
        width: "100%",
        minWidth: "0 !important",
        maxWidth: "100%",
        "& .MuiPickersInputBase-root, & .MuiInputBase-root": {
          minWidth: "0 !important",
          width: "100%",
        },
      },
    },
    actionBar: { actions: [] as any },
  };

  const sharedTimePickerSlotProps = {
    textField: {
      size: "small" as const,
      fullWidth: true,
      placeholder: "hh:mm",
      sx: {
        backgroundColor: theme.palette.common.white,
        width: "100%",
        minWidth: "0 !important",
        maxWidth: "100%",
        "& .MuiPickersInputBase-root, & .MuiInputBase-root": {
          minWidth: "0 !important",
          width: "100%",
        },
        "& .MuiInputBase-input": {
          color: "#1E293B",
          WebkitTextFillColor: "#1E293B",
        },
      },
    },
    actionBar: { actions: [] as any },
    popper: {
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
      },
    },
  };

  const dayOfWeekFormatter = (day: Dayjs) => {
    const days = ["dom", "seg", "ter", "qua", "qui", "sex", "sab"];
    return days[day.day()];
  };

  return (
    <>
      <Dialog
        open={open}
        onClose={onClose}
        fullScreen={isMobile}
        maxWidth={false}
        sx={{
          "& .MuiDialog-container": {
            alignItems: { xs: "stretch", sm: "center" },
            justifyContent: "center",
          },
        }}
        slotProps={{
          paper: {
            sx: {
              width: { xs: "100%", sm: "720px" },
              maxWidth: "100%",
              m: { xs: 0, sm: 2 },
              maxHeight: { xs: "100dvh", sm: "90vh" },
              height: { xs: "100dvh", sm: "auto" },
              borderRadius: { xs: 0, sm: 3 },
              display: "flex",
              flexDirection: "column",
              overflow: "hidden",
            },
          },
        }}
      >
        <LocalizationProvider
          dateAdapter={AdapterDayjs}
          adapterLocale="pt-br"
          localeText={
            ptBRPickers.components.MuiLocalizationProvider.defaultProps
              .localeText
          }
        >
          {/* HEADER */}
          <DialogTitle
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              px: { xs: 2, sm: 3 },
              py: { xs: 1.5, sm: 2 },
              pt: { xs: "calc(12px + env(safe-area-inset-top, 0px))", sm: 2 },
              borderBottom: "1px solid",
              borderColor: "divider",
              bgcolor: "white",
              flexShrink: 0,
              zIndex: 1,
            }}
          >
            <Typography
              variant="h5"
              sx={{
                fontSize: { xs: "1.2rem", sm: "1.45rem" },
                fontWeight: 700,
              }}
            >
              {mode === "create" ? "Novo Agendamento" : "Editar Agendamento"}
            </Typography>
            <Box
              sx={{
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: 38,
                height: 38,
                borderRadius: 2,
                color: "text.secondary",
                "&:hover": { bgcolor: "action.hover", color: "text.primary" },
              }}
              onClick={onClose}
            >
              <X size={20} />
            </Box>
          </DialogTitle>

          {/* CONTENT */}
          <DialogContent
            sx={{
              p: { xs: 2, sm: 3 },
              display: "flex",
              flexDirection: "column",
              gap: 1.5,
              flex: 1,
              overflowY: "auto",
              WebkitOverflowScrolling: "touch",
              overscrollBehavior: "contain",
            }}
          >
            {/* ── BLOCO 1: CLIENTE E PET (EMPILHADOS IGUAL BANHO & TOSA) ── */}
            {/* CLIENTE */}
            <FormControl fullWidth>
              <FormLabel
                sx={{ color: "text.primary", mb: 0.5, fontWeight: 600, mt: 1 }}
              >
                Cliente
              </FormLabel>
              <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
                <Autocomplete<Client>
                  sx={{ flex: 1, minWidth: 0 }}
                  options={clients ?? []}
                  openOnFocus={false}
                  disablePortal={false}
                  slotProps={{
                    popper: {
                      sx: { zIndex: 1400 },
                    },
                    paper: {
                      sx: {
                        borderRadius: 2,
                        boxShadow: "0 8px 30px rgba(0,0,0,0.12)",
                      },
                    },
                  }}
                  autoHighlight
                  filterOptions={(options, state) => {
                    const input = state.inputValue.toLowerCase();
                    return options
                      .filter((option) => {
                        const cPets =
                          allPets?.filter(
                            (p) => p.client_id === option.id && !p.is_deceased
                          ) || [];
                        const matchName = option.name
                          .toLowerCase()
                          .includes(input);
                        const matchPet = cPets.some((p) =>
                          p.name.toLowerCase().includes(input)
                        );
                        return matchName || matchPet;
                      })
                      .slice(0, clientListLimit);
                  }}
                  noOptionsText="Nenhum cliente cadastrado"
                  size="small"
                  value={
                    clients?.find((c) => c.id === selectedClientId) ?? null
                  }
                  getOptionLabel={(option) => option.name}
                  isOptionEqualToValue={(option, value) =>
                    option.id === value.id
                  }
                  onInputChange={(_, __, reason) => {
                    if (reason === "input") setClientListLimit(20);
                  }}
                  ListboxProps={{
                    sx: {
                      maxHeight: { xs: "220px", sm: "280px" },
                      overscrollBehavior: "contain",
                      WebkitOverflowScrolling: "touch",
                      "& .MuiAutocomplete-option": {
                        minHeight: 48,
                        py: 1,
                      },
                    },
                    onScroll: (event: React.SyntheticEvent) => {
                      const listboxNode = event.currentTarget;
                      if (
                        listboxNode.scrollTop + listboxNode.clientHeight >=
                        listboxNode.scrollHeight - 10
                      ) {
                        setClientListLimit((prev) => prev + 20);
                      }
                    },
                  }}
                  renderOption={(props, option) => {
                    const cPets =
                      allPets?.filter(
                        (p) => p.client_id === option.id && !p.is_deceased
                      ) || [];
                    const petsText =
                      cPets.length > 0
                        ? cPets.map((p) => p.name).join(", ")
                        : "Sem pets cadastrados";

                    return (
                      <li {...props} key={option.id}>
                        <Box
                          sx={{
                            display: "flex",
                            flexDirection: "column",
                            py: 0.5,
                          }}
                        >
                          <Typography variant="body2" fontWeight={600}>
                            {option.name}
                          </Typography>
                          <Typography
                            variant="caption"
                            color="text.secondary"
                          >
                            Pets: {petsText}
                          </Typography>
                        </Box>
                      </li>
                    );
                  }}
                  onChange={(_, value) => {
                    const clientId = value?.id ?? null;
                    setSelectedClientId(clientId);
                    setClientId(clientId ?? 0);
                    setSelectedPetId(null);
                    populatedClientIdRef.current = null;
                  }}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      inputRef={clientInputRef}
                      placeholder="Pesquisar cliente"
                    />
                  )}
                />
                <Button
                  sx={{
                    minWidth: { xs: "44px", sm: "140px" },
                    width: { xs: "44px", sm: "auto" },
                    height: "40px",
                    p: { xs: 0, sm: "6px 16px" },
                    flexShrink: 0,
                    borderRadius: 1.5,
                  }}
                  variant="outlined"
                  onClick={() => setClientModalOpen(true)}
                  title="Criar Cliente"
                >
                  <Plus size={18} />
                  <Box
                    component="span"
                    sx={{ display: { xs: "none", sm: "inline" }, ml: 0.5 }}
                  >
                    Criar Cliente
                  </Box>
                </Button>
              </Box>
            </FormControl>

            {/* PET */}
            <FormControl fullWidth>
              <FormLabel
                sx={{ color: "text.primary", mb: 0.5, fontWeight: 600 }}
              >
                Pet
              </FormLabel>
              <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
                <Autocomplete<Pet>
                  sx={{ flex: 1, minWidth: 0 }}
                  options={clientPets}
                  disabled={!selectedClientId}
                  filterOptions={(options, state) => {
                    const input = state.inputValue.toLowerCase();
                    return options
                      .filter((option) =>
                        option.name.toLowerCase().includes(input)
                      )
                      .slice(0, petListLimit);
                  }}
                  noOptionsText="Nenhum pet cadastrado"
                  size="small"
                  value={currentPet}
                  getOptionLabel={(option) => option.name}
                  isOptionEqualToValue={(o, v) => o.id === v.id}
                  onInputChange={(_, __, reason) => {
                    if (reason === "input") setPetListLimit(20);
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
                    const sizeText = option.size
                      ? `Porte ${option.size}`
                      : null;
                    const details = [option.breed, sizeText]
                      .filter(Boolean)
                      .join(" - ");

                    return (
                      <Box component="li" key={key} {...optionProps}>
                        <Box sx={{ display: "flex", flexDirection: "column" }}>
                          <Typography variant="body2" color="text.primary">
                            {option.name}
                          </Typography>
                          <Typography variant="caption" color="text.primary">
                            {details || "Sem raça"}
                          </Typography>
                        </Box>
                      </Box>
                    );
                  }}
                  onChange={(_, value) => {
                    setSelectedPetId(value?.id ?? null);
                  }}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      placeholder={
                        selectedClientId
                          ? "Selecionar pet"
                          : "Selecione um cliente primeiro"
                      }
                    />
                  )}
                />
                <Button
                  variant="outlined"
                  sx={{
                    minWidth: { xs: "44px", sm: "140px" },
                    width: { xs: "44px", sm: "auto" },
                    height: "40px",
                    p: { xs: 0, sm: "6px 16px" },
                    flexShrink: 0,
                    borderRadius: 1.5,
                  }}
                  disabled={!selectedClientId}
                  onClick={() => setPetModalOpen(true)}
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
            </FormControl>

            {/* ── BLOCO 2: SELETOR DE TIPO DE ATENDIMENTO ── */}
            {mode === "create" && (
              <FormControl fullWidth>
                <FormLabel
                  sx={{ color: "text.primary", mb: 0.5, fontWeight: 600 }}
                >
                  Tipo de Atendimento
                </FormLabel>
                <Box
                  sx={{
                    display: "grid",
                    gridTemplateColumns: { xs: "1fr", sm: "repeat(3, 1fr)" },
                    gap: 1,
                  }}
                >
                  {BOOKING_MODES.map((bm) => {
                    const isSelected = bookingMode === bm.id;
                    const IconComp = bm.icon;
                    return (
                      <Box
                        key={bm.id}
                        onClick={() => handleSelectBookingMode(bm.id)}
                        sx={{
                          py: 0.85,
                          px: 1.25,
                          borderRadius: 1.5,
                          border: "1.5px solid",
                          borderColor: isSelected ? bm.color : "#E2E8F0",
                          bgcolor: isSelected
                            ? alpha(bm.color, 0.08)
                            : "#FFFFFF",
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          gap: 1,
                          transition: "all 0.15s ease",
                          "&:hover": {
                            borderColor: bm.color,
                            bgcolor: alpha(bm.color, 0.04),
                          },
                        }}
                      >
                        <Box
                          sx={{
                            width: 28,
                            height: 28,
                            borderRadius: 1.25,
                            bgcolor: isSelected
                              ? bm.color
                              : alpha(bm.color, 0.12),
                            color: isSelected ? "#FFFFFF" : bm.color,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            flexShrink: 0,
                          }}
                        >
                          <IconComp size={15} />
                        </Box>
                        <Box sx={{ minWidth: 0 }}>
                          <Typography
                            variant="body2"
                            fontWeight={700}
                            fontSize="0.82rem"
                            color={isSelected ? bm.color : "text.primary"}
                            lineHeight={1.15}
                          >
                            {bm.title}
                          </Typography>
                          <Typography
                            variant="caption"
                            color="text.secondary"
                            fontSize="0.69rem"
                            lineHeight={1.1}
                            display="block"
                          >
                            {bm.subtitle}
                          </Typography>
                        </Box>
                      </Box>
                    );
                  })}
                </Box>
              </FormControl>
            )}

            {/* ── BLOCO 3: CONFIGURAÇÃO DE DATAS E SERVIÇO/PACOTE (APENAS QUANDO ESCOLHER O TIPO) ── */}
            {bookingMode !== null && (
              <Box
                sx={{
                  p: 2,
                  borderRadius: 2,
                  bgcolor: "#F8FAFC",
                  border: "1px solid #E2E8F0",
                  display: "flex",
                  flexDirection: "column",
                  gap: 2,
                  overflow: "hidden",
                  "& .MuiFormControl-root, & .MuiPickersTextField-root, & .MuiPickersInputBase-root, & .MuiInputBase-root":
                    {
                      minWidth: "0 !important",
                      width: "100%",
                    },
                }}
              >
              {/* CASO A: PACOTE MENSAL */}
              {bookingMode === "package" ? (
                <>
                  {/* 1. Escolha do Pacote */}
                  <Box>
                    <Typography
                      variant="caption"
                      sx={{
                        color: "text.secondary",
                        fontWeight: 700,
                        mb: 0.5,
                        display: "block",
                      }}
                    >
                      Pacote da Creche
                    </Typography>
                    <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
                      <Autocomplete<DaycarePackage>
                        sx={{ flex: 1, bgcolor: "white", borderRadius: 1 }}
                        options={activePackages}
                        size="small"
                        value={selectedPackage}
                        onChange={(_, val) => handleChangePackage(val)}
                        getOptionLabel={(opt) =>
                          `${opt.name} (${
                            opt.frequency || 1
                          }x na semana) - R$ ${formatBRLFromCents(
                            opt.price_cents
                          )}`
                        }
                        isOptionEqualToValue={(o, v) => o.id === v.id}
                        noOptionsText="Nenhum pacote cadastrado"
                        renderOption={(props, opt) => {
                          const { key, ...otherProps } = props;
                          return (
                            <Box
                              component="li"
                              key={key}
                              {...otherProps}
                              sx={{
                                display: "flex !important",
                                justifyContent: "space-between !important",
                                alignItems: "center !important",
                                width: "100%",
                                px: 2,
                                py: 1,
                              }}
                            >
                              <Box sx={{ flex: 1, minWidth: 0, pr: 2 }}>
                                <Typography variant="body2" fontWeight={700}>
                                  {opt.name}
                                </Typography>
                                <Typography
                                  variant="caption"
                                  color="text.secondary"
                                >
                                  {opt.frequency || 1}x na semana
                                </Typography>
                              </Box>
                              <Typography
                                variant="body2"
                                fontWeight={700}
                                color="primary.main"
                                sx={{ flexShrink: 0, whiteSpace: "nowrap" }}
                              >
                                R$ {formatBRLFromCents(opt.price_cents)}
                              </Typography>
                            </Box>
                          );
                        }}
                        renderInput={(params) => (
                          <TextField
                            {...params}
                            placeholder="Selecione o pacote (ex: 3x na semana)"
                          />
                        )}
                      />
                      <Button
                        variant="outlined"
                        sx={{
                          minWidth: { xs: "40px", sm: "135px" },
                          height: "40px",
                          p: { xs: 0, sm: "6px 14px" },
                          bgcolor: "white",
                        }}
                        onClick={() => setPackageModalOpen(true)}
                      >
                        <Plus size={18} />
                        <Box
                          component="span"
                          sx={{ display: { xs: "none", sm: "inline" }, ml: 0.5 }}
                        >
                          Criar Pacote
                        </Box>
                      </Button>
                    </Box>
                  </Box>

                  {/* 2. Dias da Semana na Creche + Data de Início lado a lado */}
                  <Box
                    sx={{
                      display: "grid",
                      gridTemplateColumns: {
                        xs: "1fr",
                        sm: "minmax(0, 1.65fr) minmax(0, 1fr)",
                      },
                      gap: 2,
                      alignItems: "start",
                      width: "100%",
                    }}
                  >
                    {/* Dias da Semana */}
                    <Box sx={{ minWidth: 0 }}>
                      <Box
                        sx={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          mb: 0.5,
                        }}
                      >
                        <Typography
                          variant="caption"
                          sx={{ color: "text.secondary", fontWeight: 700 }}
                        >
                          Dias da Semana na Creche
                        </Typography>
                        {selectedPackage?.is_monthly &&
                          selectedPackage.frequency && (
                            <Chip
                              size="small"
                              label={`${selectedWeekdays.length}/${selectedPackage.frequency} dia(s)`}
                              color={
                                selectedWeekdays.length ===
                                selectedPackage.frequency
                                  ? "success"
                                  : "warning"
                              }
                              sx={{
                                height: 20,
                                fontSize: "0.7rem",
                                fontWeight: 700,
                              }}
                            />
                          )}
                      </Box>
                      <Box sx={{ display: "flex", gap: 0.75, flexWrap: "wrap" }}>
                        {WEEKDAY_OPTIONS.map((w) => {
                          const isSelected = selectedWeekdays.includes(w.day);
                          const isLimitReached = Boolean(
                            selectedPackage?.is_monthly &&
                              selectedPackage?.frequency &&
                              selectedWeekdays.length >=
                                selectedPackage.frequency
                          );
                          const isDisabled =
                            !selectedPackage || (!isSelected && isLimitReached);

                          return (
                            <Button
                              key={w.day}
                              variant={isSelected ? "contained" : "outlined"}
                              size="small"
                              disabled={isDisabled}
                              sx={{
                                minWidth: 44,
                                height: 40,
                                px: 1.25,
                                borderRadius: 1.5,
                                fontWeight: 700,
                                fontSize: "0.8rem",
                                bgcolor: isSelected ? "primary.main" : "white",
                              }}
                              onClick={() => toggleWeekday(w.day)}
                            >
                              {w.label}
                            </Button>
                          );
                        })}
                      </Box>
                    </Box>

                    {/* Data de Início */}
                    <Box sx={{ minWidth: 0 }}>
                      <Typography
                        variant="caption"
                        sx={{
                          color: "text.secondary",
                          fontWeight: 700,
                          mb: 0.5,
                          display: "block",
                        }}
                      >
                        Data de Início
                      </Typography>
                      <DatePicker
                        format="DD/MM/YYYY"
                        value={scheduledDate}
                        disabled={selectedWeekdays.length === 0}
                        shouldDisableDate={(date) =>
                          selectedWeekdays.length > 0 &&
                          !selectedWeekdays.includes(date.day())
                        }
                        onChange={(newDate) => setScheduledDate(newDate)}
                        onMonthChange={(newMonth) =>
                          setCalendarMonth(newMonth.startOf("month"))
                        }
                        dayOfWeekFormatter={dayOfWeekFormatter}
                        slots={{
                          day: CustomDay,
                          toolbar: CustomDatePickerToolbar,
                        }}
                        slotProps={sharedDatePickerSlotProps}
                      />
                    </Box>
                  </Box>
                </>
              ) : bookingMode === "hotel" ? (
                /* CASO B: HOSPEDAGEM / HOTEL (CHECK-IN E CHECK-OUT COM DATAS SEPARADAS) */
                <>
                  <Box
                    sx={{
                      display: "grid",
                      gridTemplateColumns: {
                        xs: "1fr",
                        sm: "repeat(2, minmax(0, 1fr))",
                      },
                      gap: 1.5,
                      width: "100%",
                    }}
                  >
                    {/* CHECK-IN */}
                    <Box
                      sx={{
                        p: 1.5,
                        borderRadius: 1.5,
                        bgcolor: "white",
                        border: "1px solid #E2E8F0",
                        display: "flex",
                        flexDirection: "column",
                        gap: 1,
                        minWidth: 0,
                      }}
                    >
                      <Typography
                        variant="caption"
                        fontWeight={700}
                        color="#0284c7"
                      >
                        ENTRADA (CHECK-IN)
                      </Typography>
                      <Box
                        sx={{
                          display: "grid",
                          gridTemplateColumns: "minmax(0, 1.25fr) minmax(0, 1fr)",
                          gap: 1,
                          width: "100%",
                        }}
                      >
                        <Box sx={{ minWidth: 0 }}>
                          <Typography
                            variant="caption"
                            color="text.secondary"
                            fontWeight={600}
                            display="block"
                            mb={0.25}
                          >
                            Data Entrada
                          </Typography>
                          <DatePicker
                            format="DD/MM/YYYY"
                            value={scheduledDate}
                            onChange={(newDate) => {
                              setScheduledDate(newDate);
                              if (
                                newDate &&
                                checkoutDate &&
                                !checkoutDate.isAfter(newDate, "day")
                              ) {
                                setCheckoutDate(newDate.add(1, "day"));
                              }
                            }}
                            onMonthChange={(newMonth) =>
                              setCalendarMonth(newMonth.startOf("month"))
                            }
                            dayOfWeekFormatter={dayOfWeekFormatter}
                            slots={{
                              day: CustomDay,
                              toolbar: CustomDatePickerToolbar,
                            }}
                            slotProps={sharedDatePickerSlotProps}
                          />
                        </Box>
                        <Box sx={{ minWidth: 0 }}>
                          <Typography
                            variant="caption"
                            color="text.secondary"
                            fontWeight={600}
                            display="block"
                            mb={0.25}
                          >
                            Horário
                          </Typography>
                          <DesktopTimePicker
                            value={entryTime}
                            ampm={false}
                            minutesStep={5}
                            onChange={setEntryTime}
                            slotProps={sharedTimePickerSlotProps}
                          />
                        </Box>
                      </Box>
                    </Box>

                    {/* CHECK-OUT */}
                    <Box
                      sx={{
                        p: 1.5,
                        borderRadius: 1.5,
                        bgcolor: "white",
                        border: "1px solid #E2E8F0",
                        display: "flex",
                        flexDirection: "column",
                        gap: 1,
                        minWidth: 0,
                      }}
                    >
                      <Typography
                        variant="caption"
                        fontWeight={700}
                        color="#0284c7"
                      >
                        SAÍDA (CHECK-OUT)
                      </Typography>
                      <Box
                        sx={{
                          display: "grid",
                          gridTemplateColumns: "minmax(0, 1.25fr) minmax(0, 1fr)",
                          gap: 1,
                          width: "100%",
                        }}
                      >
                        <Box sx={{ minWidth: 0 }}>
                          <Typography
                            variant="caption"
                            color="text.secondary"
                            fontWeight={600}
                            display="block"
                            mb={0.25}
                          >
                            Data Saída
                          </Typography>
                          <DatePicker
                            format="DD/MM/YYYY"
                            value={checkoutDate}
                            minDate={scheduledDate?.add(1, "day") ?? undefined}
                            onChange={(newDate) => setCheckoutDate(newDate)}
                            onMonthChange={(newMonth) =>
                              setCalendarMonth(newMonth.startOf("month"))
                            }
                            dayOfWeekFormatter={dayOfWeekFormatter}
                            slots={{
                              day: CustomDay,
                              toolbar: CustomDatePickerToolbar,
                            }}
                            slotProps={sharedDatePickerSlotProps}
                          />
                        </Box>
                        <Box sx={{ minWidth: 0 }}>
                          <Typography
                            variant="caption"
                            color="text.secondary"
                            fontWeight={600}
                            display="block"
                            mb={0.25}
                          >
                            Horário
                          </Typography>
                          <DesktopTimePicker
                            value={exitTime}
                            ampm={false}
                            minutesStep={5}
                            onChange={setExitTime}
                            slotProps={sharedTimePickerSlotProps}
                          />
                        </Box>
                      </Box>
                    </Box>
                  </Box>

                  {/* Modalidade de Hospedagem */}
                  <Box>
                    <Typography
                      variant="caption"
                      sx={{
                        color: "text.secondary",
                        fontWeight: 700,
                        mb: 0.5,
                        display: "block",
                      }}
                    >
                      Modalidade de Hospedagem (Valor por Diária)
                    </Typography>
                    <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
                      <Autocomplete<DaycareModality>
                        sx={{ flex: 1, bgcolor: "white", borderRadius: 1 }}
                        disabled={!currentPet}
                        options={sortedAndFilteredModalities}
                        size="small"
                        value={selectedModality}
                        onChange={(_, val) =>
                          setSelectedModalityId(val ? val.id : null)
                        }
                        getOptionLabel={(opt) =>
                          `${opt.name} - R$ ${formatBRLFromCents(
                            opt.price_cents
                          )}`
                        }
                        isOptionEqualToValue={(o, v) => o.id === v.id}
                        noOptionsText={
                          currentPet
                            ? "Nenhum serviço disponível"
                            : "Selecione o pet primeiro"
                        }
                        renderInput={(params) => (
                          <TextField
                            {...params}
                            placeholder={
                              currentPet
                                ? "Selecione a diária de hospedagem"
                                : "Selecione um pet primeiro"
                            }
                          />
                        )}
                      />
                      <Button
                        variant="outlined"
                        sx={{
                          minWidth: { xs: "40px", sm: "130px" },
                          height: "40px",
                          p: { xs: 0, sm: "6px 14px" },
                          bgcolor: "white",
                        }}
                        onClick={() => setServiceModalOpen(true)}
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
                  </Box>

                  {/* Resumo de Diárias de Hotel */}
                  <Box
                    sx={{
                      p: 1.25,
                      borderRadius: 1.5,
                      bgcolor: "#E0F2FE",
                      border: "1px solid #BAE6FD",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <Typography variant="caption" color="#0369A1" fontWeight={600}>
                      Período de hospedagem: <b>{hotelNights} diária(s) / noite(s)</b>
                    </Typography>
                    {selectedModality && (
                      <Typography variant="body2" fontWeight={800} color="#0369A1">
                        Total:{" "}
                        {`${hotelNights}x R$ ${formatBRLFromCents(
                          selectedModality.price_cents
                        )} = R$ ${formatBRLFromCents(
                          selectedModality.price_cents * hotelNights
                        )}`}
                      </Typography>
                    )}
                  </Box>
                </>
              ) : (
                /* CASO C: CRECHE AVULSA (DIA ÚNICO) */
                <>
                  <Box
                    sx={{
                      display: "grid",
                      gridTemplateColumns: {
                        xs: "1fr",
                        sm: "repeat(3, minmax(0, 1fr))",
                      },
                      gap: 1.5,
                      width: "100%",
                    }}
                  >
                    <Box sx={{ minWidth: 0 }}>
                      <Typography
                        variant="caption"
                        sx={{
                          color: "text.secondary",
                          fontWeight: 700,
                          mb: 0.5,
                          display: "block",
                        }}
                      >
                        Data
                      </Typography>
                      <DatePicker
                        format="DD/MM/YYYY"
                        value={scheduledDate}
                        onChange={(newDate) => setScheduledDate(newDate)}
                        onMonthChange={(newMonth) =>
                          setCalendarMonth(newMonth.startOf("month"))
                        }
                        dayOfWeekFormatter={dayOfWeekFormatter}
                        slots={{
                          day: CustomDay,
                          toolbar: CustomDatePickerToolbar,
                        }}
                        slotProps={sharedDatePickerSlotProps}
                      />
                    </Box>
                    <Box sx={{ minWidth: 0 }}>
                      <Typography
                        variant="caption"
                        sx={{
                          color: "text.secondary",
                          fontWeight: 700,
                          mb: 0.5,
                          display: "block",
                        }}
                      >
                        Entrada
                      </Typography>
                      <DesktopTimePicker
                        value={entryTime}
                        ampm={false}
                        minutesStep={5}
                        onChange={handleEntryTimeChange}
                        slotProps={sharedTimePickerSlotProps}
                      />
                    </Box>
                    <Box sx={{ minWidth: 0 }}>
                      <Typography
                        variant="caption"
                        sx={{
                          color: "text.secondary",
                          fontWeight: 700,
                          mb: 0.5,
                          display: "block",
                        }}
                      >
                        Saída
                      </Typography>
                      <DesktopTimePicker
                        value={exitTime}
                        ampm={false}
                        minutesStep={5}
                        onChange={setExitTime}
                        slotProps={sharedTimePickerSlotProps}
                      />
                    </Box>
                  </Box>

                  {/* Serviço de Creche */}
                  <Box>
                    <Typography
                      variant="caption"
                      sx={{
                        color: "text.secondary",
                        fontWeight: 700,
                        mb: 0.5,
                        display: "block",
                      }}
                    >
                      Serviço de Creche
                    </Typography>
                    <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
                      <Autocomplete<DaycareModality>
                        sx={{ flex: 1, bgcolor: "white", borderRadius: 1 }}
                        disabled={!currentPet}
                        options={sortedAndFilteredModalities}
                        filterOptions={(options, state) => {
                          const input = state.inputValue.toLowerCase().trim();
                          if (!input) return options.slice(0, serviceListLimit);
                          return options
                            .filter((option) =>
                              `${option.name} ${
                                option.sizes?.join(" ") ?? ""
                              } ${option.species?.join(" ") ?? ""} ${
                                option.description ?? ""
                              }`
                                .toLowerCase()
                                .includes(input)
                            )
                            .slice(0, serviceListLimit);
                        }}
                        noOptionsText={
                          currentPet
                            ? "Nenhum serviço de creche disponível"
                            : "Selecione o pet primeiro"
                        }
                        size="small"
                        value={selectedModality}
                        getOptionLabel={(option) =>
                          option
                            ? `${option.name} - R$ ${formatBRLFromCents(
                                option.price_cents
                              )}`
                            : ""
                        }
                        isOptionEqualToValue={(o, v) => o.id === v.id}
                        onInputChange={(_, __, reason) => {
                          if (reason === "input") setServiceListLimit(20);
                        }}
                        onChange={(_, val) =>
                          setSelectedModalityId(val ? val.id : null)
                        }
                        renderOption={(props, option) => {
                          const { key, ...optionProps } = props;
                          const extraDetails = [
                            option.max_hours
                              ? `Duração: ${option.max_hours}h`
                              : null,
                            option.sizes?.length
                              ? `Porte: ${option.sizes.join(", ")}`
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
                              }}
                            >
                              <Box sx={{ minWidth: 0, flex: 1, pr: 1.5 }}>
                                <Typography variant="body2" fontWeight={600}>
                                  {option.name}
                                </Typography>
                                {extraDetails && (
                                  <Typography
                                    variant="caption"
                                    color="text.secondary"
                                  >
                                    {extraDetails}
                                  </Typography>
                                )}
                              </Box>
                              <Typography
                                variant="body2"
                                fontWeight={700}
                                color="primary.main"
                              >
                                R$ {formatBRLFromCents(option.price_cents)}
                              </Typography>
                            </Box>
                          );
                        }}
                        renderInput={(params) => (
                          <TextField
                            {...params}
                            placeholder={
                              currentPet
                                ? "Selecione o serviço (ex: Creche Avulsa, Adaptação)"
                                : "Selecione um pet primeiro"
                            }
                          />
                        )}
                      />
                      <Button
                        variant="outlined"
                        sx={{
                          minWidth: { xs: "40px", sm: "130px" },
                          height: "40px",
                          p: { xs: 0, sm: "6px 14px" },
                          bgcolor: "white",
                        }}
                        onClick={() => setServiceModalOpen(true)}
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

                    <FormControlLabel
                      sx={{ width: "fit-content", mt: 0.5, mb: -0.5 }}
                      control={
                        <Checkbox
                          disableRipple
                          size="small"
                          sx={{ color: "primary.main", py: 0 }}
                          checked={showAllModalities}
                          onChange={(e) =>
                            setShowAllModalities(e.target.checked)
                          }
                        />
                      }
                      label="Mostrar todos os serviços"
                      slotProps={{
                        typography: {
                          sx: {
                            fontSize: "0.75rem",
                            color: "text.secondary",
                          },
                        },
                      }}
                    />
                  </Box>
                </>
              )}
              </Box>
            )}

            {/* ── BLOCO 4: OBSERVAÇÕES E OPCIONAIS (SIMPLIFICADOS PARA 1 PET) ── */}
            <FormControl fullWidth>
              <FormLabel
                sx={{ color: "text.primary", mb: 0.5, fontWeight: 600 }}
              >
                Observações
              </FormLabel>
              <CustomTextField
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                multiline
                rows={2}
                placeholder="ex: Pertences (caminha, potinho), comportamento, cuidados especiais..."
              />
            </FormControl>

            {/* 1. ROTINA DE ALIMENTAÇÃO E MEDICAÇÃO (SEM CAMPO REPETIDO DE PET) */}
            <Box
              sx={{
                px: 2,
                py: 1.25,
                bgcolor: "#FFFFFF",
                borderRadius: 2,
                border: "1px solid #E2E8F0",
              }}
            >
              <FormControlLabel
                sx={{ m: 0, width: "100%" }}
                control={
                  <Switch
                    checked={hasRoutine}
                    onChange={(e) => handleToggleRoutine(e.target.checked)}
                    color="primary"
                  />
                }
                label={
                  <Typography variant="body2" fontWeight={600}>
                    Cadastrar rotina de alimentação e medicação
                  </Typography>
                }
              />

              {hasRoutine && (
                <Box
                  sx={{
                    mt: 2,
                    display: "flex",
                    flexDirection: "column",
                    gap: 2,
                  }}
                >
                  {/* ALIMENTAÇÃO */}
                  <Box
                    sx={{
                      p: 1.5,
                      borderRadius: 2,
                      bgcolor: "#F0FDF4",
                      border: "1px solid #BBF7D0",
                    }}
                  >
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: 1,
                        mb: 1.25,
                      }}
                    >
                      <Utensils size={17} color="#15803D" />
                      <Typography
                        variant="subtitle2"
                        fontWeight={700}
                        color="#166534"
                      >
                        Alimentação
                      </Typography>
                    </Box>

                    {feedingTasks.length > 0 && (
                      <Box
                        sx={{
                          display: "flex",
                          flexDirection: "column",
                          gap: 1.25,
                          mb: 1.25,
                        }}
                      >
                        {feedingTasks.map((task, idx) => (
                          <Box
                            key={idx}
                            sx={{
                              p: 1.25,
                              bgcolor: "#FFFFFF",
                              borderRadius: 1.5,
                              border: "1px solid #86EFAC",
                              display: "flex",
                              flexDirection: "column",
                              gap: 1,
                            }}
                          >
                            <Box
                              sx={{
                                display: "flex",
                                gap: 1,
                                alignItems: "center",
                              }}
                            >
                              <TextField
                                size="small"
                                fullWidth
                                label="Qual alimento?"
                                placeholder="Ex.: Ração Premier 100g"
                                value={task.title}
                                onChange={(e) =>
                                  handleUpdateFeedingTask(
                                    idx,
                                    "title",
                                    e.target.value
                                  )
                                }
                              />
                              <Box sx={{ width: 135, flexShrink: 0 }}>
                                <DesktopTimePicker
                                  value={parseTimeToDayjs(task.scheduled_time)}
                                  ampm={false}
                                  minutesStep={5}
                                  onChange={(newVal) =>
                                    handleUpdateFeedingTask(
                                      idx,
                                      "scheduled_time",
                                      newVal?.isValid()
                                        ? newVal.format("HH:mm")
                                        : ""
                                    )
                                  }
                                  slotProps={{
                                    ...sharedTimePickerSlotProps,
                                    textField: {
                                      ...sharedTimePickerSlotProps.textField,
                                      label: "Horário",
                                      size: "small",
                                    },
                                  }}
                                />
                              </Box>
                              <IconButton
                                size="small"
                                color="error"
                                onClick={() => handleRemoveFeedingTask(idx)}
                              >
                                <Trash2 size={16} />
                              </IconButton>
                            </Box>
                            <TextField
                              size="small"
                              fullWidth
                              label="Instruções (opcional)"
                              placeholder="Ex.: Misturar com um pouco de água morna"
                              value={task.notes || ""}
                              onChange={(e) =>
                                handleUpdateFeedingTask(
                                  idx,
                                  "notes",
                                  e.target.value
                                )
                              }
                            />
                          </Box>
                        ))}
                      </Box>
                    )}

                    <Button
                      size="small"
                      variant="outlined"
                      startIcon={<Plus size={16} />}
                      onClick={handleAddFeedingTask}
                    >
                      Adicionar refeição
                    </Button>
                  </Box>

                  {/* MEDICAÇÃO */}
                  <Box
                    sx={{
                      p: 1.5,
                      borderRadius: 2,
                      bgcolor: "#F5F3FF",
                      border: "1px solid #DDD6FE",
                    }}
                  >
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: 1,
                        mb: 1.25,
                      }}
                    >
                      <Pill size={17} color="#7C3AED" />
                      <Typography
                        variant="subtitle2"
                        fontWeight={700}
                        color="#5B21B6"
                      >
                        Medicação
                      </Typography>
                    </Box>

                    {medicationTasks.length > 0 && (
                      <Box
                        sx={{
                          display: "flex",
                          flexDirection: "column",
                          gap: 1.25,
                          mb: 1.25,
                        }}
                      >
                        {medicationTasks.map((task, idx) => (
                          <Box
                            key={idx}
                            sx={{
                              p: 1.25,
                              bgcolor: "#FFFFFF",
                              borderRadius: 1.5,
                              border: "1px solid #C4B5FD",
                              display: "flex",
                              flexDirection: "column",
                              gap: 1,
                            }}
                          >
                            <Box
                              sx={{
                                display: "flex",
                                gap: 1,
                                alignItems: "center",
                              }}
                            >
                              <TextField
                                size="small"
                                fullWidth
                                label="Qual medicamento?"
                                placeholder="Ex.: Apoquel 5.4mg"
                                value={task.title}
                                onChange={(e) =>
                                  handleUpdateMedicationTask(
                                    idx,
                                    "title",
                                    e.target.value
                                  )
                                }
                              />
                              <Box sx={{ width: 135, flexShrink: 0 }}>
                                <DesktopTimePicker
                                  value={parseTimeToDayjs(task.scheduled_time)}
                                  ampm={false}
                                  minutesStep={5}
                                  onChange={(newVal) =>
                                    handleUpdateMedicationTask(
                                      idx,
                                      "scheduled_time",
                                      newVal?.isValid()
                                        ? newVal.format("HH:mm")
                                        : ""
                                    )
                                  }
                                  slotProps={{
                                    ...sharedTimePickerSlotProps,
                                    textField: {
                                      ...sharedTimePickerSlotProps.textField,
                                      label: "Horário",
                                      size: "small",
                                    },
                                  }}
                                />
                              </Box>
                              <IconButton
                                size="small"
                                color="error"
                                onClick={() => handleRemoveMedicationTask(idx)}
                              >
                                <Trash2 size={16} />
                              </IconButton>
                            </Box>
                            <TextField
                              size="small"
                              fullWidth
                              label="Instruções (opcional)"
                              placeholder="Ex.: 1 comprimido enrolado no petisco após comer"
                              value={task.notes || ""}
                              onChange={(e) =>
                                handleUpdateMedicationTask(
                                  idx,
                                  "notes",
                                  e.target.value
                                )
                              }
                            />
                          </Box>
                        ))}
                      </Box>
                    )}

                    <Button
                      size="small"
                      variant="outlined"
                      startIcon={<Plus size={16} />}
                      onClick={handleAddMedicationTask}
                    >
                      Adicionar medicamento
                    </Button>
                  </Box>
                </Box>
              )}
            </Box>
          </DialogContent>

          {/* ACTIONS / FOOTER */}
          <DialogActions
            sx={{
              px: { xs: 2, sm: 3 },
              py: 2,
              borderTop: "1px solid",
              borderColor: "divider",
              bgcolor: "white",
              display: "flex",
              justifyContent: "flex-end",
              gap: 1.5,
            }}
          >
            <Button
              variant="outlined"
              onClick={onClose}
              disabled={submitting}
            >
              Cancelar
            </Button>
            <Button
              variant="contained"
              color="primary"
              onClick={handleSubmit}
              loading={submitting}
              disabled={submitting}
            >
              Salvar Agendamento
            </Button>
          </DialogActions>
        </LocalizationProvider>
      </Dialog>

      {/* SUBMODAIS INTEGRADOS */}
      <ClientFormModal
        open={clientModalOpen}
        mode="create"
        onClose={() => setClientModalOpen(false)}
        onSuccess={handleClientCreated}
      />

      <PetFormModal
        open={petModalOpen}
        mode="create"
        client={clients?.find((c) => c.id === selectedClientId)}
        onClose={() => setPetModalOpen(false)}
        onSuccess={handlePetCreated}
      />

      <DaycareServiceFormModal
        open={serviceModalOpen}
        mode="create"
        onClose={() => setServiceModalOpen(false)}
        onSuccess={handleServiceCreated}
      />

      <DaycarePackageFormModal
        open={packageModalOpen}
        mode="create"
        onClose={() => setPackageModalOpen(false)}
        onSuccess={handlePackageCreated}
      />
    </>
  );
}
