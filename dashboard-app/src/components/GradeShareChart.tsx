"use client";

/**
 * Интерактивный SVG-график «Доля грейдов по дням закрытия».
 * Клиентский компонент (hover, tooltip).
 *
 * X — равномерный шаг по индексу ДНЯ (реальные даты из git, стабильные).
 * Y — 0..100 %.
 * Линии: senior (фиолетовый), middle (янтарный), junior (зелёный).
 * Кружок на каждом дне. Ховер: вертикальная пунктирная направляющая + маркеры + плашка-тултип.
 */

import { useRef, useState, useCallback } from "react";
import type { GradeShareDayPoint } from "@/lib/grade";

interface Props {
  points: GradeShareDayPoint[];
}

const W = 820;
const H = 300;
const PAD = { top: 16, bottom: 32, left: 36, right: 16 };
const chartW = W - PAD.left - PAD.right;
const chartH = H - PAD.top - PAD.bottom;

function xOf(i: number, n: number): number {
  return PAD.left + (n > 1 ? i / (n - 1) : 0) * chartW;
}

function yOf(val: number): number {
  return PAD.top + chartH - (val / 100) * chartH;
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

function fmt(v: number | null): string {
  return v === null ? "—" : `${v.toFixed(0)}%`;
}

function fmtDate(iso: string): string {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("ru-RU", { day: "2-digit", month: "short", year: "2-digit" });
}

export default function GradeShareChart({ points }: Props) {
  const n = points.length;

  if (n < 2) {
    return (
      <p className="text-sm text-neutral-400">
        копится — нужно ≥2 дней с закрытыми задачами
      </p>
    );
  }

  const seniorVals = points.map((p) => p.seniorPct);
  const middleVals = points.map((p) => p.middlePct);
  const juniorVals = points.map((p) => p.juniorPct);

  const seniorPath = makePath(seniorVals, n);
  const middlePath = makePath(middleVals, n);
  const juniorPath = makePath(juniorVals, n);

  // X-axis date label positions: first, last, and some in-between (up to 3 extra)
  const labelIndices: number[] = [0];
  if (n > 2) {
    const extras = Math.min(3, n - 2);
    for (let k = 1; k <= extras; k++) {
      labelIndices.push(Math.round((k * (n - 1)) / (extras + 1)));
    }
  }
  labelIndices.push(n - 1);

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
      const tipW = 180;
      const tipH = 88;
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

  return (
    <div>
      <div className="relative w-full" style={{ userSelect: "none" }}>
        <svg
          ref={svgRef}
          viewBox={`0 0 ${W} ${H}`}
          className="w-full"
          style={{ height: "300px", display: "block" }}
          aria-label="Доля грейдов по дням закрытия: senior/middle/junior % токенов"
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
        >
          {/* Y-axis grid + labels: 0%, 50%, 100% */}
          {[0, 50, 100].map((pct) => (
            <g key={pct}>
              <line
                x1={PAD.left}
                y1={yOf(pct)}
                x2={W - PAD.right}
                y2={yOf(pct)}
                stroke="#e5e7eb"
                strokeWidth="1"
                strokeDasharray="4 3"
              />
              <text
                x={PAD.left - 4}
                y={yOf(pct) + 4}
                fontSize="10"
                fill="#9ca3af"
                textAnchor="end"
                fontFamily="inherit"
              >
                {pct}%
              </text>
            </g>
          ))}

          {/* Lines по дневным точкам */}
          {seniorPath && (
            <path
              d={seniorPath}
              fill="none"
              stroke="#8b5cf6"
              strokeWidth="2.5"
              strokeLinejoin="round"
              strokeLinecap="round"
            />
          )}
          {middlePath && (
            <path
              d={middlePath}
              fill="none"
              stroke="#f59e0b"
              strokeWidth="2"
              strokeLinejoin="round"
              strokeLinecap="round"
            />
          )}
          {juniorPath && (
            <path
              d={juniorPath}
              fill="none"
              stroke="#10b981"
              strokeWidth="2"
              strokeLinejoin="round"
              strokeLinecap="round"
            />
          )}

          {/* Кружки на каждый день — senior */}
          {seniorVals.map((v, i) =>
            v !== null ? (
              <circle
                key={`s${i}`}
                cx={xOf(i, n)}
                cy={yOf(v)}
                r="3"
                fill="#8b5cf6"
                stroke="white"
                strokeWidth="1.5"
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
                r="2.5"
                fill="#f59e0b"
                stroke="white"
                strokeWidth="1.5"
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
                r="2.5"
                fill="#10b981"
                stroke="white"
                strokeWidth="1.5"
              />
            ) : null
          )}

          {/* X-axis date labels */}
          {labelIndices.map((i) => {
            const lx = xOf(i, n);
            const anchor = i === 0 ? "start" : i === n - 1 ? "end" : "middle";
            return (
              <text
                key={i}
                x={lx}
                y={H - 6}
                fontSize="9"
                fill="#9ca3af"
                textAnchor={anchor}
                fontFamily="inherit"
              >
                {fmtDate(points[i].date)}
              </text>
            );
          })}

          {/* === Hover elements === */}
          {hoverIdx !== null && (
            <>
              {/* Vertical dashed guide */}
              <line
                x1={xOf(hoverIdx, n)}
                y1={PAD.top}
                x2={xOf(hoverIdx, n)}
                y2={H - PAD.bottom}
                stroke="#6b7280"
                strokeWidth="1"
                strokeDasharray="4 3"
                strokeLinecap="round"
              />

              {/* Hover markers */}
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
            style={{ left: tooltipPos.x, top: tooltipPos.y, minWidth: "172px" }}
          >
            <p className="mb-1 text-xs font-semibold text-neutral-600">
              {fmtDate(hp.date)}
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
              <span className="mt-0.5 text-neutral-400">{hp.count} {hp.count === 1 ? "задача" : hp.count < 5 ? "задачи" : "задач"}</span>
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
          {n} {n === 1 ? "день" : n < 5 ? "дня" : "дней"} · по дате закрытия (из git), агрегировано по дням
        </span>
      </div>
    </div>
  );
}
