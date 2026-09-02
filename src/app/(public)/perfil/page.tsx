import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import PerfilClient from "./PerfilClient";

export default async function PerfilPage() {
  const user = await getCurrentUser();

  if (!user) redirect("/login?redirect=/perfil");

  return (
    <PerfilClient
      user={{
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        role: user.role,
        subscriptionStatus: user.subscriptionStatus,
        subscriptionExpiresAt: user.subscriptionExpiresAt
          ? user.subscriptionExpiresAt.toISOString()
          : null,
      }}
    />
  );
}
