"use client";

import { Activity, Lock } from "lucide-react";

export function AuthShell({ children }: { children: React.ReactNode }) {
  return (
    <main className="labflow-bg min-h-screen w-full relative overflow-x-hidden flex flex-col justify-between p-4 md:p-8 select-none">
      
      {/* ── Floating Space Ambient Background Gradients ── */}
      <div className="absolute top-1/4 left-1/3 size-[400px] rounded-full bg-indigo-500/10 blur-[120px] pointer-events-none animate-pulse" />
      <div className="absolute bottom-1/3 right-1/4 size-[500px] rounded-full bg-cyan-500/5 blur-[150px] pointer-events-none" />

      {/* ── Top Spatial Header Bar ── */}
      <header className="spatial-glass w-full max-w-7xl mx-auto rounded-2xl px-5 py-4 flex items-center justify-between gap-4 relative z-20">
        <div className="flex items-center gap-3">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-tr from-sky-400 to-indigo-500 text-white shadow-lg spatial-glow-cyan">
            <Activity className="size-4 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm font-bold tracking-tight text-foreground font-sans">LabFlow OS</h1>
              <span className="shrink-0 rounded-full bg-sky-500/20 px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-widest text-sky-300">
                v1.0.0
              </span>
            </div>
            <p className="text-[9px] text-muted-foreground/60 leading-none uppercase tracking-widest mt-0.5 font-semibold">Dental lab operating system</p>
          </div>
        </div>

        <div className="flex items-center gap-2 rounded-full bg-emerald-500/10 border border-emerald-500/20 px-3 py-1">
          <span className="size-1.5 rounded-full bg-emerald-500 live-dot animate-pulse" />
          <span className="text-[9px] font-semibold text-emerald-400 uppercase tracking-widest">Secure auth active</span>
        </div>
      </header>

      {/* ── Center Auth Card ── */}
      <section className="w-full max-w-7xl mx-auto my-8 relative z-20 flex-1 flex items-center justify-center">
        <div className="spatial-card max-w-md w-full p-8 border border-white/10 spatial-glow-cyan relative">
          
          {/* Lock illustration */}
          <div className="mb-4 flex size-12 items-center justify-center rounded-2xl bg-gradient-to-tr from-sky-400 to-indigo-500 text-white shadow-lg spatial-glow-cyan">
            <Lock className="size-5" />
          </div>

          <div className="mb-6">
            <h2 className="text-xl font-bold text-foreground">Sign in to ODENT LabFlow</h2>
            <p className="text-xs text-muted-foreground mt-1">Enter your lab login credentials</p>
          </div>

          <div className="spatial-login-theme">
            {children}
          </div>

          <p className="text-center text-[10px] text-muted-foreground/60 uppercase tracking-wider mt-6 pt-4 border-t border-white/5">
            Secure encrypted connection
          </p>

        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="w-full max-w-7xl mx-auto pt-4 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4 text-muted-foreground/60 text-[10px] relative z-20">
        <p className="font-mono">ODENT LabFlow v1.0.0</p>
        <p className="uppercase tracking-widest">Access your lab workspace</p>
      </footer>

      {/* Styled Override for Login Form Elements to blend with spatial design */}
      <style dangerouslySetInnerHTML={{ __html: `
        .labflow-bg {
          background: radial-gradient(circle at 10% 20%, oklch(0.28 0.12 275 / 55%) 0%, transparent 45%),
                      radial-gradient(circle at 90% 80%, oklch(0.32 0.16 200 / 35%) 0%, transparent 45%),
                      radial-gradient(circle at 50% 50%, oklch(0.12 0.02 260) 0%, oklch(0.06 0.015 260) 100%);
          background-size: 200% 200%;
          animation: space-drift 24s ease-in-out infinite;
        }

        /* Overrides to make standard shadcn Cards invisible inside our beautiful shell */
        .spatial-card .border {
          border: none !important;
          background: transparent !important;
          box-shadow: none !important;
          padding: 0 !important;
        }
        .spatial-card .bg-card {
          background: transparent !important;
        }
        .spatial-card h3 {
          display: none !important; /* Hide original redundant title */
        }
        .spatial-card div[class*="CardHeader"] {
          display: none !important; /* Hide redundant card headers */
        }
        .spatial-card div[class*="CardContent"] {
          padding: 0 !important;
        }
        
        .spatial-login-theme label {
          color: rgba(255, 255, 255, 0.7) !important;
          font-size: 11px !important;
          text-transform: uppercase !important;
          letter-spacing: 0.08em !important;
          font-weight: 700 !important;
          margin-bottom: 6px !important;
          display: block !important;
        }
        .spatial-login-theme input {
          background: rgba(255, 255, 255, 0.035) !important;
          border: 1px solid rgba(255, 255, 255, 0.08) !important;
          border-radius: 12px !important;
          color: #ffffff !important;
          font-size: 13px !important;
          padding: 10px 14px !important;
          transition: all 0.25s ease !important;
        }
        .spatial-login-theme input:focus {
          background: rgba(255, 255, 255, 0.07) !important;
          border-color: oklch(0.78 0.14 195) !important;
          box-shadow: 0 0 15px oklch(0.78 0.14 195 / 20%) !important;
          outline: none !important;
        }
        .spatial-login-theme button[type="submit"] {
          background: linear-gradient(135deg, oklch(0.78 0.14 195) 0%, oklch(0.7 0.18 250) 100%) !important;
          color: oklch(0.16 0.02 260) !important;
          font-weight: 700 !important;
          font-size: 13px !important;
          border-radius: 12px !important;
          padding: 11px !important;
          border: none !important;
          box-shadow: 0 0 25px oklch(0.78 0.14 195 / 30%) !important;
          transition: all 0.3s ease !important;
          cursor: pointer !important;
        }
        .spatial-login-theme button[type="submit"]:hover {
          opacity: 0.95 !important;
          transform: translateY(-1px) !important;
          box-shadow: 0 0 35px oklch(0.78 0.14 195 / 45%) !important;
        }
        .spatial-login-theme a {
          color: oklch(0.78 0.14 195) !important;
          transition: text-shadow 0.2s ease !important;
        }
        .spatial-login-theme a:hover {
          text-shadow: 0 0 8px oklch(0.78 0.14 195 / 40%) !important;
        }
      `}} />

    </main>
  );
}
