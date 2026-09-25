"use client";

import { useMemo, useState } from "react";
import CrimeNetworkGraph from "@/components/graph/CrimeNetworkGraph";
import FilterPanel from "@/components/graph/FilterPanel";
import ProfilePanel from "@/components/graph/ProfilePanel";
import { getMockGraphData } from "@/lib/mockData";
import { DEFAULT_FILTERS, FilterState, GraphNode } from "@/types/graph";
const RAW_DATA = getMockGraphData(90);

const TOP_LEADS = [...RAW_DATA.nodes]
  .filter((n) => n.isSuspect)
  .sort((a, b) => b.leadPriority - a.leadPriority)
  .slice(0, 6);

export default function Solution() {
  const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTERS);
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);

  const { graph: filteredData, matchedIds } = useMemo(() => {
    const search = filters.search.trim().toLowerCase();

    if (search) {
      const matched = RAW_DATA.nodes.filter((n) =>
        n.label.toLowerCase().includes(search)
      );
      const matchedIds = new Set(matched.map((n) => n.id));

      const neighborIds = new Set<string>();
      RAW_DATA.links.forEach((l) => {
        const s = typeof l.source === "string" ? l.source : l.source.id;
        const t = typeof l.target === "string" ? l.target : l.target.id;
        if (matchedIds.has(s)) neighborIds.add(t);
        if (matchedIds.has(t)) neighborIds.add(s);
      });

      const visibleIds = new Set<string>([...matchedIds, ...neighborIds]);
      const nodes = RAW_DATA.nodes.filter((n) => visibleIds.has(n.id));
      const links = RAW_DATA.links.filter((l) => {
        const s = typeof l.source === "string" ? l.source : l.source.id;
        const t = typeof l.target === "string" ? l.target : l.target.id;
        return visibleIds.has(s) && visibleIds.has(t);
      });

      return { graph: { nodes, links }, matchedIds };
    }

    // No search active — fall back to the ordinary checkbox/slider filters.
    const nodes = RAW_DATA.nodes.filter((n) => {
      if (!filters.types[n.type]) return false;
      if (n.riskScore < filters.minRisk) return false;
      if (n.influenceScore < filters.minInfluence) return false;
      if (filters.suspectsOnly && !n.isSuspect) return false;
      return true;
    });
    const visibleIds = new Set(nodes.map((n) => n.id));
    const links = RAW_DATA.links.filter((l) => {
      const s = typeof l.source === "string" ? l.source : l.source.id;
      const t = typeof l.target === "string" ? l.target : l.target.id;
      return visibleIds.has(s) && visibleIds.has(t);
    });

    return { graph: { nodes, links }, matchedIds: new Set<string>() };
  }, [filters]);

  return (
    <div className="flex h-screen flex-col bg-[#0a0e14] text-[#e6e9ef]">
      <header className="flex items-center justify-between border-b border-[#1f2733] px-5 py-3">
        <div>
          <h1 className="text-sm font-medium tracking-tight">CrimeNet</h1>
          <p className="font-mono text-[11px] text-[#4a5262]">
            case file 2026-MH-0417 · {RAW_DATA.nodes.length} entities ingested
          </p>
        </div>
        {selectedNode && (
          <div className="font-mono text-xs text-[#6b7688]">
            selected: <span className="text-[#e6e9ef]">{selectedNode.label}</span>
          </div>
        )}
      </header>

      <div className="flex min-h-0 flex-1">
        <ProfilePanel node={selectedNode} data={RAW_DATA} onClear={() => setSelectedNode(null)} />
        <main className="min-w-0 flex-1">
          <CrimeNetworkGraph
            data={filteredData}
            highlightIds={matchedIds}
            onSelectNode={setSelectedNode}
          />
        </main>
        <FilterPanel
          filters={filters}
          onChange={setFilters}
          data={RAW_DATA}
          visibleCount={{ nodes: filteredData.nodes.length, links: filteredData.links.length }}
          topLeads={TOP_LEADS}
          onSelectLead={setSelectedNode}
        />
      </div>
    </div>
  );
}