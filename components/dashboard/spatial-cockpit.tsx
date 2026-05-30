"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  FileStack,
  Boxes,
  PenTool,
  ClipboardCheck,
  Truck,
  BadgeDollarSign,
  WalletCards,
  BarChart3,
  UsersRound,
  Settings,
  Activity,
  Flame,
  Zap,
  Cpu,
  Layers,
  Radio,
  Terminal,
  ShieldAlert,
  Sparkles,
  Lock,
  ArrowRight,
  Maximize2,
  ListFilter,
  CheckCircle,
  CheckCircle2,
} from "lucide-react";
import { motion } from "framer-motion";

// ── Types & Interfaces ────────────────────────────────────────────────────────

type AppRole = "owner" | "technician" | "reception" | "accountant" | "doctor" | "delivery" | "admin";

interface SystemLog {
  time: string;
  msg: string;
  type: "info" | "success" | "warning" | "error" | "quantum";
}

// ── Mock data presets per role ───────────────────────────────────────────────

const ROLE_METRICS: Record<
  AppRole,
  {
    title: string;
    kpis: { label: string; value: string; detail: string; trend?: string; color: string }[];
    actions: { label: string; actionId: string; icon: React.ElementType }[];
  }
> = {
  owner: {
    title: "Operations HQ Cockpit",
    kpis: [
      { label: "Daily Zirconia Credits (ZC)", value: "14,820 ZC", detail: "+18.4% today", trend: "up", color: "text-emerald-400" },
      { label: "Quantum Sintering Efficacy", value: "99.82%", detail: "Optimal yield", trend: "up", color: "text-cyan-400" },
      { label: "Active Cybernetic Cases", value: "148", detail: "40 in exocad design", color: "text-purple-400" },
      { label: "Overdue Stage Alerts", value: "0", detail: "Perfect sync", color: "text-slate-400" },
    ],
    actions: [
      { label: "Holographic Pulse Report", actionId: "pulse", icon: BarChart3 },
      { label: "Audit Global Ledger", actionId: "ledger", icon: WalletCards },
      { label: "Nanotech Config", actionId: "config", icon: Settings },
    ],
  },
  technician: {
    title: "Neural Manufacturing Deck",
    kpis: [
      { label: "CAM Laser Status", value: "485.2 THz", detail: "Coherent wave", color: "text-cyan-400" },
      { label: "Nanobot Density", value: "98.5%", detail: "Chamber 2 loaded", color: "text-emerald-400" },
      { label: "Active 3D Slices", value: "14 cases", detail: "Milling in progress", color: "text-purple-400" },
      { label: "Sintering Temperature", value: "2,200 °C", detail: "Quantum Lock active", color: "text-amber-400" },
    ],
    actions: [
      { label: "Recalibrate Nano-lasers", actionId: "laser", icon: Zap },
      { label: "Flush Sintering Chamber", actionId: "sinter", icon: Flame },
      { label: "Neural Render QC", actionId: "render_qc", icon: ClipboardCheck },
    ],
  },
  reception: {
    title: "Quantum Case Intake Deck",
    kpis: [
      { label: "Cases Registered Today", value: "42 Cases", detail: "All scanners linked", color: "text-cyan-400" },
      { label: "AI Case Readiness", value: "100%", detail: "No missing scans", color: "text-emerald-400" },
      { label: "Holographic Previews", value: "18 generated", detail: "exocad sync complete", color: "text-purple-400" },
      { label: "Duplicate Scans Prevented", value: "3", detail: "AI engine alert", color: "text-indigo-400" },
    ],
    actions: [
      { label: "Scan Dental QR Code", actionId: "scan", icon: Maximize2 },
      { label: "Link exocad Data Stream", actionId: "link", icon: Layers },
      { label: "Verify AI Patient Card", actionId: "verify", icon: ClipboardCheck },
    ],
  },
  accountant: {
    title: "Smart Ledger & Finance Center",
    kpis: [
      { label: "Outstanding ZC Credit", value: "24,850 ZC", detail: "All ledger blocks active", color: "text-amber-400" },
      { label: "Payments Recorded (24h)", value: "8,920 ZC", detail: "Resend Email synced", color: "text-emerald-400" },
      { label: "Automated Invoices Issued", value: "114", detail: "Zod verified schemas", color: "text-purple-400" },
      { label: "Nanobot Material Cost", value: "1,200 ZC", detail: "Optimal margin", color: "text-cyan-400" },
    ],
    actions: [
      { label: "Sync Blockchain Receipts", actionId: "receipts", icon: WalletCards },
      { label: "Process Overdue Smart Claims", actionId: "claims", icon: BadgeDollarSign },
      { label: "Calculate Net Yields", actionId: "yields", icon: BarChart3 },
    ],
  },
  doctor: {
    title: "Referring Doctor Portal",
    kpis: [
      { label: "My Active Cases", value: "8 Cases", detail: "Dr. Al-Sayed Clinic", color: "text-cyan-400" },
      { label: "Awaiting CAD Sign-off", value: "2 cases", detail: "Holographic exocad render ready", color: "text-purple-400" },
      { label: "Next Scheduled Delivery", value: "Today 14:00", detail: "Drone navigation locked", color: "text-emerald-400" },
      { label: "Current Balance", value: "1,850 ZC", detail: "Dr. Statement synced", color: "text-slate-400" },
    ],
    actions: [
      { label: "Approve exocad Neural Mesh", actionId: "approve_design", icon: CheckCircle },
      { label: "Upload Dental 3D Scan", actionId: "upload_scan", icon: FileStack },
      { label: "Secure Doctor Chat", actionId: "chat", icon: UsersRound },
    ],
  },
  delivery: {
    title: "Autonomous Logistics HQ",
    kpis: [
      { label: "Drones Out for Delivery", value: "4 Active Drones", detail: "All routes clear", color: "text-cyan-400" },
      { label: "Average Delivery Time", value: "8.4 Mins", detail: "Within 22222 orbit limits", color: "text-emerald-400" },
      { label: "Cases Ready to Dispatch", value: "6 cases", detail: "Nano-seal validated", color: "text-purple-400" },
      { label: "Secure QR Proof Locks", value: "100% verified", detail: "Cryptographic handshakes", color: "text-emerald-400" },
    ],
    actions: [
      { label: "Launch Autonomous Drone", actionId: "launch_drone", icon: Truck },
      { label: "Optimize Flight Vectors", actionId: "optimize_vectors", icon: Activity },
      { label: "Verify Cryptographic Proofs", actionId: "proofs", icon: Lock },
    ],
  },
  admin: {
    title: "System Control Deck",
    kpis: [
      { label: "Stitch MCP Bridge", value: "Online", detail: "API key verified", color: "text-emerald-400" },
      { label: "Supabase DB Status", value: "Synced", detail: "Postgres Pooler 100%", color: "text-cyan-400" },
      { label: "Active Node Connections", value: "1,402", detail: "Vision Pro meshes linked", color: "text-purple-400" },
      { label: "Security Shields", value: "99.98%", detail: "RLS Policies locked", color: "text-slate-400" },
    ],
    actions: [
      { label: "Inspect MCP Core Channels", actionId: "inspect_mcp", icon: Radio },
      { label: "Test Resend Email Engine", actionId: "test_email", icon: Terminal },
      { label: "Audit Supabase RLS Matrix", actionId: "audit_rls", icon: Lock },
    ],
  },
};

