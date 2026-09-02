"use client";

import { useState, useEffect } from "react";
import {
  TrendingUp,
  TrendingDown,
  Wallet,
  Users,
  AlertTriangle,
  Clock,
} from "lucide-react";

interface Periodo {
  valor: number;
  vendas: number;
  anterior?: number;
}

interface Dados {
  periodos: {
    hoje: Periodo;
    dias7: Periodo;
    dias30: Periodo;
    mes: Periodo;
    total: Periodo;
  };
  porDia: { dia: string; valor: number; vendas: number }[];
  porMetodo: { nome: string; valor: number; vendas: number }[];
  porPlano: { nome: string; valor: number; vendas: number }[];
  pendentes: { vendas: number; valor: number };
  assinantes: {
    ativas: number;
    vencendo7dias: number;
    porPlataforma: { nome: string; total: number }[];
  };
}

/** Centavos -> "R$ 1.234,50" */
function reais(centavos: number) {
  return (centavos / 100).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

const NOME_METODO: Record<string, string> = {
  pix: "Pix",
  card: "Cartão",
  boleto: "Boleto",
};

const NOME_PLATAFORMA: Record<string, string> = {
  efi: "Pelo site",
  cakto: "Cakto",
  manual: "Liberado por você",
  demo: "Demonstração",
};

/** Card de período com a comparação com o período anterior. */
function CardPeriodo({
  titulo,
  p,
  destaque,
}: {
  titulo: string;
  p: Periodo;
  destaque?: boolean;
}) {
  const temComparacao = p.anterior !== undefined;
  const variacao =
    temComparacao && p.anterior! > 0
      ? ((p.valor - p.anterior!) / p.anterior!) * 100
      : null;
  const subiu = variacao !== null && variacao >= 0;

  return (
    <div
      className={`rounded-xl p-5 border ${
        destaque
          ? "bg-primary/10 border-primary/30"
          : "bg-dark-card border-dark-border"
      }`}
    >
      <p className="text-xs text-gray-400 uppercase tracking-wide mb-2">
        {titulo}
      </p>
      <p className="text-2xl font-bold text-white">{reais(p.valor)}</p>
      <p className="text-sm text-gray-400 mt-1">
        {p.vendas} {p.vendas === 1 ? "venda" : "vendas"}
      </p>

      {variacao !== null && (
        <p
          className={`flex items-center gap-1 text-sm mt-2 ${
            subiu ? "text-green-400" : "text-red-400"
          }`}
        >
          {subiu ? <TrendingUp size={15} /> : <TrendingDown size={15} />}
          {subiu ? "+" : ""}
          {variacao.toFixed(0)}% vs período anterior
        </p>
      )}
      {temComparacao && variacao === null && (
        <p className="text-sm text-gray-600 mt-2">sem venda no período anterior</p>
      )}
    </div>
  );
}

/** Barras dos últimos 30 dias. Sem biblioteca: é só div com altura. */
function Grafico({ dias }: { dias: Dados["porDia"] }) {
  const maior = Math.max(...dias.map((d) => d.valor), 1);

  return (
    <div className="bg-dark-card border border-dark-border rounded-xl p-5">
      <h2 className="font-semibold mb-1">Últimos 30 dias</h2>
      <p className="text-sm text-gray-400 mb-5">
        Cada barra é um dia. Passe o dedo em cima pra ver o valor.
      </p>

      <div className="flex items-end gap-[3px] h-40">
        {dias.map((d) => {
          const [, mes, dia] = d.dia.split("-");
          return (
            <div
              key={d.dia}
              title={`${dia}/${mes} — ${reais(d.valor)} (${d.vendas} venda${d.vendas === 1 ? "" : "s"})`}
              className="flex-1 min-w-0 flex flex-col justify-end h-full group"
            >
              <div
                className={`w-full rounded-t transition ${
                  d.valor > 0
                    ? "bg-primary group-hover:bg-primary-hover"
                    : "bg-white/5"
                }`}
                style={{
                  height: d.valor > 0 ? `${Math.max((d.valor / maior) * 100, 6)}%` : "3px",
                }}
              />
            </div>
          );
        })}
      </div>

      <div className="flex justify-between text-xs text-gray-500 mt-2">
        <span>{dias[0]?.dia.split("-").reverse().slice(0, 2).join("/")}</span>
        <span>
          {dias[dias.length - 1]?.dia.split("-").reverse().slice(0, 2).join("/")}
        </span>
      </div>
    </div>
  );
}

function Reparticao({
  titulo,
  itens,
  nomes,
}: {
  titulo: string;
  itens: { nome: string; valor: number; vendas: number }[];
  nomes?: Record<string, string>;
}) {
  const total = itens.reduce((t, i) => t + i.valor, 0) || 1;

  return (
    <div className="bg-dark-card border border-dark-border rounded-xl p-5">
      <h2 className="font-semibold mb-4">{titulo}</h2>
      {itens.length === 0 ? (
        <p className="text-gray-500 text-sm">Nada ainda.</p>
      ) : (
        <div className="space-y-3">
          {itens.map((i) => (
            <div key={i.nome}>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-200">
                  {nomes?.[i.nome] ?? i.nome}
                </span>
                <span className="text-white font-medium">
                  {reais(i.valor)}{" "}
                  <span className="text-gray-500 font-normal">
                    ({i.vendas})
                  </span>
                </span>
              </div>
              <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary rounded-full"
                  style={{ width: `${(i.valor / total) * 100}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function AdminFaturamento() {
  const [d, setD] = useState<Dados | null>(null);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    fetch("/api/admin/faturamento")
      .then((r) => r.json())
      .then(setD)
      .finally(() => setCarregando(false));
  }, []);

  if (carregando) {
    return (
      <div>
        <h1 className="text-2xl font-bold mb-6">Faturamento</h1>
        <p className="text-gray-500">Carregando...</p>
      </div>
    );
  }

  if (!d?.periodos) {
    return (
      <div>
        <h1 className="text-2xl font-bold mb-6">Faturamento</h1>
        <p className="text-red-400">Não deu pra carregar. Recarregue a página.</p>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-1">Faturamento</h1>
      <p className="text-sm text-gray-400 mb-6">
        Só as vendas feitas pelo site. Venda pela Cakto não entra aqui.
      </p>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
        <CardPeriodo titulo="Hoje" p={d.periodos.hoje} />
        <CardPeriodo titulo="Últimos 7 dias" p={d.periodos.dias7} destaque />
        <CardPeriodo titulo="Últimos 30 dias" p={d.periodos.dias30} />
        <CardPeriodo titulo="Este mês" p={d.periodos.mes} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-dark-card border border-dark-border rounded-xl p-5">
          <div className="flex items-center gap-2 mb-2">
            <Wallet size={16} className="text-green-400" />
            <p className="text-xs text-gray-400 uppercase tracking-wide">
              Total recebido
            </p>
          </div>
          <p className="text-2xl font-bold text-white">
            {reais(d.periodos.total.valor)}
          </p>
          <p className="text-sm text-gray-400 mt-1">
            {d.periodos.total.vendas} vendas desde o começo
          </p>
        </div>

        <div className="bg-dark-card border border-dark-border rounded-xl p-5">
          <div className="flex items-center gap-2 mb-2">
            <Users size={16} className="text-blue-400" />
            <p className="text-xs text-gray-400 uppercase tracking-wide">
              Assinantes ativas
            </p>
          </div>
          <p className="text-2xl font-bold text-white">{d.assinantes.ativas}</p>
          {d.assinantes.vencendo7dias > 0 && (
            <p className="flex items-center gap-1 text-sm text-yellow-400 mt-1">
              <Clock size={14} />
              {d.assinantes.vencendo7dias} vence
              {d.assinantes.vencendo7dias === 1 ? "" : "m"} em 7 dias
            </p>
          )}
        </div>

        <div className="bg-dark-card border border-dark-border rounded-xl p-5">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle size={16} className="text-yellow-400" />
            <p className="text-xs text-gray-400 uppercase tracking-wide">
              Não finalizaram
            </p>
          </div>
          <p className="text-2xl font-bold text-white">
            {reais(d.pendentes.valor)}
          </p>
          <p className="text-sm text-gray-400 mt-1">
            {d.pendentes.vendas} tentaram e não pagaram (30 dias)
          </p>
        </div>
      </div>

      <div className="mb-8">
        <Grafico dias={d.porDia} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <Reparticao
          titulo="Como pagaram"
          itens={d.porMetodo}
          nomes={NOME_METODO}
        />
        <Reparticao titulo="Qual plano" itens={d.porPlano} />
      </div>

      <div className="bg-dark-card border border-dark-border rounded-xl p-5">
        <h2 className="font-semibold mb-4">De onde vêm as assinantes ativas</h2>
        <div className="space-y-2">
          {d.assinantes.porPlataforma.map((p) => (
            <div key={p.nome} className="flex justify-between text-sm">
              <span className="text-gray-200">
                {NOME_PLATAFORMA[p.nome] ?? p.nome}
              </span>
              <span className="text-white font-medium">{p.total}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
