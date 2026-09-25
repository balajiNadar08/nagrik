"use client";

import { GraphData, GraphNode, ENTITY_META } from "@/types/graph";

interface Props {
  node: GraphNode | null;
  data: GraphData;
  onClear: () => void;
}

export default function ProfilePanel({ node, data, onClear }: Props) {
  if (!node) {
    return (
      <aside className="flex h-full w-80 shrink-0 flex-col border-r border-[#1f2733] bg-[#0d1119] text-[#e6e9ef]">
        <div className="border-b border-[#1f2733] px-4 py-3">
          <h2 className="text-sm font-medium tracking-tight">Entity dossier</h2>
        </div>
        <div className="flex flex-1 items-center justify-center px-6 text-center text-xs text-[#4a5262]">
          Select any entity in the graph — a person, phone, vehicle, location or
          organization — to see its full record and connections here.
        </div>
      </aside>
    );
  }

  const meta = ENTITY_META[node.type];
  const isPriority = !!node.isSuspect && node.leadPriority >= 75;

  const connections = data.links
    .map((l) => {
      const sId = typeof l.source === "string" ? l.source : l.source.id;
      const tId = typeof l.target === "string" ? l.target : l.target.id;
      if (sId !== node.id && tId !== node.id) return null;
      const otherId = sId === node.id ? tId : sId;
      const other = data.nodes.find((n) => n.id === otherId);
      if (!other) return null;
      return { other, relation: l.relation, confirmed: l.confirmed };
    })
    .filter((c): c is { other: GraphNode; relation: string; confirmed: boolean } => c !== null);

  const confirmedConns = connections.filter((c) => c.confirmed);
  const inferredConns = connections.filter((c) => !c.confirmed);

  return (
    <aside className="flex h-full w-80 shrink-0 flex-col overflow-y-auto border-r border-[#1f2733] bg-[#0d1119] text-[#e6e9ef]">
      <div className="flex items-start justify-between border-b border-[#1f2733] px-4 py-3">
        <div>
          <h2 className="text-sm font-medium tracking-tight">Entity dossier</h2>
          <p className="font-mono text-[11px] text-[#4a5262]">{node.id}</p>
        </div>
        <button
          onClick={onClear}
          className="border border-[#1f2733] px-2 py-0.5 text-[11px] text-[#8b93a3] hover:border-[#2a3444] hover:text-[#e6e9ef]"
        >
          Clear
        </button>
      </div>

      <div className="space-y-5 px-4 py-4">
        {/* Identity */}
        <section>
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: meta.color }} />
            <h3 className="text-base font-medium leading-tight">{node.label}</h3>
          </div>
          <p className="mt-0.5 text-xs text-[#6b7688]">{meta.label.replace(/s$/, "")}</p>

          <div className="mt-2 flex flex-wrap gap-1.5">
            {node.isSuspect && (
              <span className="border border-[#d64550]/50 bg-[#d64550]/10 px-1.5 py-0.5 text-[10px] text-[#f07a83]">
                Flagged suspect
              </span>
            )}
            {isPriority && (
              <span className="border border-[#ff8c42]/50 bg-[#ff8c42]/10 px-1.5 py-0.5 text-[10px] text-[#ffb27a]">
                Priority lead
              </span>
            )}
          </div>

          {node.aliases && node.aliases.length > 0 && (
            <p className="mt-2 text-xs text-[#8b93a3]">
              Alias: <span className="font-mono text-[#c9cfdb]">{node.aliases.join(", ")}</span>
            </p>
          )}
        </section>

        {/* Key stats */}
        <section className="grid grid-cols-3 gap-2">
          <Stat label="Risk" value={node.riskScore} color="#d64550" />
          <Stat label="Influence" value={node.influenceScore} color="#5b8ac9" />
          <Stat label="Priority" value={node.leadPriority} color="#ff8c42" />
        </section>

        {/* Core details */}
        <section className="space-y-1.5 border-t border-[#1f2733] pt-4 font-mono text-xs">
          {node.jurisdiction && (
            <Row label="Jurisdiction" value={node.jurisdiction} />
          )}
          {node.meta?.age && <Row label="Age" value={node.meta.age} />}
          {node.meta?.lastSeen && <Row label="Last seen" value={node.meta.lastSeen} />}
          {node.type === "phone" && <Row label="Number" value={node.label} />}
          {node.type === "vehicle" && <Row label="Registration" value={node.label} />}
        </section>

        {/* Crimes on record */}
        {node.type === "person" && (
          <section className="border-t border-[#1f2733] pt-4">
            <h4 className="mb-2 text-xs text-[#8b93a3]">Crimes on record</h4>
            {node.crimes && node.crimes.length > 0 ? (
              <ul className="space-y-2">
                {node.crimes.map((c, i) => (
                  <li key={i} className="border border-[#1f2733] bg-[#12161f] p-2">
                    <p className="text-xs text-[#e6e9ef]">{c.charge}</p>
                    <p className="mt-0.5 font-mono text-[10px] text-[#6b7688]">
                      {c.date} · {c.caseId}
                    </p>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-xs text-[#4a5262]">No prior offenses on file.</p>
            )}
          </section>
        )}

        {/* Confirmed connections */}
        <section className="border-t border-[#1f2733] pt-4">
          <h4 className="mb-2 text-xs text-[#8b93a3]">
            Connections <span className="text-[#4a5262]">({confirmedConns.length})</span>
          </h4>
          {confirmedConns.length > 0 ? (
            <ul className="space-y-1.5">
              {confirmedConns.map((c, i) => {
                const cMeta = ENTITY_META[c.other.type];
                const crossJ =
                  !!node.jurisdiction &&
                  !!c.other.jurisdiction &&
                  node.jurisdiction !== c.other.jurisdiction;
                return (
                  <li key={i} className="flex items-center justify-between text-xs">
                    <span className="flex items-center gap-1.5 truncate">
                      <span className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: cMeta.color }} />
                      <span className="truncate">{c.other.label}</span>
                    </span>
                    <span className="ml-2 shrink-0 text-[10px] text-[#4a5262]">
                      {c.relation}
                      {crossJ && <span className="ml-1 text-[#4fd1ff]">· cross-jurisdiction</span>}
                    </span>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="text-xs text-[#4a5262]">No confirmed connections.</p>
          )}
        </section>

        {/* Missing / inferred links */}
        {inferredConns.length > 0 && (
          <section className="border-t border-[#1f2733] pt-4">
            <h4 className="mb-2 text-xs text-[#8b93a3]">
              Possible links <span className="text-[#4a5262]">— unconfirmed ({inferredConns.length})</span>
            </h4>
            <ul className="space-y-1.5">
              {inferredConns.map((c, i) => {
                const cMeta = ENTITY_META[c.other.type];
                return (
                  <li key={i} className="flex items-center gap-1.5 text-xs text-[#c9b8ff]">
                    <span className="h-1.5 w-1.5 shrink-0 rounded-full border border-dashed" style={{ borderColor: cMeta.color }} />
                    <span className="truncate">{c.other.label}</span>
                  </li>
                );
              })}
            </ul>
            <p className="mt-1.5 text-[10px] text-[#4a5262]">
              Flagged by pattern analysis — not yet verified by an investigator.
            </p>
          </section>
        )}
      </div>
    </aside>
  );
}

function Stat({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="border border-[#1f2733] bg-[#12161f] px-2 py-1.5">
      <div className="font-mono text-base leading-none" style={{ color }}>
        {value}
      </div>
      <div className="mt-1 text-[10px] text-[#6b7688]">{label}</div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-[#6b7688]">{label}</span>
      <span className="text-[#c9cfdb]">{value}</span>
    </div>
  );
}