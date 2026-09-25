"use client";

import Link from "next/link";

export default function LandingPage() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-[#070a0f] text-[#e6e9ef]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_20%,rgba(40,112,155,0.16),transparent_35%),radial-gradient(circle_at_80%_80%,rgba(220,112,32,0.08),transparent_30%)]" />
      <div className="pointer-events-none absolute inset-0 opacity-30 [background-image:linear-gradient(rgba(255,255,255,0.035)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.035)_1px,transparent_1px)] [background-size:48px_48px]" />

      <nav className="relative z-10 flex items-center justify-between border-b border-[#1f2733] px-6 py-4 md:px-10">
        <div>
          <p className="text-sm font-medium text-xl tracking-tight">CrimeNet</p>
          <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-[#596579]">
            SIH 2026 · Beta System
          </p>
        </div>
        <Link
          href="/auth"
          className="rounded-md border border-[#334052] bg-[#0d131c] px-4 py-2 text-xs font-medium transition hover:border-[#66758c] hover:bg-[#121a25]"
        >
          Access system
        </Link>
      </nav>

      <section className="relative z-10 mx-auto flex min-h-[calc(100vh-73px)] max-w-6xl items-center px-6 py-20 md:px-10">
        <div className="max-w-3xl">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[#263342] bg-[#0b1017]/80 px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.18em] text-[#738096]">
            <span className="h-1.5 w-1.5 rounded-full bg-[#43b581] shadow-[0_0_10px_rgba(67,181,129,0.7)]" />
            Operational intelligence prototype
          </div>

          <h1 className="text-5xl font-semibold tracking-[-0.04em] text-[#f0f3f7] md:text-7xl">
            See the network.
            <br />
            <span className="text-[#8b97aa]">Find what connects it.</span>
          </h1>

          <p className="mt-7 max-w-2xl text-base leading-7 text-[#7f8b9d] md:text-lg">
            A network-intelligence workspace for analyzing criminals through their personal details, vehicles,
            phone numbers, locations and organizations through connected data.
            Built as a beta prototype for SIH 2026.
          </p>

          <div className="mt-9 flex flex-wrap gap-3">
            <Link
              href="/auth"
              className="cursor-pointer rounded-md bg-[#e7edf5] px-5 py-3 text-sm font-medium text-[#0a0e14] transition hover:bg-white"
            >
              Enter beta workspace →
            </Link>
          </div>

          <div id="features" className="mt-20 grid max-w-3xl gap-3 sm:grid-cols-3">
            {[
              ["01", "Entity mapping", "Connect people, phones, vehicles, places and organizations."],
              ["02", "Relationship graph", "Visualize direct and possible links across the network."],
              ["03", "Lead prioritization", "Surface risk, influence and priority signals for investigation."],
              ["04", "Case pattern recognition", "Analyze similarity between current and pervious cases."],
            ].map(([number, title, description]) => (
              <div key={number} className="border border-[#202a36] bg-[#0b1017]/80 p-5">
                <p className="font-mono text-[10px] text-[#526076]">{number}</p>
                <h2 className="mt-5 text-sm font-medium text-[#dce2ea]">{title}</h2>
                <p className="mt-2 text-xs leading-5 text-[#687487]">{description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <footer className="relative z-10 border-t border-[#1a222d] px-6 py-4 text-center font-mono text-[10px] text-[#465163] md:px-10">
        DEMONSTRATION BUILD 
      </footer>
    </main>
  );
}
