import Link from "next/link";
import { ShieldCheck, BadgeCheck, Phone, Instagram } from "lucide-react";
import { linkSuporte, SUPORTE_WHATSAPP_VISIVEL } from "@/lib/suporte";

export default function Footer() {
  return (
    <footer className="mt-auto border-t border-white/5 bg-gradient-to-b from-black to-[#050505]">
      <div className="max-w-7xl mx-auto px-6 py-12">
        {/* Trust badges */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 pb-10 border-b border-white/5">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center flex-shrink-0">
              <ShieldCheck className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-white text-sm font-semibold">Pagamento Seguro</p>
              <p className="text-gray-500 text-xs">Seus dados protegidos</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center flex-shrink-0">
              <BadgeCheck className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-white text-sm font-semibold">Garantia</p>
              <p className="text-gray-500 text-xs">Satisfação garantida</p>
            </div>
          </div>

          <a
            href={linkSuporte()}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-start gap-3 group"
          >
            <div className="w-10 h-10 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center flex-shrink-0 group-hover:bg-primary/20 transition">
              <Phone className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-white text-sm font-semibold">Suporte</p>
              <p className="text-gray-400 text-xs group-hover:text-white transition">
                WhatsApp {SUPORTE_WHATSAPP_VISIVEL}
              </p>
            </div>
          </a>

          <a
            href="https://instagram.com/seriesdasu"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-start gap-3 group"
          >
            <div className="w-10 h-10 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center flex-shrink-0 group-hover:bg-primary/20 transition">
              <Instagram className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-white text-sm font-semibold">Instagram</p>
              <p className="text-gray-400 text-xs group-hover:text-white transition">
                @seriesdasu
              </p>
            </div>
          </a>
        </div>

        {/* Bottom row */}
        <div className="pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-1">
            <span className="text-xl font-extrabold text-primary">DRAMA</span>
            <span className="text-xl font-light text-white">FLIX</span>
          </Link>
          <p className="text-gray-500 text-xs text-center">
            © {new Date().getFullYear()} Drama Flix. Todos os direitos reservados.
          </p>
        </div>
      </div>
    </footer>
  );
}
