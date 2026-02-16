export function getAppointmentTotal(appointment: {
  items: {
    services: { price_cents: number }[]
  }[]
}): number {
  return appointment.items.reduce((itemsAcc, item) => {
    const itemTotal = item.services.reduce(
      (servicesAcc, service) => servicesAcc + service.price_cents,
      0
    )

    return itemsAcc + itemTotal
  }, 0)
}