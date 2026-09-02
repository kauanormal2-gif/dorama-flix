import Link from "next/link";
import { getCurrentUser, getTrialDaysLeft, isSubscriptionActive } from "@/lib/auth";

/**
 * Faixa avisando quanto falta do teste grátis — e, quando o teste acaba,
 * mostrando a porta de entrada de quem já pagou.
 *
 * Esse último caso é o importante: quem assina entra uma vez na hora da compra
 * e depois volta pelo navegador do celular, muitas vezes sem o cookie da
 * sessão. Como o teste grátis dava acesso pelos primeiros 7 dias, ela nem
 * percebia que não estava logada — e no oitavo dia o site só oferecia
 * "Assinar", como se ela nunca tivesse pago. Assinante e admin não veem nada.
 */
export default async function TrialBanner() {
  const user = await getCurrentUser();
  if (user?.role === "admin") return null;
  if (user && isSubscriptionActive(user)) return null;

  const dias = await getTrialDaysLeft();

  if (dias === null) {
    return (
      <div className="pt-14 bg-primary/10 border-b border-primary/25">
        <div className="max-w-7xl mx-auto px-4 py-3 flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-center">
          <p className="text-base text-gray-100">Já é assinante?</p>
          <Link
            href="/login"
            className="bg-white/10 hover:bg-white/20 border border-white/25 text-white text-base font-semibold px-5 py-2.5 rounded-lg transition"
          >
            Entrar com meu e-mail
          </Link>
          <Link
            href="/assinar"
            className="bg-primary hover:bg-primary-hover text-white text-base font-semibold px-5 py-2.5 rounded-lg transition"
          >
            Assinar
          </Link>
        </div>
      </div>
    );
  }

  const texto =
    dias === 1
      ? "Hoje é o último dia do seu período de teste"
      : `Faltam ${dias} dias do seu período de teste`;

  return (
    // O menu do topo é `fixed` (56px de altura), então a faixa precisa começar
    // abaixo dele — senão o texto fica escondido atrás do menu.
    <div className="pt-14 bg-primary/10 border-b border-primary/25">
      <div className="max-w-7xl mx-auto px-4 py-3 flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-center">
        <p className="text-base text-gray-100">{texto}</p>
        <Link
          href="/assinar"
          className="bg-primary hover:bg-primary-hover text-white text-base font-semibold px-5 py-2.5 rounded-lg transition"
        >
          Assinar
        </Link>
      </div>
    </div>
  );
}
