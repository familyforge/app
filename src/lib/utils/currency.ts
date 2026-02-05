// Currency utility for dynamic pricing based on country

export interface PriceInfo {
  symbol: string;
  amount: number;
  formatted: string;
}

// European countries (will show Euro)
const EURO_COUNTRIES = [
  "Austria", "Belgium", "Cyprus", "Estonia", "Finland", "France", "Germany",
  "Greece", "Ireland", "Italy", "Latvia", "Lithuania", "Luxembourg", "Malta",
  "Netherlands", "Portugal", "Slovakia", "Slovenia", "Spain", "Andorra",
  "Monaco", "San Marino", "Vatican City", "Montenegro", "Kosovo"
];

// Dollar countries (USA, Canada, and other western non-European)
const DOLLAR_COUNTRIES = [
  "United States", "Canada", "Australia", "New Zealand", "Singapore",
  "Hong Kong", "Taiwan", "Japan", "South Korea", "Mexico", "Brazil",
  "Argentina", "Chile", "Colombia", "Peru"
];

// UK uses Pounds (base currency)
const POUND_COUNTRIES = ["United Kingdom", "UK", "Great Britain", "England", "Scotland", "Wales", "Northern Ireland"];

// Nigeria uses Naira with multiplier
const NAIRA_COUNTRIES = ["Nigeria"];

export type CurrencyType = "pound" | "euro" | "dollar" | "naira";

export function getCurrencyType(country: string | undefined | null): CurrencyType {
  if (!country) return "pound"; // Default to pound
  
  const normalizedCountry = country.trim();
  
  if (POUND_COUNTRIES.some(c => c.toLowerCase() === normalizedCountry.toLowerCase())) {
    return "pound";
  }
  
  if (NAIRA_COUNTRIES.some(c => c.toLowerCase() === normalizedCountry.toLowerCase())) {
    return "naira";
  }
  
  if (EURO_COUNTRIES.some(c => c.toLowerCase() === normalizedCountry.toLowerCase())) {
    return "euro";
  }
  
  if (DOLLAR_COUNTRIES.some(c => c.toLowerCase() === normalizedCountry.toLowerCase())) {
    return "dollar";
  }
  
  // Default to pound for unknown countries
  return "pound";
}

export function getCurrencySymbol(currencyType: CurrencyType): string {
  switch (currencyType) {
    case "pound": return "£";
    case "euro": return "€";
    case "dollar": return "$";
    case "naira": return "₦";
  }
}

export function formatPrice(basePrice: number, currencyType: CurrencyType): PriceInfo {
  const symbol = getCurrencySymbol(currencyType);
  
  // Nigeria: multiply by 1000
  const amount = currencyType === "naira" ? basePrice * 1000 : basePrice;
  
  // Format with proper number formatting
  let formatted: string;
  if (currencyType === "naira") {
    // Naira uses comma for thousands
    formatted = `${symbol}${amount.toLocaleString("en-NG", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
  } else {
    formatted = `${symbol}${amount.toFixed(2)}`;
  }
  
  return { symbol, amount, formatted };
}

export function formatDailyPrice(monthlyPrice: number, currencyType: CurrencyType): string {
  const dailyBase = monthlyPrice / 30;
  const priceInfo = formatPrice(dailyBase, currencyType);
  
  if (currencyType === "naira") {
    return `${priceInfo.symbol}${Math.round(priceInfo.amount).toLocaleString("en-NG")}`;
  }
  
  return priceInfo.formatted;
}

// Base prices in GBP (Pounds)
export const PLAN_PRICES = {
  free: {
    monthly: 0,
    yearly: 0,
  },
  pro: {
    monthly: 6.99,
    yearly: 5.24, // per month when billed yearly (25% off)
  },
  forge: {
    monthly: 9.99,
    yearly: 7.49, // per month when billed yearly (25% off)
  },
} as const;

export type PlanType = keyof typeof PLAN_PRICES;
