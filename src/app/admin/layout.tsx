"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Film,
  Tags,
  Users,
  Settings,
  LogOut,
  Menu,
  X,
  ChevronLeft,
} from "lucide-react";

const sidebarLinks = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/movies", label: "Filmes", icon: Film },
  { href: "/admin/categories", label: "Categorias", icon: Tags },
  { href: "/admin/users", label: "Usuários", icon: Users },
  { href: "/admin/settings", label: "Configurações", icon: Settings },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [authorized, setAuthorized] = useState<boolean | null>(null);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((d) => {
        if (!d.user || d.user.role !== "admin") {
          router.push("/login");
        } else {
          setAuthorized(true);
        }
      })
      .catch(() => router.push("/login"));
  }, [router]);

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/");
  };

  if (authorized === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-dark">
        <div className="animate-pulse text-gray-400">Carregando...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-dark">
      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-dark-card border-r border-dark-border transform transition-transform lg:translate-x-0 lg:static ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="p-5 border-b border-dark-border flex items-center justify-between">
            <Link href="/admin" className="flex items-center gap-1">
              <span className="text-xl font-extrabold text-primary">DORAMA</span>
              <span className="text-xl font-light">FLIX</span>
            </Link>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden text-gray-400"
            >
              <X size={20} />
            </button>
          </div>

          {/* Links */}
          <nav className="flex-1 p-4 space-y-1">
            {sidebarLinks.map((link) => {
              const isActive =
                pathname === link.href ||
                (link.href !== "/admin" && pathname.startsWith(link.href));
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition ${
                    isActive
                      ? "bg-primary/20 text-primary"
                      : "text-gray-400 hover:text-white hover:bg-white/5"
                  }`}
                >
                  <link.icon size={18} />
                  {link.label}
                </Link>
              );
            })}
          </nav>

          {/* Bottom */}
          <div className="p-4 border-t border-dark-border space-y-2">
            <Link
              href="/"
              className="flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm text-gray-400 hover:text-white hover:bg-white/5 transition"
            >
              <ChevronLeft size={18} />
              Voltar ao site
            </Link>
            <button
              onClick={handleLogout}
              className="flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm text-gray-400 hover:text-red-400 hover:bg-white/5 transition w-full"
            >
              <LogOut size={18} />
              Sair
            </button>
          </div>
        </div>
      </aside>

      {/* Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col min-h-screen">
        {/* Top bar */}
        <header className="sticky top-0 z-30 bg-dark/80 backdrop-blur-sm border-b border-dark-border px-4 py-3 flex items-center gap-4">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden text-gray-400"
          >
            <Menu size={22} />
          </button>
          <h2 className="text-sm font-medium text-gray-300">
            Painel Administrativo
          </h2>
        </header>

        {/* Page content */}
        <main className="flex-1 p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}
