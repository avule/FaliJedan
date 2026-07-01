// Oblici redova iz Supabase baze. Drzati uskladjeno sa /supabase/migrations.
// Kad se CLI podesi, moze se regenerisati sa `supabase gen types typescript`.

export type SportKey =
  | "football"
  | "basketball"
  | "padel"
  | "other";

export type Level = "casual" | "mid" | "competitive";

export type SlotStatus = "open" | "full" | "cancelled" | "done";

export type ApplicationStatus =
  | "pending"
  | "accepted"
  | "rejected"
  | "waitlist";

export type NoShowType = "no_show" | "late_cancel" | "early_cancel";

export type BanType = "soft" | "hard";

export interface Country {
  id: number;
  name: string;
  code: string;
}

export interface City {
  id: number;
  country_id: number;
  name: string;
}

export interface Player {
  id: string;
  name: string;
  country_id: number | null;
  city_id: number | null;
  sports: SportKey[];
  level: Level | null;
  avatar_url: string | null;
  reliability_score: number;
  no_show_count_30d: number;
  ban_until: string | null;
  created_at: string;
}

export interface Slot {
  id: string;
  organizer_id: string;
  sport: SportKey;
  /** Free-text sport name when sport === "other". Null otherwise. */
  custom_sport: string | null;
  title: string;
  description: string | null;
  location_name: string;
  lat: number;
  lng: number;
  city_id: number;
  scheduled_at: string;
  total_spots: number;
  filled_spots: number;
  level: Level;
  status: SlotStatus;
  created_at: string;
}

export interface Application {
  id: string;
  slot_id: string;
  player_id: string;
  status: ApplicationStatus;
  applied_at: string;
}

export interface Appearance {
  slot_id: string;
  player_id: string;
  showed_up: boolean;
  confirmed_at: string;
}

export interface NoShowLog {
  id: string;
  player_id: string;
  slot_id: string;
  type: NoShowType;
  created_at: string;
}

export interface Ban {
  id: string;
  player_id: string;
  type: BanType;
  reason: string | null;
  starts_at: string;
  ends_at: string;
  no_show_count: number;
}

export interface SlotChatMessage {
  id: string;
  slot_id: string;
  sender_id: string;
  content: string;
  created_at: string;
}

export interface Availability {
  player_id: string;
  date: string;
  time_from: string;
  time_to: string;
  sports: SportKey[];
}
