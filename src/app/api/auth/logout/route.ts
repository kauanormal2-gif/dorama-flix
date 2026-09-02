import { NextResponse } from "next/server";
import { SECURE_COOKIE_DEFAULTS } from "@/lib/cookies";

export async function POST() {
  const response = NextResponse.json({ ok: true });
  // Zera com os mesmos flags do cookie original — alguns navegadores
  // ignoram o delete se os flags não baterem.
  response.cookies.set("token", "", { ...SECURE_COOKIE_DEFAULTS, maxAge: 0 });
  return response;
}
