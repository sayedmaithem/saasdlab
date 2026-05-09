import * as React from "react";
import { cn } from "@/lib/utils";

type BadgeTone = "default" | "blue" | "amber" | "green" | "red" | "neutral";

const tones: Record<BadgeTone, string> = {
  default: "bg-primary/10 text-primary ring-primary/20",
  blue: "bg-sky-50 text-sky-700 ring-sky-200",
  amber: "bg-amber-50 text-amber-800 ring-amber-200",
  green: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  red: "bg-red-50 text-red-700 ring-red-200",
  neutral: "bg-muted text-muted-foreground ring-border",
};

export function Badge({
  className,
  tone = "default",
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & { tone?: BadgeTone }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset",
        tones[tone],
        className,
      )}
      {...props}
    />
  );
}
