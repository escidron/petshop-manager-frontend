import dayjs from "dayjs"
import type { Appointment } from "../features/appointments/types"

function getAppointmentDuration(appointment: Appointment): number {
    const petDurations = appointment.items.map((item) => {
        return item.services.reduce(
            (sum, service) => sum + (service.duration_minutes ?? 30),
            0
        )
    })

    if (petDurations.length === 0) return 0
    console.log("petDurations", petDurations)
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

        // gap antes do agendamento
        if (start.diff(cursor, "minute") >= minDuration) {
            blocks.push({
                type: "free",
                start: cursor,
                end: start,
            })
        }

        blocks.push({
            type: "appointment",
            data: appt,
            start,
            end,
        })

        cursor = end
    }

    // gap final
    if (workEnd.diff(cursor, "minute") >= minDuration) {
        blocks.push({
            type: "free",
            start: cursor,
            end: workEnd,
        })
    }

    return blocks
}
