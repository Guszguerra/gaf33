export const DEFAULT_RESIN_PRICE_PER_LITER = 200;

const ELEGOO_PRODUCT_URL = "https://www.elegoo.com/products/elegoo-standard-resin.js";
const EXCHANGE_RATE_URL = "https://api.frankfurter.app/latest?from=USD&to=BRL";
const LIQUID_DENSITY_KG_PER_LITER = 1.1;
const CACHE_TTL_MS = 30 * 60 * 1000;

export interface ResinPrice {
  pricePerLiter: number;
  source: "elegoo" | "fallback";
  productPriceUsdPerKg: number | null;
  usdToBrl: number | null;
  available: boolean | null;
}

interface CacheEntry {
  value: ResinPrice;
  expiresAt: number;
}

let cachedPrice: CacheEntry | null = null;
let pendingFetch: Promise<ResinPrice> | null = null;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function fallbackPrice(): ResinPrice {
  return {
    pricePerLiter: DEFAULT_RESIN_PRICE_PER_LITER,
    source: "fallback",
    productPriceUsdPerKg: null,
    usdToBrl: null,
    available: null,
  };
}

async function fetchJson(url: string): Promise<unknown> {
  const response = await fetch(url, { signal: AbortSignal.timeout(5000) });
  if (!response.ok) {
    throw new Error(`Request to ${url} failed with HTTP ${response.status}`);
  }
  return response.json();
}

async function loadCurrentResinPrice(): Promise<ResinPrice> {
  try {
    const [productPayload, exchangePayload] = await Promise.all([
      fetchJson(ELEGOO_PRODUCT_URL),
      fetchJson(EXCHANGE_RATE_URL),
    ]);

    if (!isRecord(productPayload) || !Array.isArray(productPayload.variants)) {
      throw new Error("Elegoo API returned an unexpected product format");
    }

    const grayVariant = productPayload.variants.find((variant: unknown) => {
      if (!isRecord(variant) || !Array.isArray(variant.options)) return false;
      return (
        variant.options.some((option: unknown) => option === "1KG") &&
        variant.options.some((option: unknown) => option === "#Grey")
      );
    });

    if (!isRecord(grayVariant) || typeof grayVariant.price !== "number") {
      throw new Error("Elegoo API did not return the 1KG gray resin variant");
    }

    if (!isRecord(exchangePayload) || !isRecord(exchangePayload.rates)) {
      throw new Error("Exchange-rate API returned an unexpected format");
    }

    const usdToBrl = exchangePayload.rates.BRL;
    if (typeof usdToBrl !== "number" || !Number.isFinite(usdToBrl) || usdToBrl <= 0) {
      throw new Error("Exchange-rate API did not return a valid USD/BRL rate");
    }

    const productPriceUsdPerKg = grayVariant.price / 100;
    const pricePerLiter = productPriceUsdPerKg * usdToBrl * LIQUID_DENSITY_KG_PER_LITER;
    if (!Number.isFinite(pricePerLiter) || pricePerLiter <= 0) {
      throw new Error("Calculated Elegoo resin price is invalid");
    }

    return {
      pricePerLiter,
      source: "elegoo",
      productPriceUsdPerKg,
      usdToBrl,
      available: typeof grayVariant.available === "boolean" ? grayVariant.available : null,
    };
  } catch (error) {
    console.warn(
      "Could not retrieve the current Elegoo resin price; using the local estimate.",
      error,
    );
    return fallbackPrice();
  }
}

export async function fetchCurrentResinPrice(): Promise<ResinPrice> {
  if (cachedPrice && cachedPrice.expiresAt > Date.now()) {
    return cachedPrice.value;
  }

  if (!pendingFetch) {
    pendingFetch = loadCurrentResinPrice().finally(() => {
      pendingFetch = null;
    });
  }

  const value = await pendingFetch;
  cachedPrice = {
    value,
    expiresAt: Date.now() + (value.source === "elegoo" ? CACHE_TTL_MS : 5 * 60 * 1000),
  };
  return value;
}
