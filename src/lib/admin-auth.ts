import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function requireAdminSession(): Promise<NextResponse | null> {
  const jar = await cookies();
  const session = jar.get("admin_session")?.value;
  if (!session) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }
  return null;
}
