import { useState, useCallback } from "react";
import { calculateProfit, CalculatorInputs, CalculatorResults } from "@/lib/calculations";

export function useCalculator() {
  const [inputs, setInputs] = useState<CalculatorInputs>({
    weight: 300,
    quantity: 50,
    buyPrice: 2200,
    sellPrice: 2800,
    yieldPercentage: 50,
    purchaseArrobaQuote: 220,
    purchaseMode: "head",
    totalLiveWeight: 15000,
  });

  const [results, setResults] = useState<CalculatorResults>(calculateProfit(inputs));

  const updateInput = useCallback((key: keyof CalculatorInputs, value: any) => {
    setInputs((prev) => {
      const updated = { ...prev, [key]: value };
      setResults(calculateProfit(updated));
      return updated;
    });
  }, []);

  const reset = useCallback(() => {
    const defaultInputs: CalculatorInputs = {
      weight: 300,
      quantity: 50,
      buyPrice: 2200,
      sellPrice: 2800,
      yieldPercentage: 50,
      purchaseArrobaQuote: 220,
      purchaseMode: "head",
      totalLiveWeight: 15000,
    };
    setInputs(defaultInputs);
    setResults(calculateProfit(defaultInputs));
  }, []);

  return { inputs, results, updateInput, reset };
}
