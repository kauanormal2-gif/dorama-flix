"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  Check,
  X,
  Play,
  QrCode,
  CreditCard,
  Barcode,
  Sparkles,
  Copy,
  Loader2,
  ArrowLeft,
  PartyPopper,
  MessageCircle,
} from "lucide-react";
import type { Plan } from "@/lib/plans";
import { formatBRL } from "@/lib/plans";
import { linkProblemaPagamento } from "@/lib/suporte";

type Method = "pix" | "cartao" | "boleto";
type Step = "dados" | "metodo" | "pix" | "cartao" | "boleto" | "sucesso";

interface Props {
  userEmail: string | null;
  plans: Plan[];
  payeeCode: string;
  efiEnv: "sandbox" | "production";
  /** Data ISO até quando a assinatura atual vale, se ela ainda estiver ativa. */
  renovaAte: string | null;
}

interface Customer {
  name: string;
  email: string;
  phone: string;
}

export default function AssinarClient({
  userEmail,
  plans,
  payeeCode,
  efiEnv,
  renovaAte,
}: Props) {
  const [selected, setSelected] = useState<Plan | null>(null);

  return (
    <div className="min-h-screen bg-dark relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(229,9,20,0.15),transparent_60%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom,rgba(229,9,20,0.08),transparent_50%)]" />
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage:
              "radial-gradient(circle at 1px 1px, white 1px, transparent 0)",
            backgroundSize: "32px 32px",
          }}
        />
      </div>

      <div className="relative max-w-6xl mx-auto px-4 pt-28 pb-16">
        <div className="text-center mb-14 max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 mb-6">
            <Sparkles className="w-3.5 h-3.5 text-primary" />
            <span className="text-xs font-medium text-primary uppercase tracking-wider">
              Assine agora
            </span>
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold text-white mb-4 leading-tight">
            Doramas sem limites,
            <br />
            <span className="bg-gradient-to-r from-primary to-red-400 bg-clip-text text-transparent">
              onde e quando quiser
            </span>
          </h1>
          <p className="text-gray-300 text-lg leading-relaxed">
            Escolha seu plano e comece a assistir hoje mesmo. É simples e leva
            menos de um minuto.
          </p>

          {renovaAte && (
            <div className="mt-6 rounded-xl bg-primary/10 border border-primary/30 px-4 py-3 text-base text-gray-200">
              Sua assinatura vale até{" "}
              <strong className="text-white">
                {new Date(renovaAte).toLocaleDateString("pt-BR")}
              </strong>
              . Se renovar agora, os dias novos são somados a esses — você não
              perde nada.
            </div>
          )}

          {/* Quem já pagou costuma cair aqui achando que precisa comprar de
              novo. O caminho certo é entrar com o e-mail da compra. */}
          {!renovaAte && (
            <p className="mt-6 text-base text-gray-300">
              Já assinou?{" "}
              <Link href="/login" className="text-primary font-semibold underline">
                Entre com seu e-mail
              </Link>
            </p>
          )}
        </div>

        <div className="grid md:grid-cols-3 gap-5 mb-10">
          {plans.map((plan) => (
            <PlanCard
              key={plan.key}
              plan={plan}
              onSelect={() => setSelected(plan)}
            />
          ))}
        </div>

        <div className="flex items-center justify-center gap-4 text-base text-gray-300">
          {userEmail ? (
            <span>
              Logado como <span className="text-white">{userEmail}</span>
            </span>
          ) : (
            <Link href="/login" className="hover:text-white transition py-2">
              Já sou assinante, quero entrar
            </Link>
          )}
        </div>
      </div>

      {selected && (
        <CheckoutModal
          plan={selected}
          userEmail={userEmail}
          payeeCode={payeeCode}
          efiEnv={efiEnv}
          onClose={() => setSelected(null)}
        />
      )}
    </div>
  );
}

