"use client";

type SeriesPoint = {
  key: string;
  label: string;
  color: string;
  values: number[];
};

type Slice = {
  key: string;
  label: string;
  value: number;
  color: string;
};

function niceMax(values: number[]): number {
  const peak = Math.max(0, ...values);
  if (peak <= 0) return 1;
  const padded = peak * 1.08;
  const mag = 10 ** Math.floor(Math.log10(padded));
  return Math.ceil(padded / mag) * mag;
}

function buildPath(
  values: number[],
  max: number,
  width: number,
  height: number,
  padX: number,
  padY: number,
  closeArea: boolean,
): string {
  const n = values.length;
  if (n === 0) return "";
  const innerW = width - padX * 2;
  const innerH = height - padY * 2;
  const step = n === 1 ? 0 : innerW / (n - 1);
  const coords = values.map((v, i) => {
    const x = padX + i * step;
    const y = padY + innerH - (Math.max(0, v) / max) * innerH;
    return { x, y };
  });
  let d = `M ${coords[0].x} ${coords[0].y}`;
  for (let i = 1; i < coords.length; i += 1) {
    d += ` L ${coords[i].x} ${coords[i].y}`;
  }
  if (closeArea && coords.length) {
    const last = coords[coords.length - 1];
    const first = coords[0];
    d += ` L ${last.x} ${padY + innerH} L ${first.x} ${padY + innerH} Z`;
  }
  return d;
}

