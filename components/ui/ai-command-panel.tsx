"use client";

import { useState } from "react";
import {
  AlertTriangle,
  ArrowRight,
  Bot,
  CheckCircle2,
  Clock,
  Loader2,
  Sparkles,
  Users,
  X,
} from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────────────────

type QuestionId =
  | "blocking"
  | "approvals"
  | "overloaded"
  | "delivery_ready"
  | "first_action"
  | "missing_files";

type AiAnswer = {
  summary: string;
  items?: Array<{ label: string; detail: string; severity?: "red" | "amber" | "green" }>;
  action?: { label: string; href: string };
};

// ── Mock AI answers — TODO: replace with real Anthropic Claude API call ───────
// When ready: POST /api/ai/lab-pulse with { question, session.activeLabId }
// Claude should query real case data via Supabase, then generate a natural
// language summary + structured items array.
const MOCK_ANSWERS: Record<QuestionId, AiAnswer> = {
  blocking: {
    summary: "3 cases are blocked today. Two are missing scan files that technicians need to start work, and one is on hold pending doctor clarification.",
    items: [
      { label: "LAB-2035", detail: "Missing scan files — technician cannot start milling", severity: "red" },
      { label: "LAB-2029", detail: "Missing scan files — awaiting doctor upload", severity: "red" },
      { label: "LAB-2021", detail: "On hold — waiting for shade confirmation from Dr. Nour", severity: "amber" },
    ],
    action: { label: "View all cases", href: "/cases" },
  },
  approvals: {
    summary: "2 design versions are waiting for doctor approval. The oldest has been waiting 2 days.",
    items: [
      { label: "LAB-2038", detail: "Design V2 submitted 2 days ago — Dr. Hassan has not reviewed", severity: "red" },
      { label: "LAB-2034", detail: "Design V1 submitted yesterday — Dr. Khalil pending review", severity: "amber" },
    ],
    action: { label: "Open design queue", href: "/design" },
  },
  overloaded: {
    summary: "Mohammed Al-Rashid has 6 active cases — highest load on the floor. Consider redistributing 1-2 cases.",
    items: [
      { label: "Mohammed Al-Rashid", detail: "6 active cases across wax_modeling and milling stages", severity: "amber" },
      { label: "Sarah Al-Farsi", detail: "4 active cases — moderate load", severity: "green" },
      { label: "Omar Khalil", detail: "2 active cases — capacity available", severity: "green" },
    ],
    action: { label: "Production board", href: "/production" },
  },
  delivery_ready: {
    summary: "4 cases have passed QC and are ready to dispatch. 2 are marked urgent.",
    items: [
      { label: "LAB-2028", detail: "Urgent — Dr. Khalil clinic, scheduled today", severity: "red" },
      { label: "LAB-2024", detail: "Urgent — Dr. Ahmed clinic, overdue yesterday", severity: "red" },
      { label: "LAB-2019", detail: "Standard — Dr. Nour clinic", severity: "green" },
      { label: "LAB-2017", detail: "Standard — Dr. Hassan clinic", severity: "green" },
    ],
    action: { label: "Delivery queue", href: "/delivery" },
  },
  first_action: {
    summary: "Based on urgency and deadlines, here are your top 3 actions for right now.",
    items: [
      { label: "1. Dispatch LAB-2028 and LAB-2024", detail: "Both are urgent cases past delivery date", severity: "red" },
      { label: "2. Follow up on LAB-2038 design approval", detail: "Dr. Hassan has not reviewed for 2 days", severity: "amber" },
      { label: "3. Upload scan files for LAB-2035", detail: "Technician is blocked — ask reception to chase doctor", severity: "amber" },
    ],
  },
  missing_files: {
    summary: "3 active cases are missing required scan or photo files. All three are currently blocking production.",
    items: [
      { label: "LAB-2035", detail: "No scan files — intake stage", severity: "red" },
      { label: "LAB-2029", detail: "No scan files — intake stage", severity: "red" },
      { label: "LAB-2018", detail: "No clinical photos — design review paused", severity: "amber" },
    ],
    action: { label: "Cases with issues", href: "/cases" },
  },
};

const QUESTIONS: Array<{
  id: QuestionId;
  icon: typeof Bot;
  question: string;
  shortLabel: string;
}> = [
  { id: "first_action",    icon: Sparkles,      question: "What should we do first right now?",        shortLabel: "Top priority" },
  { id: "blocking",        icon: AlertTriangle, question: "What is blocking the lab today?",            shortLabel: "Blockers" },
  { id: "approvals",       icon: Clock,         question: "Which cases need doctor approval?",          shortLabel: "Approvals" },
  { id: "missing_files",   icon: AlertTriangle, question: "Which cases are missing files?",             shortLabel: "Missing files" },
  { id: "overloaded",      icon: Users,         question: "Which technicians are overloaded?",          shortLabel: "Workload" },
  { id: "delivery_ready",  icon: CheckCircle2,  question: "Which cases are ready for delivery?",        shortLabel: "Ready to ship" },
];

const SEVERITY_COLOR: Record<string, string> = {
  red:   "text-red-600 dark:text-red-400",
  amber: "text-amber-600 dark:text-amber-400",
  green: "text-emerald-600 dark:text-emerald-400",
};

