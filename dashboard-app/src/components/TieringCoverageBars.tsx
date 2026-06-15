"use client";

/**
 * Вертикальные столбцы покрытия тиринга по дням.
 * Каждый столбец — день; высота ∝ total дня / maxTotal.
 * Стэк снизу вверх: covered (emerald) + остаток (neutral-200).
 */

import { useState } from "react";

export interface TieringCoverageBarDay {
  date: string;
  covered: number;
  total: number;
}

interface Props {
  days: TieringCoverageBarDay[];
}

const BAR_AREA_H = 140; // px высота области столбцов

export default function TieringCoverageBars({ days }: Props) {
  const [hoveredDate, setHoveredDate] = useState<string | null>(null);

  if (days.length === 0) return null;

  const maxTotal = Math.max(...days.map((d) => d.total), 1);

  return (
    <div className="overflow-x-auto">
      <div className="flex items-end gap-1.5 pb-1" style={{ minWidth: `${days.length * 36}px` }}>
        {days.map((d) => {
          const barH = Math.round((d.total / maxTotal) * BAR_AREA_H);
          const coveredH = d.total > 0 ? Math.round((d.covered / d.total) * barH) : 0;
          const restH = barH - coveredH;
          const isHovered = hoveredDate === d.date;

          // компактная подпись даты
          const [, mm, dd] = d.date.split("-");
          const label = `${dd}.${mm}`;

          return (
            <div
              key={d.date}
              className="relative flex flex-col items-center"
              style={{ width: "32px" }}
              onMouseEnter={() => setHoveredDate(d.date)}
              onMouseLeave={() => setHoveredDate(null)}
            >
              {/* Тултип */}
              {isHovered && (
                <div
                  className="pointer-events-none absolute z-10 -top-16 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-lg border border-neutral-200 bg-white px-2.5 py-1.5 shadow-lg text-xs"
                >
                  <p className="font-semibold text-neutral-700">{d.date}</p>
                  <p className="text-neutral-500">
                    {d.covered}/{d.total} с токенами
                    <span className="ml-1 font-semibold text-emerald-600">
                      ({d.total > 0 ? Math.round((d.covered / d.total) * 100) : 0}%)
                    </span>
                  </p>
                </div>
              )}

              {/* Столбец */}
              <div
                className="w-full flex flex-col-reverse rounded-t overflow-hidden"
                style={{ height: `${BAR_AREA_H}px` }}
              >
                {/* Нижний (covered) — emerald */}
                {coveredH > 0 && (
                  <div
                    className="w-full shrink-0 bg-emerald-400"
                    style={{ height: `${coveredH}px` }}
                  />
                )}
                {/* Верхний (остаток) — neutral-200 */}
                {restH > 0 && (
                  <div
                    className="w-full shrink-0 bg-neutral-200"
                    style={{ height: `${restH}px` }}
                  />
                )}
              </div>

              {/* Подпись даты под столбцом */}
              <span className="mt-1 text-[9px] font-mono text-neutral-400 leading-tight">
                {label}
              </span>
            </div>
          );
        })}
      </div>

      {/* Легенда */}
      <div className="mt-2 flex gap-4 text-xs text-neutral-400">
        <span className="flex items-center gap-1">
          <span className="inline-block h-3 w-3 rounded-sm bg-emerald-400" />
          с токенами
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block h-3 w-3 rounded-sm bg-neutral-200" />
          без токенов
        </span>
      </div>
    </div>
  );
}
