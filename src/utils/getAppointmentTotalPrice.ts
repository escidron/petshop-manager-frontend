export function getAppointmentTotal(appointment: {
  items: {
    services: { price_cents: number; is_package_covered?: boolean }[]
  }[]
}): number {
  return appointment.items.reduce((itemsAcc, item) => {
    const itemTotal = item.services
      .filter((s) => !s.is_package_covered)
      .reduce((servicesAcc, service) => servicesAcc + service.price_cents, 0);
    return itemsAcc + itemTotal;
  }, 0);
}