function PlanCard({ plan, onSelect }: { plan: Plan; onSelect: () => void }) {
  const [reais, cents] = formatBRL(plan.amount).split(",");

  return (
    <div
      className={`relative rounded-2xl p-6 transition-all duration-300 hover:-translate-y-1 ${
        plan.highlight
          ? "bg-gradient-to-b from-primary/20 to-primary/5 border-2 border-primary shadow-[0_0_40px_-10px_rgba(229,9,20,0.5)]"
          : "bg-white/[0.02] border border-white/10 hover:border-white/20"
      }`}
    >
      {plan.ribbon && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider shadow-lg">
          {plan.ribbon}
        </div>
      )}

      <div className="text-center mb-6">
        <p className="text-gray-300 text-sm font-medium mb-3">
          {plan.duration}
        </p>
        <h3 className="text-2xl font-bold text-white mb-1">{plan.name}</h3>
        <div className="flex items-baseline justify-center gap-1 mt-4">
          <span className="text-3xl font-extrabold text-white">R$</span>
          <span className="text-5xl font-extrabold text-white">{reais}</span>
          <span className="text-2xl font-bold text-white">,{cents}</span>
        </div>
        <p className="text-gray-300 text-sm mt-1">{plan.period}</p>
      </div>

      <ul className="space-y-3 mb-8">
        {plan.features.map((feature) => (
          <li key={feature} className="flex items-start gap-3 text-base">
            <div
              className={`mt-1 w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${
                plan.highlight ? "bg-primary" : "bg-white/15"
              }`}
            >
              <Check className="w-3 h-3 text-white" strokeWidth={3} />
            </div>
            <span className="text-gray-200 leading-6">{feature}</span>
          </li>
        ))}
      </ul>

      <button
        onClick={onSelect}
        className={`w-full py-4 rounded-xl font-semibold text-base transition ${
          plan.highlight
            ? "bg-primary hover:bg-primary-hover text-white shadow-lg shadow-primary/30"
            : "bg-white/10 hover:bg-white/20 text-white"
        }`}
      >
        Assinar Agora
      </button>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Checkout                                                                    */
/* -------------------------------------------------------------------------- */

function CheckoutModal({
  plan,
  userEmail,
  payeeCode,
  efiEnv,
  onClose,
}: {
  plan: Plan;
  userEmail: string | null;
  payeeCode: string;
  efiEnv: "sandbox" | "production";
  onClose: () => void;
}) {
  const [step, setStep] = useState<Step>("dados");
  const [customer, setCustomer] = useState<Customer>({
    name: "",
    email: userEmail ?? "",
    phone: "",
  });

  const back = () => {
    if (step === "metodo") setStep("dados");
    else if (step !== "dados" && step !== "sucesso") setStep("metodo");
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-md my-8 bg-gradient-to-b from-dark-card to-dark-light border border-white/10 rounded-2xl p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {step !== "dados" && step !== "sucesso" && (
          <button
            onClick={back}
            className="absolute top-3 left-3 p-2 rounded-lg text-gray-300 hover:text-white hover:bg-white/10 transition"
            aria-label="Voltar"
          >
            <ArrowLeft size={24} />
          </button>
        )}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 p-2 rounded-lg text-gray-300 hover:text-white hover:bg-white/10 transition"
          aria-label="Fechar"
        >
          <X size={24} />
        </button>

        <div className="text-center mb-6 mt-2">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 mb-3">
            <Play className="w-3.5 h-3.5 text-primary fill-primary" />
            <span className="text-sm font-semibold text-primary">
              Plano {plan.name}
            </span>
          </div>
          <p className="text-gray-200 text-lg font-semibold">
            R$ {formatBRL(plan.amount)}
          </p>
          <p className="text-gray-400 text-sm">{plan.duration.toLowerCase()}</p>
        </div>

        {step === "dados" && (
          <CustomerForm
            customer={customer}
            onChange={setCustomer}
            onSubmit={() => setStep("metodo")}
          />
        )}

        {step === "metodo" && (
          <MethodPicker onPick={(method) => setStep(method)} />
        )}

        {step === "pix" && (
          <PixStep
            plan={plan}
            customer={customer}
            onPaid={() => setStep("sucesso")}
          />
        )}

        {step === "cartao" && (
          <CardStep
            plan={plan}
            customer={customer}
            payeeCode={payeeCode}
            efiEnv={efiEnv}
            onPaid={() => setStep("sucesso")}
          />
        )}

        {step === "boleto" && <BoletoStep plan={plan} customer={customer} />}

        {step === "sucesso" && <SuccessStep email={customer.email} />}

        {/* Quem trava no pagamento simplesmente fecha a página e some. Aqui ela
            fala com a gente ainda dentro do checkout, com os dados já anexados. */}
        {step !== "sucesso" && (
          <a
            href={linkProblemaPagamento({
              nome: customer.name,
              email: customer.email,
              plano: plan.name,
            })}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-6 flex items-center justify-center gap-3 w-full py-3.5 px-4 rounded-xl border border-white/15 bg-white/5 hover:bg-white/10 transition text-left"
          >
            <MessageCircle size={22} className="flex-shrink-0 text-green-400" />
            <span>
              <span className="block text-base font-semibold text-white">
                Não consegui pagar
              </span>
              <span className="block text-sm text-gray-400">
                Falar no WhatsApp
              </span>
            </span>
          </a>
        )}
      </div>
    </div>
  );
}

// text-base (16px) evita o zoom automático do iPhone ao focar o campo.
const inputClass =
  "w-full px-4 py-3.5 rounded-xl bg-white/5 border border-white/15 text-white text-base placeholder:text-gray-500 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/30 transition";

const labelClass = "block text-sm font-medium text-gray-200 mb-2";

const hintClass = "text-sm text-gray-400 mt-2 leading-relaxed";

const primaryButtonClass =
  "w-full py-4 rounded-xl bg-primary hover:bg-primary-hover disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold text-base transition shadow-lg shadow-primary/20";

function maskCpf(value: string) {
  return value
    .replace(/\D/g, "")
    .slice(0, 11)
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
}

function maskPhone(value: string) {
  return value
    .replace(/\D/g, "")
    .slice(0, 11)
    .replace(/(\d{2})(\d)/, "($1) $2")
    .replace(/(\d{5})(\d)/, "$1-$2");
}

function maskCep(value: string) {
  return value
    .replace(/\D/g, "")
    .slice(0, 8)
    .replace(/(\d{5})(\d)/, "$1-$2");
}

function CustomerForm({
  customer,
  onChange,
  onSubmit,
}: {
  customer: Customer;
  onChange: (c: Customer) => void;
  onSubmit: () => void;
}) {
  const set = (field: keyof Customer, value: string) =>
    onChange({ ...customer, [field]: value });

  const valid =
    customer.name.trim().length >= 3 &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customer.email) &&
    customer.phone.replace(/\D/g, "").length >= 10;

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (valid) onSubmit();
      }}
      className="space-y-5"
    >
      <h3 className="text-xl font-bold text-white text-center mb-1">
        Seus dados
      </h3>
      <p className="text-center text-gray-400 text-sm -mt-1">Passo 1 de 3</p>

      <div>
        <label className={labelClass}>Seu nome</label>
        <input
          className={inputClass}
          value={customer.name}
          onChange={(e) => set("name", e.target.value)}
          placeholder="Maria da Silva"
          autoComplete="name"
        />
      </div>

      <div>
        <label className={labelClass}>Seu e-mail</label>
        <input
          className={inputClass}
          type="email"
          value={customer.email}
          onChange={(e) => set("email", e.target.value)}
          placeholder="voce@email.com"
          autoComplete="email"
        />
        <p className={hintClass}>
          É com esse e-mail que você vai entrar no Drama Flix.
        </p>
      </div>

      <div>
        <label className={labelClass}>Seu celular</label>
        <input
          className={inputClass}
          value={customer.phone}
          onChange={(e) => set("phone", maskPhone(e.target.value))}
          placeholder="(11) 90000-0000"
          inputMode="numeric"
          autoComplete="tel"
        />
      </div>

      <button type="submit" disabled={!valid} className={primaryButtonClass}>
        Continuar
      </button>
    </form>
  );
}

