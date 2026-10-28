import { NextRequest, NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/admin-auth";
import { marcarPago, desmarcarPago, getCobranca } from "@/lib/cobrancas";
import { log } from "@/lib/auditoria";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const denied = await requireAdminSession();
  if (denied) return denied;

  const { id } = await params;
  if (!/^\d+$/.test(id)) return NextResponse.json({ error: "ID inválido." }, { status: 400 });

  const body = await req.json().catch(() => ({}));
  const { status } = body as { status?: string };

  if (status === "pago") {
    await marcarPago(id);
    await log("update", "configuracao", `cobranca:${id}`, { status: "pago" });
  } else if (status === "pendente") {
    await desmarcarPago(id);
    await log("update", "configuracao", `cobranca:${id}`, { status: "pendente" });
  } else {
    return NextResponse.json({ error: "Status inválido. Use 'pago' ou 'pendente'." }, { status: 400 });
  }

  const updated = await getCobranca(id);
  return NextResponse.json(updated);
}
