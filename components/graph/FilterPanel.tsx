"use client";

import { EntityType, FilterState, ENTITY_META, GraphData, GraphNode } from "@/types/graph";

interface Props {
  filters: FilterState;
  onChange: (next: FilterState) => void;
  data: GraphData;
  visibleCount: { nodes: number; links: number };
  topLeads: GraphNode[];
  onSelectLead: (node: GraphNode) => void;
}

export default function FilterPanel({ filters, onChange, data, visibleCount, topLeads, onSelectLead }: Props) {
  const totalsByType = (Object.keys(ENTITY_META) as EntityType[]).reduce(
    (acc, t) => {
      acc[t] = data.nodes.filter((n) => n.type === t).length;
      return acc;
    },
    {} as Record<EntityType, number>
  );

  function toggleType(type: EntityType) {
    onChange({ ...filters, types: { ...filters.types, [type]: !filters.types[type] } });
  }

  return (
    <aside className="flex h-full w-80 shrink-0 flex-col border-l border-[#1f2733] bg-[#0d1119] text-[#e6e9ef]">
      <div className="border-b border-[#1f2733] px-4 py-3">
        <h2 className="text-sm font-medium tracking-tight">Filters</h2>
        <p className="mt-0.5 font-mono text-xs text-[#6b7688]">
          {visibleCount.nodes} entities · {visibleCount.links} links shown
        </p>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-6">
        {/* Top leads */}
        {topLeads.length > 0 && (
          <section>
            <span className="mb-2 block text-xs text-[#8b93a3]">Top leads · by priority</span>
            <ul className="space-y-1">
              {topLeads.map((n) => (
                <li key={n.id}>
                  <button
                    onClick={() => onSelectLead(n)}
                    className="flex w-full items-center justify-between border border-[#1f2733] bg-[#12161f] px-2.5 py-1.5 text-left hover:border-[#ff8c42]/50"
                  >
                    <span className="flex items-center gap-2 truncate text-sm">
                      <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: ENTITY_META.person.color }} />
                      <span className="truncate">{n.label}</span>
                    </span>
                    <span className="ml-2 shrink-0 font-mono text-xs text-[#ff8c42]">{n.leadPriority}</span>
                  </button>
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* Search */}
        <section>
          <label className="mb-1.5 block text-xs text-[#8b93a3]">Search entity</label>
          <input
            type="text"
            value={filters.search}
            onChange={(e) => onChange({ ...filters, search: e.target.value })}
            placeholder="Name, phone, plate number…"
            className="w-full border border-[#1f2733] bg-[#12161f] px-2.5 py-1.5 text-sm outline-none placeholder:text-[#4a5262] focus:border-[#3d5a80]"
          />
          {filters.search.trim() && (
            <p className="mt-1 text-[11px] text-[#4a5262]">
              Showing matches (gold ring) plus everyone/everything directly connected to them.
            </p>
          )}
        </section>

        {/* Entity types */}
        <section>
          <span className="mb-2 block text-xs text-[#8b93a3]">Entity type</span>
          <div className="space-y-1.5">
            {(Object.keys(ENTITY_META) as EntityType[]).map((type) => {
              const meta = ENTITY_META[type];
              return (
                <label
                  key={type}
                  className="flex cursor-pointer items-center justify-between border border-[#1f2733] bg-[#12161f] px-2.5 py-1.5 hover:border-[#2a3444]"
                >
                  <span className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={filters.types[type]}
                      onChange={() => toggleType(type)}
                      className="accent-[#3d5a80]"
                    />
                    <span
                      className="h-2 w-2 rounded-full"
                      style={{ background: meta.color }}
                    />
                    {meta.label}
                  </span>
                  <span className="font-mono text-xs text-[#6b7688]">{totalsByType[type]}</span>
                </label>
              );
            })}
          </div>
        </section>

        {/* Risk score */}
        <section>
          <div className="mb-1.5 flex items-center justify-between text-xs text-[#8b93a3]">
            <span>Minimum risk score</span>
            <span className="font-mono">{filters.minRisk}</span>
          </div>
          <input
            type="range"
            min={0}
            max={100}
            value={filters.minRisk}
            onChange={(e) => onChange({ ...filters, minRisk: Number(e.target.value) })}
            className="w-full accent-[#d64550]"
          />
        </section>

        {/* Influence score */}
        <section>
          <div className="mb-1.5 flex items-center justify-between text-xs text-[#8b93a3]">
            <span>Minimum influence score</span>
            <span className="font-mono">{filters.minInfluence}</span>
          </div>
          <input
            type="range"
            min={0}
            max={100}
            value={filters.minInfluence}
            onChange={(e) => onChange({ ...filters, minInfluence: Number(e.target.value) })}
            className="w-full accent-[#e8a33d]"
          />
          <p className="mt-1 text-[11px] text-[#4a5262]">
            Higher influence = more central to the network (key-player indicator).
          </p>
        </section>

        {/* Suspects only */}
        <section>
          <label className="flex cursor-pointer items-center justify-between border border-[#1f2733] bg-[#12161f] px-2.5 py-2">
            <span className="text-sm">Flagged suspects only</span>
            <input
              type="checkbox"
              checked={filters.suspectsOnly}
              onChange={(e) => onChange({ ...filters, suspectsOnly: e.target.checked })}
              className="accent-[#d64550]"
            />
          </label>
        </section>

        <button
          onClick={() =>
            onChange({
              types: { person: true, location: true, vehicle: true, phone: true, organization: true },
              minRisk: 0,
              minInfluence: 0,
              search: "",
              suspectsOnly: false,
            })
          }
          className="w-full border border-[#1f2733] py-1.5 text-xs text-[#8b93a3] hover:border-[#2a3444] hover:text-[#e6e9ef]"
        >
          Reset filters
        </button>
      </div>
    </aside>
  );
}