import { getCurrentUser, isSubscriptionActive } from "@/lib/auth";
import { redirect } from "next/navigation";
import { PLAN_LIST } from "@/lib/plans";
import AssinarClient from "./AssinarClient";

export default async function AssinarPage() {
  const user = await getCurrentUser();

  if (user?.role === "admin") redirect("/");

  // Assinante ativo continua podendo entrar aqui pra renovar — os dias novos
  // são somados ao que ainda falta (ver activateSubscription em lib/subscription).
  const renovaAte =
    user && isSubscriptionActive(user) && user.subscriptionExpiresAt
      ? user.subscriptionExpiresAt.toISOString()
      : null;

  return (
    <AssinarClient
      renovaAte={renovaAte}
      userEmail={user?.email ?? null}
      plans={PLAN_LIST}
      payeeCode={process.env.NEXT_PUBLIC_EFI_PAYEE_CODE || ""}
      efiEnv={process.env.EFI_ENV === "production" ? "production" : "sandbox"}
    />
  );
}
