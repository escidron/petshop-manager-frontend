import type { Client } from "../../clients/types";
import type { Pet } from "../../pets/types";
import type { Service } from "../../tenant_services/types";

export type WaitingListStatus = "pending" | "scheduled" | "canceled";
export type WaitingListPeriod = "any" | "morning" | "afternoon" | "evening";

export interface WaitingListItem {
  id: number;
  pet_id: number;
  pet: Pet;
  services: Service[];
}

export interface WaitingListEntry {
  id: number;
  tenant_id: number;
  client_id: number;
  status: WaitingListStatus;
  preferred_date: string | null;
  preferred_period: WaitingListPeriod;
  notes: string | null;
  created_at: string;
  client: Client;
  items: WaitingListItem[];
}

export interface WaitingListEntryCreate {
  client_id: number;
  preferred_date?: string | null;
  preferred_period?: WaitingListPeriod;
  notes?: string | null;
  items: { pet_id: number; service_ids: number[] }[];
}

export interface WaitingListEntryUpdate {
  status?: WaitingListStatus;
  preferred_date?: string | null;
  preferred_period?: WaitingListPeriod;
  notes?: string | null;
}
