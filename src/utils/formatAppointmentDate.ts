import dayjs from "dayjs"
import "dayjs/locale/pt-br"

dayjs.locale("pt-br")

export function formatAppointmentDate(date: string) {
  const d = dayjs(date)
  const now = dayjs()

  if (d.isSame(now, "day")) {
    return `Hoje às ${d.format("HH:mm")}`
  }

  if (d.isSame(now.add(1, "day"), "day")) {
    return `Amanhã às ${d.format("HH:mm")}`
  }

  if (d.isSame(now.subtract(1, "day"), "day")) {
    return `Ontem às ${d.format("HH:mm")}`
  }

  return `${d.format("D [de] MMMM")} às ${d.format("HH:mm")}`
}
