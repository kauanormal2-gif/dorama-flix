"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Search, Menu, X, Download, Share } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export default function Navbar() {
  const [search, setSearch] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<Event | null>(null);
  const [canInstall, setCanInstall] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [showIOSGuide, setShowIOSGuide] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const ios = /iphone|ipad|ipod/i.test(navigator.userAgent);
    setIsIOS(ios);
  }, []);

  // Captura o evento de instalação do PWA
  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setCanInstall(true);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    const prompt = deferredPrompt as BeforeInstallPromptEvent;
    prompt.prompt();
    await prompt.userChoice;
    setDeferredPrompt(null);
    setCanInstall(false);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (search.trim()) {
      router.push(`/?search=${encodeURIComponent(search.trim())}`);
    }
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-b from-black/90 to-transparent backdrop-blur-sm">
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <span className="text-2xl font-extrabold text-primary">DORAMA</span>
          <span className="text-2xl font-light text-white">FLIX</span>
        </Link>

        {/* Search - Desktop */}
        <form
          onSubmit={handleSearch}
          className="hidden md:flex items-center bg-white/10 rounded-full px-4 py-2 flex-1 max-w-md mx-6"
        >
          <Search size={18} className="text-gray-400 mr-2" />
          <input
            type="text"
            placeholder="Buscar filme ou série..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-transparent outline-none text-white placeholder-gray-400 w-full text-sm"
          />
        </form>

        {/* Mobile menu button */}
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="md:hidden text-white"
        >
          {menuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden bg-black/95 backdrop-blur-sm px-4 pb-4 animate-fade-in">
          <form onSubmit={handleSearch} className="flex items-center bg-white/10 rounded-full px-4 py-2 mb-3">
            <Search size={18} className="text-gray-400 mr-2" />
            <input
              type="text"
              placeholder="Buscar filme ou série..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-transparent outline-none text-white placeholder-gray-400 w-full text-sm"
            />
          </form>
          {/* Android: botão nativo */}
          {canInstall && (
            <button
              onClick={handleInstall}
              className="flex items-center gap-2 w-full bg-primary hover:bg-primary-hover text-white text-sm py-2.5 px-4 rounded-full font-semibold transition mt-1"
            >
              <Download size={18} />
              Baixar o App
            </button>
          )}

          {/* iOS: botão que abre guia passo a passo */}
          {isIOS && !canInstall && (
            <div className="mt-1">
              <button
                onClick={() => setShowIOSGuide(!showIOSGuide)}
                className="flex items-center gap-2 w-full bg-white/10 hover:bg-white/20 text-white text-sm py-2.5 px-4 rounded-full font-semibold transition"
              >
                <Download size={18} />
                Baixar o App
              </button>
              {showIOSGuide && (
                <div className="mt-2 bg-white/10 rounded-2xl p-3 text-sm">
                  <p className="text-white font-semibold mb-2">Instalar no iPhone:</p>
                  <div className="flex items-start gap-2 mb-2">
                    <span className="bg-primary rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold flex-shrink-0">1</span>
                    <p className="text-gray-300">Toque no ícone <Share size={13} className="inline mb-0.5" /> <span className="font-semibold text-white">Compartilhar</span> na barra do Safari</p>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="bg-primary rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold flex-shrink-0">2</span>
                    <p className="text-gray-300">Role e toque em <span className="font-semibold text-white">&quot;Adicionar à Tela de Início&quot;</span> e confirme</p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </nav>
  );
}