function MethodPicker({ onPick }: { onPick: (m: Method) => void }) {
  const options: {
    method: Method;
    icon: typeof QrCode;
    title: string;
    sub: string;
  }[] = [
    {
      method: "pix",
      icon: QrCode,
      title: "Pix",
      sub: "Acesso liberado na hora",
    },
    {
      method: "cartao",
      icon: CreditCard,
      title: "Cartão de crédito",
      sub: "Acesso liberado na hora",
    },
    {
      method: "boleto",
      icon: Barcode,
      title: "Boleto",
      sub: "Demora até 3 dias úteis",
    },
  ];

  return (
    <div className="space-y-4">
      <h3 className="text-xl font-bold text-white text-center mb-1">
        Como você quer pagar?
      </h3>
      <p className="text-center text-gray-400 text-sm -mt-1">Passo 2 de 3</p>

      {options.map(({ method, icon: Icon, title, sub }) => (
        <button
          key={method}
          onClick={() => onPick(method)}
          className="flex items-center gap-4 w-full p-5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/15 hover:border-primary transition"
        >
          <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center flex-shrink-0">
            <Icon className="w-6 h-6 text-primary" />
          </div>
          <div className="flex-1 text-left">
            <p className="text-white font-semibold text-base">{title}</p>
            <p className="text-gray-400 text-sm">{sub}</p>
          </div>
        </button>
      ))}
    </div>
  );
}

