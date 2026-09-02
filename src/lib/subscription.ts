import { prisma } from "./db";
import { getPlan, type PlanKey } from "./plans";

/**
 * Libera (ou renova) o acesso do assinante.
 * Se a assinatura ainda estiver válida, os dias novos são somados ao que resta.
 */
export async function activateSubscription(params: {
  email: string;
  name: string;
  plan: PlanKey;
  platform?: string;
}) {
  const email = params.email.toLowerCase().trim();
  const plan = getPlan(params.plan);
  if (!plan) throw new Error(`Plano inválido: ${params.plan}`);

  const user = await prisma.user.findUnique({ where: { email } });

  const base =
    user?.subscriptionExpiresAt && user.subscriptionExpiresAt > new Date()
      ? new Date(user.subscriptionExpiresAt)
      : new Date();
  const expiresAt = new Date(base);
  expiresAt.setDate(expiresAt.getDate() + plan.days);

  const data = {
    subscriptionStatus: "active",
    subscriptionPlatform: params.platform ?? "efi",
    subscriptionExpiresAt: expiresAt,
  };

  if (user) {
    await prisma.user.update({ where: { email }, data });
  } else {
    // Conta pré-ativada: a pessoa define a senha no primeiro acesso
    await prisma.user.create({
      data: {
        email,
        name: params.name || email.split("@")[0],
        password: "",
        ...data,
      },
    });
  }

  return expiresAt;
}

/**
 * Marca o pagamento como pago e libera o acesso. Idempotente — webhooks da Efí
 * são reenviados várias vezes e não podem somar dias duas vezes.
 */
export async function settlePayment(paymentId: string) {
  const payment = await prisma.payment.findUnique({ where: { id: paymentId } });
  if (!payment) return { ok: false, reason: "payment_not_found" as const };
  if (payment.status === "paid") return { ok: true, alreadyPaid: true };

  await prisma.payment.update({
    where: { id: paymentId },
    data: { status: "paid", paidAt: new Date() },
  });

  await activateSubscription({
    email: payment.email,
    name: payment.name,
    plan: payment.plan as PlanKey,
  });

  return { ok: true, alreadyPaid: false };
}
