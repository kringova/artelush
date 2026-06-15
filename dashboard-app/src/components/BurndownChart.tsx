import type { BurndownPoint } from "@/lib/vault";

/**
 * SVG-график сгорания: остаток открытых задач во времени.
 * Чистый презентационный компонент (без клиентских хуков) — переиспользуется
 * на странице /burndown и виджетом на /analytics.
 *
 * X — равномерный шаг по индексу точки (не абсолютное время),
 * чтобы линия заполняла ширину ровно при любом распределении дат.
 */

const W = 820;
const H = 220;
const PAD = { l: 40, r: 16, t: 16, b: 30 };

function fmtDay(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("ru-RU", { day: "2-digit", month: "short" });
}

export default function BurndownChart({ points }: { points: BurndownPoint[] }) {
  const n = points.length;
  const maxV = Math.max(...points.map((p) => p.remaining), 1);

  const chartW = W - PAD.l - PAD.r;
  const chartH = H - PAD.t - PAD.b;

  // X — равномерный по индексу
  const x = (i: number) =>
    n === 1 ? W - PAD.r : PAD.l + (i / (n - 1)) * chartW;

  const y = (v: number) => PAD.t + (1 - v / maxV) * chartH;

  const coordPairs = points.map((p, i) => `${x(i)},${y(p.remaining)}`);
  const line = coordPairs.join(" ");

  const baseline = H - PAD.b;
  const area =
    n > 1
      ? `M ${x(0)},${baseline} L ${coordPairs.join(" L ")} L ${x(n - 1)},${baseline} Z`
      : "";

  const yTicks = [0, Math.round(maxV / 2), maxV];

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className="w-full"
      style={{ maxHeight: 220 }}
      preserveAspectRatio="xMidYMid meet"
    >
      {yTicks.map((v) => (
        <g key={v}>
          <line
            x1={PAD.l}
            x2={W - PAD.r}
            y1={y(v)}
            y2={y(v)}
            stroke="#e5e5e5"
            strokeWidth={1}
          />
          <text x={4} y={y(v) + 4} fontSize={11} fill="#a3a3a3">
            {v}
          </text>
        </g>
      ))}

      {area && <path d={area} fill="var(--color-accent)" opacity={0.08} />}
      {n > 1 && (
        <polyline
          points={line}
          fill="none"
          stroke="var(--color-accent)"
          strokeWidth={2}
          strokeLinejoin="round"
        />
      )}
      {points.map((p, i) => (
        <circle
          key={i}
          cx={x(i)}
          cy={y(p.remaining)}
          r={3}
          fill="var(--color-accent)"
        />
      ))}

      <text x={PAD.l} y={H - 8} fontSize={11} fill="#a3a3a3">
        {fmtDay(points[0].date)}
      </text>
      {n > 1 && (
        <text
          x={W - PAD.r}
          y={H - 8}
          fontSize={11}
          fill="#a3a3a3"
          textAnchor="end"
        >
          {fmtDay(points[n - 1].date)}
        </text>
      )}
    </svg>
  );
}
