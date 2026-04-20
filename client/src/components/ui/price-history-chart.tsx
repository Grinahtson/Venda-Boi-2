import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { TrendingUp, Loader2 } from "lucide-react";

interface PriceHistoryData {
  id: string;
  state: string;
  category: string;
  price: string;
  source: string;
  recordedAt: string;
}

interface ChartData {
  date: string;
  displayDate: string;
  [key: string]: string | number;
}

const STATE_COLORS: Record<string, string> = {
  SP: "#2e7d32",
  MT: "#1565c0", 
  GO: "#f57c00",
  MS: "#7b1fa2",
  MG: "#c62828",
  RS: "#00838f",
  BA: "#558b2f",
  PR: "#6a1b9a",
};

export function PriceHistoryChart() {
  const [data, setData] = useState<ChartData[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedState, setSelectedState] = useState("all");
  const [days, setDays] = useState("30");

  useEffect(() => {
    const fetchHistory = async () => {
      setLoading(true);
      try {
        const url = selectedState === "all"
          ? `/api/market/history?days=${days}`
          : `/api/market/history?state=${selectedState}&days=${days}`;
        
        const res = await fetch(url);
        if (res.ok) {
          const result = await res.json();
          const rawData: PriceHistoryData[] = result.data || [];
          
          const grouped: Record<string, Record<string, number>> = {};
          rawData.forEach((item) => {
            const date = new Date(item.recordedAt).toISOString().split('T')[0];
            if (!grouped[date]) {
              grouped[date] = {};
            }
            grouped[date][item.state] = parseFloat(item.price);
          });
          
          const chartData = Object.entries(grouped)
            .map(([date, states]) => ({
              date,
              displayDate: new Date(date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }),
              ...states,
            }))
            .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
          
          setData(chartData);
        }
      } catch (error) {
        console.error("Failed to fetch price history:", error);
        generateSampleData();
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, [selectedState, days]);

  const generateSampleData = () => {
    const sampleData: ChartData[] = [];
    const baseDate = new Date();
    const numDays = parseInt(days);
    
    for (let i = numDays; i >= 0; i--) {
      const date = new Date(baseDate);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      
      sampleData.push({
        date: dateStr,
        displayDate: date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }),
        SP: 320 + Math.random() * 20 - 10,
        MT: 310 + Math.random() * 15 - 7,
        GO: 305 + Math.random() * 18 - 9,
        MS: 308 + Math.random() * 12 - 6,
      });
    }
    
    setData(sampleData);
  };

  const stateKeys = data.length > 0
    ? Object.keys(data[0]).filter(k => k !== 'date' && k !== 'displayDate')
    : [];

  const formatTooltip = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { 
      style: 'currency', 
      currency: 'BRL' 
    }).format(value);
  };

  return (
    <Card className="mt-8">
      <CardHeader className="pb-4">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            <CardTitle className="font-serif">Histórico de Preços da Arroba</CardTitle>
          </div>
          <div className="flex gap-3">
            <Select value={selectedState} onValueChange={setSelectedState}>
              <SelectTrigger className="w-[140px]" data-testid="select-history-state">
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="SP">São Paulo</SelectItem>
                <SelectItem value="MT">Mato Grosso</SelectItem>
                <SelectItem value="GO">Goiás</SelectItem>
                <SelectItem value="MS">Mato Grosso do Sul</SelectItem>
                <SelectItem value="MG">Minas Gerais</SelectItem>
                <SelectItem value="RS">Rio Grande do Sul</SelectItem>
                <SelectItem value="BA">Bahia</SelectItem>
                <SelectItem value="PR">Paraná</SelectItem>
              </SelectContent>
            </Select>
            <Select value={days} onValueChange={setDays}>
              <SelectTrigger className="w-[120px]" data-testid="select-history-days">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7">7 dias</SelectItem>
                <SelectItem value="14">14 dias</SelectItem>
                <SelectItem value="30">30 dias</SelectItem>
                <SelectItem value="60">60 dias</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center h-[300px]">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : data.length === 0 ? (
          <div className="flex items-center justify-center h-[300px] text-muted-foreground">
            Nenhum dado de histórico disponível. Os preços serão registrados automaticamente.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis 
                dataKey="displayDate" 
                tick={{ fontSize: 12 }} 
                className="text-muted-foreground"
              />
              <YAxis 
                tick={{ fontSize: 12 }}
                tickFormatter={(value) => `R$ ${value}`}
                domain={['dataMin - 10', 'dataMax + 10']}
                className="text-muted-foreground"
              />
              <Tooltip
                formatter={(value: number) => [formatTooltip(value), 'Preço/@']}
                labelFormatter={(label) => `Data: ${label}`}
                contentStyle={{ 
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px'
                }}
              />
              <Legend />
              {stateKeys.map((state) => (
                <Line
                  key={state}
                  type="monotone"
                  dataKey={state}
                  stroke={STATE_COLORS[state] || '#888'}
                  strokeWidth={2}
                  dot={{ r: 3 }}
                  activeDot={{ r: 5 }}
                  name={state}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
