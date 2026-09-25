// Core data model for the criminal network graph.
// Extend `EntityType` and the ENTITY_META map below to add new entity kinds
// (e.g. 'bank_account', 'email') without touching the rendering code.

export type EntityType =
  | "person"
  | "location"
  | "vehicle"
  | "phone"
  | "organization";

export interface CrimeRecord {
  charge: string;
  date: string;
  caseId: string;
}

export interface GraphNode {
  id: string;
  label: string;
  type: EntityType;
  /** 0-100. How dangerous / central to ongoing criminal activity this node is flagged as. */
  riskScore: number;
  /** 0-100. Degree/betweenness-style centrality — how influential this node is in the network. */
  influenceScore: number;
  /** 0-100. Derived triage score (risk + influence + record) — who investigators should look at first. */
  leadPriority: number;
  /** Marked as a known suspect vs. an incidental/associated entity. */
  isSuspect?: boolean;
  /** Police station / district this entity's record is filed under. Links crossing two different
   *  jurisdictions are what "interconnected jurisdiction" highlights in the graph. */
  jurisdiction?: string;
  aliases?: string[];
  crimes?: CrimeRecord[];
  meta?: Record<string, string>;

  // d3-force mutates these at runtime — declared here so TS is happy
  // when the simulation writes positions/velocities back onto nodes.
  x?: number;
  y?: number;
  vx?: number;
  vy?: number;
  fx?: number | null;
  fy?: number | null;
}

export interface GraphLink {
  source: string | GraphNode;
  target: string | GraphNode;
  /** Relative strength of the connection, e.g. number of calls/meetings. Drives line thickness. */
  weight: number;
  /** e.g. "call", "owns", "visited", "associate", "transaction" */
  relation: string;
  /** false = a "missing link": an AI-inferred, not-yet-verified connection (e.g. same cell tower
   *  ping, shared vehicle sighting) rendered dashed so investigators know to go confirm it. */
  confirmed: boolean;
}

export interface GraphData {
  nodes: GraphNode[];
  links: GraphLink[];
}

export interface FilterState {
  types: Record<EntityType, boolean>;
  minRisk: number;
  minInfluence: number;
  search: string;
  suspectsOnly: boolean;
}

export const DEFAULT_FILTERS: FilterState = {
  types: {
    person: true,
    location: true,
    vehicle: true,
    phone: true,
    organization: true,
  },
  minRisk: 0,
  minInfluence: 0,
  search: "",
  suspectsOnly: false,
};

export const ENTITY_META: Record<
  EntityType,
  { label: string; color: string; glow: string }
> = {
  person: { label: "People", color: "#e8a33d", glow: "#f4c471" },
  location: { label: "Locations", color: "#3d9970", glow: "#6fd6a3" },
  vehicle: { label: "Vehicles", color: "#5b8ac9", glow: "#8fb4e8" },
  phone: { label: "Phone numbers", color: "#c77dff", glow: "#e0b3ff" },
  organization: { label: "Organizations", color: "#d64550", glow: "#f07a83" },
};