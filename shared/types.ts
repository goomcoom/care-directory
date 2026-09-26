// Types shared by the React app (src/) and the Express server (server/).

export const CATEGORY_IDS = [
  "pharmacy",
  "gp",
  "dentist",
  "optician",
  "physio",
  "sexual-health",
  "mental-health",
  "urgent-care",
  "minor-injuries",
  "podiatry",
] as const;
export type CategoryId = (typeof CATEGORY_IDS)[number];

export const DISTRICT_IDS = [
  "northgate",
  "riverside",
  "old-town",
  "meadowbrook",
  "harbour",
  "hillcrest",
] as const;
export type DistrictId = (typeof DISTRICT_IDS)[number];

export interface Category {
  id: CategoryId;
  /** Singular label, e.g. "Pharmacy". */
  label: string;
  /** Plural label used in step descriptions, e.g. "pharmacies". */
  plural: string;
}

export interface District {
  id: DistrictId;
  name: string;
  /** One line of character for the map tooltip and directory filters. */
  blurb: string;
  /** SVG path in the 0–100 × 0–70 map viewBox. */
  path: string;
  /** Label anchor in map coordinates. */
  label: { x: number; y: number };
}

/** One opening interval, 24h "HH:MM" strings. */
export interface OpenInterval {
  open: string;
  close: string;
}

/** Index 0 = Sunday … 6 = Saturday, matching Date.getDay(). Empty array = closed. */
export type OpeningHours = [
  OpenInterval[],
  OpenInterval[],
  OpenInterval[],
  OpenInterval[],
  OpenInterval[],
  OpenInterval[],
  OpenInterval[],
];

export interface Provider {
  id: string;
  /** Placeholder names only: "Pharmacy A", "Dental Practice B", "Dr X's Practice". */
  name: string;
  category: CategoryId;
  district: DistrictId;
  /** Free-form facets matched by the search tool's `query`. */
  tags: string[];
  nhs: boolean;
  walkIn: boolean;
  accessible: boolean;
  hours: OpeningHours;
  /** Ofcom's reserved drama range, so no real number is ever shown. */
  phone: string;
  /** Position in the 0–100 × 0–70 map viewBox. */
  x: number;
  y: number;
  blurb: string;
}

export interface Recommendation {
  providerId: string;
  reason: string;
}

/** One thing the agent did on the way to an answer, shown as a progress step. */
export interface AgentStep {
  id: string;
  label: string;
  detail?: string;
}

export interface UserMessage {
  id: string;
  role: "user";
  text: string;
  at: string;
}

export interface AssistantMessage {
  id: string;
  role: "assistant";
  text: string;
  recommendations: Recommendation[];
  followUp?: string;
  safety?: string;
  steps: AgentStep[];
  at: string;
}

export type ChatMessage = UserMessage | AssistantMessage;
