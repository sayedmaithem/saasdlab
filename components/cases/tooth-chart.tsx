"use client";

import { cn } from "@/lib/utils";

// FDI notation — upper right 18→11, upper left 21→28, lower left 31→38, lower right 48→41
const UPPER_RIGHT = [18, 17, 16, 15, 14, 13, 12, 11];
const UPPER_LEFT = [21, 22, 23, 24, 25, 26, 27, 28];
const LOWER_LEFT = [31, 32, 33, 34, 35, 36, 37, 38];
const LOWER_RIGHT = [48, 47, 46, 45, 44, 43, 42, 41];

function ToothButton({
  number,
  selected,
  onToggle,
}: {
  number: number;
  selected: boolean;
  onToggle: (n: number) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onToggle(number)}
      className={cn(
        "flex h-9 w-9 items-center justify-center rounded-md border text-xs font-semibold transition-colors",
        selected
          ? "border-primary bg-primary text-primary-foreground"
          : "border-muted bg-card text-muted-foreground hover:border-primary/60 hover:bg-primary/10 hover:text-foreground",
      )}
      title={`Tooth ${number}`}
      aria-pressed={selected}
    >
      {number}
    </button>
  );
}

function QuadrantRow({
  teeth,
  selected,
  onToggle,
  justify,
}: {
  teeth: number[];
  selected: Set<number>;
  onToggle: (n: number) => void;
  justify: "start" | "end";
}) {
  return (
    <div className={cn("flex gap-1", justify === "end" ? "justify-end" : "justify-start")}>
      {teeth.map((n) => (
        <ToothButton key={n} number={n} selected={selected.has(n)} onToggle={onToggle} />
      ))}
    </div>
  );
}

export function ToothChart({
  selected,
  onChange,
}: {
  selected: number[];
  onChange: (teeth: number[]) => void;
}) {
  const selectedSet = new Set(selected);

  function toggle(n: number) {
    const next = new Set(selectedSet);
    if (next.has(n)) {
      next.delete(n);
    } else {
      next.add(n);
    }
    onChange(Array.from(next).sort((a, b) => a - b));
  }

  function toggleArch(arch: number[]) {
    const allSelected = arch.every((n) => selectedSet.has(n));
    const next = new Set(selectedSet);
    if (allSelected) {
      arch.forEach((n) => next.delete(n));
    } else {
      arch.forEach((n) => next.add(n));
    }
    onChange(Array.from(next).sort((a, b) => a - b));
  }

  const upperAll = [...UPPER_RIGHT, ...UPPER_LEFT];
  const lowerAll = [...LOWER_LEFT, ...LOWER_RIGHT];
  const allUpper = upperAll.every((n) => selectedSet.has(n));
  const allLower = lowerAll.every((n) => selectedSet.has(n));

  return (
    <div className="space-y-3">
      {/* Row labels */}
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>Upper right</span>
        <button
          type="button"
          onClick={() => toggleArch(upperAll)}
          className={cn(
            "rounded px-2 py-0.5 text-xs font-medium transition-colors",
            allUpper
              ? "bg-primary text-primary-foreground"
              : "bg-muted text-muted-foreground hover:bg-primary/10",
          )}
        >
          {allUpper ? "Deselect upper" : "Select all upper"}
        </button>
        <span>Upper left</span>
      </div>

      {/* Upper jaw */}
      <div className="grid grid-cols-2 gap-1 rounded-t-lg border border-b-0 bg-muted/20 p-3">
        <QuadrantRow teeth={UPPER_RIGHT} selected={selectedSet} onToggle={toggle} justify="end" />
        <QuadrantRow teeth={UPPER_LEFT} selected={selectedSet} onToggle={toggle} justify="start" />
      </div>

      {/* Midline */}
      <div className="mx-3 border-t border-dashed border-muted-foreground/30" />

      {/* Lower jaw */}
      <div className="grid grid-cols-2 gap-1 rounded-b-lg border border-t-0 bg-muted/20 p-3">
        <QuadrantRow teeth={LOWER_RIGHT} selected={selectedSet} onToggle={toggle} justify="end" />
        <QuadrantRow teeth={LOWER_LEFT} selected={selectedSet} onToggle={toggle} justify="start" />
      </div>

      {/* Row labels */}
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>Lower right</span>
        <button
          type="button"
          onClick={() => toggleArch(lowerAll)}
          className={cn(
            "rounded px-2 py-0.5 text-xs font-medium transition-colors",
            allLower
              ? "bg-primary text-primary-foreground"
              : "bg-muted text-muted-foreground hover:bg-primary/10",
          )}
        >
          {allLower ? "Deselect lower" : "Select all lower"}
        </button>
        <span>Lower left</span>
      </div>

      {selected.length > 0 && (
        <p className="text-xs text-muted-foreground">
          <span className="font-semibold text-foreground">{selected.length} teeth selected:</span>{" "}
          {selected.join(", ")}
        </p>
      )}
    </div>
  );
}
