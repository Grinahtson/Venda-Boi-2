import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Calculator as CalcIcon, TrendingUp, AlertCircle, CheckCircle2, RotateCcw } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { AnimatePresence, motion } from "framer-motion";
import { useCalculator } from "@/hooks/useCalculator";
import { marketQuotes } from "@/lib/data";
import { formatCurrency } from "@/lib/calculations";
import { AnimatedNumber, AnimatedBox } from "@/components/ui/animated-number";

export default function Calculator() {
  const { inputs, results, updateInput, reset } = useCalculator();

  return (
    <div className="min-h-screen bg-background py-12">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-10">
            <h1 className="text-3xl md:text-4xl font-serif font-bold mb-4">Calculadora Inteligente de Lucro</h1>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Simule seus negócios e descubra se a operação será lucrativa com base nas cotações atuais do mercado.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Inputs */}
            <Card className="border-primary/20 shadow-lg">
              <CardHeader className="bg-secondary/30 border-b border-border flex flex-row justify-between items-center">
                <CardTitle className="flex items-center gap-2">
                  <CalcIcon className="h-5 w-5 text-primary" /> Parâmetros
                </CardTitle>
                <Button variant="ghost" size="sm" onClick={reset} className="h-8 gap-1 text-xs">
                  <RotateCcw className="h-3 w-3" /> Reset
                </Button>
              </CardHeader>
              <CardContent className="space-y-6 p-6">
                <Tabs defaultValue="simple" onValueChange={(v) => updateInput("purchaseMode", v === "advanced" ? "weight" : "head")}>
                  <TabsList className="grid w-full grid-cols-2 mb-4">
                    <TabsTrigger value="simple">Por Cabeça</TabsTrigger>
                    <TabsTrigger value="advanced">Por Peso/Arroba</TabsTrigger>
                  </TabsList>

                  <div className="space-y-4 mb-6">
                    <div className="flex justify-between items-center">
                      <Label>Quantidade</Label>
                      <span className="font-mono font-bold">{inputs.quantity} cab</span>
                    </div>
                    <Slider
                      value={[inputs.quantity]}
                      onValueChange={(v) => updateInput("quantity", v[0])}
                      max={5000}
                      step={1}
                    />
                  </div>

                  <TabsContent value="simple" className="space-y-6 mt-0">
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <Label>Peso Médio (kg)</Label>
                        <span className="font-mono font-bold">{inputs.weight} kg</span>
                      </div>
                      <Slider
                        value={[inputs.weight]}
                        onValueChange={(v) => updateInput("weight", v[0])}
                        min={100}
                        max={1200}
                        step={10}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="text-sm font-semibold">Preço de Compra (por cabeça)</Label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-medium">R$</span>
                        <Input
                          type="number"
                          value={inputs.buyPrice || ""}
                          onChange={(e) => updateInput("buyPrice", Number(e.target.value) || 0)}
                          className="pl-10 h-11"
                          placeholder="Digite o valor"
                        />
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="advanced" className="space-y-4 mt-0">
                    <div className="space-y-2">
                      <Label>Peso Vivo Total (kg)</Label>
                      <Input
                        type="number"
                        value={inputs.totalLiveWeight}
                        onChange={(e) => updateInput("totalLiveWeight", Number(e.target.value))}
                      />
                      <p className="text-xs text-muted-foreground">
                        Média: {(inputs.totalLiveWeight / (inputs.quantity || 1)).toFixed(0)} kg/cab
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Rendimento (%)</Label>
                        <div className="relative">
                          <Input
                            type="number"
                            value={inputs.yieldPercentage}
                            onChange={(e) => updateInput("yieldPercentage", Number(e.target.value))}
                            className="pr-8"
                          />
                          <span className="absolute right-3 top-2.5 text-muted-foreground">%</span>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>Cotação Compra (@)</Label>
                        <div className="relative">
                          <span className="absolute left-3 top-2.5 text-muted-foreground">R$</span>
                          <Input
                            type="number"
                            value={inputs.purchaseArrobaQuote}
                            onChange={(e) => updateInput("purchaseArrobaQuote", Number(e.target.value))}
                            className="pl-9"
                          />
                        </div>
                      </div>
                    </div>

                    <AnimatePresence mode="wait">
                      <motion.div
                        key="arrobas-box"
                        className="bg-muted/50 p-3 rounded-md text-sm space-y-1"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.3 }}
                      >
                        <div className="flex justify-between items-center">
                          <span className="text-muted-foreground">Arrobas Est.:</span>
                          <AnimatePresence mode="wait">
                            <AnimatedNumber
                              key={`arrobas-${results.estimatedArrobas}`}
                              value={results.estimatedArrobas}
                              decimals={1}
                              suffix=" @"
                              className="font-bold text-lg text-accent"
                            />
                          </AnimatePresence>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-muted-foreground">Custo Total:</span>
                          <motion.span
                            key={`cost-${results.totalCost}`}
                            className="font-bold text-primary"
                            initial={{ opacity: 0, x: 10 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -10 }}
                            transition={{ duration: 0.4 }}
                          >
                            {formatCurrency(results.totalCost)}
                          </motion.span>
                        </div>
                      </motion.div>
                    </AnimatePresence>
                  </TabsContent>
                </Tabs>

                <Separator className="my-4" />

                <div className="space-y-2">
                  <Label className="text-sm font-semibold">Preço de Venda Esperado (por cabeça)</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-medium">R$</span>
                    <Input
                      type="number"
                      value={inputs.sellPrice || ""}
                      onChange={(e) => updateInput("sellPrice", Number(e.target.value) || 0)}
                      className="pl-10 h-11"
                      placeholder="Digite o valor"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Results */}
            <div className="space-y-6">
              <Card
                className={`border-2 shadow-xl ${
                  results.status === "good"
                    ? "border-green-500/50 bg-green-50/30"
                    : results.status === "warning"
                      ? "border-yellow-500/50 bg-yellow-50/30"
                      : "border-red-500/50 bg-red-50/30"
                }`}
              >
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>Análise</span>
                    {results.status === "good" && <CheckCircle2 className="h-8 w-8 text-green-600" />}
                    {results.status === "warning" && <AlertCircle className="h-8 w-8 text-yellow-600" />}
                    {results.status === "bad" && <AlertCircle className="h-8 w-8 text-red-600" />}
                  </CardTitle>
                  <CardDescription>
                    {results.status === "good" && "Excelente! Margem acima do esperado."}
                    {results.status === "warning" && "Atenção: Margem apertada."}
                    {results.status === "bad" && "Cuidado: Risco de prejuízo."}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <AnimatePresence mode="wait">
                    <motion.div
                      className="grid grid-cols-2 gap-4"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                    >
                      <motion.div
                        className="bg-card p-4 rounded-lg border border-border shadow-sm"
                        key={`profit-${results.profit}`}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ type: "spring", stiffness: 200, damping: 20 }}
                      >
                        <p className="text-xs text-muted-foreground uppercase font-bold">Lucro Total</p>
                        <motion.p
                          className={`text-xl font-bold ${results.profit > 0 ? "text-green-600" : "text-red-600"}`}
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.1, duration: 0.3 }}
                        >
                          {formatCurrency(results.profit)}
                        </motion.p>
                      </motion.div>
                      <motion.div
                        className="bg-card p-4 rounded-lg border border-border shadow-sm"
                        key={`margin-${results.margin}`}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ type: "spring", stiffness: 200, damping: 20 }}
                      >
                        <p className="text-xs text-muted-foreground uppercase font-bold">Margem</p>
                        <motion.p
                          className={`text-xl font-bold ${
                            results.status === "good"
                              ? "text-green-600"
                              : results.status === "warning"
                                ? "text-yellow-600"
                                : "text-red-600"
                          }`}
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.1, duration: 0.3 }}
                        >
                          {results.margin.toFixed(1)}%
                        </motion.p>
                      </motion.div>
                    </motion.div>
                  </AnimatePresence>

                  <AnimatePresence mode="wait">
                    <motion.div
                      className="space-y-2 pt-2"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                    >
                      <motion.div
                        className="flex justify-between text-sm py-2 border-b border-border/50"
                        key={`profit-head-${results.profitPerHead}`}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 10 }}
                        transition={{ duration: 0.3 }}
                      >
                        <span className="text-muted-foreground">Lucro/Cabeça:</span>
                        <motion.span
                          className="font-bold"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: 0.05 }}
                        >
                          {formatCurrency(results.profitPerHead)}
                        </motion.span>
                      </motion.div>
                      <motion.div
                        className="flex justify-between text-sm py-2 border-b border-border/50"
                        key={`arroba-${results.realArroba}`}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 10 }}
                        transition={{ duration: 0.3, delay: 0.1 }}
                      >
                        <span className="text-muted-foreground">Sua Arroba:</span>
                        <AnimatePresence mode="wait">
                          <AnimatedNumber
                            key={`arroba-value-${results.realArroba}`}
                            value={results.realArroba}
                            decimals={2}
                            prefix="R$ "
                            className="font-bold text-accent"
                          />
                        </AnimatePresence>
                      </motion.div>
                    </motion.div>
                  </AnimatePresence>
                </CardContent>
              </Card>

              <Alert>
                <TrendingUp className="h-4 w-4" />
                <AlertTitle>Dica da IA</AlertTitle>
                <AlertDescription>
                  Com peso de {inputs.weight}kg, o animal está próximo do ideal de abate. Considerando a cotação atual de R$ {inputs.purchaseArrobaQuote}/arroba, a
                  operação pode ser viável se os custos de diária forem baixos.
                </AlertDescription>
              </Alert>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
