"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const CC_TABS = [
  { label: "Overview", href: "/command-center" },
  { label: "Master Data", href: "/command-center/master-data" },
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
      className="flex gap-1 overflow-x-auto rounded-lg border bg-muted/40 p-1"
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
              "shrink-0 rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
              isActive
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground",
            )}
            aria-current={isActive ? "page" : undefined}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
