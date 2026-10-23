import { NextRequest, NextResponse } from "next/server";
import sqlFoods from "@/lib/db-foods";
import { requireAdminSession } from "@/lib/admin-auth";
import { SLUG_RE, listPizzarias } from "@/lib/foods";

export async function POST(req: NextRequest) {
  const denied = await requireAdminSession();
  if (denied) return denied;

  const body = await req.json().catch(() => ({}));
  const slug = String(body.slug ?? "").trim().toLowerCase();
  const nome = String(body.nome ?? "").trim();

  if (!SLUG_RE.test(slug)) {
    return NextResponse.json(
      { error: "Slug inválido. Use letras minúsculas, números e hífen (máx. 49 caracteres)." },
      { status: 400 }
    );
  }
  if (!nome) return NextResponse.json({ error: "Informe o nome da pizzaria." }, { status: 400 });

  const pizzaria = JSON.stringify({ nome });
  const cardapio = JSON.stringify({ categorias: [], tamanhos: [], bordas: [], adicionais: [] });

  try {
    await sqlFoods`
      INSERT INTO pizzarias (slug, pizzaria, cardapio, publicado)
      VALUES (${slug}, ${pizzaria}::text::jsonb, ${cardapio}::text::jsonb, false)
    `;
  } catch (e) {
    if ((e as { code?: string }).code === "23505") {
      return NextResponse.json({ error: "Já existe uma pizzaria com esse slug." }, { status: 409 });
    }
    throw e;
  }

  const created = (await listPizzarias()).find(p => p.slug === slug);
  return NextResponse.json(created, { status: 201 });
}
