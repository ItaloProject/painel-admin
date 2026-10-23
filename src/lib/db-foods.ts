import postgres from "postgres";

const create = () =>
  postgres(process.env.FOODS_DATABASE_URL!, { prepare: false, max: 5, idle_timeout: 20, onnotice: () => {} });

const cache = globalThis as unknown as { __sql_foods?: ReturnType<typeof create> };
const sqlFoods = cache.__sql_foods ?? create();
if (process.env.NODE_ENV !== "production") cache.__sql_foods = sqlFoods;

export default sqlFoods;
