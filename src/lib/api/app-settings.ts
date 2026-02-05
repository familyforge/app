import { supabase, isSupabaseConfigured } from './supabase';
import { PLAN_PRICES } from '../utils/currency';

export type AppPlanPrices = {
  free: { monthly: number; yearly: number };
  pro: { monthly: number; yearly: number };
  forge: { monthly: number; yearly: number };
};

export type TrialOffer = {
  enabled: boolean;
  label: string;
  firstMonthPrice: number;
  durationDays: number;
  targetPlanId: "forge" | "pro";
};

export type AppPricingConfig = {
  planPrices: AppPlanPrices;
  mostPopularPlanId: "pro" | "forge";
  trialOffer: TrialOffer;
};

const DEFAULT_PRICING_CONFIG: AppPricingConfig = {
  planPrices: PLAN_PRICES,
  mostPopularPlanId: "forge",
  trialOffer: {
    enabled: false,
    label: "Forge Trial",
    firstMonthPrice: 1.99,
    durationDays: 30,
    targetPlanId: "forge",
  },
};

const normalizeNumber = (value: unknown, fallback: number): number => {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }
  return fallback;
};

const normalizePlanPrices = (input: unknown): AppPlanPrices => {
  const raw = input as Partial<AppPlanPrices> | undefined;
  return {
    free: {
      monthly: normalizeNumber(raw?.free?.monthly, PLAN_PRICES.free.monthly),
      yearly: normalizeNumber(raw?.free?.yearly, PLAN_PRICES.free.yearly),
    },
    pro: {
      monthly: normalizeNumber(raw?.pro?.monthly, PLAN_PRICES.pro.monthly),
      yearly: normalizeNumber(raw?.pro?.yearly, PLAN_PRICES.pro.yearly),
    },
    forge: {
      monthly: normalizeNumber(raw?.forge?.monthly, PLAN_PRICES.forge.monthly),
      yearly: normalizeNumber(raw?.forge?.yearly, PLAN_PRICES.forge.yearly),
    },
  };
};

const normalizePricingConfig = (input: unknown): AppPricingConfig => {
  const raw = input as Partial<AppPricingConfig> & { prices?: unknown };
  return {
    planPrices: normalizePlanPrices(raw?.planPrices ?? raw?.prices ?? raw),
    mostPopularPlanId: raw?.mostPopularPlanId === "pro" ? "pro" : "forge",
    trialOffer: {
      enabled: Boolean(raw?.trialOffer?.enabled),
      label: raw?.trialOffer?.label || DEFAULT_PRICING_CONFIG.trialOffer.label,
      firstMonthPrice: normalizeNumber(raw?.trialOffer?.firstMonthPrice, DEFAULT_PRICING_CONFIG.trialOffer.firstMonthPrice),
      durationDays: normalizeNumber(raw?.trialOffer?.durationDays, DEFAULT_PRICING_CONFIG.trialOffer.durationDays),
      targetPlanId: raw?.trialOffer?.targetPlanId === "pro" ? "pro" : "forge",
    },
  };
};

export async function getAppPricingConfig(): Promise<AppPricingConfig> {
  if (!isSupabaseConfigured()) {
    return DEFAULT_PRICING_CONFIG;
  }

  const { data, error } = await (supabase as unknown as { from: (table: string) => any })
    .from('app_settings')
    .select('plan_prices')
    .eq('key', 'subscription_prices')
    .maybeSingle();

  if (error) {
    console.warn('Failed to fetch app settings:', error.message);
    return DEFAULT_PRICING_CONFIG;
  }

  if (!data?.plan_prices) {
    return DEFAULT_PRICING_CONFIG;
  }

  return normalizePricingConfig(data.plan_prices);
}

export async function getAppPlanPrices(): Promise<AppPlanPrices> {
  const config = await getAppPricingConfig();
  return config.planPrices;
}
