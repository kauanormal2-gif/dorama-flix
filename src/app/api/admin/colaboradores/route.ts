import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { hashPassword, requireAdmin } from "@/lib/auth";

const SENHA_MINIMA = 8;

/**
 * Colaboradores do painel.
 *
 * Só a dona (admin) mexe aqui — quem trabalha pra ela não pode criar novos
 * acessos nem se promover.
 */
export async function GET() {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const equipe = await prisma.user.findMany({
    where: { role: { in: ["admin", "colaborador"] } },
    select: { id: true, name: true, email: true, role: true, lastLoginAt: true, createdAt: true },
    orderBy: [{ role: "asc" }, { createdAt: "asc" }],
  });

  return NextResponse.json({ equipe });
}

export async function POST(req: Request) {
  let dona;
  try {
    dona = await requireAdmin();
  } catch {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const nome = typeof body?.nome === "string" ? body.nome.trim() : "";
  const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
  const senha = typeof body?.senha === "string" ? body.senha : "";

  if (!nome) {
    return NextResponse.json({ error: "Diga o nome da pessoa" }, { status: 400 });
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "E-mail inválido" }, { status: 400 });
  }
  if (senha.length < SENHA_MINIMA) {
    return NextResponse.json(
      { error: `A senha precisa ter pelo menos ${SENHA_MINIMA} letras ou números` },
      { status: 400 }
    );
  }

  const jaExiste = await prisma.user.findUnique({ where: { email } });

  // Promover a própria dona por engano tiraria o acesso dela ao faturamento.
  if (jaExiste?.role === "admin") {
    return NextResponse.json(
      { error: "Esse e-mail já é de um administrador" },
      { status: 400 }
    );
  }
  if (jaExiste && jaExiste.id === dona.id) {
    return NextResponse.json({ error: "Esse é o seu próprio e-mail" }, { status: 400 });
  }

  const dados = { name: nome, password: await hashPassword(senha), role: "colaborador" };

  const colaborador = jaExiste
    ? await prisma.user.update({ where: { email }, data: dados })
    : await prisma.user.create({ data: { email, ...dados } });

  return NextResponse.json({
    colaborador: {
      id: colaborador.id,
      nome: colaborador.name,
      email: colaborador.email,
      eraCliente: Boolean(jaExiste),
    },
  });
}
