import { afterEach, describe, expect, it, vi } from "vitest";
import { autoCategorize, DEFAULT_RULES, getAllRules, loadCustomRules, saveCustomRules } from "./autoCategorize";

function memoria(inicial: Record<string, string> = {}) {
  const store = new Map(Object.entries(inicial));
  vi.stubGlobal("localStorage", {
    getItem: (k: string) => store.get(k) ?? null,
    setItem: (k: string, v: string) => {
      store.set(k, v);
    },
    removeItem: (k: string) => {
      store.delete(k);
    },
  });
}

describe("reglas de categorización en localStorage", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("sin nada guardado devuelve una lista vacía", () => {
    memoria();
    expect(loadCustomRules()).toEqual([]);
  });

  it("recupera una lista válida tal como se guardó", () => {
    memoria();
    const reglas = [{ keywords: ["taller propio"], category: "Coche", priority: 3 }];
    saveCustomRules(reglas);
    expect(loadCustomRules()).toEqual(reglas);
  });

  it("un JSON roto o que no es una lista no tumba el importador", () => {
    memoria({ customCategorizationRules: "{no es json" });
    expect(loadCustomRules()).toEqual([]);
    expect(() => getAllRules()).not.toThrow();
    expect(getAllRules()).toHaveLength(DEFAULT_RULES.length);

    memoria({ customCategorizationRules: JSON.stringify({ keywords: ["x"] }) });
    expect(loadCustomRules()).toEqual([]);
  });

  it("mercadona sigue siendo Alimentación", () => {
    expect(autoCategorize("mercadona")).toBe("Alimentación");
  });

  it("una regla sin keywords se ignora y una válida con más prioridad sigue ganando", () => {
    const rota = { keywords: undefined, category: "Rota", priority: 99 } as unknown as (typeof DEFAULT_RULES)[number];
    expect(autoCategorize("mercadona", [rota, ...DEFAULT_RULES])).toBe("Alimentación");
    expect(autoCategorize("mercadona", [null as unknown as (typeof DEFAULT_RULES)[number]])).toBeNull();
    expect(autoCategorize("mercadona", [{ keywords: ["mercadona"], category: "Propia", priority: 50 }])).toBe("Propia");
  });
});
