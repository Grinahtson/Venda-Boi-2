export interface CalculatorInputs {
  weight: number;
  quantity: number;
  buyPrice: number;
  sellPrice: number;
  yieldPercentage: number;
  purchaseArrobaQuote: number;
  purchaseMode: "head" | "weight";
  totalLiveWeight: number;
}

export interface CalculatorResults {
  totalCost: number;
  totalRevenue: number;
  profit: number;
  margin: number;
  profitPerHead: number;
  realArroba: number;
  estimatedArrobas: number;
  status: "good" | "warning" | "bad" | "neutral";
}

export function calculateProfit(inputs: CalculatorInputs): CalculatorResults {
  let calculatedTotalCost = 0;
  let estimatedArrobas = 0;

  if (inputs.purchaseMode === "weight") {
    const carcassWeight = inputs.totalLiveWeight * (inputs.yieldPercentage / 100);
    estimatedArrobas = carcassWeight / 15;
    calculatedTotalCost = estimatedArrobas * inputs.purchaseArrobaQuote;
  } else {
    calculatedTotalCost = inputs.buyPrice * inputs.quantity;
    estimatedArrobas = (inputs.weight * inputs.quantity) * (inputs.yieldPercentage / 100) / 15;
  }

  const totalRevenue = inputs.sellPrice * inputs.quantity;
  const profit = totalRevenue - calculatedTotalCost;
  const profitPerHead = inputs.quantity > 0 ? profit / inputs.quantity : 0;
  const margin = totalRevenue > 0 ? (profit / totalRevenue) * 100 : 0;

  const arrobas = inputs.weight / 30;
  const realArroba = arrobas > 0 ? inputs.sellPrice / arrobas : 0;

  let status: "good" | "warning" | "bad" | "neutral" = "neutral";
  if (margin > 15) status = "good";
  else if (margin > 5) status = "warning";
  else if (margin < 0) status = "bad";

  return {
    totalCost: calculatedTotalCost,
    totalRevenue,
    profit,
    margin,
    profitPerHead,
    realArroba,
    estimatedArrobas,
    status,
  };
}

export function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function deg2rad(deg: number) {
  return deg * (Math.PI / 180);
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
}

export function formatDistance(distanceKm: number): string {
  if (distanceKm < 1) return "< 1 km";
  return `${Math.round(distanceKm)} km`;
}
