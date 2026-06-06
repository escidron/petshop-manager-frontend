export interface PredefinedServiceTemplate {
  key: string;
  name: string;
  description: string;
  species: "Canino" | "Felino" | "Exoticos";
  size: "PP" | "P" | "M" | "G" | "GG";
  price_cents: number;
  duration_minutes: number;
}

export const PREDEFINED_SERVICES_MATRIX: {
  [serviceKey: string]: {
    name: string;
    description: string;
    defaults: {
      [species: string]: {
        [size: string]: {
          price_cents: number;
          duration_minutes: number;
        };
      };
    };
  };
} = {
  banho: {
    name: "Banho",
    description: "Banho completo com shampoo neutro e secagem",
    defaults: {
      Canino: {
        PP: { price_cents: 4000, duration_minutes: 30 },
        P: { price_cents: 5000, duration_minutes: 45 },
        M: { price_cents: 6000, duration_minutes: 60 },
        G: { price_cents: 8000, duration_minutes: 75 },
        GG: { price_cents: 10000, duration_minutes: 90 },
      },
      Felino: {
        P: { price_cents: 6000, duration_minutes: 45 },
        M: { price_cents: 7000, duration_minutes: 60 },
        G: { price_cents: 9000, duration_minutes: 75 },
      },
    },
  },
  banho_tosa: {
    name: "Banho e Tosa",
    description: "Banho completo + tosa (máquina/tesoura)",
    defaults: {
      Canino: {
        PP: { price_cents: 7000, duration_minutes: 60 },
        P: { price_cents: 8000, duration_minutes: 75 },
        M: { price_cents: 10000, duration_minutes: 90 },
        G: { price_cents: 13000, duration_minutes: 120 },
        GG: { price_cents: 16000, duration_minutes: 150 },
      },
      Felino: {
        P: { price_cents: 10000, duration_minutes: 90 },
        M: { price_cents: 12000, duration_minutes: 105 },
        G: { price_cents: 14000, duration_minutes: 120 },
      },
    },
  },
  tosa_higienca: {
    name: "Tosa Higiênica",
    description: "Tosa das patinhas, região íntima e barriga",
    defaults: {
      Canino: {
        PP: { price_cents: 3500, duration_minutes: 30 },
        P: { price_cents: 4000, duration_minutes: 30 },
        M: { price_cents: 5000, duration_minutes: 45 },
        G: { price_cents: 6000, duration_minutes: 45 },
        GG: { price_cents: 7000, duration_minutes: 60 },
      },
      Felino: {
        P: { price_cents: 5000, duration_minutes: 45 },
        M: { price_cents: 6000, duration_minutes: 45 },
        G: { price_cents: 7000, duration_minutes: 45 },
      },
    },
  },
  corte_unha: {
    name: "Corte de Unhas",
    description: "Corte e lixamento das unhas",
    defaults: {
      Canino: {
        PP: { price_cents: 1500, duration_minutes: 15 },
        P: { price_cents: 1500, duration_minutes: 15 },
        M: { price_cents: 1500, duration_minutes: 15 },
        G: { price_cents: 2000, duration_minutes: 15 },
        GG: { price_cents: 2000, duration_minutes: 15 },
      },
      Felino: {
        P: { price_cents: 1500, duration_minutes: 15 },
        M: { price_cents: 1500, duration_minutes: 15 },
        G: { price_cents: 1500, duration_minutes: 15 },
      },
    },
  },
  limpeza_ouvido: {
    name: "Limpeza de Ouvidos",
    description: "Higienização dos condutos auditivos externos",
    defaults: {
      Canino: {
        PP: { price_cents: 1500, duration_minutes: 15 },
        P: { price_cents: 1500, duration_minutes: 15 },
        M: { price_cents: 1500, duration_minutes: 15 },
        G: { price_cents: 1500, duration_minutes: 15 },
        GG: { price_cents: 1500, duration_minutes: 15 },
      },
      Felino: {
        P: { price_cents: 1500, duration_minutes: 15 },
        M: { price_cents: 1500, duration_minutes: 15 },
        G: { price_cents: 1500, duration_minutes: 15 },
      },
    },
  },
};
