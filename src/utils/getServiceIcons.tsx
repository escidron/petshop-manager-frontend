import { ScissorsIcon, ShowerHead, Syringe } from "lucide-react";

// Mapeia keyword → tipo de ícone (a chave de dedup é o tipo, não o keyword)
const KEYWORD_TO_ICON_TYPE: Record<string, string> = {
  banho:     "shower",
  ducha:     "shower",
  tosa:      "scissors",
  higienica: "scissors",
  vacina:    "syringe",
  vacinacao: "syringe",
};

const ICON_COMPONENTS: Record<string, React.ReactNode> = {
  shower:   <ShowerHead size={24} />,
  scissors: <ScissorsIcon size={22} />,
  syringe:  <Syringe size={24} />,
};

export function getServiceIcons(serviceNames: string[]) {
  const normalized = (text: string) =>
    text.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

  // Set de tipos já adicionados — garante um ícone por tipo independente dos keywords
  const addedTypes = new Set<string>();

  serviceNames.forEach((name) => {
    const cleanName = normalized(name);
    Object.entries(KEYWORD_TO_ICON_TYPE).forEach(([keyword, iconType]) => {
      if (cleanName.includes(keyword)) {
        addedTypes.add(iconType);
      }
    });
  });

  return Array.from(addedTypes).map((type) => ICON_COMPONENTS[type]);
}
