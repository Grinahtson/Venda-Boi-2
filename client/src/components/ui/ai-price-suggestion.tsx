import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Sparkles, TrendingUp, TrendingDown, Minus, Loader2, Brain, Target, BarChart3 } from "lucide-react";
import { cn } from "@/lib/utils";

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

interface AIPriceSuggestionProps {
  category: string;
  breed: string;
  weight: number;
  quantity: number;
  state: string;
  carcassYield?: number;
  onApplyPrice: (pricePerHead: number, pricePerArroba: number) => void;
}

export function AIPriceSuggestion({
  category,
  breed,
  weight,
  quantity,
  state,
  carcassYield,
  onApplyPrice,
}: AIPriceSuggestionProps) {
  const [suggestion, setSuggestion] = useState<PriceSuggestion | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canFetch = category && breed && weight > 0 && quantity > 0 && state;

  const fetchSuggestion = async () => {
    if (!canFetch) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/pricing/suggest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ category, breed, weight, quantity, state, carcassYield }),
      });

      if (!response.ok) {
        throw new Error("Erro ao obter sugestão de preço");
      }

      const data = await response.json();
      setSuggestion(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case "up":
        return <TrendingUp className="h-4 w-4 text-green-500" />;
      case "down":
        return <TrendingDown className="h-4 w-4 text-red-500" />;
      default:
        return <Minus className="h-4 w-4 text-yellow-500" />;
    }
  };

  const getConfidenceColor = (confidence: string) => {
    switch (confidence) {
      case "high":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      case "medium":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
      default:
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
    }
  };

  const getConfidenceLabel = (confidence: string) => {
    switch (confidence) {
      case "high":
        return "Alta";
      case "medium":
        return "Média";
      default:
        return "Baixa";
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  if (!canFetch) {
    return (
      <Card className="border-dashed border-2 border-muted-foreground/20">
        <CardContent className="py-6 text-center text-muted-foreground">
          <Brain className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">
            Preencha categoria, raça, peso, quantidade e estado para receber uma sugestão de preço da IA.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Sparkles className="h-5 w-5 text-primary" />
          Sugestão de Preço com IA
        </CardTitle>
      </CardHeader>
      <CardContent>
        {!suggestion && !loading && (
          <div className="text-center py-4">
            <p className="text-sm text-muted-foreground mb-4">
              Nossa IA analisa dados de mercado, região e características do animal para sugerir o melhor preço.
            </p>
            <Button onClick={fetchSuggestion} className="gap-2" data-testid="button-get-ai-price">
              <Brain className="h-4 w-4" />
              Obter Sugestão de Preço
            </Button>
          </div>
        )}

        {loading && (
          <div className="text-center py-8">
            <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary mb-2" />
            <p className="text-sm text-muted-foreground">Analisando mercado e calculando preço ideal...</p>
          </div>
        )}

        {error && (
          <div className="text-center py-4 text-red-500">
            <p className="text-sm">{error}</p>
            <Button variant="outline" onClick={fetchSuggestion} className="mt-2">
              Tentar novamente
            </Button>
          </div>
        )}

        {suggestion && !loading && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Badge className={cn("font-normal", getConfidenceColor(suggestion.confidence))}>
                  Confiança: {getConfidenceLabel(suggestion.confidence)}
                </Badge>
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  {getTrendIcon(suggestion.marketTrend)}
                  <span>
                    Mercado {suggestion.marketTrend === "up" ? "em alta" : suggestion.marketTrend === "down" ? "em baixa" : "estável"}
                  </span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-card rounded-lg p-4 border">
                <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
                  <Target className="h-4 w-4" />
                  Preço por Cabeça
                </div>
                <p className="text-2xl font-bold text-primary">
                  {formatCurrency(suggestion.suggestedPricePerHead)}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Faixa: {formatCurrency(suggestion.priceRange.min)} - {formatCurrency(suggestion.priceRange.max)}
                </p>
              </div>

              <div className="bg-card rounded-lg p-4 border">
                <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
                  <BarChart3 className="h-4 w-4" />
                  Preço por Arroba
                </div>
                <p className="text-2xl font-bold text-primary">
                  {formatCurrency(suggestion.suggestedPricePerArroba)}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Média nacional: {formatCurrency(suggestion.regionComparison.avgPrice)}
                </p>
              </div>
            </div>

            <div className="bg-muted/50 rounded-lg p-3">
              <p className="text-sm font-medium mb-2">Análise de Mercado:</p>
              <ul className="text-sm text-muted-foreground space-y-1">
                {suggestion.reasoning.map((reason, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="text-primary">•</span>
                    {reason}
                  </li>
                ))}
              </ul>
            </div>

            <div className="flex gap-2">
              <Button
                onClick={() => onApplyPrice(suggestion.suggestedPricePerHead, suggestion.suggestedPricePerArroba)}
                className="flex-1 gap-2"
                data-testid="button-apply-ai-price"
              >
                <Sparkles className="h-4 w-4" />
                Aplicar Preço Sugerido
              </Button>
              <Button variant="outline" onClick={fetchSuggestion} data-testid="button-refresh-ai-price">
                Recalcular
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
