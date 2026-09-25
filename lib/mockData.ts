import { GraphData, GraphNode, GraphLink, EntityType, CrimeRecord } from "@/types/graph";

// Deterministic pseudo-random so the layout doesn't jump around on every
// hot-reload. Swap this whole file out for your real NLP/entity-extraction
// pipeline output — the shape (GraphData) is the only contract that matters.
function seeded(seed: number) {
  let s = seed;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}
const rand = seeded(42);
const pick = <T,>(arr: T[]) => arr[Math.floor(rand() * arr.length)];

const FIRST = ["Rakesh", "Vikram", "Suresh", "Anil", "Farhan", "Deepak", "Sanjay", "Irfan", "Ravi", "Arjun", "Mohit", "Zaid", "Kunal", "Rahul", "Tariq"];
const LAST = ["Malhotra", "Sharma", "Shah", "Khan", "Reddy", "Verma", "Iyer", "Bhatt", "Nair", "Gupta", "Chauhan", "Ansari"];
const CITIES = ["Andheri Godown", "Dharavi Yard", "Nashik Highway Dhaba", "Bhiwandi Warehouse", "Surat Port Gate 3", "Thane Scrapyard", "Vashi Market", "Panvel Toll Plaza"];
const ORGS = ["Shivam Traders Pvt Ltd", "Konkan Shipping Co.", "Sunrise Logistics", "Al-Madina Imports", "Pacific Freight Agency", "Golden Gate Finance"];
const VEHICLES = ["MH04 AB 1123", "MH02 CJ 4471", "GJ05 KT 9981", "MH43 XZ 2210", "RJ14 GT 7765", "MH12 QF 3390"];

// Jurisdictions a record can be filed under. A link between two entities
// filed under *different* jurisdictions is what "interconnected jurisdiction"
// surfaces — it means the network operates across police-boundary lines,
// which usually means separate cases need to be joined up.
const JURISDICTIONS = [
  "Mumbai City Police",
  "Thane Rural Police",
  "Navi Mumbai Police",
  "Surat City Police",
  "Nashik Rural Police",
  "Pune City Police",
];

const CHARGES = [
  "Extortion — IPC 384",
  "Smuggling — Customs Act",
  "Illegal arms possession — Arms Act",
  "Drug trafficking — NDPS Act",
  "Kidnapping for ransom — IPC 364A",
  "Money laundering — PMLA",
  "Assault — IPC 323",
  "Criminal conspiracy — IPC 120B",
  "Human trafficking — IPC 370",
  "Counterfeit currency — IPC 489B",
];

const ALIAS_POOL = ["Bhai", "Tiger", "Chotu", "Pintu", "Shooter", "Bunty", "Lala"];

function makeLabel(type: EntityType, i: number): string {
  switch (type) {
    case "person":
      return `${pick(FIRST)} ${pick(LAST)}`;
    case "location":
      return pick(CITIES);
    case "vehicle":
      return pick(VEHICLES);
    case "organization":
      return pick(ORGS);
    case "phone":
      return `+91 ${70000 + Math.floor(rand() * 9999)} ${10000 + Math.floor(rand() * 89999)}`;
  }
  return `Entity ${i}`;
}