const DOCK_APPS = [
  { role: "owner" as AppRole, label: "HQ Portal", icon: BarChart3, gradient: "from-sky-400 to-indigo-500" },
  { role: "technician" as AppRole, label: "CAM Mill", icon: Cpu, gradient: "from-cyan-400 to-teal-500" },
  { role: "reception" as AppRole, label: "Scan In", icon: Layers, gradient: "from-purple-500 to-pink-500" },
  { role: "accountant" as AppRole, label: "Ledger", icon: BadgeDollarSign, gradient: "from-amber-400 to-orange-500" },
  { role: "doctor" as AppRole, label: "Doctor", icon: Activity, gradient: "from-emerald-400 to-teal-600" },
  { role: "delivery" as AppRole, label: "Logistics", icon: Truck, gradient: "from-teal-500 to-emerald-600" },
  { role: "admin" as AppRole, label: "System", icon: Settings, gradient: "from-violet-500 to-purple-600" },
];

// ── Component ─────────────────────────────────────────────────────────────────

export function SpatialCockpit({ 
  onRevealLogin,
  onNotify
}: { 
  onRevealLogin: () => void;
  onNotify?: (title: string, subtitle?: string, icon?: string, color?: string) => void;
}) {
  const [activeRole, setActiveRole] = useState<AppRole>("owner");
  const [sinteringPressure, setSinteringPressure] = useState(28.45);
  const [laserFreq, setLaserFreq] = useState(485.2);
  const [logs, setLogs] = useState<SystemLog[]>([]);
  const [controlCenterOpen, setControlCenterOpen] = useState(false);
  const [actionAlert, setActionAlert] = useState<string | null>(null);

  // Microservices state
  const [aiEngine, setAiEngine] = useState(true);
  const [resendBridge, setResendBridge] = useState(true);
  const [supabasePipe, setSupabasePipe] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const laserAngleRef = useRef(0);

  // ── Sintering Pressure simulated live tick ──
  useEffect(() => {
    const timer = setInterval(() => {
      setSinteringPressure((prev) => {
        const delta = (Math.random() - 0.5) * 0.15;
        const next = prev + delta;
        return Number(Math.max(26.0, Math.min(32.0, next)).toFixed(3));
      });
    }, 400);
    return () => clearInterval(timer);
  }, []);

  // ── Cyber Logs Stream ──
  useEffect(() => {
    const initialLogs: SystemLog[] = [
      { time: "11:22:04", msg: "Cosmic Space-Time background initialized inside ODENT LabOS", type: "info" },
      { time: "11:22:15", msg: "Stitch MCP Server successfully registered via secure API handshake", type: "success" },
      { time: "11:22:32", msg: "Zirconia synthesis chamber calibrated at 2,200°C", type: "quantum" },
      { time: "11:23:01", msg: "Scanning database blocks... 148 active cyber cases verified", type: "info" },
    ];
    setLogs(initialLogs);

    const logTimer = setInterval(() => {
      const messages: { msg: string; type: SystemLog["type"] }[] = [
        { msg: "Nanobots successfully seeded for Case #204859", type: "success" },
        { msg: "Dr. Al-Sayed approved the exocad neural mesh in real-time", type: "success" },
        { msg: "Milling Chamber 2 experiencing slight nanotech fluctuations. Auto-tuned.", type: "warning" },
        { msg: "Autonomous Delivery Drone #22 deployed with case nano-container", type: "info" },
        { msg: "Zirconia synthesis complete. Carbon alignment crystal lattice: 99.89%", type: "quantum" },
        { msg: "Resend email transmission synced for customer statement invoice", type: "info" },
      ];
      const randomMsg = messages[Math.floor(Math.random() * messages.length)];
      const now = new Date();
      const timeStr = `${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}:${now.getSeconds().toString().padStart(2, "0")}`;
      
      setLogs((prev) => [
        { time: timeStr, msg: randomMsg.msg, type: randomMsg.type },
        ...prev.slice(0, 14),
      ]);
    }, 4500);

    return () => clearInterval(logTimer);
  }, []);

  // ── Laser Slicing Canvas Animation (Now tied live to slider frequency!) ──
  useEffect(() => {
    let animationFrameId: number;
    
    const draw = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const width = canvas.width;
      const height = canvas.height;

      // Clear with very light fade for motion blur
      ctx.fillStyle = "rgba(10, 12, 22, 0.25)";
      ctx.fillRect(0, 0, width, height);

      // Draw cyber grids
      ctx.strokeStyle = "rgba(255, 255, 255, 0.03)";
      ctx.lineWidth = 1;
      for (let i = 0; i < width; i += 20) {
        ctx.beginPath();
        ctx.moveTo(i, 0);
        ctx.lineTo(i, height);
        ctx.stroke();
      }
      for (let j = 0; j < height; j += 20) {
        ctx.beginPath();
        ctx.moveTo(0, j);
        ctx.lineTo(width, j);
        ctx.stroke();
      }

      // Sine-like laser slice waves
      // Tied to actual laserFreq slider! Higher frequency = faster wave motion!
      laserAngleRef.current += 0.04 * (laserFreq / 485.2);
      const numWaves = 3;
      
      for (let w = 0; w < numWaves; w++) {
        ctx.beginPath();
        ctx.lineWidth = w === 0 ? 3 : 1;
        // Cyan color palette mapping
        ctx.strokeStyle = w === 0 ? "oklch(0.78 0.14 195)" : w === 1 ? "rgba(14, 165, 233, 0.4)" : "rgba(139, 92, 246, 0.3)";
        
        ctx.shadowBlur = w === 0 ? 15 : 0;
        ctx.shadowColor = "oklch(0.78 0.14 195)";

        for (let x = 0; x < width; x++) {
          const frequencyMultiplier = 0.015 + w * 0.005;
          const speedMultiplier = laserAngleRef.current * (1 + w * 0.2);
          const y = height / 2 + Math.sin(x * frequencyMultiplier + speedMultiplier) * (30 + w * 10);
          
          if (x === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }
        }
        ctx.stroke();
      }

      ctx.shadowBlur = 0; // Reset

      // Slicing laser target line
      const pulseX = (Math.sin(laserAngleRef.current) * 0.5 + 0.5) * width;
      ctx.beginPath();
      ctx.strokeStyle = "oklch(0.7 0.18 295)";
      ctx.lineWidth = 2;
      ctx.moveTo(pulseX, 0);
      ctx.lineTo(pulseX, height);
      ctx.stroke();

      // Slicing target dot
      ctx.beginPath();
      ctx.fillStyle = "oklch(0.7 0.18 295)";
      ctx.arc(pulseX, height / 2 + Math.sin(pulseX * 0.015 + laserAngleRef.current) * 30, 6, 0, Math.PI * 2);
      ctx.fill();

      animationFrameId = requestAnimationFrame(draw);
    };

    draw();

    return () => cancelAnimationFrame(animationFrameId);
  }, [laserFreq]);

  // ── Custom Action Click ──
  const handleAction = (label: string, actionId: string) => {
    setActionAlert(`Initiating system pulse: "${label}"...`);
    
    // Log action to timeline
    const now = new Date();
    const timeStr = `${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}:${now.getSeconds().toString().padStart(2, "0")}`;
    
    setLogs((prev) => [
      { time: timeStr, msg: `COMMAND RUN: [${activeRole.toUpperCase()}] executed "${label}"`, type: "quantum" },
      ...prev,
    ]);

    // Map action IDs to elegant Dynamic Island triggers
    let notifTitle = `Executing ${label}`;
    let notifSub = `Executing quantum operation in perspective deck.`;
    let notifIcon = "sync";

    if (actionId === "pulse") {
      notifTitle = "Pulse Report Synced";
      notifSub = "Yields & operating metrics updated successfully.";
      notifIcon = "success";
    } else if (actionId === "ledger") {
      notifTitle = "Ledger Audited";
      notifSub = "Airtable node synced to quantum blocks.";
      notifIcon = "quantum";
    } else if (actionId === "config") {
      notifTitle = "Nanotech Crystal Locked";
      notifSub = "Molecular alignment carbon crystal tuned to 99.89%.";
      notifIcon = "zap";
    } else if (actionId === "laser") {
      notifTitle = "Milling Lasers Calibrated";
      notifSub = "Active CAM resonators locked at 485.2 THz.";
      notifIcon = "laser";
    } else if (actionId === "sinter") {
      notifTitle = "Sintering Chamber Purged";
      notifSub = "Core thermals cooled. Sintering atmosphere balanced.";
      notifIcon = "flame";
    } else if (actionId === "render_qc") {
      notifTitle = "Neural QC Complete";
      notifSub = "exocad mesh checked. 0 intersection errors.";
      notifIcon = "success";
    } else if (actionId === "scan") {
      notifTitle = "Bilingual QR Scan Success";
      notifSub = "Intake scan registered in referring doctor file.";
      notifIcon = "success";
    } else if (actionId === "link") {
      notifTitle = "exocad Stream Linked";
      notifSub = "3D scan volumetric datasets active.";
      notifIcon = "sync";
    } else if (actionId === "verify") {
      notifTitle = "AI Patient Card Verified";
      notifSub = "Intake readiness verification completed.";
      notifIcon = "info";
    } else if (actionId === "receipts") {
      notifTitle = "Blockchain Synced";
      notifSub = "Invoice credits recorded on the smart ledger.";
      notifIcon = "quantum";
    } else if (actionId === "claims") {
      notifTitle = "Claims Synced";
      notifSub = "Smart claims sent to doctor email via Resend.";
      notifIcon = "zap";
    } else if (actionId === "yields") {
      notifTitle = "Yield Net Calculated";
      notifSub = "Synthesized Zirconia material profit offsets saved.";
      notifIcon = "info";
    } else if (actionId === "approve_design") {
      notifTitle = "Design Mesh Approved";
      notifSub = "Dr. Al-Sayed approved crown. Cam Milling initiated.";
      notifIcon = "success";
    } else if (actionId === "upload_scan") {
      notifTitle = "3D Scanned File Synced";
      notifSub = "Upper molar exocad prep file loaded successfully.";
      notifIcon = "sync";
    } else if (actionId === "chat") {
      notifTitle = "Secure Chat Connected";
      notifSub = "Bilingual secure channel open with Dr. Al-Sayed.";
      notifIcon = "info";
    } else if (actionId === "launch_drone") {
      notifTitle = "Drone Dispatched";
      notifSub = "Autonav vector path locked. Flight eta 8.4 mins.";
      notifIcon = "drone";
    } else if (actionId === "optimize_vectors") {
      notifTitle = "Vectors Tuned";
      notifSub = "Drone velocity compensated against wind pressures.";
      notifIcon = "zap";
    } else if (actionId === "proofs") {
      notifTitle = "Delivery Verified";
      notifSub = "Clinic QR cryptographic handshakes certified.";
      notifIcon = "success";
    } else if (actionId === "inspect_mcp") {
      notifTitle = "Stitch MCPBridge Synced";
      notifSub = "MCP Server active. Zero system call latency.";
      notifIcon = "quantum";
    } else if (actionId === "test_email") {
      notifTitle = "Resend SMTP Online";
      notifSub = "Standard HTML SMTP test email dispatched.";
      notifIcon = "success";
    } else if (actionId === "audit_rls") {
      notifTitle = "RLS Matrices Secure";
      notifSub = "All Row-Level Security policies active.";
      notifIcon = "success";
    }

    if (onNotify) {
      onNotify(notifTitle, notifSub, notifIcon);
    }

    setTimeout(() => {
      setActionAlert(null);
    }, 3000);
  };

  const rolePreset = ROLE_METRICS[activeRole];

  return (
    <div className="space-y-6">
      
      {/* ── iOS 18 Control Center style sliding segmented switcher ── */}
      <div className="flex flex-col items-center gap-3 select-none">
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/80">
          Simulate Spatial System Perspective (Year 22222)
        </p>
        <div className="w-full overflow-x-auto py-1 flex justify-center">
          <div className="relative flex p-1 rounded-2xl gap-1 shrink-0 bg-white/5 border border-white/5 shadow-inner backdrop-blur-md">
            {(Object.keys(ROLE_METRICS) as AppRole[]).map((role) => {
              const active = activeRole === role;
              return (
                <button
                  key={role}
                  onClick={() => {
                    setActiveRole(role);
                    if (onNotify) {
                      onNotify(
                        `Role: ${role.toUpperCase()}`,
                        `Switching spatial cockpit to ${ROLE_METRICS[role].title}`,
                        "sync"
                      );
                    }
                  }}
                  className={`relative px-4 py-2 text-xs font-semibold rounded-xl capitalize transition-colors duration-300 cursor-pointer z-10 ${
                    active ? "text-sky-300" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {active && (
                    <motion.div
                      layoutId="activeRoleHighlight"
                      className="absolute inset-0 bg-sky-500/20 border border-sky-500/30 rounded-xl z-[-1] spatial-glow-cyan"
                      transition={{ type: "spring", stiffness: 300, damping: 25 }}
                    />
                  )}
                  {role}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Action Alert banner ── */}
      {actionAlert && (
        <div className="spatial-glass border-emerald-500/30 rounded-2xl p-3 flex items-center gap-3 animate-fade-in shadow-[0_4px_15px_rgba(16,185,129,0.15)]">
          <div className="size-2 rounded-full bg-emerald-500 live-dot shrink-0" />
          <p className="text-xs font-medium text-emerald-300">{actionAlert}</p>
        </div>
      )}

      {/* ── Interactive Grid Deck (iOS Widget-styled Tiles) ── */}
      <div className="grid gap-6 md:grid-cols-12">

        {/* ── Left main telemetry cockpit (8 Columns) ── */}
        <div className="md:col-span-8 space-y-6">
          
          {/* Main Spatial Card: Dynamic metrics */}
          <div className="ios-widget p-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 size-48 bg-gradient-to-bl from-sky-500/10 to-transparent blur-3xl pointer-events-none" />
            
            <div className="flex items-center justify-between gap-4 border-b border-white/5 pb-4 mb-5">
              <div>
                <span className="text-[9px] font-bold uppercase tracking-[0.22em] text-sky-400">Operating Space-Time Shield</span>
                <h2 className="text-lg font-bold text-foreground mt-0.5">{rolePreset.title}</h2>
              </div>
              <div className="flex items-center gap-2 rounded-full bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1">
                <span className="size-1.5 rounded-full bg-emerald-500 live-dot" />
                <span className="text-[9px] font-semibold text-emerald-400 uppercase tracking-wider">ACTIVE LINK</span>
              </div>
            </div>

            {/* Simulated Live KPIs */}
            <div className="grid gap-4 sm:grid-cols-2">
              {rolePreset.kpis.map((kpi, idx) => (
                <div key={idx} className="spatial-glass rounded-xl p-4 transition-all duration-300 hover:border-white/10 hover:shadow-lg">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/75">{kpi.label}</p>
                  <p className={`text-xl font-bold mt-1.5 ${kpi.color}`}>{kpi.value}</p>
                  <p className="text-[10px] text-muted-foreground/70 mt-1">{kpi.detail}</p>
                </div>
              ))}
            </div>

            {/* Smart Actions Row */}
            <div className="mt-6 pt-4 border-t border-white/5">
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/80 mb-3">Initiate Role-Specific Operations</p>
              <div className="flex flex-wrap gap-3">
                {rolePreset.actions.map((act, idx) => {
                  const Icon = act.icon;
                  return (
                    <button
                      key={idx}
                      onClick={() => handleAction(act.label, act.actionId)}
                      className="spatial-glass flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold hover:border-sky-500/40 hover:bg-sky-500/10 hover:text-sky-300 transition-all duration-300 cursor-pointer active:scale-95 shadow-sm"
                    >
                      <Icon className="size-3.5 text-sky-400" />
                      <span>{act.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

          </div>

          {/* Slicing Laser interactive visual canvas */}
          <div className="ios-widget p-6">
            <div className="flex items-center justify-between gap-4 border-b border-white/5 pb-3 mb-4">
              <div className="flex items-center gap-2">
                <Cpu className="size-4 text-purple-400" />
                <p className="text-xs font-bold uppercase tracking-widest text-foreground">Cyber-Milling Slicer (Active Simulation)</p>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <span className="text-[9px] text-muted-foreground block">Laser Resonance</span>
                  <span className="text-xs font-bold text-sky-400">{laserFreq.toFixed(1)} THz</span>
                </div>
                <div className="text-right">
                  <span className="text-[9px] text-muted-foreground block">Sintering Pressure</span>
                  <span className="text-xs font-bold text-purple-400">{sinteringPressure.toFixed(3)} GPa</span>
                </div>
              </div>
            </div>

            {/* Animation Canvas */}
            <div className="relative overflow-hidden rounded-2xl border border-white/5 bg-slate-950/80">
              <canvas
                ref={canvasRef}
                width={600}
                height={160}
                className="w-full h-[160px] block"
              />
              <div className="absolute inset-x-0 bottom-2 px-3 flex justify-between text-[8px] font-mono text-muted-foreground/60 pointer-events-none">
                <span>SLICING MATRIX v22.2.0</span>
                <span>QUANTUM CRYSTAL LOCK ACTIVE</span>
              </div>
            </div>

            {/* Simulated exocad Rendering Progress */}
            <div className="mt-5 space-y-3">
              <p className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground/75">Active Neural Rendering Queues</p>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="spatial-glass rounded-xl p-3">
                  <div className="flex justify-between items-center text-[10px] mb-1 font-semibold">
                    <span className="text-sky-300 truncate">Upper_Arch_NanoMesh.exocad</span>
                    <span className="font-mono text-muted-foreground">89%</span>
                  </div>
                  <div className="w-full bg-white/5 rounded-full h-1.5 overflow-hidden">
                    <div className="bg-sky-400 h-full rounded-full transition-all duration-500" style={{ width: "89%" }} />
                  </div>
                </div>
                <div className="spatial-glass rounded-xl p-3">
                  <div className="flex justify-between items-center text-[10px] mb-1 font-semibold">
                    <span className="text-purple-300 truncate">Zirconia_Crown_Molar.cam</span>
                    <span className="font-mono text-muted-foreground">62%</span>
                  </div>
                  <div className="w-full bg-white/5 rounded-full h-1.5 overflow-hidden">
                    <div className="bg-purple-400 h-full rounded-full transition-all duration-500" style={{ width: "62%" }} />
                  </div>
                </div>
              </div>
            </div>

          </div>

        </div>

        {/* ── Right control panels & system logs (4 Columns) ── */}
        <div className="md:col-span-4 space-y-6">

          {/* Control Center Drawer Panel (iOS Widget style) */}
          <div className="ios-widget p-5 relative">
            <div className="flex items-center justify-between gap-4 border-b border-white/5 pb-3 mb-4">
              <div className="flex items-center gap-1.5">
                <Settings className="size-4 text-sky-400" />
                <p className="text-xs font-bold uppercase tracking-widest text-foreground">Control Center</p>
              </div>
              <button
                onClick={() => setControlCenterOpen(!controlCenterOpen)}
                className="text-[10px] font-bold text-sky-400 hover:text-sky-300 transition-colors uppercase tracking-wider cursor-pointer"
              >
                {controlCenterOpen ? "Collapse" : "Expand"}
              </button>
            </div>

            <div className="space-y-5">
              
              {/* Laser Frequency Slider */}
              <div className="space-y-2">
                <div className="flex justify-between text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                  <span>Laser Wave Frequency</span>
                  <span className="text-sky-300 font-mono">{laserFreq.toFixed(1)} THz</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-[9px] font-mono text-muted-foreground">200</span>
                  <input
                    type="range"
                    min="200"
                    max="800"
                    step="0.5"
                    value={laserFreq}
                    onChange={(e) => setLaserFreq(Number(e.target.value))}
                    className="ios-slider"
                  />
                  <span className="text-[9px] font-mono text-muted-foreground">800</span>
                </div>
              </div>

              {/* Toggles list with custom iOS Switch Toggles */}
              <div className="space-y-3 pt-2">
                <p className="text-[8px] font-bold uppercase tracking-widest text-muted-foreground/75">Simulate Core Microservices</p>
                
                {[
                  { label: "AI Diagnostic Engine", desc: "Auto case audit & risk block", state: aiEngine, setter: setAiEngine, id: "ai" },
                  { label: "Resend Resync Bridge", desc: "Sync invoice claims to email", state: resendBridge, setter: setResendBridge, id: "resend" },
                  { label: "Supabase Live Pipeline", desc: "Postgres event trigger stream", state: supabasePipe, setter: setSupabasePipe, id: "supabase" },
                ].map((item, idx) => (
                  <div key={idx} className="spatial-glass rounded-xl p-3 flex items-center justify-between gap-3 shadow-sm hover:border-white/10 transition-all">
                    <div className="min-w-0">
                      <p className="text-[10px] font-bold text-foreground leading-tight">{item.label}</p>
                      <p className="text-[8px] text-muted-foreground/80 mt-0.5 leading-none truncate">{item.desc}</p>
                    </div>
                    
                    {/* iOS Switch */}
                    <div 
                      onClick={() => {
                        const target = !item.state;
                        item.setter(target);
                        if (onNotify) {
                          onNotify(
                            target ? `${item.label} Secured` : `${item.label} Offline`,
                            target ? `${item.label} core operations synced live.` : `${item.label} communication layer offline.`,
                            target ? "success" : "error"
                          );
                        }
                      }}
                      className={`ios-switch shrink-0 ${item.state ? "active" : ""}`}
                    >
                      <div className="ios-switch-knob" />
                    </div>
                  </div>
                ))}
              </div>

              {controlCenterOpen && (
                <div className="space-y-3 pt-3 border-t border-white/5 animate-fade-in">
                  <p className="text-[8px] font-bold uppercase tracking-widest text-purple-400">Milling Core Matrix</p>
                  
                  <div className="grid grid-cols-2 gap-2 text-[10px]">
                    <div className="spatial-glass p-2.5 rounded-xl text-center">
                      <span className="text-muted-foreground block text-[8px] uppercase font-bold tracking-wider">Nano-Seals</span>
                      <span className="font-extrabold text-emerald-400 mt-1 block tracking-widest text-[9px]">SECURED</span>
                    </div>
                    <div className="spatial-glass p-2.5 rounded-xl text-center">
                      <span className="text-muted-foreground block text-[8px] uppercase font-bold tracking-wider">Telemetry</span>
                      <span className="font-extrabold text-sky-400 mt-1 block tracking-widest text-[9px]">SYNCED</span>
                    </div>
                  </div>
                </div>
              )}

            </div>
          </div>

          {/* Cybernetic Timeline Logs */}
          <div className="ios-widget p-5">
            <div className="flex items-center gap-2 border-b border-white/5 pb-3 mb-4">
              <Terminal className="size-4 text-purple-400" />
              <p className="text-xs font-bold uppercase tracking-widest text-foreground font-sans">Cyber Log stream</p>
            </div>

            <div className="h-[200px] overflow-y-auto space-y-2.5 pr-1 font-mono scrollbar-thin">
              {logs.map((log, idx) => {
                let colorClass = "text-sky-300";
                if (log.type === "success") colorClass = "text-emerald-400";
                if (log.type === "warning") colorClass = "text-amber-400";
                if (log.type === "error") colorClass = "text-red-400";
                if (log.type === "quantum") colorClass = "text-purple-300";

                return (
                  <div key={idx} className="text-[10px] leading-relaxed transition-all duration-300 hover:bg-white/5 p-1 rounded">
                    <span className="text-muted-foreground/60 mr-1.5">[{log.time}]</span>
                    <span className={colorClass}>{log.msg}</span>
                  </div>
                );
              })}
            </div>
          </div>

        </div>

      </div>

      {/* ── Floating iOS Premium Dock (Persistent at bottom viewport layout center) ── */}
      <div className="flex flex-col items-center pt-10">
        <div className="ios-dock p-2 px-3 flex items-center gap-3 relative z-30 shadow-[0_15px_35px_rgba(0,0,0,0.5)]">
          <div className="flex items-center gap-2">
            {DOCK_APPS.map((app) => {
              const Icon = app.icon;
              const active = activeRole === app.role;
              return (
                <button
                  key={app.role}
                  onClick={() => {
                    setActiveRole(app.role);
                    if (onNotify) {
                      onNotify(
                        `${app.label} Active`,
                        `System loaded with ${ROLE_METRICS[app.role].title} telemetry.`,
                        "sync"
                      );
                    }
                  }}
                  className={`ios-dock-icon group size-12 rounded-2xl bg-gradient-to-tr ${app.gradient} text-white flex items-center justify-center shadow-lg transition-transform duration-300 relative cursor-pointer active:scale-90 hover:scale-115 ${
                    active ? "active ring-2 ring-white/40 spatial-glow-cyan" : "opacity-80 hover:opacity-100"
                  }`}
                  title={app.label}
                >
                  <Icon className="size-5 transition-transform group-hover:scale-110" />
                  
                  {/* Tooltip */}
                  <span className="absolute bottom-16 bg-slate-950/80 text-white text-[9px] font-bold uppercase tracking-widest px-2 py-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap border border-white/10 shadow-lg z-50">
                    {app.label}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Separator line */}
          <div className="w-[1px] h-8 bg-white/10 mx-1" />

          {/* Apple-style Secure Access Lock app */}
          <button
            onClick={onRevealLogin}
            className="group size-12 rounded-2xl bg-gradient-to-tr from-slate-800 to-slate-900 border border-white/10 text-white flex items-center justify-center shadow-lg hover:scale-115 active:scale-90 transition-transform duration-300 relative cursor-pointer"
            title="Secure System Portal"
          >
            <Lock className="size-5 text-sky-400 group-hover:animate-pulse" />
            
            {/* Tooltip */}
            <span className="absolute bottom-16 bg-slate-950/80 text-white text-[9px] font-bold uppercase tracking-widest px-2 py-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap border border-white/10 shadow-lg z-50 font-sans">
              Secure Access
            </span>
          </button>
        </div>
        <p className="text-[9px] text-muted-foreground mt-3 uppercase tracking-widest font-mono">LabFlow OS Multi-tenant Cyber Dock Layer</p>
      </div>

    </div>
  );
}
