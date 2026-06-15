"use client";

/**
 * Интерактивный SVG-график «Динамика грейдов (накопительно)».
 * X — равномерный шаг по индексу бакета (бакеты равномерны по времени).
 * Y — 0..100 %.
 * Линии: senior (#8b5cf6), middle (#f59e0b), junior (#10b981).
 * Hover: вертикальная пунктирная направляющая + маркеры + тултип.
 */

import { useRef, useState, useCallback } from "react";
import type { GradeCumulativePoint } from "@/lib/grade";

interface Props {
  points: GradeCumulativePoint[];
}

const W = 820;
const H = 220;
const PAD = { l: 40, r: 16, t: 16, b: 30 };
const chartW = W - PAD.l - PAD.r;
const chartH = H - PAD.t - PAD.b;

function xOf(i: number, n: number): number {
  return PAD.l + (n > 1 ? i / (n - 1) : 0) * chartW;
}

function yOf(val: number): number {
  return PAD.t + chartH - (val / 100) * chartH;
}

function makePath(vals: (number | null)[], n: number): string | null {
  const segs: string[] = [];
  for (let i = 0; i < vals.length; i++) {
    const v = vals[i];
    if (v === null) continue;
    segs.push(
      `${segs.length === 0 ? "M" : "L"}${xOf(i, n).toFixed(1)},${yOf(v).toFixed(1)}`
    );
  }
  return segs.length >= 2 ? segs.join(" ") : null;
}

function makeArea(vals: (number | null)[], n: number): string | null {
  const pts: string[] = [];
  let firstI: number | null = null;
  let lastI: number | null = null;
  for (let i = 0; i < vals.length; i++) {
    const v = vals[i];
    if (v === null) continue;
    if (firstI === null) firstI = i;
    lastI = i;
    pts.push(`${xOf(i, n).toFixed(1)},${yOf(v).toFixed(1)}`);
  }
  if (pts.length < 2 || firstI === null || lastI === null) return null;
  const baseline = H - PAD.b;
  return `M ${xOf(firstI, n).toFixed(1)},${baseline} L ${pts.join(" L ")} L ${xOf(lastI, n).toFixed(1)},${baseline} Z`;
}

function fmt(v: number | null): string {
  return v === null ? "—" : `${v.toFixed(0)}%`;
}

