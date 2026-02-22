import { Box, Typography, Switch, Divider } from "@mui/material";
import { TimePicker } from "@mui/x-date-pickers/TimePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import dayjs from "dayjs";
import { Controller, useForm, useWatch } from "react-hook-form";
import { Button } from "../../components/Button/Button";
import type { BusinessHoursFormData } from "../onboarding/types";
import { days } from "./constants";

type Props = {
  onSubmit: (data: BusinessHoursFormData) => Promise<void>;
};

const TenantBusinessHours = ({ onSubmit }: Props) => {
  const { control, handleSubmit } = useForm<BusinessHoursFormData>({
    defaultValues: {
      schedule: days.map((day) => ({
        day,
        enabled: day === "Domingo" ? false : true,
        start: dayjs().hour(8).minute(0),
        end: dayjs().hour(19).minute(0),
      })),
    },
  });

  
  // ✅ jeito correto de usar useWatch
  const schedule = useWatch({
    control,
    name: "schedule",
  });

  return (
    <Box>
      <LocalizationProvider dateAdapter={AdapterDayjs}>
        <Typography variant="body1" color="text.disabled" mb={3}>
          Defina os horários em que poderá receber agendamentos. Os horários
          podem ser alterados a qualquer momento.
        </Typography>

        <Box
          display="grid"
          gridTemplateColumns="0.6fr 0.6fr 0.6fr 0.6fr"
          gap={2}
          alignItems="center"
        >
          {days.map((day, index) => {
            const enabled = schedule?.[index]?.enabled ?? false;

            return (
              <Box key={day} display="contents">
                <Typography fontWeight={600}>{day}</Typography>

                {/* Switch */}
                <Controller
                  name={`schedule.${index}.enabled`}
                  control={control}
                  render={({ field }) => (
                    <Box display="flex" alignItems="center">
                      <Switch
                        checked={field.value}
                        onChange={(e) => field.onChange(e.target.checked)}
                      />
                      <Typography
                        variant="body2"
                        color={field.value ? "text.primary" : "text.disabled"}
                      >
                        {field.value ? "Aberto" : "Fechado"}
                      </Typography>
                    </Box>
                  )}
                />

                {/* Hora início */}
                <Controller
                  name={`schedule.${index}.start`}
                  control={control}
                  render={({ field }) => (
                    <TimePicker
                      ampm={false}
                      value={field.value}
                      onChange={(newValue) => field.onChange(newValue)}
                      disabled={!enabled}
                      slotProps={{
                        textField: {
                          size: "small",
                          fullWidth: true,
                        },
                        popper: {
                          sx: {
                            "& .MuiMultiSectionDigitalClock-root": {
                              minHeight: 500, // altura total do clock
                            },
                            "& .MuiMultiSectionDigitalClockSection-root": {
                              minHeight: 500, // altura da coluna (horas/minutos)
                            },
                          },
                        },
                      }}
                    />
                  )}
                />

                {/* Hora fim */}
                <Controller
                  name={`schedule.${index}.end`}
                  control={control}
                  render={({ field }) => (
                    <TimePicker
                      ampm={false}
                      value={field.value}
                      onChange={(newValue) => field.onChange(newValue)}
                      disabled={!enabled}
                      slotProps={{
                        textField: {
                          size: "small",
                          fullWidth: true,
                        },
                        popper: {
                          sx: {
                            "& .MuiMultiSectionDigitalClock-root": {
                              minHeight: 500, // altura total do clock
                            },
                            "& .MuiMultiSectionDigitalClockSection-root": {
                              minHeight: 500, // altura da coluna (horas/minutos)
                            },
                          },
                        },
                      }}
                    />
                  )}
                />
              </Box>
            );
          })}
        </Box>
        <Divider sx={{ my: 3 }} />
        <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 2 }}>
          <Button
            data-action="save"
            onClick={handleSubmit((data: BusinessHoursFormData) => onSubmit(data))}
          >
            Salvar
          </Button>
        </Box>
      </LocalizationProvider>
    </Box>
  );
};

export default TenantBusinessHours;