function ErrorBox({ message }: { message: string }) {
  return (
    <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-200 text-sm leading-relaxed">
      {message}
    </div>
  );
}

function PixStep({
  plan,
  customer,
  onPaid,
}: {
  plan: Plan;
  customer: Customer;
  onPaid: () => void;
}) {
  const [data, setData] = useState<{
    txid: string;
    copiaECola: string;
    qrCodeImage: string;
  } | null>(null);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const created = useRef(false);

  useEffect(() => {
    if (created.current) return;
    created.current = true;

    fetch("/api/pagamentos/pix", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ plan: plan.key, ...customer }),
    })
      .then(async (res) => {
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || "Falha ao gerar o Pix");
        setData(json);
      })
      .catch((e) => setError(e.message));
  }, [plan.key, customer]);

  // Enquanto não paga, pergunta o status a cada 4s
  useEffect(() => {
    if (!data) return;
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/pagamentos/pix/${data.txid}`);
        const json = await res.json();
        if (json.status === "paid") {
          clearInterval(interval);
          onPaid();
        }
      } catch {
        /* segue tentando */
      }
    }, 4000);
    return () => clearInterval(interval);
  }, [data, onPaid]);

  const copy = useCallback(() => {
    if (!data) return;
    navigator.clipboard.writeText(data.copiaECola);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [data]);

  if (error) return <ErrorBox message={error} />;

  if (!data) {
    return (
      <div className="flex flex-col items-center py-10 gap-3 text-gray-300 text-base">
        <Loader2 className="w-7 h-7 animate-spin text-primary" />
        Gerando seu Pix...
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <h3 className="text-xl font-bold text-white text-center">
        Pague com Pix
      </h3>

      <ol className="space-y-3">
        {[
          "Copie o código no botão abaixo",
          "Abra o aplicativo do seu banco",
          'Escolha "Pix Copia e Cola" e cole o código',
        ].map((text, i) => (
          <li key={text} className="flex items-start gap-3">
            <span className="w-7 h-7 rounded-full bg-primary text-white text-sm font-bold flex items-center justify-center flex-shrink-0">
              {i + 1}
            </span>
            <span className="text-gray-200 text-base leading-7">{text}</span>
          </li>
        ))}
      </ol>

      <button
        onClick={copy}
        className="flex items-center justify-center gap-2 w-full py-4 rounded-xl bg-primary hover:bg-primary-hover text-white font-semibold text-base transition shadow-lg shadow-primary/20"
      >
        <Copy className="w-5 h-5" />
        {copied ? "Código copiado!" : "Copiar código Pix"}
      </button>

      <div className="pt-1">
        <p className="text-center text-gray-400 text-sm mb-3">
          Ou aponte a câmera do banco para o código abaixo
        </p>
        <div className="bg-white rounded-xl p-3 mx-auto w-fit">
          <Image
            src={data.qrCodeImage}
            alt="QR Code do Pix"
            width={200}
            height={200}
            unoptimized
          />
        </div>
      </div>

      <div className="flex items-center justify-center gap-2 text-gray-300 text-sm">
        <Loader2 className="w-4 h-4 animate-spin" />
        Aguardando o pagamento...
      </div>

      <p className="text-center text-gray-400 text-sm leading-relaxed">
        Pode deixar essa tela aberta. Assim que o pagamento cair, seu acesso é
        liberado sozinho.
      </p>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Cartão                                                                      */
/* -------------------------------------------------------------------------- */

interface EfiCreditCard {
  setAccount: (code: string) => EfiCreditCard;
  setEnvironment: (env: string) => EfiCreditCard;
  setCardNumber: (number: string) => EfiCreditCard;
  verifyCardBrand: () => Promise<string>;
  setCreditCardData: (data: Record<string, unknown>) => EfiCreditCard;
  getPaymentToken: () => Promise<{ payment_token: string; card_mask: string }>;
}

declare global {
  interface Window {
    EfiPay?: { CreditCard: EfiCreditCard };
  }
}

const EFI_SCRIPT =
  "https://cdn.jsdelivr.net/npm/payment-token-efi@3.4.1/dist/payment-token-efi-umd.min.js";

function loadEfiScript(): Promise<EfiCreditCard> {
  if (window.EfiPay) return Promise.resolve(window.EfiPay.CreditCard);

  return new Promise((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(
      `script[src="${EFI_SCRIPT}"]`
    );
    const script = existing ?? document.createElement("script");
    const onLoad = () =>
      window.EfiPay
        ? resolve(window.EfiPay.CreditCard)
        : reject(new Error("Falha ao carregar o checkout"));

    script.addEventListener("load", onLoad);
    script.addEventListener("error", () =>
      reject(new Error("Falha ao carregar o checkout"))
    );

    if (!existing) {
      script.src = EFI_SCRIPT;
      script.async = true;
      document.body.appendChild(script);
    }
  });
}

function CardStep({
  plan,
  customer,
  payeeCode,
  efiEnv,
  onPaid,
}: {
  plan: Plan;
  customer: Customer;
  payeeCode: string;
  efiEnv: "sandbox" | "production";
  onPaid: () => void;
}) {
  const [form, setForm] = useState({
    number: "",
    holderName: "",
    cpf: "",
    expirationMonth: "",
    expirationYear: "",
    cvv: "",
    birth: "",
    zipcode: "",
    addressNumber: "",
    installments: "1",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const set = (field: keyof typeof form, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const efi = await loadEfiScript();

      const brand = await efi
        .setCardNumber(form.number.replace(/\D/g, ""))
        .verifyCardBrand();

      if (!brand || brand === "undefined" || brand === "unsupported") {
        throw new Error("Cartão não suportado. Tente outro.");
      }

      const { payment_token } = await efi
        .setAccount(payeeCode)
        .setEnvironment(efiEnv)
        .setCreditCardData({
          brand,
          number: form.number.replace(/\D/g, ""),
          cvv: form.cvv,
          expirationMonth: form.expirationMonth,
          expirationYear: form.expirationYear,
          holderName: form.holderName,
          holderDocument: form.cpf.replace(/\D/g, ""),
          reuse: false,
        })
        .getPaymentToken();

      const res = await fetch("/api/pagamentos/cartao", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          plan: plan.key,
          ...customer,
          cpf: form.cpf,
          paymentToken: payment_token,
          birth: form.birth,
          zipcode: form.zipcode,
          addressNumber: form.addressNumber,
          installments: Number(form.installments),
        }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Pagamento recusado");
      if (json.status !== "paid") {
        throw new Error(
          "Pagamento em análise. Você recebe um e-mail assim que for aprovado."
        );
      }
      onPaid();
    } catch (e) {
      const err = e as { error_description?: string; message?: string };
      setError(err.error_description || err.message || "Pagamento recusado");
    } finally {
      setLoading(false);
    }
  };

  const maxInstallments = plan.amount >= 5000 ? 12 : 1;

  return (
    <form onSubmit={submit} className="space-y-4">
      <h3 className="text-xl font-bold text-white text-center mb-1">
        Dados do cartão
      </h3>
      <p className="text-center text-gray-400 text-sm -mt-1">Passo 3 de 3</p>

      {error && <ErrorBox message={error} />}

      <div>
        <label className={labelClass}>Número do cartão</label>
        <input
          className={inputClass}
          value={form.number}
          onChange={(e) =>
            set(
              "number",
              e.target.value
                .replace(/\D/g, "")
                .slice(0, 16)
                .replace(/(\d{4})(?=\d)/g, "$1 ")
            )
          }
          placeholder="0000 0000 0000 0000"
          inputMode="numeric"
          required
        />
      </div>

      <div>
        <label className={labelClass}>Nome impresso no cartão</label>
        <input
          className={inputClass}
          value={form.holderName}
          onChange={(e) => set("holderName", e.target.value.toUpperCase())}
          placeholder="MARIA DA SILVA"
          required
        />
      </div>

      <div>
        <label className={labelClass}>CPF do titular</label>
        <input
          className={inputClass}
          value={form.cpf}
          onChange={(e) => set("cpf", maskCpf(e.target.value))}
          placeholder="000.000.000-00"
          inputMode="numeric"
          required
        />
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className={labelClass}>Mês</label>
          <input
            className={inputClass}
            value={form.expirationMonth}
            onChange={(e) =>
              set("expirationMonth", e.target.value.replace(/\D/g, "").slice(0, 2))
            }
            placeholder="05"
            inputMode="numeric"
            required
          />
        </div>
        <div>
          <label className={labelClass}>Ano</label>
          <input
            className={inputClass}
            value={form.expirationYear}
            onChange={(e) =>
              set("expirationYear", e.target.value.replace(/\D/g, "").slice(0, 4))
            }
            placeholder="2030"
            inputMode="numeric"
            required
          />
        </div>
        <div>
          <label className={labelClass}>CVV</label>
          <input
            className={inputClass}
            value={form.cvv}
            onChange={(e) => set("cvv", e.target.value.replace(/\D/g, "").slice(0, 4))}
            placeholder="123"
            inputMode="numeric"
            required
          />
        </div>
      </div>
      <p className={hintClass}>
        O CVV são os 3 números que ficam atrás do cartão.
      </p>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelClass}>Data de nascimento</label>
          <input
            className={inputClass}
            type="date"
            value={form.birth}
            onChange={(e) => set("birth", e.target.value)}
            required
          />
        </div>
        <div>
          <label className={labelClass}>CEP</label>
          <input
            className={inputClass}
            value={form.zipcode}
            onChange={(e) => set("zipcode", maskCep(e.target.value))}
            placeholder="00000-000"
            inputMode="numeric"
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelClass}>Número da casa</label>
          <input
            className={inputClass}
            value={form.addressNumber}
            onChange={(e) => set("addressNumber", e.target.value.slice(0, 10))}
            placeholder="123"
            required
          />
        </div>
        <div>
          <label className={labelClass}>Parcelas</label>
          <select
            className={inputClass}
            value={form.installments}
            onChange={(e) => set("installments", e.target.value)}
          >
            {Array.from({ length: maxInstallments }, (_, i) => i + 1).map((n) => (
              <option key={n} value={n} className="bg-dark-card">
                {n}x de R$ {formatBRL(Math.round(plan.amount / n))}
              </option>
            ))}
          </select>
        </div>
      </div>

      <button
        type="submit"
        disabled={loading}
        className={`flex items-center justify-center gap-2 ${primaryButtonClass}`}
      >
        {loading && <Loader2 className="w-5 h-5 animate-spin" />}
        {loading ? "Processando..." : `Pagar R$ ${formatBRL(plan.amount)}`}
      </button>

      <p className="text-center text-gray-400 text-sm leading-relaxed">
        Seus dados são enviados direto para o banco, com segurança.
      </p>
    </form>
  );
}

function BoletoStep({ plan, customer }: { plan: Plan; customer: Customer }) {
  const [data, setData] = useState<{
    link: string;
    pdf?: string;
    barcode: string;
  } | null>(null);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [cpf, setCpf] = useState("");
  const [loading, setLoading] = useState(false);

  const generate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/pagamentos/boleto", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: plan.key, ...customer, cpf }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Falha ao gerar o boleto");
      setData(json);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  if (!data) {
    return (
      <form onSubmit={generate} className="space-y-4">
        <h3 className="text-xl font-bold text-white text-center mb-1">
          Dados do boleto
        </h3>
        <p className="text-center text-gray-400 text-sm -mt-1">Passo 3 de 3</p>

        {error && <ErrorBox message={error} />}

        <div>
          <label className={labelClass}>Seu CPF</label>
          <input
            className={inputClass}
            value={cpf}
            onChange={(e) => setCpf(maskCpf(e.target.value))}
            placeholder="000.000.000-00"
            inputMode="numeric"
            required
          />
          <p className={hintClass}>O banco pede o CPF para emitir o boleto.</p>
        </div>

        <button
          type="submit"
          disabled={loading || cpf.replace(/\D/g, "").length !== 11}
          className={`flex items-center justify-center gap-2 ${primaryButtonClass}`}
        >
          {loading && <Loader2 className="w-5 h-5 animate-spin" />}
          {loading ? "Gerando..." : "Gerar boleto"}
        </button>
      </form>
    );
  }

  return (
    <div className="space-y-5">
      <h3 className="text-xl font-bold text-white text-center">
        Seu boleto está pronto
      </h3>

      <a
        href={data.pdf || data.link}
        target="_blank"
        rel="noopener noreferrer"
        className="block text-center w-full py-4 rounded-xl bg-primary hover:bg-primary-hover text-white font-semibold text-base transition shadow-lg shadow-primary/20"
      >
        Abrir boleto
      </a>

      <div className="p-4 rounded-xl bg-white/5 border border-white/15">
        <p className="text-sm text-gray-300 mb-2">Linha digitável</p>
        <p className="text-white text-sm break-all font-mono leading-6">
          {data.barcode}
        </p>
      </div>

      <button
        onClick={() => {
          navigator.clipboard.writeText(data.barcode);
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        }}
        className="flex items-center justify-center gap-2 w-full py-4 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold text-base transition"
      >
        <Copy className="w-5 h-5" />
        {copied ? "Copiado!" : "Copiar linha digitável"}
      </button>

      <p className="text-center text-gray-400 text-sm leading-relaxed">
        Seu acesso é liberado sozinho assim que o banco confirmar o pagamento
        (até 3 dias úteis). Você recebe um aviso no e-mail{" "}
        <span className="text-gray-200">{customer.email}</span>.
      </p>
    </div>
  );
}

function SuccessStep({ email }: { email: string }) {
  const router = useRouter();

  // Já loga a pessoa no aparelho dela — ela acabou de pagar com esse e-mail,
  // não faz sentido pedir pra digitar de novo na tela seguinte. E logo depois
  // leva ela pro catálogo sozinha: muita gente pagava, via a tela de "pronto"
  // e fechava o site sem nunca chegar a assistir.
  useEffect(() => {
    let cancelado = false;
    (async () => {
      await fetch("/api/auth/entrar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      }).catch(() => {});
      if (cancelado) return;
      // Um respiro pra ela ler "Pagamento confirmado" antes de sair da tela.
      setTimeout(() => {
        if (cancelado) return;
        router.replace("/");
        router.refresh();
      }, 2500);
    })();
    return () => {
      cancelado = true;
    };
  }, [email, router]);

  return (
    <div className="text-center space-y-5 py-4">
      <div className="w-16 h-16 rounded-full bg-green-500/15 border border-green-500/30 flex items-center justify-center mx-auto">
        <PartyPopper className="w-8 h-8 text-green-400" />
      </div>
      <h3 className="text-2xl font-bold text-white">Pagamento confirmado!</h3>
      <p className="text-gray-300 text-base leading-relaxed">
        Seu acesso já está liberado para{" "}
        <span className="text-white font-semibold">{email}</span>.
      </p>
      <p className="text-gray-400 text-base">Levando você para o catálogo...</p>
      <Link
        href="/"
        className="block w-full py-4 rounded-xl bg-primary hover:bg-primary-hover text-white font-semibold text-base transition shadow-lg shadow-primary/20"
      >
        Começar a assistir
      </Link>
    </div>
  );
}