function randomDate(): string {
  const year = 2023 + Math.floor(rand() * 4); // 2023-2026
  const month = String(1 + Math.floor(rand() * 12)).padStart(2, "0");
  const day = String(1 + Math.floor(rand() * 28)).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function makeCrimeRecord(caseSeed: number): CrimeRecord {
  return {
    charge: pick(CHARGES),
    date: randomDate(),
    caseId: `FIR/${2023 + Math.floor(rand() * 4)}/${1000 + caseSeed}`,
  };
}

function buildNodes(count: number): GraphNode[] {
  const nodes: GraphNode[] = [];
  // Weighted so "person" dominates like a real case file would.
  const weightedTypes: EntityType[] = [
    ...Array(5).fill("person"),
    ...Array(2).fill("phone"),
    ...Array(2).fill("location"),
    ...Array(1).fill("vehicle"),
    ...Array(1).fill("organization"),
  ];
  for (let i = 0; i < count; i++) {
    const type = weightedTypes[Math.floor(rand() * weightedTypes.length)];
    const influenceScore = Math.round(rand() * 100);
    const riskScore = Math.round(
      Math.min(100, influenceScore * 0.5 + rand() * 60)
    );
    const isSuspect = type === "person" && riskScore > 55 && rand() > 0.35;
    const crimes = isSuspect
      ? Array.from({ length: 1 + Math.floor(rand() * 3) }, () => makeCrimeRecord(i))
      : undefined;

    // Lead priority: weighted blend of risk, influence, and how much of a
    // paper trail (confirmed crimes) exists. This is the "who do we chase
    // first" number surfaced in the graph and the Top Leads list.
    const recordWeight = crimes ? Math.min(20, crimes.length * 7) : 0;
    const leadPriority = Math.round(
      Math.min(100, riskScore * 0.45 + influenceScore * 0.35 + recordWeight)
    );

    nodes.push({
      id: `n${i}`,
      label: makeLabel(type, i),
      type,
      riskScore,
      influenceScore,
      leadPriority,
      isSuspect,
      jurisdiction: pick(JURISDICTIONS),
      aliases:
        isSuspect && rand() > 0.5 ? [pick(ALIAS_POOL)] : undefined,
      crimes,
      meta:
        type === "person"
          ? { age: `${20 + Math.floor(rand() * 40)}`, lastSeen: randomDate() }
          : undefined,
    });
  }
  ensureMinSuspects(nodes, Math.max(10, Math.round(count * 0.18)));
  return nodes;
}

// Top up suspects by promoting the highest-risk remaining people, so small
// or unlucky random draws still produce a graph with a real network to show.
function ensureMinSuspects(nodes: GraphNode[], min: number) {
  const persons = nodes.filter((n) => n.type === "person");
  const current = persons.filter((n) => n.isSuspect).length;
  if (current >= min) return;
  const candidates = persons
    .filter((n) => !n.isSuspect)
    .sort((a, b) => b.riskScore - a.riskScore);
  let need = min - current;
  for (const c of candidates) {
    if (need <= 0) break;
    c.isSuspect = true;
    if (!c.crimes) c.crimes = [makeCrimeRecord(Math.floor(rand() * 999))];
    c.leadPriority = Math.round(Math.min(100, c.leadPriority + 15));
    need--;
  }
}

function buildLinks(nodes: GraphNode[], density: number): GraphLink[] {
  const links: GraphLink[] = [];
  const relations = ["call", "associate", "visited", "owns", "transaction"];
  // A few hub nodes get disproportionately more connections, like real
  // criminal networks (a handful of high-degree "influencer" nodes).
  const hubs = nodes.filter((n) => n.influenceScore > 70);

  nodes.forEach((node) => {
    const edgeCount = Math.max(1, Math.round(rand() * density));
    for (let e = 0; e < edgeCount; e++) {
      const preferHub = rand() > 0.5 && hubs.length > 0;
      const targetPool = preferHub ? hubs : nodes;
      const target = pick(targetPool);
      if (target.id === node.id) continue;
      links.push({
        source: node.id,
        target: target.id,
        weight: Math.round(1 + rand() * 9),
        relation: pick(relations),
        confirmed: true,
      });
    }
  });

  // De-dupe A-B / B-A pairs
  const seen = new Set<string>();
  const deduped = links.filter((l) => {
    const key = [l.source, l.target].sort().join("::");
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  return [...deduped, ...buildInferredLinks(nodes, seen)];
}

// "Missing links": pairs of entities that AREN'T already connected but share
// a signal worth flagging (e.g. two suspects filed under the same
// jurisdiction with high risk scores) — surfaced as an unconfirmed,
// investigator-should-verify connection rather than a hard fact.
function buildInferredLinks(nodes: GraphNode[], existingPairs: Set<string>): GraphLink[] {
  const inferred: GraphLink[] = [];
  const highRisk = nodes.filter((n) => n.riskScore > 60);
  const targetCount = Math.max(6, Math.round(nodes.length * 0.08));

  let attempts = 0;
  while (inferred.length < targetCount && attempts < targetCount * 20) {
    attempts++;
    const a = pick(highRisk.length > 1 ? highRisk : nodes);
    const b = pick(nodes);
    if (a.id === b.id) continue;
    const key = [a.id, b.id].sort().join("::");
    if (existingPairs.has(key)) continue;
    existingPairs.add(key);
    inferred.push({
      source: a.id,
      target: b.id,
      weight: 1 + Math.floor(rand() * 3),
      relation: "possible link",
      confirmed: false,
    });
  }
  return inferred;
}

export function getMockGraphData(nodeCount = 90): GraphData {
  const nodes = buildNodes(nodeCount);
  const links = buildLinks(nodes, 2.2);
  return { nodes, links };
}