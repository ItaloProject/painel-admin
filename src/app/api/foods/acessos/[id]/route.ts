import { NextRequest, NextResponse } from "next/server";
import sqlFoods from "@/lib/db-foods";
import { requireAdminSession } from "@/lib/admin-auth";
import { getAcesso, otherAdminsCount } from "@/lib/foods-acessos";

const LAST_ADMIN = "Não é possível remover o último admin do cardápio.";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const denied = await requireAdminSession();
  if (denied) return denied;

  const { id } = await params;
  if (!/^\d+$/.test(id)) return NextResponse.json({ error: "Acesso inválido." }, { status: 400 });

  const current = await getAcesso(id);
  if (!current) return NextResponse.json({ error: "Acesso não encontrado." }, { status: 404 });

  const body = await req.json().catch(() => ({}));

  // Bloqueio/desbloqueio: aceita PATCH { bloqueado } isolado
  if (typeof body.bloqueado === "boolean" && Object.keys(body).length === 1) {
    await sqlFoods`UPDATE acessos SET bloqueado = ${body.bloqueado} WHERE id = ${id}::bigint`;
    return NextResponse.json(await getAcesso(id));
  }

  const papel = body.papel ?? current.papel;
  const slug = papel === "dono" ? String(body.pizzaria_slug ?? current.pizzaria_slug ?? "").trim() : null;

  if (papel !== "admin" && papel !== "dono") return NextResponse.json({ error: "Papel inválido." }, { status: 400 });
  if (papel === "dono" && !slug) return NextResponse.json({ error: "Escolha a pizzaria do dono." }, { status: 400 });
  if (current.papel === "admin" && papel !== "admin" && (await otherAdminsCount(id)) === 0) {
    return NextResponse.json({ error: LAST_ADMIN }, { status: 400 });
  }

  try {
    await sqlFoods`UPDATE acessos SET papel = ${papel}, pizzaria_slug = ${slug} WHERE id = ${id}::bigint`;
  } catch (e) {
    const code = (e as { code?: string }).code;
    if (code === "23505") return NextResponse.json({ error: "Esse acesso já existe." }, { status: 409 });
    if (code === "23503") return NextResponse.json({ error: "Pizzaria não encontrada." }, { status: 400 });
    throw e;
  }

  return NextResponse.json(await getAcesso(id));
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const denied = await requireAdminSession();
  if (denied) return denied;

  const { id } = await params;
  if (!/^\d+$/.test(id)) return NextResponse.json({ error: "Acesso inválido." }, { status: 400 });

  const current = await getAcesso(id);
  if (!current) return NextResponse.json({ ok: true });
  if (current.papel === "admin" && (await otherAdminsCount(id)) === 0) {
    return NextResponse.json({ error: LAST_ADMIN }, { status: 400 });
  }

  await sqlFoods`DELETE FROM acessos WHERE id = ${id}::bigint`;
  return NextResponse.json({ ok: true });
}
