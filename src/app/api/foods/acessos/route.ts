import { NextRequest, NextResponse } from "next/server";
import sqlFoods from "@/lib/db-foods";
import { requireAdminSession } from "@/lib/admin-auth";
import { EMAIL_RE } from "@/lib/foods";
import { listAcessos } from "@/lib/foods-acessos";
import { log } from "@/lib/auditoria";

export async function POST(req: NextRequest) {
  const denied = await requireAdminSession();
  if (denied) return denied;

  const body = await req.json().catch(() => ({}));
  const email = String(body.email ?? "").trim().toLowerCase();
  const papel = body.papel;
  const slug = papel === "dono" ? String(body.pizzaria_slug ?? "").trim() : null;

  if (!EMAIL_RE.test(email)) return NextResponse.json({ error: "E-mail inválido." }, { status: 400 });
  if (papel !== "admin" && papel !== "dono") return NextResponse.json({ error: "Papel inválido." }, { status: 400 });
  if (papel === "dono" && !slug) return NextResponse.json({ error: "Escolha a pizzaria do dono." }, { status: 400 });

  let id: string;
  try {
    const [row] = await sqlFoods`
      INSERT INTO acessos (email, papel, pizzaria_slug)
      VALUES (${email}, ${papel}, ${slug})
      RETURNING id::text AS id
    `;
    id = row.id;
  } catch (e) {
    const code = (e as { code?: string }).code;
    if (code === "23505") return NextResponse.json({ error: "Esse acesso já existe." }, { status: 409 });
    if (code === "23503") return NextResponse.json({ error: "Pizzaria não encontrada." }, { status: 400 });
    throw e;
  }

  const created = (await listAcessos()).find(a => a.id === id);
  await log("create", "acesso", email, { papel, pizzaria_slug: slug });
  return NextResponse.json(created, { status: 201 });
}
