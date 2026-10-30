import { NextRequest, NextResponse } from "next/server";
import sqlFoods from "@/lib/db-foods";
import { requireAdminSession } from "@/lib/admin-auth";
import { listPizzarias } from "@/lib/foods";
import { log } from "@/lib/auditoria";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const denied = await requireAdminSession();
  if (denied) return denied;

  const { slug } = await params;
  const body = await req.json().catch(() => ({}));

  if (typeof body.publicado === "boolean") {
    await sqlFoods`UPDATE pizzarias SET publicado = ${body.publicado}, atualizado_em = now() WHERE slug = ${slug}`;
    await log("update", "pizzaria", slug, { publicado: body.publicado });
  }

  if (body.plano === "normal" || body.plano === "premium") {
    await sqlFoods`UPDATE pizzarias SET plano = ${body.plano} WHERE slug = ${slug}`;
    await log("update", "pizzaria", slug, { plano: body.plano });
  }

  const row = (await listPizzarias()).find(p => p.slug === slug);
  if (!row) return NextResponse.json({ error: "Pizzaria não encontrada." }, { status: 404 });
  return NextResponse.json(row);
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const denied = await requireAdminSession();
  if (denied) return denied;

  const { slug } = await params;
  await sqlFoods`DELETE FROM pizzarias WHERE slug = ${slug}`;
  await log("delete", "pizzaria", slug);
  return NextResponse.json({ ok: true });
}
