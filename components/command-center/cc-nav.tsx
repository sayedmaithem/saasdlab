"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

const CC_TABS = [
  { label: "Overview", href: "/command-center" },
  { label: "Master Data", href: "/command-center/master-data" },
  { label: "Finance", href: "/command-center/finance" },
  { label: "Launch", href: "/command-center/launch" },
  { label: "Tasks", href: "/command-center/tasks" },
  { label: "Features", href: "/command-center/features" },
  { label: "Security", href: "/command-center/security" },
  { label: "Roles & Access", href: "/command-center/roles" },
  { label: "Users", href: "/command-center/users" },
  { label: "Backend Health", href: "/command-center/health" },
  { label: "Cloud", href: "/command-center/cloud" },
  { label: "Setup", href: "/command-center/setup" },
] as const;

export function CcNav() {
  const pathname = usePathname();

  return (
    <nav
      className="glass-card flex gap-1 overflow-x-auto rounded-xl p-1.5 scrollbar-hide shadow-sm"
      aria-label="Command Center navigation"
    >
      {CC_TABS.map((tab) => {
        const isActive =
          tab.href === "/command-center"
            ? pathname === "/command-center"
            : pathname.startsWith(tab.href);

        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={cn(
              "relative shrink-0 rounded-lg px-4 py-2 text-sm font-semibold transition-all duration-300",
              isActive
                ? "text-emerald-900 dark:text-emerald-100"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/50",
            )}
            aria-current={isActive ? "page" : undefined}
          >
            {isActive && (
              <motion.div
                layoutId="cc-nav-active-tab"
                className="absolute inset-0 rounded-lg bg-emerald-500/10 border border-emerald-500/20 shadow-sm"
                initial={false}
                transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
              />
            )}
            <span className="relative z-10">{tab.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
