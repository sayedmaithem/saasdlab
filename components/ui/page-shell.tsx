import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface PageShellProps {
  children: ReactNode;
  /** Optional additional classNames for the inner content area */
  className?: string;
  /** Maximum width constraint. Defaults to full width. */
  maxWidth?: "sm" | "md" | "lg" | "xl" | "2xl" | "full";
}

const MAX_WIDTH_CLASSES: Record<NonNullable<PageShellProps["maxWidth"]>, string> = {
  sm: "max-w-sm",
  md: "max-w-md",
  lg: "max-w-lg",
  xl: "max-w-xl",
  "2xl": "max-w-2xl",
  full: "max-w-full",
};

/**
 * Inner page content wrapper. Provides consistent vertical spacing
 * and optional max-width constraint. Use inside AppShell pages to
 * avoid writing `space-y-8` or `max-w-2xl` repeatedly.
 */
export function PageShell({
  children,
  className,
  maxWidth = "full",
}: PageShellProps) {
  return (
    <div
      className={cn(
        "space-y-8 animate-fade-in relative z-10",
        MAX_WIDTH_CLASSES[maxWidth],
        className,
      )}
    >
      {children}
    </div>
  );
}
