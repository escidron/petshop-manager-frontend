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
  Radio,
  RadioGroup,
  Switch,
  TextField,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { DesktopTimePicker } from "@mui/x-date-pickers/DesktopTimePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { ptBR as ptBRPickers } from "@mui/x-date-pickers/locales";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import {
  Pill,
  Plus,
  Trash2,
  Utensils,
  X,
} from "lucide-react";
import dayjs, { type Dayjs } from "dayjs";
import "dayjs/locale/pt-br";
import { useQuery, useQueryClient } from "@tanstack/react-query";

import { createAppointment } from "../../api/services/appointments";
import {
  createDaycareStay,
  listDaycareHighlightedDays,
  listDaycareModalities,
  updateDaycareStay,
} from "../../api/services/daycare";
import { useClients } from "../../hooks/useClients";
import { useClient } from "../../hooks/useClient";
import { usePets } from "../../hooks/usePets";
import { useServices } from "../../hooks/useServices";
import { useToast } from "../../hooks/useToast";
import { Button } from "../../components/Button/Button";
import CustomTextField from "../../components/Textfield/CustomTextfield";
import { CustomDay } from "../dashboard/DashboardCalendar";

import ClientFormModal from "../clients/ClientFormModal";
import PetFormModal from "../pets/PetFormModal";
import DaycareServiceFormModal from "./DaycareServiceFormModal";
import DaycarePetItem, { type DaycarePetItemData } from "./DaycarePetItem";
import DaycareBathPetItem, {
  type DaycareBathItemData,
} from "./DaycareBathPetItem";

import type {
  DaycareModality,
  DaycareStay,
  DaycareStayType,
  DaycareTaskCreatePayload,
} from "./types";
import type { Client } from "../clients/types";
import type { Pet } from "../pets/types";

interface DaycareTaskFormItem extends DaycareTaskCreatePayload {
  pet_ids: number[];
}

dayjs.locale("pt-br");

