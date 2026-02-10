import type { ClientFormData } from "./types";

export const DEFAULT_CLIENT_FORM: ClientFormData = {
  name: "",                  // obrigatório
  phone: "",                 // obrigatório
  is_active: false,         
  email: undefined,                 
  document_type: "CPF", 
  document: undefined,
  birth_date: undefined,
  cep: "",
  street: "",
  number: "",
  complement: "",
  neighborhood: "",
  city: "",
  state: "",
  instagram: "",
  facebook: "",
  x: "",
  phone_secondary_name: "",
  phone_secondary:undefined,
  phone_tertiary_name: "",
  phone_tertiary: undefined,
};