// ── Component ─────────────────────────────────────────────────────────────────

export function AiCommandPanel() {
  const [open, setOpen] = useState(false);
  const [activeQuestion, setActiveQuestion] = useState<QuestionId | null>(null);
  const [loading, setLoading] = useState(false);

  function ask(id: QuestionId) {
    if (activeQuestion === id) return;
    setLoading(true);
    setActiveQuestion(id);
    // Simulate API latency — TODO: replace with real fetch
    setTimeout(() => setLoading(false), 420);
  }

  const answer = activeQuestion ? MOCK_ANSWERS[activeQuestion] : null;

  return (
    <>
      {/* Trigger button */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex h-9 items-center gap-1.5 rounded-lg border bg-card px-2.5 text-[12px] font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
        aria-label="Open AI command panel"
      >
        <Bot className="size-3.5 text-primary" />
        <span className="hidden sm:inline">Ask AI</span>
      </button>

      {/* Panel */}
      {open && (
        <>
          <div
            className="ai-panel-backdrop"
            onClick={() => setOpen(false)}
            aria-hidden="true"
          />
          <div className="ai-panel" role="dialog" aria-label="AI Command Panel">
            {/* Header */}
            <div className="sticky top-0 z-10 flex items-center justify-between border-b bg-card px-5 py-4">
              <div className="flex items-center gap-2.5">
                <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10">
                  <Bot className="size-4 text-primary" />
                </div>
                <div>
                  <h2 className="text-sm font-bold">Lab Intelligence</h2>
                  <p className="text-[10px] text-muted-foreground">
                    Ask your lab any question
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="flex size-8 items-center justify-center rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                aria-label="Close AI panel"
              >
                <X className="size-4" />
              </button>
            </div>

            {/* Mock data banner */}
            <div className="mx-5 mt-4 rounded-lg border border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950/30 px-3 py-2">
              <p className="text-[10px] font-semibold text-amber-700 dark:text-amber-400">
                ⚠ Mock AI — TODO: connect Anthropic Claude API
              </p>
              <p className="text-[10px] text-amber-600 dark:text-amber-500 mt-0.5">
                Responses are static. Real AI will query live Supabase data.
              </p>
            </div>

            {/* Question chips */}
            <div className="px-5 pt-4 pb-2">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-3">
                Lab questions
              </p>
              <div className="flex flex-wrap gap-2">
                {QUESTIONS.map((q) => {
                  const Icon = q.icon;
                  const active = activeQuestion === q.id;
                  return (
                    <button
                      key={q.id}
                      type="button"
                      onClick={() => ask(q.id)}
                      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[12px] font-medium transition-all ${
                        active
                          ? "border-primary bg-primary text-primary-foreground shadow-sm"
                          : "border-border bg-card text-muted-foreground hover:border-primary/40 hover:text-foreground hover:bg-muted"
                      }`}
                    >
                      <Icon className="size-3" />
                      {q.shortLabel}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Active question display */}
            {activeQuestion && (
              <div className="px-5 pb-5 pt-3">
                <div className="rounded-xl border bg-muted/30 p-4 space-y-3">
                  <p className="text-[13px] font-semibold text-muted-foreground">
                    {QUESTIONS.find((q) => q.id === activeQuestion)?.question}
                  </p>

                  {loading ? (
                    <div className="flex items-center gap-2 text-muted-foreground py-2">
                      <Loader2 className="size-4 animate-spin" />
                      <span className="text-sm">Analyzing lab data…</span>
                    </div>
                  ) : answer ? (
                    <div className="space-y-3 animate-fade-in">
                      {/* Summary */}
                      <p className="text-sm leading-relaxed text-foreground">
                        {answer.summary}
                      </p>

                      {/* Items */}
                      {answer.items && answer.items.length > 0 && (
                        <div className="space-y-2 pt-1">
                          {answer.items.map((item, i) => (
                            <div
                              key={i}
                              className="flex items-start gap-3 rounded-lg border bg-card px-3 py-2.5"
                            >
                              <span
                                className={`mt-0.5 size-1.5 shrink-0 rounded-full ${
                                  item.severity === "red"
                                    ? "bg-red-500"
                                    : item.severity === "amber"
                                    ? "bg-amber-400"
                                    : "bg-emerald-500"
                                }`}
                              />
                              <div className="min-w-0">
                                <p className={`text-[13px] font-semibold ${item.severity ? SEVERITY_COLOR[item.severity] : ""}`}>
                                  {item.label}
                                </p>
                                <p className="text-[11px] text-muted-foreground mt-0.5">
                                  {item.detail}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Action */}
                      {answer.action && (
                        <a
                          href={answer.action.href}
                          onClick={() => setOpen(false)}
                          className="inline-flex items-center gap-1 text-[12px] font-medium text-primary hover:underline pt-1"
                        >
                          {answer.action.label}
                          <ArrowRight className="size-3" />
                        </a>
                      )}
                    </div>
                  ) : null}
                </div>
              </div>
            )}

            {!activeQuestion && (
              <div className="px-5 pb-6 pt-2 text-center text-sm text-muted-foreground">
                Select a question above to get an instant lab briefing.
              </div>
            )}
          </div>
        </>
      )}
    </>
  );
}
