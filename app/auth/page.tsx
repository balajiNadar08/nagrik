"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

const BETA_PASSWORD = "SIH2026";

export default function AuthPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (password === BETA_PASSWORD) {
      window.localStorage.setItem("network-intelligence-auth", "true");
      router.push("/solution");
      return;
    }

    setError("Incorrect password. Use the beta password shown below.");
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#070a0f] px-5 text-[#e6e9ef]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_35%,rgba(41,112,155,0.14),transparent_35%)]" />
      <div className="pointer-events-none absolute inset-0 opacity-25 [background-image:linear-gradient(rgba(255,255,255,0.035)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.035)_1px,transparent_1px)] [background-size:48px_48px]" />

      <div className="relative z-10 w-full max-w-md">
        <Link href="/" className="mb-8 block text-center font-mono text-[10px] uppercase tracking-[0.2em] text-[#596579] hover:text-[#8c98aa]">
          ← CrimeNet
        </Link>

        <div className="border border-[#252f3c] bg-[#0b1017]/95 p-7 shadow-2xl shadow-black/30">
          <div className="mb-7">
            <div className="mb-4 flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.16em] text-[#6e7b8f]">
              <span className="h-1.5 w-1.5 rounded-full bg-[#e59d2b]" />
              Restricted beta access
            </div>
            <h1 className="text-xl font-medium tracking-tight">Enter the workspace</h1>
            <p className="mt-2 text-md text-[#697588]">
              This is a demonstration authentication screen for the SIH 2026 beta.
            </p>
          </div>

          <div className="mt-2 mb-6 border border-dashed border-[#313c4b] bg-[#0a0f16] p-4">
            <p className="font-mono text-[14px] text-bold text-center uppercase tracking-[0.14em] text-[#657287]">
              Beta access password
            </p>
            <p className="mt-2 font-mono text-center text-2xl font-bold tracking-wider text-[#e59d2b]">
              {BETA_PASSWORD}
            </p>
            <p className="mt-2 text-lg text-center text-[#566174]">
              The password is intentionally displayed because this is a beta / demo build.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
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
                autoFocus
                className="w-full border border-[#2b3543] bg-[#080c12] px-3 py-3 text-sm text-[#e6e9ef] outline-none placeholder:text-[#424c5b] focus:border-[#65748a]"
              />
            </label>

            {error && <p className="text-xs text-[#ef6b6b]">{error}</p>}

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
