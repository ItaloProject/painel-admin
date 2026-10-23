export const dynamic = "force-dynamic";

import { listPizzarias } from "@/lib/foods";
import { PizzariasList } from "./pizzarias-list";

export default async function PizzariasPage() {
  return <PizzariasList initial={await listPizzarias()} />;
}
