import type { PetAgeUnit, PetFormData } from "./types";

export const DEFAULT_PET_FORM: PetFormData = {
  // Obrigatórios
  name: "",          // obrigatório
  species: "",       // obrigatório
  is_active: true,
  client_id: 0,
  // Básicos
  breed: "",
  gender: "other",

  // Porte e pelagem
  size: undefined,
  coat_type: "",
  coat_color: "",

  // Idade
  age: undefined,
  age_unit: undefined,
  birth_date: undefined,

  // Observações
  notes: "",
  is_neutered: undefined,
};


export const PET_SPECIES = [
  { value: "Canino", label: "Canino" },
  { value: "Felino", label: "Felino" },
  { value: "Exotico", label: "Exotico" },
] as const;

export const COAT_COLORS = [
  "Branco",
  "Preto",
  "Cinza",
  "Marrom",
  "Caramelo",
  "Bege",
  "Dourado",
  "Creme",
  "Chocolate",
  "Canela",
  "Fulvo",
  "Rajado",
  "Tigrado",
  "Malhado",
  "Mesclado",
  "Tricolor",
  "Bicolor",
  "Pardo",
  "Amarelo",
  "Vermelho",
];

export const COAT_TYPES = [
  { value: "short", label: "Curta" },
  { value: "medium", label: "Média" },
  { value: "long", label: "Longa" },
  { value: "double", label: "Dupla camada" },
  { value: "hairless", label: "Sem pelo" },
] as const;

export const PET_SIZES = [
  { value: "PP", label: "Muito pequeno (PP)" },
  { value: "P", label: "Pequeno (P)" },
  { value: "M", label: "Médio (M)" },
  { value: "G", label: "Grande (G)" },
  { value: "GG", label: "Gigante (GG)" },
] as const;

export const PET_GENDERS = [
  { value: "male", label: "Macho" },
  { value: "female", label: "Fêmea" },
  { value: "other", label: "Não informado" },
] as const;

export const DOG_BREEDS = [
  "Afghan Hound",
  "Akita Inu",
  "Alaskan Malamute",
  "American Bully",
  "American Eskimo Dog",
  "American Pit Bull Terrier",
  "American Staffordshire Terrier",
  "Australian Cattle Dog",
  "Australian Shepherd",
  "Basenji",
  "Basset Hound",
  "Beagle",
  "Bearded Collie",
  "Bedlington Terrier",
  "Belgian Malinois",
  "Belgian Sheepdog",
  "Belgian Tervuren",
  "Bernese Mountain Dog",
  "Bichon Frisé",
  "Bloodhound",
  "Border Collie",
  "Borzoi",
  "Boston Terrier",
  "Boxer",
  "Brittany",
  "Bull Terrier",
  "Bulldog Francês",
  "Bulldog Inglês",
  "Bullmastiff",
  "Cairn Terrier",
  "Cane Corso",
  "Cavalier King Charles Spaniel",
  "Chesapeake Bay Retriever",
  "Chihuahua",
  "Chow Chow",
  "Cocker Spaniel Americano",
  "Cocker Spaniel Inglês",
  "Collie",
  "Coton de Tuléar",
  "Dachshund",
  "Dálmata",
  "Dobermann",
  "Dogue Alemão",
  "Dogue de Bordeaux",
  "English Setter",
  "English Springer Spaniel",
  "Fila Brasileiro",
  "Finnish Spitz",
  "Fox Terrier",
  "French Spaniel",
  "German Pinscher",
  "Golden Retriever",
  "Gordon Setter",
  "Great Pyrenees",
  "Greyhound",
  "Havanese",
  "Irish Setter",
  "Irish Wolfhound",
  "Italian Greyhound",
  "Jack Russell Terrier",
  "Japanese Chin",
  "Keeshond",
  "Komondor",
  "Kuvasz",
  "Labrador Retriever",
  "Lagotto Romagnolo",
  "Leonberger",
  "Lhasa Apso",
  "Maltês",
  "Mastiff Inglês",
  "Miniature Pinscher",
  "Newfoundland",
  "Norfolk Terrier",
  "Norwich Terrier",
  "Old English Sheepdog",
  "Papillon",
  "Pastor Alemão",
  "Pastor Australiano",
  "Pastor Branco Suíço",
  "Pequinês",
  "Pharaoh Hound",
  "Pinscher",
  "Pointer",
  "Pomeranian (Spitz Alemão)",
  "Poodle",
  "Poodle Miniatura",
  "Poodle Toy",
  "Portuguese Water Dog",
  "Pug",
  "Rhodesian Ridgeback",
  "Rottweiler",
  "Saint Bernard",
  "Saluki",
  "Samoyed",
  "Schipperke",
  "Schnauzer",
  "Schnauzer Miniatura",
  "Schnauzer Gigante",
  "Scottish Terrier",
  "Shar Pei",
  "Shiba Inu",
  "Shih Tzu",
  "Siberian Husky",
  "Skye Terrier",
  "Soft Coated Wheaten Terrier",
  "Staffordshire Bull Terrier",
  "Weimaraner",
  "Welsh Corgi Cardigan",
  "Welsh Corgi Pembroke",
  "West Highland White Terrier",
  "Whippet",
  "Yorkshire Terrier",
  "Sem Raça Definida (SRD)",
  "Outro"
];

export const CAT_BREEDS = [
  "Abyssinian",
  "American Shorthair",
  "Bengal",
  "Birmanês",
  "British Shorthair",
  "Burmese",
  "Cornish Rex",
  "Devon Rex",
  "Egyptian Mau",
  "Exotic Shorthair",
  "Maine Coon",
  "Norwegian Forest Cat",
  "Oriental Shorthair",
  "Persa",
  "Ragdoll",
  "Russian Blue",
  "Scottish Fold",
  "Scottish Straight",
  "Siamês",
  "Siberian",
  "Somali",
  "Sphynx",
  "Angorá Turco",
  "Sem Raça Definida (SRD)",
  "Outro"
];

export const AGE_UNIT_LABELS: Record<
  PetAgeUnit,
  { singular: string; plural: string }
> = {
  days: { singular: "dia", plural: "dias" },
  weeks: { singular: "semana", plural: "semanas" },
  months: { singular: "mês", plural: "meses" },
  years: { singular: "ano", plural: "anos" },
};

export const AGE_UNIT_OPTIONS: {
  value: PetAgeUnit;
  label: string;
}[] = Object.entries(AGE_UNIT_LABELS).map(
  ([value, labels]) => ({
    value: value as PetAgeUnit,
    label: labels.plural, // no select faz mais sentido plural
  })
);