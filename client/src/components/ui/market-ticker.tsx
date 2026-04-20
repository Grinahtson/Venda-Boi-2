import { marketQuotes } from "@/lib/data";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { useEffect, useState, useRef } from "react";

interface Quote {
  state: string;
  stateName?: string;
  category?: string;
  priceArroba: number;
  variation?: number;
  trend: "up" | "down" | "stable";
}

export function MarketTicker() {
  const [quotes, setQuotes] = useState<Quote[]>(marketQuotes);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    const fetchPrices = async () => {
      try {
        const response = await fetch('/api/market/arroba-prices');
        if (response.ok) {
          const data = await response.json();
          if (data.prices && data.prices.length > 0) {
            setQuotes(data.prices);
          }
        }
      } catch (error) {
        console.log('Using static market data');
      }
    };

    fetchPrices();
    const interval = setInterval(fetchPrices, 60000);
    return () => clearInterval(interval);
  }, []);

  const allQuotes = [...quotes, ...quotes];

  return (
    <div 
      className="w-full bg-gradient-to-r from-primary/5 via-primary/10 to-primary/5 border-y border-primary/20 overflow-hidden py-3"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      <style>
        {`
          @keyframes marquee {
            0% { transform: translateX(0); }
            100% { transform: translateX(-50%); }
          }
          .ticker-scroll {
            animation: marquee 25s linear infinite;
          }
          .ticker-scroll.paused {
            animation-play-state: paused;
          }
        `}
      </style>
      <div 
        ref={scrollRef}
        className={`inline-flex gap-8 md:gap-12 ticker-scroll ${isPaused ? 'paused' : ''}`}
        style={{ whiteSpace: 'nowrap' }}
      >
        {allQuotes.map((quote, i) => (
          <div 
            key={i} 
            className="flex items-center gap-2 md:gap-3 text-sm px-4 py-1.5 rounded-full bg-background/60 backdrop-blur-sm border border-primary/15 shadow-sm"
            data-testid={`ticker-quote-${quote.state}-${i}`}
          >
            <span className="font-bold text-primary font-serif text-sm">{quote.stateName || quote.state}</span>
            {quote.category && (
              <span className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                {quote.category}
              </span>
            )}
            <div className="flex items-center gap-1.5">
              <span className="text-muted-foreground text-xs">Boi @:</span>
              <span className="font-mono font-semibold text-sm">
                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(quote.priceArroba)}
              </span>
            </div>
            {quote.variation !== undefined && quote.variation !== 0 && (
              <span className={`text-xs font-medium ${quote.variation > 0 ? 'text-green-600' : 'text-red-500'}`}>
                {quote.variation > 0 ? '+' : ''}{quote.variation.toFixed(1)}%
              </span>
            )}
            {quote.trend === "up" && <TrendingUp className="h-4 w-4 text-green-600" />}
            {quote.trend === "down" && <TrendingDown className="h-4 w-4 text-red-500" />}
            {quote.trend === "stable" && <Minus className="h-4 w-4 text-muted-foreground" />}
          </div>
        ))}
      </div>
    </div>
  );
}
