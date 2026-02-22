import type dayjs from "dayjs";

export type OnboardingStep =
  | "services"
  | "business_hours"
  | "client"
  | "pet"
  | "completed";

  export type BusinessHour = {
  day: string;
  enabled: boolean;
  start: dayjs.Dayjs | null;
  end: dayjs.Dayjs | null;
};

export type BusinessHoursFormData = {
  schedule: BusinessHour[];
};