export function TimeSeriesSvg({
  type,
  labels,
  series,
  height = 200,
}: {
  type: "bars" | "lines" | "area";
  labels: string[];
  series: SeriesPoint[];
  height?: number;
}) {
  const width = 720;
  const padX = 28;
  const padY = 24;
  const allValues = series.flatMap((s) => s.values);
  const max = niceMax(allValues);
  const n = labels.length;
  const active = series.filter((s) => s.values.some((v) => v > 0) || true);

  if (!n || !active.length) {
    return (
      <div className="flex h-40 items-center justify-center text-sm text-ops-ink/50">
        Aucune série sélectionnée
      </div>
    );
  }

  if (type === "bars") {
    const groupW = (width - padX * 2) / Math.max(1, n);
    const barGap = 4;
    const seriesCount = Math.max(1, active.length);
    const barW = Math.max(4, (groupW - barGap * 2) / seriesCount - 2);

    return (
      <div className="w-full overflow-x-auto">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="h-44 w-full min-w-[480px]"
          role="img"
          aria-label="Graphique en barres sur 7 jours"
        >
          {[0.25, 0.5, 0.75, 1].map((t) => {
            const y = padY + (height - padY * 2) * (1 - t);
            return (
              <g key={t}>
                <line
                  x1={padX}
                  x2={width - padX}
                  y1={y}
                  y2={y}
                  stroke="currentColor"
                  strokeOpacity={0.08}
                />
                <text
                  x={8}
                  y={y + 4}
                  className="fill-ops-ink/45 text-[10px]"
                >
                  {Math.round(max * t)}
                </text>
              </g>
            );
          })}
          {labels.map((label, i) => {
            const gx = padX + i * groupW + barGap;
            return (
              <g key={`${label}-${i}`}>
                {active.map((s, si) => {
                  const v = s.values[i] ?? 0;
                  const h =
                    ((Math.max(0, v) / max) * (height - padY * 2)) || 0;
                  const x = gx + si * (barW + 2);
                  const y = height - padY - h;
                  return (
                    <rect
                      key={s.key}
                      x={x}
                      y={y}
                      width={barW}
                      height={Math.max(v > 0 ? 3 : 0, h)}
                      rx={3}
                      fill={s.color}
                    >
                      <title>
                        {s.label} · {label} · {v}
                      </title>
                    </rect>
                  );
                })}
                <text
                  x={gx + (groupW - barGap * 2) / 2}
                  y={height - 6}
                  textAnchor="middle"
                  className="fill-ops-ink/45 text-[11px]"
                >
                  {label}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
    );
  }

  return (
    <div className="w-full overflow-x-auto">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="h-44 w-full min-w-[480px]"
        role="img"
        aria-label={
          type === "area"
            ? "Graphique en aires sur 7 jours"
            : "Graphique en courbes sur 7 jours"
        }
      >
        {[0.25, 0.5, 0.75, 1].map((t) => {
          const y = padY + (height - padY * 2) * (1 - t);
          return (
            <g key={t}>
              <line
                x1={padX}
                x2={width - padX}
                y1={y}
                y2={y}
                stroke="currentColor"
                strokeOpacity={0.08}
              />
              <text x={8} y={y + 4} className="fill-ops-ink/45 text-[10px]">
                {Math.round(max * t)}
              </text>
            </g>
          );
        })}
        {active.map((s) => {
          const linePath = buildPath(
            s.values,
            max,
            width,
            height,
            padX,
            padY,
            false,
          );
          const areaPath = buildPath(
            s.values,
            max,
            width,
            height,
            padX,
            padY,
            true,
          );
          return (
            <g key={s.key}>
              {type === "area" ? (
                <path d={areaPath} fill={s.color} fillOpacity={0.18} />
              ) : null}
              <path
                d={linePath}
                fill="none"
                stroke={s.color}
                strokeWidth={2.5}
                strokeLinejoin="round"
                strokeLinecap="round"
              />
              {s.values.map((v, i) => {
                const innerW = width - padX * 2;
                const innerH = height - padY * 2;
                const step = n === 1 ? 0 : innerW / (n - 1);
                const x = padX + i * step;
                const y = padY + innerH - (Math.max(0, v) / max) * innerH;
                return (
                  <circle
                    key={`${s.key}-${i}`}
                    cx={x}
                    cy={y}
                    r={3.5}
                    fill={s.color}
                  >
                    <title>
                      {s.label} · {labels[i]} · {v}
                    </title>
                  </circle>
                );
              })}
            </g>
          );
        })}
        {labels.map((label, i) => {
          const innerW = width - padX * 2;
          const step = n === 1 ? 0 : innerW / (n - 1);
          const x = padX + i * step;
          return (
            <text
              key={label}
              x={x}
              y={height - 6}
              textAnchor="middle"
              className="fill-ops-ink/45 text-[11px]"
            >
              {label}
            </text>
          );
        })}
      </svg>
    </div>
  );
}

function polar(cx: number, cy: number, r: number, angle: number) {
  const rad = ((angle - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

function arcPath(
  cx: number,
  cy: number,
  rOuter: number,
  rInner: number,
  start: number,
  end: number,
): string {
  const large = end - start > 180 ? 1 : 0;
  const o1 = polar(cx, cy, rOuter, start);
  const o2 = polar(cx, cy, rOuter, end);
  const i1 = polar(cx, cy, rInner, end);
  const i2 = polar(cx, cy, rInner, start);
  return [
    `M ${o1.x} ${o1.y}`,
    `A ${rOuter} ${rOuter} 0 ${large} 1 ${o2.x} ${o2.y}`,
    `L ${i1.x} ${i1.y}`,
    `A ${rInner} ${rInner} 0 ${large} 0 ${i2.x} ${i2.y}`,
    "Z",
  ].join(" ");
}

export function DonutSvg({
  slices,
  centerLabel,
  centerValue,
  size = 220,
}: {
  slices: Slice[];
  centerLabel?: string;
  centerValue?: string;
  size?: number;
}) {
  const total = slices.reduce((s, x) => s + Math.max(0, x.value), 0);
  const cx = size / 2;
  const cy = size / 2;
  const rOuter = size * 0.42;
  const rInner = size * 0.26;

  if (total <= 0) {
    return (
      <div className="flex h-52 items-center justify-center text-sm text-ops-ink/50">
        Pas de données
      </div>
    );
  }

  let angle = 0;
  const paths = slices
    .filter((s) => s.value > 0)
    .map((s) => {
      const sweep = (s.value / total) * 360;
      const start = angle;
      const end = angle + Math.max(sweep, 0.4);
      angle += sweep;
      return { ...s, start, end };
    });

  return (
    <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-center">
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="shrink-0"
        role="img"
        aria-label={centerLabel ?? "Répartition"}
      >
        {paths.map((p) => (
          <path
            key={p.key}
            d={arcPath(cx, cy, rOuter, rInner, p.start, p.end)}
            fill={p.color}
          >
            <title>
              {p.label}: {p.value}
            </title>
          </path>
        ))}
        {centerValue ? (
          <text
            x={cx}
            y={cy - 4}
            textAnchor="middle"
            className="fill-ops-ink text-lg font-extrabold"
          >
            {centerValue}
          </text>
        ) : null}
        {centerLabel ? (
          <text
            x={cx}
            y={cy + 16}
            textAnchor="middle"
            className="fill-ops-ink/45 text-[11px]"
          >
            {centerLabel}
          </text>
        ) : null}
      </svg>
      <ul className="w-full space-y-2 text-sm">
        {slices.map((s) => {
          const pct = total ? Math.round((s.value / total) * 100) : 0;
          return (
            <li
              key={s.key}
              className="flex items-center justify-between gap-3"
            >
              <span className="inline-flex items-center gap-2 font-medium text-ops-ink">
                <span
                  className="h-2.5 w-2.5 shrink-0 rounded-sm"
                  style={{ backgroundColor: s.color }}
                />
                {s.label}
              </span>
              <span className="tabular-nums text-ops-ink/50">
                {s.value} · {pct}%
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export function RateMeter({
  label,
  value,
  hint,
  color = "#E11D48",
}: {
  label: string;
  value: number;
  hint: string;
  color?: string;
}) {
  const clamped = Math.max(0, Math.min(100, value));
  const size = 160;
  const cx = size / 2;
  const cy = size / 2 + 10;
  const r = 58;
  const start = -120;
  const end = 120;
  const span = end - start;
  const valueAngle = start + (clamped / 100) * span;
  const showValue = clamped > 0.5;

  return (
    <article className="rounded-xl border border-ops-card bg-ops-surface px-3 py-2.5">
      <p className="text-[11px] font-semibold text-ops-ink/50">{label}</p>
      <div className="mt-1 flex justify-center">
        <svg width={size} height={96} viewBox={`0 0 ${size} 110`} aria-hidden>
          <path
            d={arcPath(cx, cy, r, r - 12, start, end)}
            fill="var(--ops-surface-2)"
          />
          {showValue ? (
            <path
              d={arcPath(cx, cy, r, r - 12, start, valueAngle)}
              fill={color}
            />
          ) : null}
          <text
            x={cx}
            y={cy - 8}
            textAnchor="middle"
            className="fill-ops-ink text-2xl font-extrabold"
          >
            {clamped}%
          </text>
        </svg>
      </div>
      <p className="text-center text-[11px] text-ops-ink/50">{hint}</p>
    </article>
  );
}

export const SERIES_COLORS: Record<string, string> = {
  creations: "#E11D48",
  delivered: "#00875A",
  external: "var(--ops-accent)",
  internal: "#0065FF",
  returns: "#FB7185",
  awaiting: "#FFAB00",
  inProgress: "#0065FF",
  exchanges: "#6554C0",
  disponible: "#E11D48",
  enDemande: "#FFAB00",
  aVerser: "#0065FF",
  verse: "#64748B",
  encaisse: "#00875A",
  retoursMontant: "#E11D48",
};
