"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

const BETA_PASSWORD = "SIH2026";
const DEMO_INVESTIGATOR_ID = "INV-SIH-2026";

export default function AuthPage() {
  const router = useRouter();

  const [investigatorId, setInvestigatorId] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (
      investigatorId === DEMO_INVESTIGATOR_ID &&
      password === BETA_PASSWORD
    ) {
      window.localStorage.setItem("network-intelligence-auth", "true");
      window.localStorage.setItem(
        "network-intelligence-investigator",
        investigatorId
      );

      router.push("/solution");
      return;
    }

    setError("Invalid Investigator ID or password.");
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#070a0f] px-5 text-[#e6e9ef]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_35%,rgba(41,112,155,0.14),transparent_35%)]" />

      <div className="pointer-events-none absolute inset-0 opacity-25 [background-image:linear-gradient(rgba(255,255,255,0.035)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.035)_1px,transparent_1px)] [background-size:48px_48px]" />

      <div className="relative z-10 w-full max-w-md">

        <Link
          href="/"
          className="mb-8 block text-center font-mono text-[10px] uppercase tracking-[0.2em] text-[#596579] hover:text-[#8c98aa]"
        >
          ← CrimeNet
        </Link>

        <div className="border border-[#252f3c] bg-[#0b1017]/95 p-7 shadow-2xl shadow-black/30">

          <div className="mb-7">
            <div className="mb-4 flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.16em] text-[#6e7b8f]">
              <span className="h-1.5 w-1.5 rounded-full bg-[#e59d2b]" />
              Restricted beta access
            </div>

            <h1 className="text-xl font-medium tracking-tight">
              Enter the workspace
            </h1>

            <p className="mt-2 text-md text-[#697588]">
              This is a demonstration authentication screen for the SIH 2026 beta.
            </p>
          </div>

          {/* Demo credentials */}
          <div className="mt-2 mb-6 border border-dashed border-[#313c4b] bg-[#0a0f16] p-4">
            <p className="text-center font-mono text-[10px] uppercase tracking-[0.14em] text-[#657287]">
              Demo credentials
            </p>

            <div className="mt-3 space-y-2 text-center font-mono">
              <div>
                <span className="text-[11px] text-[#566174]">
                  INVESTIGATOR ID
                </span>

                <p className="mt-1 text-lg font-bold tracking-wider text-[#e59d2b]">
                  {DEMO_INVESTIGATOR_ID}
                </p>
              </div>

              <div>
                <span className="text-[11px] text-[#566174]">
                  BETA PASSWORD
                </span>

                <p className="mt-1 text-lg font-bold tracking-wider text-[#e59d2b]">
                  {BETA_PASSWORD}
                </p>
              </div>
            </div>

            <p className="mt-3 text-center text-xs text-[#566174]">
              Credentials are intentionally displayed because this is a beta / demo build.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">

            {/* Investigator ID */}
            <label className="block">
              <span className="mb-2 block font-mono text-[10px] uppercase tracking-[0.14em] text-[#687589]">
                Investigator ID
              </span>

              <input
                type="text"
                value={investigatorId}
                onChange={(event) => {
                  setInvestigatorId(event.target.value);
                  setError("");
                }}
                placeholder="Enter investigator ID"
                autoFocus
                className="w-full border border-[#2b3543] bg-[#080c12] px-3 py-3 text-sm text-[#e6e9ef] outline-none placeholder:text-[#424c5b] focus:border-[#65748a]"
              />
            </label>

            {/* Password */}
            <label className="block">
              <span className="mb-2 block font-mono text-[10px] uppercase tracking-[0.14em] text-[#687589]">
                Beta password
              </span>

              <input
                type="password"
                value={password}
                onChange={(event) => {
                  setPassword(event.target.value);
                  setError("");
                }}
                placeholder="Enter password"
                className="w-full border border-[#2b3543] bg-[#080c12] px-3 py-3 text-sm text-[#e6e9ef] outline-none placeholder:text-[#424c5b] focus:border-[#65748a]"
              />
            </label>

            {error && (
              <p className="text-xs text-[#ef6b6b]">
                {error}
              </p>
            )}

            <button
              type="submit"
              className="w-full border border-[#d8e0ea] bg-[#e7edf5] px-4 py-3 text-sm font-medium text-[#0a0e14] transition hover:bg-white"
            >
              Authenticate →
            </button>

          </form>
        </div>
      </div>
    </main>
  );
}