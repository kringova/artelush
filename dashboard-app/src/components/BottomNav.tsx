"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

/**
 * Мобильная нижняя навигация (как в financeush): фиксированный бар внизу,
 * по центру — приподнятая FAB-кнопка инбокса с каунтером ждущих апрува.
 * Только на мобиле (`lg:hidden`); на десктопе навигация — верхняя шапка (Nav).
 */

const SIDE = [
  {
    href: "/",
    exact: true,
    label: "Проекты",
    icon: (
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l9-9 9 9M5 10v9a1 1 0 001 1h4v-5h4v5h4a1 1 0 001-1v-9" />
    ),
  },
  {
    href: "/kanban",
    label: "Канбан",
    icon: (
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 5h4v14H4zM10 5h4v9h-4zM16 5h4v6h-4z" />
    ),
  },
  // center: инбокс (FAB)
  {
    href: "/rice",
    label: "RICE",
    icon: (
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h10M4 18h6" />
    ),
  },
  {
    href: "/analytics",
    label: "Аналитика",
    icon: (
      <path strokeLinecap="round" strokeLinejoin="round" d="M7 16V8m5 8V4m5 12v-4m-12 8h14a2 2 0 002-2V4a2 2 0 00-2-2H5a2 2 0 00-2 2v16a2 2 0 002 2z" />
    ),
  },
];

export function BottomNav({ reviewCount = 0 }: { reviewCount?: number }) {
  const pathname = usePathname();
  const isActive = (href: string, exact?: boolean) =>
    exact ? pathname === href : pathname.startsWith(href);
  const inboxActive = pathname.startsWith("/inbox");

  const Item = ({
    href,
    label,
    exact,
    icon,
  }: {
    href: string;
    label: string;
    exact?: boolean;
    icon: React.ReactNode;
  }) => (
    <Link
      href={href}
      className={`flex min-h-11 flex-1 flex-col items-center justify-center gap-0.5 py-1.5 transition-colors ${
        isActive(href, exact)
          ? "text-[color:var(--color-accent)]"
          : "text-neutral-400 hover:text-neutral-700"
      }`}
    >
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        {icon}
      </svg>
      <span className="text-[11px] font-medium">{label}</span>
    </Link>
  );

  return (
    <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-neutral-200 bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur lg:hidden">
      <div className="flex items-end justify-around px-1 py-1">
        <Item {...SIDE[0]} />
        <Item {...SIDE[1]} />

        {/* Центр: инбокс — приподнятая FAB с каунтером */}
        <Link
          href="/inbox"
          aria-label={`Инбокс${reviewCount > 0 ? `, ${reviewCount} ждут апрува` : ""}`}
          className={`relative -mt-6 flex h-14 w-14 shrink-0 items-center justify-center rounded-full text-white shadow-lg ring-4 ring-white transition-transform active:scale-95 ${
            inboxActive
              ? "bg-[color:var(--color-accent)]"
              : "bg-[color:var(--color-accent)]"
          }`}
        >
          <svg width="24" height="24" viewBox="0 0 20 20" fill="none" aria-hidden="true">
            <rect x="2" y="4" width="16" height="12" rx="2" stroke="currentColor" strokeWidth="1.6" />
            <path d="M2 7l8 5 8-5" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
          </svg>
          {reviewCount > 0 && (
            <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-violet-500 px-1 text-[10px] font-bold leading-none text-white ring-2 ring-white">
              {reviewCount}
            </span>
          )}
        </Link>

        <Item {...SIDE[2]} />
        <Item {...SIDE[3]} />
      </div>
    </nav>
  );
}
