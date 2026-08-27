import { Badge } from "@mui/material";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { DateCalendar } from "@mui/x-date-pickers/DateCalendar";
import { PickersDay, type PickersDayProps } from "@mui/x-date-pickers/PickersDay";
import "dayjs/locale/pt-br";
import type { Dayjs } from "dayjs";

export function CustomDay(props: PickersDayProps & { highlightedDays?: Set<string>; day: Dayjs }) {
  const { highlightedDays = new Set(), day, outsideCurrentMonth, ...other } = props;

  const hasAppointment = !outsideCurrentMonth && highlightedDays.has(day.format("YYYY-MM-DD"));

  if (!hasAppointment) {
    return <PickersDay {...other} outsideCurrentMonth={outsideCurrentMonth} day={day} />;
  }

  return (
    <Badge
      key={day.toString()}
      overlap="circular"
      variant="dot"
      sx={{
        "& .MuiBadge-badge": {
          backgroundColor: "#1976d2",
          bottom: 4,
          right: "50%",
          transform: "translateX(50%)",
          width: 14,
          height: 3,
          borderRadius: 2,
        },
      }}
    >
      <PickersDay {...other} outsideCurrentMonth={outsideCurrentMonth} day={day} />
    </Badge>
  );
}

type Props = {
  value: Dayjs;
  onChange: (newDate: Dayjs | null) => void;
  onMonthChange?: (newMonth: Dayjs) => void;
  highlightedDays?: Set<string>;
};

export default function DashboardCalendar({
  value,
  onChange,
  onMonthChange,
  highlightedDays = new Set(),
}: Props) {
  return (
    <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="pt-br">
      <DateCalendar
        value={value}
        onChange={onChange}
        onMonthChange={(newMonth) => {
          if (onMonthChange) onMonthChange(newMonth);
        }}
        dayOfWeekFormatter={(day: Dayjs) => {
          const days = ["dom", "seg", "ter", "qua", "qui", "sex", "sab"];
          return days[day.day()];
        }}
        slots={{
          day: CustomDay,
        }}
        slotProps={{
          day: {
            highlightedDays,
          } as PickersDayProps & { highlightedDays: Set<string> },
        }}
        sx={{
          width: "100%",
          height: "320px",
          margin: 0,
          backgroundColor: "#ffffff",
          "& *": {
            color: "#3d4048 !important",
          },
          "& .MuiPickersCalendarHeader-root": {
            mt: 1,
            mb: 0,
            px: 2,
            minHeight: "40px",
          },
          "& .MuiPickersCalendarHeader-labelContainer": {
            color: "#3d4048 !important",
          },
          "& .MuiPickersCalendarHeader-label": {
            color: "#3d4048 !important",
            fontWeight: 600,
            fontSize: "0.9rem",
          },
          "& .MuiPickersArrowSwitcher-button": {
            color: "#3d4048 !important",
          },
          "& .MuiDayCalendar-weekDayLabel": {
            color: "#3d4048 !important",
            fontWeight: 700,
            fontSize: "0.75rem",
          },
          "& .MuiPickersDay-root": {
            width: "36px",
            height: "36px",
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
        }}
      />
    </LocalizationProvider>
  );
}
