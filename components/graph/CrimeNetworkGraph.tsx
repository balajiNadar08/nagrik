"use client";

import { useEffect, useRef, useState, useMemo, type ReactNode } from "react";
import * as d3 from "d3";
import { GraphData, GraphNode, ENTITY_META } from "@/types/graph";

interface Props {
  data: GraphData;
  /** Node ids that matched an active search — rendered with a gold ring and kept
   *  full-opacity along with their direct connections; everything else dims. */
  highlightIds?: Set<string>;
  onSelectNode?: (node: GraphNode | null) => void;
}

// Nodes resolved by d3-force to have live x/y and link.source/target as objects.
type SimNode = GraphNode & d3.SimulationNodeDatum;
type SimLink = d3.SimulationLinkDatum<SimNode> & { weight: number; confirmed: boolean };

const PRIORITY_COLOR = "#ff8c42";
const MATCH_COLOR = "#e8c35a";
const JURISDICTION_COLOR = "#4fd1ff";
const INFERRED_COLOR = "#a48cff";

const EMPTY_SET: Set<string> = new Set();

export default function CrimeNetworkGraph({ data, highlightIds = EMPTY_SET, onSelectNode }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const simRef = useRef<d3.Simulation<SimNode, SimLink> | null>(null);
  const transformRef = useRef(d3.zoomIdentity);
  const hoverRef = useRef<SimNode | null>(null);
  const [selected, setSelected] = useState<SimNode | null>(null);
  const [dims, setDims] = useState({ w: 800, h: 600 });

  // Keep canvas sized to its container.
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      const { width, height } = entries[0].contentRect;
      setDims({ w: width, h: height });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Precompute neighbor sets so hover-highlighting is O(1) per frame.
  const neighborMap = useMemo(() => {
    const map = new Map<string, Set<string>>();
    data.nodes.forEach((n) => map.set(n.id, new Set()));
    data.links.forEach((l) => {
      const s = typeof l.source === "string" ? l.source : l.source.id;
      const t = typeof l.target === "string" ? l.target : l.target.id;
      map.get(s)?.add(t);
      map.get(t)?.add(s);
    });
    return map;
  }, [data]);

  useEffect(() => {
    const canvasEl = canvasRef.current;
    if (!canvasEl) return;
    const maybeCtx = canvasEl.getContext("2d");
    if (!maybeCtx) return;
    // Rebind both as fresh consts so TS's null-narrowing survives inside the
    // nested closures below (draw/tick/zoom/drag handlers) instead of
    // widening back to `... | null`.
    const canvas = canvasEl;
    const ctx = maybeCtx;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = dims.w * dpr;
    canvas.height = dims.h * dpr;
    canvas.style.width = `${dims.w}px`;
    canvas.style.height = `${dims.h}px`;
    ctx.scale(dpr, dpr);

    // Reuse simulation nodes across data changes where possible so filtering
    // doesn't reset the whole layout — nodes that persist keep their position.
    const prevPositions = new Map<string, { x: number; y: number }>();
    simRef.current?.nodes().forEach((n) => {
      if (n.x != null && n.y != null) prevPositions.set(n.id, { x: n.x, y: n.y });
    });

    const nodes: SimNode[] = data.nodes.map((n) => {
      const prev = prevPositions.get(n.id);
      return {
        ...n,
        x: prev?.x ?? dims.w / 2 + (Math.random() - 0.5) * 100,
        y: prev?.y ?? dims.h / 2 + (Math.random() - 0.5) * 100,
      };
    });
    const links: SimLink[] = data.links.map((l) => ({ ...l, source: l.source as string, target: l.target as string, confirmed: l.confirmed }));

    const sim = d3
      .forceSimulation<SimNode>(nodes)
      .force(
        "link",
        d3
          .forceLink<SimNode, SimLink>(links)
          .id((d) => d.id)
          .distance((l) => 70 - Math.min(40, l.weight * 3))
          .strength(0.35)
      )
      .force("charge", d3.forceManyBody().strength(-90))
      .force("center", d3.forceCenter(dims.w / 2, dims.h / 2))
      .force(
        "collide",
        d3.forceCollide<SimNode>((d) => 4 + radiusFor(d))
      )
      .alpha(prevPositions.size ? 0.4 : 1)
      .alphaDecay(0.02);

    simRef.current = sim;

    function radiusFor(n: SimNode) {
      return 3 + (n.influenceScore / 100) * 9;
    }

    function draw() {
      ctx.clearRect(0, 0, dims.w, dims.h);
      ctx.save();
      ctx.translate(transformRef.current.x, transformRef.current.y);
      ctx.scale(transformRef.current.k, transformRef.current.k);

      const hovered = hoverRef.current;
      const activeId = hovered?.id ?? selected?.id ?? null;
      const activeNeighbors = activeId ? neighborMap.get(activeId) : null;

      // A search is active if there are matched ids. In that state we treat
      // every match + its direct neighbors as the "focus set" and dim
      // everything else, so the searched suspect's network — locations,
      // vehicles, phones, orgs — reads clearly even in a dense graph.
      const searchActive = highlightIds.size > 0;
      const searchNeighbors = new Set<string>();
      if (searchActive) {
        highlightIds.forEach((id) => neighborMap.get(id)?.forEach((nid) => searchNeighbors.add(nid)));
      }

      function isDimmed(id: string) {
        if (searchActive) return !highlightIds.has(id) && !searchNeighbors.has(id);
        if (activeId) return id !== activeId && !activeNeighbors?.has(id);
        return false;
      }

      // Edges
      links.forEach((l) => {
        const s = l.source as unknown as SimNode;
        const t = l.target as unknown as SimNode;
        if (s.x == null || t.x == null) return;
        const dim = isDimmed(s.id) && isDimmed(t.id);
        const touchesMatch = searchActive && (highlightIds.has(s.id) || highlightIds.has(t.id));
        const crossesJurisdiction =
          !!s.jurisdiction && !!t.jurisdiction && s.jurisdiction !== t.jurisdiction;

        ctx.beginPath();
        ctx.moveTo(s.x, s.y!);
        ctx.lineTo(t.x, t.y!);

        if (dim) {
          ctx.strokeStyle = "rgba(120,130,150,0.05)";
          ctx.setLineDash([]);
        } else if (!l.confirmed) {
          // Missing link: an inferred, unconfirmed connection — dashed so it
          // reads as "worth checking," not established fact.
          ctx.strokeStyle = INFERRED_COLOR + "99";
          ctx.setLineDash([5 / transformRef.current.k, 4 / transformRef.current.k]);
        } else if (touchesMatch) {
          ctx.strokeStyle = "rgba(232,195,90,0.55)";
          ctx.setLineDash([]);
        } else if (crossesJurisdiction) {
          ctx.strokeStyle = JURISDICTION_COLOR + "70";
          ctx.setLineDash([]);
        } else {
          ctx.strokeStyle = "rgba(140,155,180,0.22)";
          ctx.setLineDash([]);
        }

        ctx.lineWidth = Math.max(0.4, Math.min(2, l.weight / 5)) / transformRef.current.k;
        ctx.stroke();
        ctx.setLineDash([]);
      });

      // Nodes
      nodes.forEach((n) => {
        if (n.x == null || n.y == null) return;
        const meta = ENTITY_META[n.type];
        const r = radiusFor(n);
        const isMatch = highlightIds.has(n.id);
        const isSearchNeighbor = searchNeighbors.has(n.id);
        const isActive = n.id === activeId;
        const isHoverNeighbor = !!activeNeighbors?.has(n.id);
        const dim = isDimmed(n.id);

        if (isActive || isMatch) {
          const glowColor = isMatch ? "#e8c35a" : meta.glow;
          const glow = ctx.createRadialGradient(n.x, n.y, 0, n.x, n.y, r * 4);
          glow.addColorStop(0, glowColor + "99");
          glow.addColorStop(1, glowColor + "00");
          ctx.fillStyle = glow;
          ctx.beginPath();
          ctx.arc(n.x, n.y, r * 4, 0, Math.PI * 2);
          ctx.fill();
        }

        ctx.beginPath();
        ctx.arc(n.x, n.y, r, 0, Math.PI * 2);
        ctx.fillStyle = dim ? meta.color + "33" : meta.color;
        ctx.fill();

        if (n.isSuspect) {
          ctx.beginPath();
          ctx.arc(n.x, n.y, r + 2.5, 0, Math.PI * 2);
          ctx.strokeStyle = dim ? "rgba(214,69,80,0.3)" : "#d64550";
          ctx.lineWidth = 1.4 / transformRef.current.k;
          ctx.stroke();
        }

        // Priority lead: a flagged suspect with a high derived triage score.
        // Drawn as its own ring outside the suspect ring so "who's flagged"
        // and "who to chase first" stay visually distinct.
        const isPriority = !!n.isSuspect && n.leadPriority >= 75;
        if (isPriority) {
          ctx.beginPath();
          ctx.arc(n.x, n.y, r + 5.5, 0, Math.PI * 2);
          ctx.strokeStyle = dim ? "rgba(255,140,66,0.3)" : PRIORITY_COLOR;
          ctx.lineWidth = 1.4 / transformRef.current.k;
          ctx.stroke();
        }

        // Gold ring for a direct search match, drawn outside the suspect
        // ring so both are visible when a match is also a flagged suspect.
        if (isMatch) {
          const offset = isPriority ? 8.5 : n.isSuspect ? 5 : 2.5;
          ctx.beginPath();
          ctx.arc(n.x, n.y, r + offset, 0, Math.PI * 2);
          ctx.strokeStyle = MATCH_COLOR;
          ctx.lineWidth = 1.8 / transformRef.current.k;
          ctx.stroke();
        }

        // Labels: active/matched/neighbor nodes always show; otherwise only when zoomed in.
        if (isActive || isHoverNeighbor || isMatch || isSearchNeighbor || transformRef.current.k > 1.8) {
          ctx.font = `${11 / transformRef.current.k}px Inter, sans-serif`;
          ctx.fillStyle = dim ? "rgba(230,233,239,0.35)" : "#e6e9ef";
          ctx.fillText(n.label, n.x + r + 5, n.y + 3);
        }
      });

      ctx.restore();
    }

    sim.on("tick", draw);
    draw();

    // Zoom / pan
    const zoom = d3
      .zoom<HTMLCanvasElement, unknown>()
      .scaleExtent([0.2, 6])
      .on("zoom", (event) => {
        transformRef.current = event.transform;
        draw();
      });
    d3.select(canvas).call(zoom);

    // Drag
    function toSimPoint(x: number, y: number) {
      return transformRef.current.invert([x, y]);
    }
    let draggingNode: SimNode | null = null;
    const drag = d3
      .drag<HTMLCanvasElement, unknown>()
      .subject((event) => {
        const [mx, my] = toSimPoint(event.x, event.y);
        return nodes.find((n) => n.x != null && Math.hypot(n.x - mx, n.y! - my) < radiusFor(n) + 4);
      })
      .on("start", (event) => {
        if (!event.subject) return;
        draggingNode = event.subject;
        if (!event.active) sim.alphaTarget(0.25).restart();
        draggingNode!.fx = draggingNode!.x;
        draggingNode!.fy = draggingNode!.y;
      })
      .on("drag", (event) => {
        if (!draggingNode) return;
        const [mx, my] = toSimPoint(event.x, event.y);
        draggingNode.fx = mx;
        draggingNode.fy = my;
      })
      .on("end", (event) => {
        if (!draggingNode) return;
        if (!event.active) sim.alphaTarget(0);
        draggingNode.fx = null;
        draggingNode.fy = null;
        draggingNode = null;
      });
    d3.select(canvas).call(drag);

    // Hover + click
    function handleMove(event: MouseEvent) {
      const rect = canvas.getBoundingClientRect();
      const [mx, my] = toSimPoint(event.clientX - rect.left, event.clientY - rect.top);
      const found = nodes.find((n) => n.x != null && Math.hypot(n.x - mx, n.y! - my) < radiusFor(n) + 4);
      hoverRef.current = found ?? null;
      canvas.style.cursor = found ? "pointer" : "grab";
      draw();
    }
    function handleClick(event: MouseEvent) {
      const rect = canvas.getBoundingClientRect();
      const [mx, my] = toSimPoint(event.clientX - rect.left, event.clientY - rect.top);
      const found = nodes.find((n) => n.x != null && Math.hypot(n.x - mx, n.y! - my) < radiusFor(n) + 4);
      setSelected(found ?? null);
      onSelectNode?.(found ?? null);
    }
    canvas.addEventListener("mousemove", handleMove);
    canvas.addEventListener("click", handleClick);

    return () => {
      sim.stop();
      canvas.removeEventListener("mousemove", handleMove);
      canvas.removeEventListener("click", handleClick);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, dims, highlightIds]);

  return (
    <div ref={containerRef} className="relative h-full w-full bg-[#0a0e14]">
      <canvas ref={canvasRef} />
      <div className="pointer-events-none absolute bottom-4 left-4 flex flex-col gap-1.5 border border-[#1f2733] bg-[#12161f]/90 px-3 py-2.5 text-[11px] text-[#8b93a3]">
        <LegendRow swatch={<Ring color="#d64550" />} label="Flagged suspect" />
        <LegendRow swatch={<Ring color={PRIORITY_COLOR} />} label="Priority lead" />
        <LegendRow swatch={<Ring color={MATCH_COLOR} />} label="Search match" />
        <LegendRow swatch={<Line color={JURISDICTION_COLOR} />} label="Crosses jurisdiction" />
        <LegendRow swatch={<Line color={INFERRED_COLOR} dashed />} label="Possible link — unconfirmed" />
      </div>
    </div>
  );
}

function LegendRow({ swatch, label }: { swatch: ReactNode; label: string }) {
  return (
    <div className="flex items-center gap-2">
      {swatch}
      <span>{label}</span>
    </div>
  );
}
function Ring({ color }: { color: string }) {
  return <span className="h-2.5 w-2.5 rounded-full border-2" style={{ borderColor: color }} />;
}
function Line({ color, dashed }: { color: string; dashed?: boolean }) {
  return (
    <span
      className="h-0 w-3.5 border-t-2"
      style={{ borderColor: color, borderStyle: dashed ? "dashed" : "solid" }}
    />
  );
}