export const dynamic = "force-dynamic";

import { listPizzarias } from "@/lib/foods";
import { listAcessos } from "@/lib/foods-acessos";
import { AcessosList } from "./acessos-list";

export default async function AcessosPage() {
  const [acessos, pizzarias] = await Promise.all([listAcessos(), listPizzarias()]);
  return (
    <AcessosList
      initial={acessos}
      pizzarias={pizzarias.map(p => ({ slug: p.slug, nome: p.nome }))}
    />
  );
}
