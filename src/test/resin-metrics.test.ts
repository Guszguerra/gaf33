import { beforeEach, describe, it, expect, vi } from "vitest";
import { resinMetrics } from "@/lib/resin-metrics.server";

beforeEach(() => {
  vi.stubGlobal(
    "fetch",
    vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      const payload = url.includes("elegoo.com")
        ? {
            variants: [
              {
                options: ["1KG", "#Grey"],
                price: 2399,
                available: true,
              },
            ],
          }
        : { rates: { BRL: 5 } };
      return new Response(JSON.stringify(payload), { status: 200 });
    }),
  );
});

describe("resinMetrics", () => {
  it("uses the current Elegoo gray resin price converted to BRL per liter", async () => {
    const result = await resinMetrics(15, "simple");
    expect(result.resinPrice.pricePerLiter).toBeCloseTo(23.99 * 5 * 1.1);
    expect(result.resinPrice.source).toBe("elegoo");
  });

  it("taller figure costs more", async () => {
    expect((await resinMetrics(30, "simple")).price).toBeGreaterThan(
      (await resinMetrics(15, "simple")).price,
    );
  });

  it("detailed paint costs more than simple", async () => {
    expect((await resinMetrics(20, "detailed")).price).toBeGreaterThan(
      (await resinMetrics(20, "simple")).price,
    );
  });
});
