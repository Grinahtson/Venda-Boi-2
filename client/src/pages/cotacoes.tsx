import { useEffect, useState } from "react";
import { TrendingUp, TrendingDown, Minus, RefreshCw, Clock, MapPin, Tag } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MarketTicker } from "@/components/ui/market-ticker";
import { PriceHistoryChart } from "@/components/ui/price-history-chart";

import boiGordoImg from "@assets/Boi_gordo_1765070356893.jfif";
import vacaGordaImg from "@assets/vaca_gorda_1765070356895.webp";
import bezerroImg from "@assets/bezerro_1765070356895.webp";
import bezerraImg from "@assets/bezerra_1765070356895.webp";
import novilhaImg from "@assets/novilha_1765070356896.png";
import vacaMagraImg from "@assets/Vaca_magra_1765070356892.webp";
import touroImg from "@assets/Touros_1765070356894.jfif";
import garrotesImg from "@assets/Garrotes_1765070356894.jpg";

const categoryImages: Record<string, string> = {
  "boi-gordo": boiGordoImg,
  "vacas-gordas": vacaGordaImg,
  "bezerros": bezerroImg,
  "bezerras": bezerraImg,
  "novilhas": novilhaImg,
  "vacas-magras": vacaMagraImg,
  "touros": touroImg,
  "garrotes": garrotesImg,
};

interface StatePrice {
  state: string;
  stateName: string;
  priceArroba: number;
  trend: "up" | "down" | "stable";
}

interface CategoryPrice {
  id: string;
  name: string;
  priceArroba: number;
  trend: "up" | "down" | "stable";
  description: string;
}

interface QuotesData {
  states: StatePrice[];
  categories: CategoryPrice[];
  updated: string;
  source?: string;
  realtime?: boolean;
}

export default function Cotacoes() {
  const [data, setData] = useState<QuotesData | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  const fetchQuotes = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/market/quotes');
      if (response.ok) {
        const result = await response.json();
        setData(result);
        setLastRefresh(new Date());
      }
    } catch (error) {
      console.error('Failed to fetch quotes:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuotes();
    const interval = setInterval(fetchQuotes, 120000);
    return () => clearInterval(interval);
  }, []);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  };

  const TrendIcon = ({ trend }: { trend: "up" | "down" | "stable" }) => {
    if (trend === "up") return <TrendingUp className="h-5 w-5 text-green-600" />;
    if (trend === "down") return <TrendingDown className="h-5 w-5 text-red-500" />;
    return <Minus className="h-5 w-5 text-muted-foreground" />;
  };

  const TrendBadge = ({ trend }: { trend: "up" | "down" | "stable" }) => {
    const colors = {
      up: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
      down: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
      stable: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400"
    };
    const labels = { up: "Alta", down: "Baixa", stable: "Estável" };
    
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${colors[trend]}`}>
        {labels[trend]}
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-background">
      <MarketTicker />
      
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-foreground font-serif">
              Cotação do Dia - Boi Gordo
            </h1>
            <p className="text-muted-foreground mt-2">
              Preços da arroba do boi gordo por estado, atualizados em tempo real
            </p>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="h-4 w-4" />
              <span>Atualizado às {formatTime(lastRefresh)}</span>
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={fetchQuotes}
              disabled={loading}
              data-testid="button-refresh-quotes"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Atualizar
            </Button>
          </div>
        </div>

        <Tabs defaultValue="categories" className="w-full">
          <TabsList className="grid w-full max-w-md grid-cols-2 mb-8">
            <TabsTrigger value="categories" className="gap-2" data-testid="tab-categories">
              <Tag className="h-4 w-4" />
              Por Categoria
            </TabsTrigger>
            <TabsTrigger value="states" className="gap-2" data-testid="tab-states">
              <MapPin className="h-4 w-4" />
              Por Estado
            </TabsTrigger>
          </TabsList>

          <TabsContent value="categories">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {data?.categories.map((category) => (
                <Card 
                  key={category.id} 
                  className="hover:shadow-lg transition-shadow border-primary/10 overflow-hidden"
                  data-testid={`card-category-${category.id}`}
                >
                  {categoryImages[category.id] && (
                    <div className="relative h-36 w-full overflow-hidden">
                      <img 
                        src={categoryImages[category.id]} 
                        alt={category.name}
                        className="w-full h-full object-cover object-center"
                        style={{ objectPosition: 'center 30%' }}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                      <div className="absolute top-2 right-2">
                        <TrendIcon trend={category.trend} />
                      </div>
                    </div>
                  )}
                  <CardHeader className={categoryImages[category.id] ? "pb-2 pt-3" : "pb-2"}>
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-lg font-serif">{category.name}</CardTitle>
                      {!categoryImages[category.id] && <TrendIcon trend={category.trend} />}
                    </div>
                    <p className="text-xs text-muted-foreground">{category.description}</p>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-end justify-between">
                      <div>
                        <p className="text-2xl font-bold font-mono text-primary">
                          {formatCurrency(category.priceArroba)}
                        </p>
                        <p className="text-xs text-muted-foreground">por arroba</p>
                      </div>
                      <TrendBadge trend={category.trend} />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="states">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {data?.states.map((state) => (
                <Card 
                  key={state.state} 
                  className="hover:shadow-lg transition-shadow border-primary/10"
                  data-testid={`card-state-${state.state}`}
                >
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-xl font-bold text-primary">{state.state}</CardTitle>
                        <p className="text-sm text-muted-foreground">{state.stateName}</p>
                      </div>
                      <TrendIcon trend={state.trend} />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-end justify-between">
                      <div>
                        <p className="text-2xl font-bold font-mono">
                          {formatCurrency(state.priceArroba)}
                        </p>
                        <p className="text-xs text-muted-foreground">por arroba</p>
                      </div>
                      <TrendBadge trend={state.trend} />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>

        <PriceHistoryChart />

        <Card className="mt-8 bg-primary/5 border-primary/20">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <h3 className="font-semibold text-foreground mb-1">Sobre as Cotações</h3>
                <p className="text-sm text-muted-foreground">
                  Os preços são obtidos automaticamente da SCOT Consultoria, referência no mercado pecuário brasileiro.
                  Use esses valores como referência para suas negociações.
                </p>
              </div>
              <div className="text-right">
                <div className="flex items-center gap-2 justify-end mb-1">
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${data?.realtime ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'}`}>
                    <span className={`w-2 h-2 rounded-full ${data?.realtime ? 'bg-green-500' : 'bg-yellow-500'}`}></span>
                    {data?.realtime ? 'Tempo Real' : 'Cache'}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground font-medium">Fonte: {data?.source || 'SCOT Consultoria'}</p>
                <p className="text-xs text-muted-foreground">
                  Atualizado: {data?.updated ? new Date(data.updated).toLocaleString('pt-BR') : '-'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
