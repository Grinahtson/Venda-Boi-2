import { storage } from "./storage";

interface PriceSuggestion {
  suggestedPricePerHead: number;
  suggestedPricePerArroba: number;
  confidence: "high" | "medium" | "low";
  marketTrend: "up" | "down" | "stable";
  reasoning: string[];
  priceRange: {
    min: number;
    max: number;
  };
  regionComparison: {
    avgPrice: number;
    percentile: number;
  };
}

interface PricingInput {
  category: string;
  breed: string;
  weight: number;
  quantity: number;
  state: string;
  carcassYield?: number;
}

const BREED_PREMIUMS: Record<string, number> = {
  "Nelore": 1.0,
  "Angus": 1.15,
  "Brahman": 1.05,
  "Hereford": 1.10,
  "Senepol": 1.12,
  "Wagyu": 1.50,
  "Nelore CEIP": 1.08,
  "Brangus": 1.10,
  "Tabapuã": 1.02,
  "Guzerá": 0.98,
};

const CATEGORY_FACTORS: Record<string, number> = {
  "boi-gordo": 1.0,
  "novilhas": 0.92,
  "garrotes": 0.95,
  "vacas-gordas": 0.85,
  "vacas-magras": 0.70,
  "bezerros": 1.10,
  "bezerras": 1.05,
  "touros": 1.25,
};

const STATE_AVG_PRICES: Record<string, number> = {
  "SP": 310,
  "MS": 295,
  "MT": 285,
  "GO": 290,
  "MG": 305,
  "PR": 308,
  "RS": 300,
  "BA": 275,
  "TO": 270,
  "PA": 265,
  "RO": 260,
  "AC": 255,
  "MA": 268,
  "PI": 265,
  "RN": 270,
  "CE": 272,
  "PE": 275,
  "AL": 273,
  "SE": 274,
  "ES": 298,
  "RJ": 302,
  "SC": 305,
  "AM": 250,
  "AP": 248,
  "RR": 245,
  "DF": 295,
};

export async function calculatePriceSuggestion(input: PricingInput): Promise<PriceSuggestion> {
  const reasoning: string[] = [];
  
  const baseArrobaPrice = STATE_AVG_PRICES[input.state] || 280;
  reasoning.push(`Preço base da arroba em ${input.state}: R$ ${baseArrobaPrice.toFixed(2)}`);
  
  const breedPremium = BREED_PREMIUMS[input.breed] || 1.0;
  if (breedPremium !== 1.0) {
    reasoning.push(`Ajuste por raça ${input.breed}: ${breedPremium > 1 ? "+" : ""}${((breedPremium - 1) * 100).toFixed(0)}%`);
  }
  
  const categoryFactor = CATEGORY_FACTORS[input.category.toLowerCase()] || 1.0;
  if (categoryFactor !== 1.0) {
    reasoning.push(`Ajuste por categoria: ${categoryFactor > 1 ? "+" : ""}${((categoryFactor - 1) * 100).toFixed(0)}%`);
  }
  
  let weightFactor = 1.0;
  if (input.weight > 500) {
    weightFactor = 1.05;
    reasoning.push("Bônus por peso acima de 500kg: +5%");
  } else if (input.weight < 200) {
    weightFactor = 0.95;
    reasoning.push("Ajuste por peso abaixo de 200kg: -5%");
  }
  
  let quantityDiscount = 1.0;
  if (input.quantity >= 100) {
    quantityDiscount = 0.97;
    reasoning.push("Desconto para lote grande (100+): -3%");
  } else if (input.quantity >= 50) {
    quantityDiscount = 0.98;
    reasoning.push("Desconto para lote médio (50+): -2%");
  }
  
  const carcassMultiplier = input.carcassYield ? (input.carcassYield / 52) : 1.0;
  if (input.carcassYield && input.carcassYield !== 52) {
    reasoning.push(`Ajuste por rendimento de carcaça (${input.carcassYield}%): ${carcassMultiplier > 1 ? "+" : ""}${((carcassMultiplier - 1) * 100).toFixed(1)}%`);
  }
  
  const adjustedArrobaPrice = baseArrobaPrice * breedPremium * categoryFactor * weightFactor * quantityDiscount * carcassMultiplier;
  
  const arrobasPerAnimal = input.weight / 15;
  const suggestedPricePerHead = adjustedArrobaPrice * arrobasPerAnimal;
  
  const variance = 0.08;
  const minPrice = suggestedPricePerHead * (1 - variance);
  const maxPrice = suggestedPricePerHead * (1 + variance);
  
  let confidence: "high" | "medium" | "low" = "medium";
  if (BREED_PREMIUMS[input.breed] && STATE_AVG_PRICES[input.state]) {
    confidence = "high";
  } else if (!BREED_PREMIUMS[input.breed] && !STATE_AVG_PRICES[input.state]) {
    confidence = "low";
  }
  
  let marketTrend: "up" | "down" | "stable" = "stable";
  const currentMonth = new Date().getMonth();
  if (currentMonth >= 3 && currentMonth <= 5) {
    marketTrend = "up";
    reasoning.push("Tendência de alta no período de entressafra");
  } else if (currentMonth >= 9 && currentMonth <= 11) {
    marketTrend = "down";
    reasoning.push("Tendência de baixa no período de safra");
  }
  
  const avgPrice = Object.values(STATE_AVG_PRICES).reduce((a, b) => a + b, 0) / Object.values(STATE_AVG_PRICES).length;
  const sortedPrices = Object.values(STATE_AVG_PRICES).sort((a, b) => a - b);
  const statePrice = STATE_AVG_PRICES[input.state] || avgPrice;
  const percentileIndex = sortedPrices.findIndex(p => p >= statePrice);
  const percentile = Math.round((percentileIndex / sortedPrices.length) * 100);

  return {
    suggestedPricePerHead: Math.round(suggestedPricePerHead * 100) / 100,
    suggestedPricePerArroba: Math.round(adjustedArrobaPrice * 100) / 100,
    confidence,
    marketTrend,
    reasoning,
    priceRange: {
      min: Math.round(minPrice * 100) / 100,
      max: Math.round(maxPrice * 100) / 100,
    },
    regionComparison: {
      avgPrice: Math.round(avgPrice * 100) / 100,
      percentile,
    },
  };
}

export async function getMarketInsights(state: string) {
  const statePrice = STATE_AVG_PRICES[state] || 280;
  const nationalAvg = Object.values(STATE_AVG_PRICES).reduce((a, b) => a + b, 0) / Object.values(STATE_AVG_PRICES).length;
  
  const topStates = Object.entries(STATE_AVG_PRICES)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([s, p]) => ({ state: s, price: p }));
  
  return {
    currentState: {
      state,
      price: statePrice,
      vsNational: ((statePrice - nationalAvg) / nationalAvg * 100).toFixed(1) + "%",
    },
    nationalAverage: Math.round(nationalAvg * 100) / 100,
    topStates,
    lastUpdated: new Date().toISOString(),
  };
}
