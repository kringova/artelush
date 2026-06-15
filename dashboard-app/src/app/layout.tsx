import type { Metadata } from "next";
import "./globals.css";
import Nav from "@/components/Nav";
import { BottomNav } from "@/components/BottomNav";
import { getAllTasks } from "@/lib/vault";

export const metadata: Metadata = {
  title: "Artel Dashboard",
  description: "Проекты, задачи и приоритеты из vault Артели",
};

export const dynamic = "force-dynamic";

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const reviewCount = getAllTasks().filter((t) => t.status === "review").length;
  return (
    <html lang="ru">
      <body className="overflow-x-clip">
        <Nav reviewCount={reviewCount} />
        {/* нижний отступ на мобиле — чтобы контент не прятался за фиксированным BottomNav */}
        <main className="mx-auto max-w-6xl px-4 py-6 pb-28 sm:py-8 lg:pb-8">{children}</main>
        <BottomNav reviewCount={reviewCount} />
      </body>
    </html>
  );
}
