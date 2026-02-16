import { ScissorsIcon, ShowerHead, Syringe } from "lucide-react";


export function getServiceIcons(serviceNames: string[]) {
  const normalized = (text: string) =>
    text
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");

  const iconMap: Record<string, React.ReactNode> = {
    banho: <ShowerHead size={24} />,
    ducha: <ShowerHead size={24} />,

    tosa: <ScissorsIcon size={22} />,
    higienica: <ScissorsIcon size={22} />,

    vacina: <Syringe size={24} />,
    vacinacao: <Syringe size={24} />

  };

  const icons = new Map<string, React.ReactNode>();

  serviceNames.forEach((name) => {
    const cleanName = normalized(name);

    Object.entries(iconMap).forEach(([keyword, icon]) => {
      if (cleanName.includes(keyword)) {
        icons.set(keyword, icon); // evita duplicação
      }
    });
  });

  return Array.from(icons.values());
}
