"use client";

import React, { useState, useEffect } from "react";
import { SpatialCockpit } from "@/components/dashboard/spatial-cockpit";
import { LoginForm } from "@/components/auth/login-form";
import { 
  Activity, ShieldAlert, Sparkles, X, Lock, 
  Battery, Wifi, Signal, Cpu, Zap, Flame, Truck, 
  CheckCircle2, AlertCircle, Info
} from "lucide-react";
import { motion } from "framer-motion";

function renderIslandIcon(name?: string) {
  switch (name) {
    case "zap": return <Zap className="size-4.5 text-amber-400 animate-pulse" />;
    case "flame": return <Flame className="size-4.5 text-orange-400 animate-bounce" />;
    case "drone": return <Truck className="size-4.5 text-emerald-400 animate-pulse" />;
    case "laser": return <Cpu className="size-4.5 text-cyan-400 animate-spin" style={{ animationDuration: "3s" }} />;
    case "sync": return <Sparkles className="size-4.5 text-purple-400" />;
    case "success": return <CheckCircle2 className="size-4.5 text-emerald-400" />;
    case "error": return <AlertCircle className="size-4.5 text-red-400" />;
    case "info": return <Info className="size-4.5 text-sky-400" />;
    default: return <Sparkles className="size-4.5 text-sky-400 animate-pulse" />;
  }
}

