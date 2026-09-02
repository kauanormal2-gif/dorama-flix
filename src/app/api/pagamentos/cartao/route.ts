import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { appOrigin, parseCheckout, parseCpf } from "@/lib/checkout";
import { createCardCharge } from "@/lib/efi";
import { settlePayment } from "@/lib/subscription";
import { getClientIp, rateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";

interface ViaCep {
  logradouro?: string;
  bairro?: string;
  localidade?: string;
  uf?: string;
  erro?: boolean | string;
}

async function lookupAddress(zipcode: string) {
  const res = await fetch(`https://viacep.com.br/ws/${zipcode}/json/`);
  if (!res.ok) return null;
  const data = (await res.json()) as ViaCep;
  if (data.erro || !data.localidade || !data.uf) return null;
  return {
    street: data.logradouro || "Não informado",
    neighborhood: data.bairro || "Centro",
    city: data.localidade,
    state: data.uf,
  };
}

export async function POST(req: NextRequest) {
  const ip = getClientIp(req.headers);
  const limit = await rateLimit(`card:${ip}`, 8, 10 * 60 * 1000);
  if (!limit.allowed) {
    return NextResponse.json(
      { error: "Muitas tentativas. Tente de novo em alguns minutos." },
      { status: 429 }
    );
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  const parsed = parseCheckout(body);
  if (!parsed.ok) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }
  const { plan, customer } = parsed.data;

  // A Efí exige o CPF do titular pra cobrança no cartão.
  const document = parseCpf(body);
  if (!document.ok) {
    return NextResponse.json({ error: document.error }, { status: 400 });
  }

  const paymentToken = typeof body.paymentToken === "string" ? body.paymentToken : "";
  if (!paymentToken) {
    return NextResponse.json({ error: "Dados do cartão inválidos" }, { status: 400 });
  }

  const birth = typeof body.birth === "string" ? body.birth : "";
  if (!/^\d{4}-\d{2}-\d{2}$/.test(birth)) {
    return NextResponse.json({ error: "Data de nascimento inválida" }, { status: 400 });
  }

  const zipcode =
    typeof body.zipcode === "string" ? body.zipcode.replace(/\D/g, "") : "";
  if (zipcode.length !== 8) {
    return NextResponse.json({ error: "CEP inválido" }, { status: 400 });
  }

  const addressNumber =
    typeof body.addressNumber === "string" ? body.addressNumber.trim().slice(0, 10) : "";
  if (!addressNumber) {
    return NextResponse.json({ error: "Informe o número do endereço" }, { status: 400 });
  }

  const installments = Math.min(
    12,
    Math.max(1, Number(body.installments) || 1)
  );

  const address = await lookupAddress(zipcode);
  if (!address) {
    return NextResponse.json({ error: "CEP não encontrado" }, { status: 400 });
  }

  const payment = await prisma.payment.create({
    data: {
      method: "card",
      plan: plan.key,
      amount: plan.amount,
      email: customer.email,
      name: customer.name,
      cpf: document.cpf,
    },
  });

  try {
    const charge = await createCardCharge({
      item: `Drama Flix - Plano ${plan.name}`,
      amount: plan.amount,
      customer: {
        name: customer.name,
        cpf: document.cpf,
        email: customer.email,
        phone_number: customer.phone,
        birth,
      },
      billingAddress: {
        ...address,
        number: addressNumber,
        zipcode,
        complement:
          typeof body.complement === "string" ? body.complement.slice(0, 60) : "",
      },
      paymentToken,
      installments,
      notificationUrl: `${appOrigin(req)}/api/webhooks/efi/cobrancas`,
      customId: payment.id,
    });

    await prisma.payment.update({
      where: { id: payment.id },
      data: { chargeId: String(charge.charge_id) },
    });

    // "approved" = autorizado pela operadora; "paid" = já creditado
    if (charge.status === "approved" || charge.status === "paid") {
      await settlePayment(payment.id);
      return NextResponse.json({ status: "paid", email: customer.email });
    }

    return NextResponse.json({ status: charge.status });
  } catch (error) {
    console.error("[Efí Cartão] Falha ao criar cobrança:", error);
    await prisma.payment.update({
      where: { id: payment.id },
      data: { status: "failed" },
    });
    return NextResponse.json(
      { error: "Pagamento recusado. Confira os dados do cartão ou tente outro." },
      { status: 402 }
    );
  }
}