const WEEKDAY_OPTIONS = [
  { day: 0, label: "Dom", fullName: "Domingo" },
  { day: 1, label: "Seg", fullName: "Segunda-feira" },
  { day: 2, label: "Ter", fullName: "Terça-feira" },
  { day: 3, label: "Qua", fullName: "Quarta-feira" },
  { day: 4, label: "Qui", fullName: "Quinta-feira" },
  { day: 5, label: "Sex", fullName: "Sexta-feira" },
  { day: 6, label: "Sáb", fullName: "Sábado" },
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

const generateItemId = () => Math.random().toString(36).substring(2, 9);

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
  const { services } = useServices();

  const [clientListLimit, setClientListLimit] = useState(20);
  const clientInputRef = useRef<HTMLInputElement>(null);

  const [selectedClientId, setSelectedClientId] = useState<number | null>(
    stay?.client_id ?? null
  );
  const { pets, setClientId, refetchPets, loadedClientId } = useClient(
    selectedClientId ?? undefined
  );

  const clientPets = useMemo(
    () => (pets || []).filter((p) => !p.is_deceased),
    [pets]
  );

  // Pets & Serviços lista
  const [items, setItems] = useState<DaycarePetItemData[]>([
    {
      id: generateItemId(),
      pet_id: stay?.pet_id ?? null,
      modality_id: stay?.modality_id ?? null,
      showAllServices: false,
    },
  ]);

  // Data e horários de entrada e saída (Data única na Creche)
  const [scheduledDate, setScheduledDate] = useState<Dayjs | null>(dayjs());
  const [entryTime, setEntryTime] = useState<Dayjs | null>(
    dayjs().hour(8).minute(0).second(0)
  );
  const [exitTime, setExitTime] = useState<Dayjs | null>(
    dayjs().hour(18).minute(0).second(0)
  );

  const [calendarMonth, setCalendarMonth] = useState<Dayjs>(
    dayjs().startOf("month")
  );

  const [notes, setNotes] = useState<string>("");

  // Submodais de criação rápida
  const [clientModalOpen, setClientModalOpen] = useState(false);
  const [petModal, setPetModal] = useState<{
    open: boolean;
    index: number;
    clientId: number;
  }>({
    open: false,
    index: 0,
    clientId: 0,
  });
  const [serviceModal, setServiceModal] = useState<{
    open: boolean;
    index: number;
  }>({
    open: false,
    index: 0,
  });

  // Seções opcionais (Rotina, Recorrência, Serviços)
  const [hasRoutine, setHasRoutine] = useState<boolean>(false);
  const [tasks, setTasks] = useState<DaycareTaskFormItem[]>([]);

  const [isRecurrent, setIsRecurrent] = useState<boolean>(false);
  const [selectedWeekdays, setSelectedWeekdays] = useState<number[]>([]);
  const [weeksCount, setWeeksCount] = useState<number>(4);
  const [recurrenceEndType, setRecurrenceEndType] = useState<"weeks" | "never">(
    "weeks"
  );

  const [scheduleBath, setScheduleBath] = useState<boolean>(false);
  const [bathItems, setBathItems] = useState<DaycareBathItemData[]>([]);
  const [bathTime, setBathTime] = useState<Dayjs | null>(
    dayjs().hour(11).minute(0).second(0)
  );
  const [bathNotes, setBathNotes] = useState<string>("");

  const [submitting, setSubmitting] = useState(false);

  const { data: modalities = [] } = useQuery<DaycareModality[]>({
    queryKey: ["daycare", "modalities"],
    queryFn: () => listDaycareModalities(false),
    enabled: open,
  });

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
      setItems([
        {
          id: generateItemId(),
          pet_id: stay.pet_id,
          modality_id: stay.modality_id ?? null,
          showAllServices: false,
        },
      ]);

      const start = dayjs(stay.scheduled_start_at);
      const end = dayjs(stay.scheduled_end_at);
      setScheduledDate(start);
      setEntryTime(start);
      setExitTime(end);
      setCalendarMonth(start.startOf("month"));

      setNotes(stay.notes || "");

      const mappedTasks: DaycareTaskFormItem[] = (stay.tasks || []).map((t) => ({
        task_type: t.task_type,
        scheduled_time: t.scheduled_time,
        title: t.title,
        notes: t.notes ?? undefined,
        pet_ids: stay.pet_id ? [stay.pet_id] : [],
      }));
      setTasks(mappedTasks);
      setHasRoutine(Boolean(stay.food_info || mappedTasks.length > 0));
      setIsRecurrent(false);
      setScheduleBath(false);
      setBathItems([]);
    } else {
      const base = initialDate ? dayjs(initialDate) : dayjs();
      setSelectedClientId(null);
      setItems([
        {
          id: generateItemId(),
          pet_id: null,
          modality_id: null,
          showAllServices: false,
        },
      ]);
      setScheduledDate(base);
      setEntryTime(base.hour(8).minute(0).second(0));
      setExitTime(base.hour(18).minute(0).second(0));
      setCalendarMonth(base.startOf("month"));
      setNotes("");
      setTasks([]);
      setHasRoutine(false);
      setIsRecurrent(false);
      setSelectedWeekdays([]);
      setWeeksCount(4);
      setRecurrenceEndType("weeks");
      setScheduleBath(false);
      setBathItems([]);
      setBathTime(base.hour(11).minute(0).second(0));
      setBathNotes("");
    }
  }, [open, mode, stay, initialDate, setClientId]);

  // Quando seleciona o cliente, busca e popula automaticamente os campos pet / serviço
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
      const clientPets = (pets || []).filter((p) => !p.is_deceased);

      if (clientPets.length > 0) {
        setItems(
          clientPets.map((pet) => ({
            id: generateItemId(),
            pet_id: pet.id,
            modality_id: null,
            showAllServices: false,
          }))
        );
        setBathItems(
          clientPets.map((pet) => ({
            id: generateItemId(),
            pet_id: pet.id,
            service_ids: [],
            showAllServices: false,
          }))
        );
      } else {
        setItems([
          {
            id: generateItemId(),
            pet_id: null,
            modality_id: null,
            showAllServices: false,
          },
        ]);
        setBathItems([
          {
            id: generateItemId(),
            pet_id: null,
            service_ids: [],
            showAllServices: false,
          },
        ]);
      }
    }
  }, [selectedClientId, loadedClientId, pets, mode, open]);

  // Sincronização de horário de entrada e saída
  const handleEntryTimeChange = (newTime: Dayjs | null) => {
    setEntryTime(newTime);
    if (newTime && exitTime && !exitTime.isAfter(newTime)) {
      setExitTime(newTime.add(4, "hour"));
    }
  };

  // Gerenciamento dos itens de Pet e Serviço
  const handleChangePet = (index: number, petId: number | null) => {
    setItems((prev) =>
      prev.map((item, idx) => {
        if (idx !== index) return item;
        return {
          ...item,
          pet_id: petId,
          modality_id: null,
        };
      })
    );
  };

  const handleChangeModality = (index: number, modalityId: number | null) => {
    setItems((prev) =>
      prev.map((item, idx) =>
        idx === index ? { ...item, modality_id: modalityId } : item
      )
    );
  };

  const handleChangeShowAllServices = (index: number, showAll: boolean) => {
    setItems((prev) =>
      prev.map((item, idx) =>
        idx === index ? { ...item, showAllServices: showAll } : item
      )
    );
  };

  const handleAddPetItem = () => {
    setItems((prev) => [
      ...prev,
      {
        id: generateItemId(),
        pet_id: null,
        modality_id: null,
        showAllServices: false,
      },
    ]);
  };

  const handleRemovePetItem = (index: number) => {
    setItems((prev) => prev.filter((_, idx) => idx !== index));
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
    handleChangePet(petModal.index, pet.id);
  };

  const handleServiceCreated = (modality: DaycareModality) => {
    queryClient.invalidateQueries({ queryKey: ["daycare", "modalities"] });
    handleChangeModality(serviceModal.index, modality.id);
  };

  // Gerenciamento dos itens de Banho & Tosa
  const handleToggleScheduleBath = (enabled: boolean) => {
    setScheduleBath(enabled);
    if (enabled && bathItems.length === 0) {
      const clientPets = (pets || []).filter((p) => !p.is_deceased);
      if (clientPets.length > 0) {
        setBathItems(
          clientPets.map((pet) => ({
            id: generateItemId(),
            pet_id: pet.id,
            service_ids: [],
            showAllServices: false,
          }))
        );
      } else {
        setBathItems([
          {
            id: generateItemId(),
            pet_id: null,
            service_ids: [],
            showAllServices: false,
          },
        ]);
      }
    }
  };

  const handleChangeBathPet = (index: number, petId: number | null) => {
    setBathItems((prev) =>
      prev.map((item, idx) => {
        if (idx !== index) return item;
        return {
          ...item,
          pet_id: petId,
          service_ids: [],
        };
      })
    );
  };

  const handleChangeBathServices = (index: number, serviceIds: number[]) => {
    setBathItems((prev) =>
      prev.map((item, idx) =>
        idx === index ? { ...item, service_ids: serviceIds } : item
      )
    );
  };

  const handleChangeBathShowAllServices = (index: number, showAll: boolean) => {
    setBathItems((prev) =>
      prev.map((item, idx) =>
        idx === index ? { ...item, showAllServices: showAll } : item
      )
    );
  };

  const handleAddBathPetItem = () => {
    setBathItems((prev) => [
      ...prev,
      {
        id: generateItemId(),
        pet_id: null,
        service_ids: [],
        showAllServices: false,
      },
    ]);
  };

  const handleRemoveBathPetItem = (index: number) => {
    setBathItems((prev) => prev.filter((_, idx) => idx !== index));
  };

  // Cálculo da estadia (Creche sempre ocorre no mesmo dia)
  const stayCalculation = useMemo(() => {
    return {
      stayType: "daily" as DaycareStayType,
      quantity: 1,
    };
  }, []);

  const baseWeekday = useMemo(() => {
    return scheduledDate?.isValid() ? scheduledDate.day() : null;
  }, [scheduledDate]);

  useEffect(() => {
    if (isRecurrent && baseWeekday !== null) {
      setSelectedWeekdays((prev) =>
        prev.includes(baseWeekday)
          ? prev
          : [...prev, baseWeekday].sort((a, b) => a - b)
      );
    }
  }, [isRecurrent, baseWeekday]);

  const handleToggleRecurrence = (enabled: boolean) => {
    setIsRecurrent(enabled);
    if (enabled && baseWeekday !== null) {
      setSelectedWeekdays((prev) =>
        prev.includes(baseWeekday)
          ? prev
          : [...prev, baseWeekday].sort((a, b) => a - b)
      );
    }
  };

  const toggleWeekday = (dayNum: number) => {
    // O dia de início da data selecionada não pode ser desmarcado
    if (baseWeekday !== null && dayNum === baseWeekday) {
      return;
    }
    setSelectedWeekdays((prev) => {
      if (prev.includes(dayNum)) {
        return prev.filter((d) => d !== dayNum);
      }
      return [...prev, dayNum].sort((a, b) => a - b);
    });
  };

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
      const currentSelectedPets = items
        .map((it) => it.pet_id)
        .filter((id): id is number => id !== null);

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
            pet_ids: currentSelectedPets,
          });
        }
        if (!hasMed) {
          next.push({
            task_type: "medication",
            scheduled_time: "14:00",
            title: "",
            notes: "",
            pet_ids: currentSelectedPets,
          });
        }
        return next;
      });
    }
  };

  const handleAddFeedingTask = () => {
    const currentSelectedPets = items
      .map((it) => it.pet_id)
      .filter((id): id is number => id !== null);

    setTasks((prev) => [
      ...prev,
      {
        task_type: "feeding",
        scheduled_time: "12:00",
        title: "",
        notes: "",
        pet_ids: currentSelectedPets,
      },
    ]);
  };

  const handleAddMedicationTask = () => {
    const currentSelectedPets = items
      .map((it) => it.pet_id)
      .filter((id): id is number => id !== null);

    setTasks((prev) => [
      ...prev,
      {
        task_type: "medication",
        scheduled_time: "14:00",
        title: "",
        notes: "",
        pet_ids: currentSelectedPets,
      },
    ]);
  };

  const handleUpdateTaskPets = (
    subIndex: number,
    taskType: "feeding" | "medication",
    petIds: number[]
  ) => {
    setTasks((prev) => {
      let count = 0;
      return prev.map((item) => {
        if (item.task_type === taskType) {
          if (count === subIndex) {
            count++;
            return { ...item, pet_ids: petIds };
          }
          count++;
        }
        return item;
      });
    });
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

    const validItems = items.filter(
      (item) => item.pet_id !== null && item.modality_id !== null
    );

    if (validItems.length === 0) {
      toast.error("Selecione ao menos um pet e serviço de creche válido.");
      return;
    }

    if (!scheduledDate?.isValid()) {
      toast.error("Informe a data do agendamento.");
      return;
    }

    if (!entryTime?.isValid()) {
      toast.error("Informe o horário de entrada.");
      return;
    }

    if (!exitTime?.isValid()) {
      toast.error("Informe o horário de saída.");
      return;
    }

    const startMoment = scheduledDate
      .hour(entryTime.hour())
      .minute(entryTime.minute())
      .second(0)
      .millisecond(0);

    const endMoment = scheduledDate
      .hour(exitTime.hour())
      .minute(exitTime.minute())
      .second(0)
      .millisecond(0);

    if (endMoment.isBefore(startMoment)) {
      toast.error("O horário de saída não pode ser anterior ao de entrada.");
      return;
    }

    if (isRecurrent && selectedWeekdays.length === 0) {
      toast.error("Selecione ao menos um dia da semana para a repetição.");
      return;
    }

    const validTasks = hasRoutine
      ? tasks.filter(
          (t) => t.scheduled_time.trim() !== "" && t.title.trim() !== ""
        )
      : [];

    try {
      setSubmitting(true);

      if (mode === "edit" && stay) {
        const item = validItems[0];
        const selectedMod = modalities.find((m) => m.id === item.modality_id);

        const petTasks = validTasks
          .filter(
            (t) => t.pet_ids.length === 0 || t.pet_ids.includes(item.pet_id!)
          )
          .map(({ task_type, scheduled_time, title, notes }) => ({
            task_type,
            scheduled_time,
            title,
            notes,
          }));

        const petFoodInfo = hasRoutine
          ? petTasks
              .filter((t) => t.task_type === "feeding")
              .map(
                (t) =>
                  `${t.scheduled_time} - ${t.title}${
                    t.notes ? ` (${t.notes})` : ""
                  }`
              )
              .join("; ") || null
          : null;

        await updateDaycareStay(stay.id, {
          modality_id: item.modality_id,
          stay_type: stayCalculation.stayType,
          quantity: stayCalculation.quantity,
          unit_price_cents: selectedMod?.price_cents ?? 0,
          scheduled_start_at: startMoment.format("YYYY-MM-DDTHH:mm:ssZ"),
          scheduled_end_at: endMoment.format("YYYY-MM-DDTHH:mm:ssZ"),
          food_info: petFoodInfo,
          notes: notes.trim() || null,
          tasks: petTasks,
        });
        toast.success("Agendamento de creche atualizado!");
      } else {
        for (const item of validItems) {
          const selectedMod = modalities.find((m) => m.id === item.modality_id);

          const petTasks = validTasks
            .filter(
              (t) => t.pet_ids.length === 0 || t.pet_ids.includes(item.pet_id!)
            )
            .map(({ task_type, scheduled_time, title, notes }) => ({
              task_type,
              scheduled_time,
              title,
              notes,
            }));

          const petFoodInfo = hasRoutine
            ? petTasks
                .filter((t) => t.task_type === "feeding")
                .map(
                  (t) =>
                    `${t.scheduled_time} - ${t.title}${
                      t.notes ? ` (${t.notes})` : ""
                    }`
                )
                .join("; ") || null
            : null;

          await createDaycareStay({
            client_id: selectedClientId,
            pet_id: item.pet_id!,
            modality_id: item.modality_id,
            stay_type: stayCalculation.stayType,
            quantity: stayCalculation.quantity,
            unit_price_cents: selectedMod?.price_cents ?? 0,
            scheduled_start_at: startMoment.format("YYYY-MM-DDTHH:mm:ssZ"),
            scheduled_end_at: endMoment.format("YYYY-MM-DDTHH:mm:ssZ"),
            food_info: petFoodInfo,
            notes: notes.trim() || null,
            tasks: petTasks,
            recurrence: isRecurrent
              ? {
                  frequency: "custom",
                  weekdays: selectedWeekdays,
                  weeks_count: recurrenceEndType === "never" ? 52 : weeksCount,
                  is_continuous: recurrenceEndType === "never",
                }
              : undefined,
          });
        }

        // Se marcado Banho & Tosa com serviços, agenda no banho e tosa para os pets configurados
        if (scheduleBath) {
          const validBathItems = bathItems.filter(
            (b) => b.pet_id !== null && b.service_ids.length > 0
          );

          if (validBathItems.length > 0) {
            const bathTimeDate = bathTime?.isValid()
              ? scheduledDate
                  .hour(bathTime.hour())
                  .minute(bathTime.minute())
                  .second(0)
                  .millisecond(0)
              : startMoment;

            await createAppointment({
              client_id: selectedClientId,
              scheduled_at: bathTimeDate.format("YYYY-MM-DDTHH:mm:ssZ"),
              notes: bathNotes.trim()
                ? `[Creche] ${bathNotes.trim()}`
                : "Agendado durante a estadia na Creche",
              items: validBathItems.map((bi) => ({
                pet_id: bi.pet_id!,
                service_ids: bi.service_ids,
              })),
            });
            queryClient.invalidateQueries({ queryKey: ["appointments"] });
          }
        }

        toast.success(
          validItems.length > 1
            ? `${validItems.length} agendamentos de creche criados com sucesso!`
            : "Agendamento de creche criado com sucesso!"
        );
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
      sx: { backgroundColor: theme.palette.common.white, width: "100%" },
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
              fontSize: { xs: "1.2rem", sm: "1.5rem" },
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
              width: 40,
              height: 40,
              borderRadius: 2,
              color: "text.secondary",
              "&:hover": { bgcolor: "action.hover", color: "text.primary" },
            }}
            onClick={onClose}
          >
            <X size={22} />
          </Box>
        </DialogTitle>

        {/* CONTENT */}
        <DialogContent
          sx={{
            p: { xs: 2, sm: 3 },
            mt: 2,
            display: "flex",
            flexDirection: "column",
            gap: { xs: 2.5, sm: 3 },
            flex: 1,
            overflowY: "auto",
            WebkitOverflowScrolling: "touch",
            overscrollBehavior: "contain",
          }}
        >
          {/* CLIENTE */}
          <FormControl fullWidth>
            <FormLabel
              sx={{ color: "text.primary", mb: 0.5, fontWeight: 600 }}
            >
              Cliente
            </FormLabel>
            <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
              <Autocomplete<Client>
                sx={{ flex: 1, minWidth: 0 }}
                options={clients ?? []}
                openOnFocus={false}
                autoHighlight
                filterOptions={(options, state) => {
                  const input = state.inputValue.toLowerCase();
                  return options
                    .filter((option) => {
                      const clientPets =
                        allPets?.filter(
                          (p) => p.client_id === option.id && !p.is_deceased
                        ) || [];
                      const matchName = option.name.toLowerCase().includes(input);
                      const matchPet = clientPets.some((p) =>
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
                isOptionEqualToValue={(option, value) => option.id === value.id}
                onInputChange={(_, __, reason) => {
                  if (reason === "input") setClientListLimit(20);
                }}
                renderOption={(props, option) => {
                  const clientPets =
                    allPets?.filter(
                      (p) => p.client_id === option.id && !p.is_deceased
                    ) || [];
                  const petsText =
                    clientPets.length > 0
                      ? clientPets.map((p) => p.name).join(", ")
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
                        <Typography variant="caption" color="text.secondary">
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

          {/* DATA E HORA (ENTRADA E SAÍDA NA MESMA LINHA) */}
          <FormControl fullWidth>
            <FormLabel
              sx={{ color: "text.primary", mb: 0.5, fontWeight: 600 }}
            >
              Data e hora
            </FormLabel>
            <Box
              sx={{
                display: "flex",
                flexDirection: { xs: "column", sm: "row" },
                gap: { xs: 1.5, sm: 2 },
                width: "100%",
              }}
            >
              {/* DATA */}
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography
                  variant="caption"
                  sx={{
                    color: "text.secondary",
                    fontWeight: 600,
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
                  dayOfWeekFormatter={(day: Dayjs) => {
                    const days = [
                      "dom",
                      "seg",
                      "ter",
                      "qua",
                      "qui",
                      "sex",
                      "sab",
                    ];
                    return days[day.day()];
                  }}
                  slots={{
                    day: CustomDay,
                    toolbar: CustomDatePickerToolbar,
                  }}
                  slotProps={sharedDatePickerSlotProps}
                />
              </Box>

              {/* HORÁRIO DE ENTRADA */}
              <Box
                sx={{
                  width: { xs: "100%", sm: "140px", md: "150px" },
                  flexShrink: 0,
                }}
              >
                <Typography
                  variant="caption"
                  sx={{
                    color: "text.secondary",
                    fontWeight: 600,
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

              {/* HORÁRIO DE SAÍDA */}
              <Box
                sx={{
                  width: { xs: "100%", sm: "140px", md: "150px" },
                  flexShrink: 0,
                }}
              >
                <Typography
                  variant="caption"
                  sx={{
                    color: "text.secondary",
                    fontWeight: 600,
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
          </FormControl>

          {/* PETS E SERVIÇOS */}
          <FormControl fullWidth>
            <FormLabel
              sx={{ color: "text.primary", mb: 0.5, fontWeight: 600 }}
            >
              Pets e Serviços
            </FormLabel>

            {items.map((item, index) => (
              <DaycarePetItem
                key={item.id}
                index={index}
                item={item}
                watchedClientId={selectedClientId}
                pets={pets || []}
                modalities={modalities}
                selectedPetIds={items
                  .map((i) => i.pet_id)
                  .filter((id): id is number => typeof id === "number")}
                onChangePet={handleChangePet}
                onChangeModality={handleChangeModality}
                onChangeShowAllServices={handleChangeShowAllServices}
                onCreatePet={(idx, cId) =>
                  setPetModal({ open: true, index: idx, clientId: cId })
                }
                onCreateService={(idx) =>
                  setServiceModal({ open: true, index: idx })
                }
                onRemove={handleRemovePetItem}
                isOnlyPet={items.length === 1}
              />
            ))}

            {mode === "create" && (
              <Button
                sx={{ display: "flex", mx: "auto", mt: 0.5 }}
                startIcon={<Plus size={18} />}
                variant="outlined"
                onClick={handleAddPetItem}
              >
                Adicionar outro Pet ao agendamento
              </Button>
            )}
          </FormControl>

          {/* OBSERVAÇÕES */}
          <FormControl fullWidth>
            <FormLabel sx={{ color: "text.primary", mb: 0.5 }}>
              Observações
            </FormLabel>
            <CustomTextField
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              multiline
              rows={3}
              placeholder="ex: Adicionais, comportamento, cuidados especiais, etc."
            />
          </FormControl>

          {/* 1. ROTINA DE ALIMENTAÇÃO E MEDICAÇÃO */}
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
                        gap: 2.5,
                      }}
                    >
                      {/* --- ALIMENTAÇÃO --- */}
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
                            mb: 1.5,
                          }}
                        >
                          <Utensils size={18} color="#15803D" />
                          <Typography
                            variant="subtitle2"
                            fontWeight={700}
                            color="#166534"
                          >
                            Alimentação
                          </Typography>
                        </Box>

                        {feedingTasks.length === 0 ? (
                          <Typography
                            variant="caption"
                            color="text.secondary"
                            sx={{ display: "block", mb: 1.5 }}
                          >
                            Nenhuma refeição cadastrada para esta estadia.
                          </Typography>
                        ) : (
                          <Box
                            sx={{
                              display: "flex",
                              flexDirection: "column",
                              gap: 1.5,
                              mb: 1.5,
                            }}
                          >
                            {feedingTasks.map((task, idx) => (
                              <Box
                                key={idx}
                                sx={{
                                  p: 1.5,
                                  bgcolor: "#FFFFFF",
                                  borderRadius: 1.5,
                                  border: "1px solid #86EFAC",
                                  display: "flex",
                                  flexDirection: "column",
                                  gap: 1.25,
                                }}
                              >
                                <Box
                                  sx={{
                                    display: "flex",
                                    gap: 1,
                                    alignItems: "center",
                                  }}
                                >
                                  <Box sx={{ flex: 1, minWidth: 0 }}>
                                    <TextField
                                      size="small"
                                      fullWidth
                                      label="Qual alimento?"
                                      placeholder="Ex.: Ração Premier Filhotes"
                                      value={task.title}
                                      onChange={(e) =>
                                        handleUpdateFeedingTask(
                                          idx,
                                          "title",
                                          e.target.value
                                        )
                                      }
                                    />
                                  </Box>
                                  <Box sx={{ width: { xs: 130, sm: 145 }, flexShrink: 0 }}>
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
                                    title="Remover refeição"
                                  >
                                    <Trash2 size={16} />
                                  </IconButton>
                                </Box>

                                <Autocomplete<Pet, true>
                                  multiple
                                  disableCloseOnSelect
                                  size="small"
                                  options={clientPets}
                                  getOptionLabel={(p) => p.name}
                                  value={clientPets.filter((p) =>
                                    (task.pet_ids || []).includes(p.id)
                                  )}
                                  onChange={(_, selected) =>
                                    handleUpdateTaskPets(
                                      idx,
                                      "feeding",
                                      selected.map((p) => p.id)
                                    )
                                  }
                                  isOptionEqualToValue={(option, value) =>
                                    option.id === value.id
                                  }
                                  noOptionsText={
                                    selectedClientId
                                      ? "Nenhum pet cadastrado para este cliente"
                                      : "Selecione um cliente primeiro"
                                  }
                                  renderTags={(value, getTagProps) =>
                                    value.map((option, index) => {
                                      const { key, ...tagProps } = getTagProps({
                                        index,
                                      });
                                      return (
                                        <Chip
                                          key={key}
                                          {...tagProps}
                                          label={option.name}
                                          size="small"
                                          sx={{
                                            height: 24,
                                            fontSize: "0.75rem",
                                            fontWeight: 600,
                                            bgcolor: "#DCFCE7",
                                            color: "#166534",
                                          }}
                                        />
                                      );
                                    })
                                  }
                                  renderOption={(props, option, { selected }) => {
                                    const { key, ...otherProps } = props as any;
                                    return (
                                      <Box
                                        component="li"
                                        key={key}
                                        {...otherProps}
                                        sx={{
                                          display: "flex",
                                          alignItems: "center",
                                          gap: 1,
                                        }}
                                      >
                                        <Checkbox
                                          size="small"
                                          checked={selected}
                                          sx={{ p: 0 }}
                                        />
                                        <Typography
                                          variant="body2"
                                          sx={{ fontWeight: 500 }}
                                        >
                                          {option.name}
                                        </Typography>
                                        {option.breed && (
                                          <Typography
                                            variant="caption"
                                            color="text.secondary"
                                          >
                                            ({option.breed})
                                          </Typography>
                                        )}
                                      </Box>
                                    );
                                  }}
                                  renderInput={(params) => (
                                    <TextField
                                      {...params}
                                      size="small"
                                      label="Vincular aos pets"
                                      placeholder={
                                        task.pet_ids?.length
                                          ? ""
                                          : "Selecione os pets da refeição"
                                      }
                                    />
                                  )}
                                />

                                <TextField
                                  size="small"
                                  fullWidth
                                  label="Instruções"
                                  placeholder="Ex.: Servir 100 gramas, aquecer por 15 segundos no micro-ondas e misturar com um pouco de água."
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
                          Adicionar outra refeição
                        </Button>
                      </Box>

                      {/* --- MEDICAÇÃO --- */}
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
                            mb: 1.5,
                          }}
                        >
                          <Pill size={18} color="#7C3AED" />
                          <Typography
                            variant="subtitle2"
                            fontWeight={700}
                            color="#5B21B6"
                          >
                            Medicação
                          </Typography>
                        </Box>

                        {medicationTasks.length === 0 ? (
                          <Typography
                            variant="caption"
                            color="text.secondary"
                            sx={{ display: "block", mb: 1.5 }}
                          >
                            Nenhum medicamento cadastrado para esta estadia.
                          </Typography>
                        ) : (
                          <Box
                            sx={{
                              display: "flex",
                              flexDirection: "column",
                              gap: 1.5,
                              mb: 1.5,
                            }}
                          >
                            {medicationTasks.map((task, idx) => (
                              <Box
                                key={idx}
                                sx={{
                                  p: 1.5,
                                  bgcolor: "#FFFFFF",
                                  borderRadius: 1.5,
                                  border: "1px solid #C4B5FD",
                                  display: "flex",
                                  flexDirection: "column",
                                  gap: 1.25,
                                }}
                              >
                                <Box
                                  sx={{
                                    display: "flex",
                                    gap: 1,
                                    alignItems: "center",
                                  }}
                                >
                                  <Box sx={{ flex: 1, minWidth: 0 }}>
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
                                  </Box>
                                  <Box sx={{ width: { xs: 130, sm: 145 }, flexShrink: 0 }}>
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
                                    title="Remover medicamento"
                                  >
                                    <Trash2 size={16} />
                                  </IconButton>
                                </Box>

                                <Autocomplete<Pet, true>
                                  multiple
                                  disableCloseOnSelect
                                  size="small"
                                  options={clientPets}
                                  getOptionLabel={(p) => p.name}
                                  value={clientPets.filter((p) =>
                                    (task.pet_ids || []).includes(p.id)
                                  )}
                                  onChange={(_, selected) =>
                                    handleUpdateTaskPets(
                                      idx,
                                      "medication",
                                      selected.map((p) => p.id)
                                    )
                                  }
                                  isOptionEqualToValue={(option, value) =>
                                    option.id === value.id
                                  }
                                  noOptionsText={
                                    selectedClientId
                                      ? "Nenhum pet cadastrado para este cliente"
                                      : "Selecione um cliente primeiro"
                                  }
                                  renderTags={(value, getTagProps) =>
                                    value.map((option, index) => {
                                      const { key, ...tagProps } = getTagProps({
                                        index,
                                      });
                                      return (
                                        <Chip
                                          key={key}
                                          {...tagProps}
                                          label={option.name}
                                          size="small"
                                          sx={{
                                            height: 24,
                                            fontSize: "0.75rem",
                                            fontWeight: 600,
                                            bgcolor: "#EDE9FE",
                                            color: "#5B21B6",
                                          }}
                                        />
                                      );
                                    })
                                  }
                                  renderOption={(props, option, { selected }) => {
                                    const { key, ...otherProps } = props as any;
                                    return (
                                      <Box
                                        component="li"
                                        key={key}
                                        {...otherProps}
                                        sx={{
                                          display: "flex",
                                          alignItems: "center",
                                          gap: 1,
                                        }}
                                      >
                                        <Checkbox
                                          size="small"
                                          checked={selected}
                                          sx={{ p: 0 }}
                                        />
                                        <Typography
                                          variant="body2"
                                          sx={{ fontWeight: 500 }}
                                        >
                                          {option.name}
                                        </Typography>
                                        {option.breed && (
                                          <Typography
                                            variant="caption"
                                            color="text.secondary"
                                          >
                                            ({option.breed})
                                          </Typography>
                                        )}
                                      </Box>
                                    );
                                  }}
                                  renderInput={(params) => (
                                    <TextField
                                      {...params}
                                      size="small"
                                      label="Vincular aos pets"
                                      placeholder={
                                        task.pet_ids?.length
                                          ? ""
                                          : "Selecione os pets da medicação"
                                      }
                                    />
                                  )}
                                />

                                <TextField
                                  size="small"
                                  fullWidth
                                  label="Instruções (dose, quantidade e forma de administração)"
                                  placeholder="Ex.: 1 comprimido via oral enrolado no patê, após a refeição"
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
                          Adicionar outro medicamento
                        </Button>
                      </Box>
                    </Box>
                  )}
                </Box>

          {/* 2. RECORRÊNCIA POR DIAS DA SEMANA */}
          {mode === "create" && (
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
                    checked={isRecurrent}
                    onChange={(e) => handleToggleRecurrence(e.target.checked)}
                    color="primary"
                  />
                }
                label={
                  <Typography variant="body2" fontWeight={600}>
                    Repetir agendamento semanalmente
                  </Typography>
                }
              />

                    {isRecurrent && (
                      <Box sx={{ mt: 1.5, display: "flex", flexDirection: "column", gap: 2 }}>
                        {/* SELEÇÃO DOS DIAS DA SEMANA */}
                        <Box>
                          <Typography
                            variant="caption"
                            color="text.secondary"
                            sx={{ display: "block", mb: 0.75, fontWeight: 600 }}
                          >
                            Selecione os dias da semana para a creche:
                          </Typography>
                          <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
                            {WEEKDAY_OPTIONS.map((w) => {
                              const isSelected = selectedWeekdays.includes(w.day);
                              const isBaseDay =
                                baseWeekday !== null && w.day === baseWeekday;
                              return (
                                <Button
                                  key={w.day}
                                  variant={isSelected ? "contained" : "outlined"}
                                  size="small"
                                  sx={{
                                    minWidth: 44,
                                    px: 1.25,
                                    py: 0.5,
                                    borderRadius: 1.5,
                                    fontWeight: 700,
                                    fontSize: "0.82rem",
                                    cursor: isBaseDay ? "default" : "pointer",
                                    ...(isBaseDay && {
                                      boxShadow:
                                        "0 0 0 2px rgba(79, 70, 229, 0.25)",
                                    }),
                                  }}
                                  onClick={() => toggleWeekday(w.day)}
                                  title={
                                    isBaseDay
                                      ? "Dia inicial do agendamento (obrigatório)"
                                      : undefined
                                  }
                                >
                                  {w.label}
                                </Button>
                              );
                            })}
                          </Box>
                        </Box>

                        {/* DURAÇÃO / AUTO-RENOVAÇÃO */}
                        <FormControl>
                          <FormLabel
                            sx={{
                              color: "text.primary",
                              mb: 0.5,
                              fontSize: "0.85rem",
                              fontWeight: 600,
                            }}
                          >
                            Repetir por
                          </FormLabel>
                          <RadioGroup
                            value={recurrenceEndType}
                            onChange={(e) =>
                              setRecurrenceEndType(e.target.value as "weeks" | "never")
                            }
                          >
                            <Box sx={{ display: "flex", alignItems: "center", mb: 0.5 }}>
                              <FormControlLabel
                                value="weeks"
                                control={
                                  <Radio
                                    size="small"
                                    disableRipple
                                    sx={{ color: theme.palette.primary.main }}
                                  />
                                }
                                label={<Typography variant="body2">Por</Typography>}
                                sx={{ mr: 1 }}
                              />
                              <TextField
                                size="small"
                                type="number"
                                disabled={recurrenceEndType !== "weeks"}
                                value={weeksCount}
                                onChange={(e) =>
                                  setWeeksCount(
                                    Math.max(1, Math.min(52, Number(e.target.value) || 1))
                                  )
                                }
                                inputProps={{ min: 1, max: 52 }}
                                sx={{ width: 80, mr: 1.5, bgcolor: "white" }}
                              />
                              <Typography variant="body2" color="text.primary">
                                semanas
                              </Typography>
                            </Box>

                            <FormControlLabel
                              value="never"
                              control={
                                <Radio
                                  size="small"
                                  disableRipple
                                  sx={{ color: theme.palette.primary.main }}
                                />
                              }
                              label={
                                <Typography variant="body2" fontWeight={600}>
                                  Contínua
                                </Typography>
                              }
                            />
                          </RadioGroup>
                        </FormControl>

                        {/* RESUMO INFORMATIVO */}
                        <Box
                          sx={{
                            p: 1.25,
                            borderRadius: 1.5,
                            bgcolor:
                              selectedWeekdays.length === 0 ? "#FFFBEB" : "#F8FAFC",
                            border: `1px solid ${
                              selectedWeekdays.length === 0 ? "#FDE68A" : "#E2E8F0"
                            }`,
                          }}
                        >
                          {selectedWeekdays.length === 0 ? (
                            <Typography variant="caption" color="#B45309">
                              Selecione ao menos um dia da semana para ativar a repetição.
                            </Typography>
                          ) : recurrenceEndType === "never" ? (
                            <Typography variant="caption" color="text.secondary">
                              A recorrência começa em{" "}
                              <b>
                                {scheduledDate?.format("dddd, DD [de] MMMM")}
                              </b>
                              . Serão agendadas{" "}
                              <b>{selectedWeekdays.length * 52} diárias</b> ao longo de{" "}
                              <b>52 semanas</b> (
                              {selectedWeekdays
                                .map((d) => WEEKDAY_OPTIONS.find((w) => w.day === d)?.label)
                                .join(", ")}
                              ) para cada pet.
                            </Typography>
                          ) : (
                            <Typography variant="caption" color="text.secondary">
                              A recorrência começa em{" "}
                              <b>
                                {scheduledDate?.format("dddd, DD [de] MMMM")}
                              </b>
                              . Serão agendadas{" "}
                              <b>{selectedWeekdays.length * weeksCount} diárias</b> ao longo de{" "}
                              <b>{weeksCount} semanas</b> (
                              {selectedWeekdays
                                .map((d) => WEEKDAY_OPTIONS.find((w) => w.day === d)?.label)
                                .join(", ")}
                              ) para cada pet.
                            </Typography>
                          )}
                        </Box>
                      </Box>
                    )}
                  </Box>
                )}

          {/* 3. SERVIÇOS ADICIONAIS DURANTE A ESTADIA */}
          {mode === "create" && (
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
                    checked={scheduleBath}
                    onChange={(e) => handleToggleScheduleBath(e.target.checked)}
                    color="primary"
                  />
                }
                label={
                  <Typography variant="body2" fontWeight={600}>
                    Agendar serviços durante a estadia
                  </Typography>
                }
              />

              {scheduleBath && (
                <Box
                  sx={{
                    mt: 1.5,
                    pb: 0.5,
                    display: "flex",
                    flexDirection: "column",
                    gap: 2,
                  }}
                >
                  {/* HORÁRIO DO SERVIÇO */}
                  <Box sx={{ maxWidth: { xs: "100%", sm: "240px" } }}>
                    <DesktopTimePicker
                      label="Horário"
                      value={bathTime}
                      onChange={(val) => setBathTime(val)}
                      ampm={false}
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

                  {/* LISTA DE PETS E SERVIÇOS */}
                  <Box
                    sx={{
                      display: "flex",
                      flexDirection: "column",
                      gap: 1.5,
                    }}
                  >
                    {bathItems.map((item, index) => (
                      <DaycareBathPetItem
                        key={item.id}
                        index={index}
                        item={item}
                        watchedClientId={selectedClientId}
                        pets={pets || []}
                        services={services || []}
                        selectedPetIds={bathItems
                          .map((b) => b.pet_id)
                          .filter((id): id is number => id !== null)}
                        onChangePet={handleChangeBathPet}
                        onChangeServices={handleChangeBathServices}
                        onChangeShowAllServices={
                          handleChangeBathShowAllServices
                        }
                        onRemove={handleRemoveBathPetItem}
                        isOnlyPet={bathItems.length === 1}
                      />
                    ))}

                    <Button
                      variant="outlined"
                      color="primary"
                      startIcon={<Plus size={18} />}
                      onClick={handleAddBathPetItem}
                      sx={{
                        display: "flex",
                        width: "fit-content",
                        mx: "auto",
                        mt: 0.5,
                      }}
                    >
                      Adicionar outro Pet
                    </Button>
                  </Box>

                  {/* OBSERVAÇÕES (PADRÃO BANHO & TOSA) */}
                  <FormControl fullWidth>
                    <FormLabel sx={{ color: "text.primary", mb: 0.5 }}>
                      Observações
                    </FormLabel>
                    <CustomTextField
                      multiline
                      rows={3}
                      placeholder="ex: Adicionais, comportamento, alergias, etc."
                      value={bathNotes}
                      onChange={(e) => setBathNotes(e.target.value)}
                    />
                  </FormControl>
                </Box>
              )}
            </Box>
          )}
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
        open={petModal.open}
        mode="create"
        client={clients?.find((c) => c.id === petModal.clientId)}
        onClose={() => setPetModal((prev) => ({ ...prev, open: false }))}
        onSuccess={handlePetCreated}
      />

      <DaycareServiceFormModal
        open={serviceModal.open}
        mode="create"
        onClose={() => setServiceModal((prev) => ({ ...prev, open: false }))}
        onSuccess={handleServiceCreated}
      />
    </>
  );
}