export function SpatialCockpitWrapper({ supabaseReady }: { supabaseReady: boolean }) {
  const [showLogin, setShowLogin] = useState(false);
  const [timeStr, setTimeStr] = useState("14:19");

  // Dynamic Island states
  const [island, setIsland] = useState<{
    active: boolean;
    title: string;
    subtitle?: string;
    icon?: string;
    color?: string;
  }>({
    active: false,
    title: "System Online",
    subtitle: "LabFlow Quantum Node Initialized",
    icon: "sync",
  });

  // Track clock
  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      const hours = now.getHours().toString().padStart(2, "0");
      const mins = now.getMinutes().toString().padStart(2, "0");
      setTimeStr(`${hours}:${mins}`);
    };
    updateClock();
    const clockInterval = setInterval(updateClock, 1000);
    return () => clearInterval(clockInterval);
  }, []);

  // Trigger notification callback from cockpit
  const handleNotify = (title: string, subtitle?: string, icon?: string, color?: string) => {
    setIsland({
      active: true,
      title,
      subtitle,
      icon,
      color,
    });
    
    // Automatically close after 4.5 seconds
    const timer = setTimeout(() => {
      setIsland(prev => ({ ...prev, active: false }));
    }, 4500);

    return () => clearTimeout(timer);
  };

  return (
    <main className="space-nebula min-h-screen w-full relative overflow-x-hidden flex flex-col justify-between select-none pb-8">
      
      {/* ── Simulated iPhone / Vision Pro iOS Status Bar ── */}
      <div className="w-full ios-status-bar py-1.5 px-6 flex items-center justify-between text-[11px] font-semibold text-white/80 z-40 relative select-none">
        <div className="flex items-center gap-2">
          <span className="tracking-tight text-white">{timeStr}</span>
          <span className="size-1.5 rounded-full bg-emerald-500 live-dot" />
        </div>
        
        {/* Subtle Branding in status bar */}
        <div className="hidden md:flex items-center gap-1.5 text-white/50 text-[10px] uppercase tracking-widest font-mono">
          <span>LabFlow OS Quantum Node</span>
          <span>•</span>
          <span className="text-sky-400">Shields v22.2</span>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1">
            <Signal className="size-3.5 opacity-90 text-sky-400" />
            <span className="text-[9px] font-mono opacity-80 uppercase">5G QTM</span>
          </div>
          <Wifi className="size-3.5 opacity-90 text-sky-400" />
          <div className="flex items-center gap-1.5">
            <span className="text-[9px] font-mono opacity-80">98%</span>
            <div className="relative w-5 h-2.5 border border-white/30 rounded-sm flex items-center p-0.5">
              <div className="h-full w-4/5 bg-emerald-500 rounded-[1px]" />
              <div className="absolute right-[-2.5px] top-[2.5px] w-[2px] h-[3px] bg-white/50 rounded-r-xs" />
            </div>
          </div>
        </div>
      </div>

      {/* ── Futuristic iPhone Dynamic Island ── */}
      <div className="w-full absolute top-8 left-0 z-50 flex justify-center pointer-events-none ios-dynamic-island-container">
        <motion.div
          layout
          initial={{ width: 110, height: 30, borderRadius: 99 }}
          animate={island.active ? {
            width: 340,
            height: 72,
            borderRadius: 24,
            transition: { type: "spring", stiffness: 200, damping: 20 }
          } : {
            width: 110,
            height: 30,
            borderRadius: 99,
            transition: { type: "spring", stiffness: 260, damping: 25 }
          }}
          className="ios-dynamic-island flex items-center justify-between px-3 text-white pointer-events-auto overflow-hidden relative"
        >
          {island.active ? (
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1, duration: 0.2 }}
              className="flex items-center justify-between w-full h-full gap-3 px-1.5"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="size-10 rounded-xl bg-white/10 flex items-center justify-center shadow-inner border border-white/5 shrink-0">
                  {renderIslandIcon(island.icon)}
                </div>
                <div className="flex flex-col justify-center min-w-0">
                  <span className="text-[12px] font-extrabold text-foreground truncate uppercase tracking-wider">{island.title}</span>
                  <span className="text-[10px] text-muted-foreground/80 leading-tight truncate">{island.subtitle || "Quantum operations synced"}</span>
                </div>
              </div>

              {/* Glowing active indicator */}
              <div className="flex items-center shrink-0 pr-1">
                <span className="size-2 rounded-full bg-cyan-400 live-dot animate-pulse" />
              </div>
            </motion.div>
          ) : (
            // Mini compact static/idle state (resembling the iPhone camera cutout)
            <div className="flex items-center justify-center w-full h-full gap-1.5 opacity-85">
              <span className="size-2 rounded-full bg-zinc-800 shrink-0" />
              <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest leading-none">LabFlow</span>
              <span className="size-1 rounded-full bg-emerald-500 shrink-0 live-dot" />
            </div>
          )}
        </motion.div>
      </div>
      
      {/* ── Space Ambient Background & Celestial Bodies ── */}
      <div className="absolute top-1/4 left-1/3 size-[500px] rounded-full bg-indigo-500/10 blur-[130px] pointer-events-none orbit-item" />
      <div className="absolute bottom-1/3 right-1/4 size-[600px] rounded-full bg-cyan-500/5 blur-[160px] pointer-events-none orbit-item-reverse" />
      
      {/* Elegant Vector Star Grid Overlay for depth */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.01)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.01)_1px,transparent_1px)] bg-[size:100px_100px] pointer-events-none" />

      {/* ── Top Header ── */}
      <header className="spatial-glass w-full max-w-7xl mx-auto rounded-3xl mt-14 px-6 py-4 flex items-center justify-between gap-4 relative z-20 shadow-[0_15px_40px_rgba(0,0,0,0.4)]">
        <div className="flex items-center gap-3.5">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-tr from-sky-400 to-indigo-500 text-white shadow-lg spatial-glow-cyan">
            <Activity className="size-4 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm font-extrabold tracking-tight text-foreground font-sans">LabFlow OS</h1>
              <span className="shrink-0 rounded-full bg-sky-500/20 px-2 py-0.5 text-[8px] font-extrabold uppercase tracking-widest text-sky-300 border border-sky-500/30">
                v22222.9
              </span>
            </div>
            <p className="text-[9px] text-muted-foreground/60 leading-none uppercase tracking-widest mt-0.5 font-bold">Dental Operating System</p>
          </div>
        </div>

        {/* Global System status badge */}
        <div className="flex items-center gap-4">
          <div className="hidden sm:flex items-center gap-2 rounded-full bg-white/5 border border-white/5 px-3 py-1.5">
            <Sparkles className="size-3 text-purple-400 animate-spin" style={{ animationDuration: "4s" }} />
            <span className="text-[9px] font-bold text-purple-300 uppercase tracking-widest">AI Diagnostics Locked</span>
          </div>
          <div className="flex items-center gap-2 rounded-full bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 shadow-inner">
            <span className="size-1.5 rounded-full bg-emerald-500 live-dot animate-pulse" />
            <span className="text-[9px] font-bold text-emerald-400 uppercase tracking-widest">System Pulse 100%</span>
          </div>
        </div>
      </header>

      {/* ── Main Interactive Cockpit Area ── */}
      <section className="w-full max-w-7xl mx-auto my-6 relative z-20 flex-1 flex flex-col justify-center px-4 sm:px-0">
        <SpatialCockpit onRevealLogin={() => setShowLogin(true)} onNotify={handleNotify} />
      </section>

      {/* ── Footer ── */}
      <footer className="w-full max-w-7xl mx-auto pt-4 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4 text-muted-foreground/60 text-[10px] relative z-20 px-4 sm:px-0 font-mono">
        <p className="tracking-wide">ODENT CYBERNETIC COCKPIT v22222.0.0 — ALL SHIELDS OPERATIONAL</p>
        <p className="uppercase tracking-widest">Multi-tenant Quantum Network Layer Active</p>
      </footer>

      {/* ── iOS Glass Login Dock Drawer Overlay ── */}
      {showLogin && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-fade-in">
          
          <div className="spatial-card max-w-md w-full p-8 relative animate-slide-in-up border border-white/10 spatial-glow-cyan shadow-[0_30px_70px_rgba(0,0,0,0.9)]">
            
            {/* Close button */}
            <button
              onClick={() => setShowLogin(false)}
              className="absolute top-4 right-4 p-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 text-muted-foreground hover:text-foreground transition-all duration-300 cursor-pointer"
            >
              <X className="size-4" />
            </button>

            {/* Lock illustration */}
            <div className="mb-4 flex size-12 items-center justify-center rounded-2xl bg-gradient-to-tr from-sky-400 to-indigo-500 text-white shadow-lg spatial-glow-cyan">
              <Lock className="size-5" />
            </div>

            <div className="mb-6">
              <h2 className="text-xl font-bold text-foreground">Sign in to LabFlow</h2>
              <p className="text-xs text-muted-foreground mt-1">Enter your quantum key coordinates to secure communication node.</p>
            </div>

            {/* Render Login Form */}
            <div className="space-y-4">
              {supabaseReady ? (
                <div className="spatial-login-theme">
                  <LoginForm />
                </div>
              ) : (
                <div className="spatial-glass border-amber-500/20 bg-amber-500/5 rounded-2xl p-4 flex items-start gap-3">
                  <ShieldAlert className="size-5 text-amber-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-bold text-amber-300">Supabase offline</p>
                    <p className="text-[10px] text-amber-200/80 leading-relaxed mt-1">
                      Configure your environment parameters in .env.local to open the live auth gates.
                    </p>
                  </div>
                </div>
              )}
            </div>

            <p className="text-center text-[10px] text-muted-foreground/60 uppercase tracking-wider mt-6 pt-4 border-t border-white/5">
              Secure AES-256 Quantum Handshake Active
            </p>

          </div>

        </div>
      )}

      {/* Styled Override for Login Form Elements to blend with spatial design */}
      <style jsx global>{`
        .spatial-login-theme label {
          color: rgba(255, 255, 255, 0.7);
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          font-weight: 700;
          margin-bottom: 6px;
          display: block;
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
          transition: all 0.3s ease !important;
          cursor: pointer !important;
        }
        .spatial-login-theme a {
          color: oklch(0.78 0.14 195) !important;
          transition: text-shadow 0.2s ease !important;
        }
        .spatial-login-theme a:hover {
          text-shadow: 0 0 8px oklch(0.78 0.14 195 / 40%) !important;
        }
      `}</style>

    </main>
  );
}
