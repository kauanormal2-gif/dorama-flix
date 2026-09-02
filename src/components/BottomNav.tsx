"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Search, Bookmark, Clock, User } from "lucide-react";

export default function BottomNav() {
  const pathname = usePathname();

  const items = [
    { href: "/", icon: Home, label: "Início", active: pathname === "/" },
    {
      href: "/buscar",
      icon: Search,
      label: "Buscar",
      active: pathname === "/buscar",
    },
    {
      href: "/favoritos",
      icon: Bookmark,
      label: "Favoritos",
      active: pathname === "/favoritos",
    },
    {
      href: "/historico",
      icon: Clock,
      label: "Histórico",
      active: pathname === "/historico",
    },
    {
      href: "/perfil",
      icon: User,
      label: "Perfil",
      active: pathname === "/perfil" || pathname === "/login",
    },
  ];

  return (
    <nav className="md:hidden fixed bottom-4 left-1/2 -translate-x-1/2 z-40 pointer-events-none">
      <div className="pointer-events-auto flex items-center gap-1 px-2 py-2 bg-black/60 backdrop-blur-2xl border border-white/10 rounded-full shadow-[0_10px_40px_-10px_rgba(0,0,0,0.8)]">
        {items.map((item) => {
          const Icon = item.icon;
          const content = (
            <div
              className={`w-10 h-10 flex items-center justify-center rounded-full transition-all ${
                item.active
                  ? "bg-primary text-white shadow-[0_4px_20px_-4px_rgba(229,9,20,0.6)]"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              <Icon size={18} strokeWidth={2.2} />
            </div>
          );

          return (
            <Link key={item.label} href={item.href} aria-label={item.label}>
              {content}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
