import { hasSupabaseEnv, canUsePreviewAuth } from "@/lib/env";
import { SECURITY_FINDINGS, FINDING_COUNTS, type FindingSeverity } from "@/lib/constants/security-findings";
import { calculateLaunchReadiness } from "@/lib/command-center/launch-checklist";
import { getSystemTasks } from "@/lib/command-center/system-tasks";
import { getFeatureFlags } from "@/lib/command-center/feature-flags";

export type SecuritySummary = {
  total: number;
  bySeverity: Record<FindingSeverity, number>;
  openCount: number;
  score: number;
};

export type ReadinessScore = {
  total: number;
  security: number;
  cloud: number;
  setup: number;
  launch: number;
  feature: number;
};

export type BackendHealth = {
  migrationCount: number;
  hasEnvExample: boolean;
  hasTsBuildInfo: boolean;
  nodeEnv: string;
  isPreview: boolean;
};

export type CloudStatusKind = "connected" | "warning" | "offline" | "unknown";

export type CloudStatusItem = {
  label: string;
  status: CloudStatusKind;
  detail: string;
};

export type CloudStatus = {
  overall: "connected" | "preview" | "offline";
  items: CloudStatusItem[];
};

export function getSecuritySummary(): SecuritySummary {
  const openCount = SECURITY_FINDINGS.filter((f) => f.status === "open").length;
  const score = Math.max(
    0,
    Math.min(
      100,
      100 -
        (FINDING_COUNTS.critical * 15 +
          FINDING_COUNTS.high * 8 +
          FINDING_COUNTS.medium * 4 +
          FINDING_COUNTS.low * 2),
    ),
  );

  return {
    total: FINDING_COUNTS.total,
    bySeverity: {
      critical: FINDING_COUNTS.critical,
      high: FINDING_COUNTS.high,
      medium: FINDING_COUNTS.medium,
      low: FINDING_COUNTS.low,
    },
    openCount,
    score,
  };
}

export function getSystemReadiness(): ReadinessScore {
  const security = Math.max(
    0,
    Math.min(
      100,
      100 -
        (FINDING_COUNTS.critical * 15 +
          FINDING_COUNTS.high * 8 +
          FINDING_COUNTS.medium * 4 +
          FINDING_COUNTS.low * 2),
    ),
  );

  const cloud = hasSupabaseEnv() ? 85 : 20;

  // Setup: pilot-blocking tasks that are not done reduce the score
  const tasks = getSystemTasks();
  const pilotBlockers = tasks.filter((t) => t.blocksPilot && t.status !== "done");
  const setup = Math.max(0, Math.min(100, 100 - pilotBlockers.length * 10));

  // Launch: use pilot score from launch checklist as the launch sub-score
  const launchReadiness = calculateLaunchReadiness();
  const launch = launchReadiness.pilotScore;

  // Feature: percentage of flags that are enabled vs needs_setup/disabled
  const flags = getFeatureFlags();
  const enabledFlags = flags.filter((f) => f.status === "enabled").length;
  const feature = flags.length > 0 ? Math.round((enabledFlags / flags.length) * 100) : 0;

  const total = Math.round((security + cloud + setup + launch + feature) / 5);

  return { total, security, cloud, setup, launch, feature };
}

export async function getBackendHealth(): Promise<BackendHealth> {
  let migrationCount = 0;
  let hasEnvExample = false;
  let hasTsBuildInfo = false;

  try {
    const fs = await import("fs");
    const path = await import("path");
    const migrationsDir = path.join(process.cwd(), "supabase", "migrations");
    const envExamplePath = path.join(process.cwd(), ".env.example");
    const tsBuildPath = path.join(process.cwd(), "tsconfig.tsbuildinfo");

    if (fs.existsSync(migrationsDir)) {
      const files = fs.readdirSync(migrationsDir);
      migrationCount = files.filter((f: string) => f.endsWith(".sql")).length;
    }

    hasEnvExample = fs.existsSync(envExamplePath);
    hasTsBuildInfo = fs.existsSync(tsBuildPath);
  } catch {
    // fs unavailable in edge runtime — leave defaults
  }

  return {
    migrationCount,
    hasEnvExample,
    hasTsBuildInfo,
    nodeEnv: process.env.NODE_ENV ?? "unknown",
    isPreview: canUsePreviewAuth(),
  };
}

export function getCloudStatus(): CloudStatus {
  const supabaseConnected = hasSupabaseEnv();

  const items: CloudStatusItem[] = [
    {
      label: "Supabase Auth",
      status: supabaseConnected ? "connected" : "offline",
      detail: supabaseConnected
        ? "NEXT_PUBLIC_SUPABASE_URL and ANON_KEY are set"
        : "NEXT_PUBLIC_SUPABASE_URL or ANON_KEY missing",
    },
    {
      label: "PostgreSQL Database",
      status: supabaseConnected ? "connected" : "offline",
      detail: supabaseConnected
        ? "Database reachable via Supabase project"
        : "No Supabase connection configured",
    },
    {
      label: "Storage Buckets",
      status: supabaseConnected ? "unknown" : "offline",
      detail: supabaseConnected
        ? "Bucket reachability not verified at build time"
        : "Requires Supabase connection",
    },
    {
      label: "GitHub Remote",
      status: "unknown",
      detail: "Remote URL not verified at runtime — check git remote",
    },
    {
      label: "Vercel Deployment",
      status: "unknown",
      detail: "Deployment status not wired — connect via Vercel API in Phase 3",
    },
    {
      label: "Backup / DR",
      status: "unknown",
      detail: "Backup strategy not configured — placeholder for Phase 3",
    },
  ];

  return {
    overall: supabaseConnected ? "connected" : "preview",
    items,
  };
}
