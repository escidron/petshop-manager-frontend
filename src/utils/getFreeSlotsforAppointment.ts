import dayjs from "dayjs"
import type { Appointment, TimelineBlock } from "../features/appointments/types"

function getAppointmentDuration(appointment: Appointment): number {
    const petDurations = appointment.items.map((item) => {
        return item.services.reduce(
            (sum, service) => sum + (service.duration_minutes ?? 30),
            0
        )
    })

    if (petDurations.length === 0) return 0
    return Math.max(...petDurations)
}

export function buildDayTimeline(
    appointments: Appointment[],
    workStart: dayjs.Dayjs,
    workEnd: dayjs.Dayjs,
    minDuration: number
): TimelineBlock[] {
    const sorted = [...appointments].sort(
        (a, b) =>
            dayjs(a.scheduled_at).valueOf() -
            dayjs(b.scheduled_at).valueOf()
    )

    const blocks: TimelineBlock[] = []
    let cursor = workStart
    for (const appt of sorted) {
        const start = dayjs(appt.scheduled_at)
        const duration = getAppointmentDuration(appt)
        const end = start.add(duration, "minute")

        // gap antes do agendamento (limitado ao horário de funcionamento)
        const freeStart = cursor.isBefore(workStart) ? workStart : cursor
        const freeEnd = start.isAfter(workEnd) ? workEnd : start

        if (freeEnd.isAfter(freeStart) && freeEnd.diff(freeStart, "minute") >= minDuration) {
            blocks.push({
                type: "free",
                start: freeStart,
                end: freeEnd,
            })
        }

        blocks.push({
            type: "appointment",
            data: appt,
            start,
            end,
        })

        cursor = end.isAfter(cursor) ? end : cursor
    }

    // gap final (limitado ao horário de funcionamento)
    const finalStart = cursor.isBefore(workStart) ? workStart : cursor
    if (workEnd.isAfter(finalStart) && workEnd.diff(finalStart, "minute") >= minDuration) {
        blocks.push({
            type: "free",
            start: finalStart,
            end: workEnd,
        })
    }
    return blocks
}

