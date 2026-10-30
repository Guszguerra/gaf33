export type PaintLevel = "none" | "simple" | "detailed";

export interface PricingInput {
  resinPricePerLiter: number; // R$/L
  resinMl: number; // ml usados
  supportWastePct: number; // % extra de resina em suportes/perdas
  printHours: number;
  printerKw: number; // potência em kW
  kwhPrice: number; // R$/kWh
  ipaCost: number; // R$ álcool isopropílico por peça
  laborHours: number; // pós-processamento
  laborRate: number; // R$/h
  paint: PaintLevel;
  paintSimple: number;
  paintDetailed: number;
  profitPct: number;
}

export const defaultInput: PricingInput = {
  resinPricePerLiter: 200,
  resinMl: 80,
  supportWastePct: 15,
  printHours: 6,
  printerKw: 0.06,
  kwhPrice: 0.9,
  ipaCost: 3,
  laborHours: 1.5,
  laborRate: 25,
  paint: "simple",
  paintSimple: 40,
  paintDetailed: 120,
  profitPct: 50,
};

export function calcPrice(i: PricingInput) {
  const resin = (i.resinMl / 1000) * i.resinPricePerLiter;
  const supports = resin * (i.supportWastePct / 100);
  const energy = i.printHours * i.printerKw * i.kwhPrice;
  const extras = supports + energy + i.ipaCost;
  const labor = i.laborHours * i.laborRate;
  const paint = i.paint === "none" ? 0 : i.paint === "simple" ? i.paintSimple : i.paintDetailed;
  const cost = resin + extras + labor + paint;
  const profit = cost * (i.profitPct / 100);
  return { resin, supports, energy, ipa: i.ipaCost, extras, labor, paint, cost, profit, price: cost + profit };
}
