import { UtensilsCrossed } from "lucide-react";

export default function FoodsPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center gap-4">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-orange-500/10">
        <UtensilsCrossed className="h-8 w-8 text-orange-500" />
      </div>
      <div>
        <h1 className="text-xl font-bold text-foreground">MUVO Foods</h1>
        <p className="text-muted-foreground text-sm mt-1">Em desenvolvimento — em breve disponível aqui.</p>
      </div>
      <span className="rounded-full bg-orange-500/10 px-3 py-1 text-xs font-semibold text-orange-600">Em breve</span>
    </div>
  );
}
