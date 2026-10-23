import postgres from "postgres";

type Sql = ReturnType<typeof postgres>;

let instance: Sql | undefined;

function get(): Sql {
  if (!instance) {
    instance = postgres(process.env.FOODS_DATABASE_URL!, {
      prepare: false, max: 5, idle_timeout: 20, onnotice: () => {},
    });
  }
  return instance;
}

const sqlFoods = new Proxy(function () {} as unknown as Sql, {
  apply(_t, _this, args) {
    return (get() as unknown as (...a: unknown[]) => unknown)(...args);
  },
  get(_t, prop) {
    return (get() as unknown as Record<string | symbol, unknown>)[prop];
  },
});

export default sqlFoods;