function fmtBucketLabel(iso: string): string {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  return d.toLocaleString("ru-RU", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function pluralTasks(n: number): string {
  if (n % 10 === 1 && n % 100 !== 11) return "задача";
  if (n % 10 >= 2 && n % 10 <= 4 && (n % 100 < 10 || n % 100 >= 20)) return "задачи";
  return "задач";
}

export default function CumulativeGradeChart({ points }: Props) {
  const n = points.length;

  if (n < 2) {
    return (
      <p className="text-sm text-neutral-400">
        копится — нужно ≥2 бакетов с закрытыми задачами
      </p>
    );
  }

  const seniorVals = points.map((p) => p.seniorPct);
  const middleVals = points.map((p) => p.middlePct);
  const juniorVals = points.map((p) => p.juniorPct);

  const seniorPath = makePath(seniorVals, n);
  const middlePath = makePath(middleVals, n);
  const juniorPath = makePath(juniorVals, n);

  const seniorArea = makeArea(seniorVals, n);
  const middleArea = makeArea(middleVals, n);
  const juniorArea = makeArea(juniorVals, n);

  // --- hover state ---
  const svgRef = useRef<SVGSVGElement>(null);
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);
  const [tooltipPos, setTooltipPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<SVGSVGElement>) => {
      const svg = svgRef.current;
      if (!svg) return;
      const bbox = svg.getBoundingClientRect();
      const scale = W / bbox.width;
      const svgX = (e.clientX - bbox.left) * scale;
      let best = 0;
      let bestDist = Math.abs(xOf(0, n) - svgX);
      for (let i = 1; i < n; i++) {
        const d = Math.abs(xOf(i, n) - svgX);
        if (d < bestDist) {
          bestDist = d;
          best = i;
        }
      }
      setHoverIdx(best);
      const rawX = xOf(best, n) / scale;
      const tipW = 210;
      const tipH = 110;
      const clampedX = Math.min(Math.max(rawX + 12, 4), bbox.width - tipW - 4);
      const clampedY = Math.max(
        Math.min(e.clientY - bbox.top - tipH / 2, bbox.height - tipH - 4),
        4
      );
      setTooltipPos({ x: clampedX, y: clampedY });
    },
    [n]
  );

  const handleMouseLeave = useCallback(() => {
    setHoverIdx(null);
  }, []);

  const hp = hoverIdx !== null ? points[hoverIdx] : null;
  const hSenior = hoverIdx !== null ? seniorVals[hoverIdx] : null;
  const hMiddle = hoverIdx !== null ? middleVals[hoverIdx] : null;
  const hJunior = hoverIdx !== null ? juniorVals[hoverIdx] : null;

  // кол-во бакетов с хоть одной задачей (для легенды)
  const activeBuckets = points.filter((p) => p.bucketCount > 0).length;

  return (
    <div>
      <div className="relative w-full" style={{ userSelect: "none" }}>
        <svg
          ref={svgRef}
          viewBox={`0 0 ${W} ${H}`}
          className="w-full"
          style={{ maxHeight: 220 }}
          preserveAspectRatio="xMidYMid meet"
          aria-label="Накопительная доля грейдов: senior/middle/junior % io-токенов"
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
        >
          {/* Y-axis grid + labels */}
          {[0, 50, 100].map((pct) => (
            <g key={pct}>
              <line
                x1={PAD.l}
                y1={yOf(pct)}
                x2={W - PAD.r}
                y2={yOf(pct)}
                stroke="#e5e5e5"
                strokeWidth={1}
              />
              <text
                x={4}
                y={yOf(pct) + 4}
                fontSize={11}
                fill="#a3a3a3"
              >
                {pct}%
              </text>
            </g>
          ))}

          {/* Area fills — порядок: senior (largest), middle, junior */}
          {seniorArea && (
            <path d={seniorArea} fill="#8b5cf6" opacity={0.08} />
          )}
          {middleArea && (
            <path d={middleArea} fill="#f59e0b" opacity={0.08} />
          )}
          {juniorArea && (
            <path d={juniorArea} fill="#10b981" opacity={0.08} />
          )}

          {/* Lines */}
          {seniorPath && (
            <path
              d={seniorPath}
              fill="none"
              stroke="#8b5cf6"
              strokeWidth={2}
              strokeLinejoin="round"
              strokeLinecap="round"
            />
          )}
          {middlePath && (
            <path
              d={middlePath}
              fill="none"
              stroke="#f59e0b"
              strokeWidth={2}
              strokeLinejoin="round"
              strokeLinecap="round"
            />
          )}
          {juniorPath && (
            <path
              d={juniorPath}
              fill="none"
              stroke="#10b981"
              strokeWidth={2}
              strokeLinejoin="round"
              strokeLinecap="round"
            />
          )}

          {/* Кружки senior */}
          {seniorVals.map((v, i) =>
            v !== null ? (
              <circle
                key={`s${i}`}
                cx={xOf(i, n)}
                cy={yOf(v)}
                r={3}
                fill="#8b5cf6"
              />
            ) : null
          )}
          {/* Кружки middle */}
          {middleVals.map((v, i) =>
            v !== null ? (
              <circle
                key={`m${i}`}
                cx={xOf(i, n)}
                cy={yOf(v)}
                r={3}
                fill="#f59e0b"
              />
            ) : null
          )}
          {/* Кружки junior */}
          {juniorVals.map((v, i) =>
            v !== null ? (
              <circle
                key={`j${i}`}
                cx={xOf(i, n)}
                cy={yOf(v)}
                r={3}
                fill="#10b981"
              />
            ) : null
          )}

          {/* X-axis labels: только первая и последняя */}
          <text
            x={xOf(0, n)}
            y={H - 8}
            fontSize={11}
            fill="#a3a3a3"
          >
            {fmtBucketLabel(points[0].iso)}
          </text>
          <text
            x={xOf(n - 1, n)}
            y={H - 8}
            fontSize={11}
            fill="#a3a3a3"
            textAnchor="end"
          >
            {fmtBucketLabel(points[n - 1].iso)}
          </text>

          {/* Hover elements */}
          {hoverIdx !== null && (
            <>
              <line
                x1={xOf(hoverIdx, n)}
                y1={PAD.t}
                x2={xOf(hoverIdx, n)}
                y2={H - PAD.b}
                stroke="#6b7280"
                strokeWidth="1"
                strokeDasharray="4 3"
                strokeLinecap="round"
              />
              {hSenior !== null && (
                <circle
                  cx={xOf(hoverIdx, n)}
                  cy={yOf(hSenior)}
                  r="5"
                  fill="#8b5cf6"
                  stroke="white"
                  strokeWidth="2"
                />
              )}
              {hMiddle !== null && (
                <circle
                  cx={xOf(hoverIdx, n)}
                  cy={yOf(hMiddle)}
                  r="4.5"
                  fill="#f59e0b"
                  stroke="white"
                  strokeWidth="2"
                />
              )}
              {hJunior !== null && (
                <circle
                  cx={xOf(hoverIdx, n)}
                  cy={yOf(hJunior)}
                  r="4.5"
                  fill="#10b981"
                  stroke="white"
                  strokeWidth="2"
                />
              )}
            </>
          )}
        </svg>

        {/* Tooltip overlay */}
        {hoverIdx !== null && hp && (
          <div
            className="pointer-events-none absolute z-10 rounded-lg border border-neutral-200 bg-white px-3 py-2 shadow-lg"
            style={{ left: tooltipPos.x, top: tooltipPos.y, minWidth: "200px" }}
          >
            <p className="mb-1 text-xs font-semibold text-neutral-600">
              {fmtBucketLabel(hp.iso)}
            </p>
            <div className="flex flex-col gap-0.5 text-xs">
              <span className="flex items-center gap-1.5">
                <span className="inline-block h-2 w-2 rounded-full" style={{ backgroundColor: "#8b5cf6" }} />
                <span className="text-neutral-500">senior</span>
                <span className="ml-auto font-mono font-semibold text-neutral-700">{fmt(hSenior)}</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="inline-block h-2 w-2 rounded-full" style={{ backgroundColor: "#f59e0b" }} />
                <span className="text-neutral-500">middle</span>
                <span className="ml-auto font-mono font-semibold text-neutral-700">{fmt(hMiddle)}</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="inline-block h-2 w-2 rounded-full" style={{ backgroundColor: "#10b981" }} />
                <span className="text-neutral-500">junior</span>
                <span className="ml-auto font-mono font-semibold text-neutral-700">{fmt(hJunior)}</span>
              </span>
              {hp.bucketCount > 0 && (
                <span className="mt-0.5 text-neutral-400">
                  +{hp.bucketCount} {pluralTasks(hp.bucketCount)} в окне
                </span>
              )}
              <span className="text-neutral-400">накоплено {hp.cumIo.toLocaleString("ru-RU")} io</span>
            </div>
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="mt-2 flex gap-4 text-xs text-neutral-500">
        <span className="flex items-center gap-1">
          <span className="inline-block h-0.5 w-4 rounded" style={{ backgroundColor: "#8b5cf6" }} />
          senior
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block h-0.5 w-4 rounded" style={{ backgroundColor: "#f59e0b" }} />
          middle
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block h-0.5 w-4 rounded" style={{ backgroundColor: "#10b981" }} />
          junior
        </span>
        <span className="ml-auto text-neutral-400">
          {n} {n === 1 ? "бакет" : n < 5 ? "бакета" : "бакетов"} по 3 ч · накопительная доля грейдов
          {activeBuckets < n && ` (${n - activeBuckets} пустых)`}
        </span>
      </div>
    </div>
  );
}
