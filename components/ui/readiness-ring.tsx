/**
 * ReadinessRing — circular SVG ring showing a percentage (0–100).
 *
 * Color thresholds (matches Lovable prototype):
 *   ≥ 85%  → success (green)
 *   ≥ 60%  → primary (teal)
 *   ≥ 40%  → warning (amber)
 *   < 40%  → destructive (red)
 *
 * Usage:
 *   <ReadinessRing value={72} size={64} />
 *   <ReadinessRing value={72} size={108} label="ready" />
 */

export function ReadinessRing({
  value,
  size = 64,
  label,
}: {
  value: number;
  size?: number;
  label?: string;
}) {
  const r = (size - 8) / 2;
  const circumference = 2 * Math.PI * r;
  const offset = circumference - (Math.max(0, Math.min(100, value)) / 100) * circumference;

  const stroke =
    value >= 85
      ? "var(--color-success, #059669)"
      : value >= 60
      ? "var(--color-primary, #0a5c51)"
      : value >= 40
      ? "#f59e0b"
      : "var(--color-destructive, #ef4444)";

  return (
    <div
      className="relative inline-flex shrink-0 items-center justify-center"
      style={{ width: size, height: size }}
    >
      <svg
        width={size}
        height={size}
        className="-rotate-90"
        aria-hidden="true"
      >
        {/* Track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke="var(--border)"
          strokeWidth="4"
          fill="none"
        />
        {/* Progress */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={stroke}
          strokeWidth="4"
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: "stroke-dashoffset 0.6s ease" }}
        />
      </svg>

      {/* Center label */}
      <div className="absolute inset-0 flex flex-col items-center justify-center leading-none">
        <span className="tabular-nums font-semibold" style={{ fontSize: size * 0.19 }}>
          {value}
          <span className="text-muted-foreground" style={{ fontSize: size * 0.12 }}>%</span>
        </span>
        {label && (
          <span
            className="uppercase tracking-wider text-muted-foreground mt-0.5"
            style={{ fontSize: size * 0.1 }}
          >
            {label}
          </span>
        )}
      </div>
    </div>
  );
}
