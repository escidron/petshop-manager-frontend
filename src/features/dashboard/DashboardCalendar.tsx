import { memo } from "react";
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

function DashboardCalendar({
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
          } as any,
        }}
        sx={{
          width: "100%",
          "& .MuiPickersCalendarHeader-root": {
            pl: 2,
            pr: 1,
            mb: 0.5,
          },
          "& .MuiPickersCalendarHeader-label": {
            fontSize: "0.9rem",
            fontWeight: 600,
            textTransform: "capitalize",
          },
          "& .MuiDayCalendar-weekDayLabel": {
            width: 36,
            height: 36,
            fontSize: "0.75rem",
            fontWeight: 600,
            color: "text.secondary",
            textTransform: "capitalize",
          },
          "& .MuiPickersDay-root": {
            width: 36,
            height: 36,
            fontSize: "0.8rem",
            fontWeight: 500,
            borderRadius: 2,
            "&.Mui-selected": {
              backgroundColor: "primary.main",
              color: "white",
              fontWeight: 700,
              "&:hover": {
                backgroundColor: "primary.dark",
              },
            },
            "&:hover": {
              backgroundColor: "grey.100",
            },
            "&.MuiPickersDay-today": {
              border: "1px solid",
              borderColor: "primary.main",
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

export default memo(DashboardCalendar);
