import { Check, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tilt } from "@/components/ui/tilt";
import { useState, useEffect } from "react";
import { useAppContext } from "@/context/AppContext";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";

interface PricingPlan {
  product_id: string;
  product_name: string;
  product_description: string;
  price_id: string | null;
  unit_amount: number | null;
  currency: string | null;
  recurring?: {
    interval: string;
  };
  product_metadata: {
    tier: "free" | "basic" | "premium" | "premium_annual";
    maxAds: string;
    features: string;
  };
}

export default function Pricing() {
  const { user, sessionId } = useAppContext();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [loading, setLoading] = useState<string | null>(null);
  const [products, setProducts] = useState<PricingPlan[]>([]);

  useEffect(() => {
    const loadProducts = async () => {
      try {
        const response = await fetch("/api/pricing-plans");
        const data = await response.json();
        setProducts(data.data || []);
      } catch (error) {
        console.error("Failed to load products:", error);
        toast({
          title: "Erro",
          description: "Não conseguimos carregar os planos.",
          variant: "destructive",
        });
      }
    };
    loadProducts();
  }, [toast]);

  const handleCheckout = async (priceId: string | null, tier: string) => {
    if (tier === "free") {
      toast({
        title: "Plano Free selecionado!",
        description: "Você pode começar a usar agora mesmo.",
      });
      return;
    }

    if (!priceId) {
      toast({
        title: "Erro",
        description: "Este plano não está disponível no momento.",
        variant: "destructive",
      });
      return;
    }

    if (!user || !sessionId) {
      setLocation("/auth");
      return;
    }

    try {
      setLoading(priceId);
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${sessionId}`,
        },
        body: JSON.stringify({ priceId }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Erro ao processar checkout");
      }

      const data = await response.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error("Não conseguimos gerar o link de pagamento");
      }
    } catch (error: any) {
      console.error("Checkout error:", error);
      toast({
        title: "Erro no Pagamento",
        description: error.message || "Não conseguimos processar seu checkout. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="min-h-screen bg-background py-20">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-serif font-bold mb-6">Planos para todo tamanho de rebanho</h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Escolha o plano ideal para o seu negócio. Comece gratuitamente e evolua conforme suas vendas crescem.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {products.length > 0 ? (
            (() => {
              const seenKeys = new Set<string>();
              return products
                .filter((product) => {
                  const tier = product.product_metadata.tier;
                  const interval = product.recurring?.interval || 'none';
                  const key = `${tier}-${interval}`;
                  
                  if (seenKeys.has(key)) return false;
                  seenKeys.add(key);
                  
                  if (tier === 'free') return false;
                  if (tier === 'basic' && interval === 'month') return true;
                  if (tier === 'premium' && interval === 'month') return true;
                  if (tier === 'premium_annual') return true;
                  
                  return false;
                })
                .sort((a, b) => {
                  const tierOrder: Record<string, number> = { free: 0, basic: 1, premium: 2, premium_annual: 3 };
                  const aTier = a.product_metadata.tier;
                  const bTier = b.product_metadata.tier;
                  const aOrder = tierOrder[aTier] ?? 99;
                  const bOrder = tierOrder[bTier] ?? 99;
                  return aOrder - bOrder;
                })
                .map((product) => {
              const tier = product.product_metadata.tier;
              const isBasic = tier === "basic";
              const isPremium = tier === "premium" || tier === "premium_annual";
              const isAnnualPlan = tier === "premium_annual" || product.recurring?.interval === 'year';
              let features = product.product_metadata.features.split(",").map(f => f.trim()).filter(f => f.toLowerCase() !== 'analytics');
              if (isAnnualPlan) {
                features = features.map(f => f.includes('20 anúncios') ? 'Anúncios ilimitados' : f);
              }
              
              let priceDisplay = "Grátis";
              let periodLabel = "";
              if (isAnnualPlan) {
                priceDisplay = `R$ 499.00`;
                periodLabel = "/ano";
              } else if (isPremium) {
                priceDisplay = `R$ 59.90`;
                periodLabel = "/mês";
              } else if (isBasic) {
                priceDisplay = `R$ 19.90`;
                periodLabel = "/mês";
              }
              
              return (
                <Tilt key={product.product_id + product.price_id} intensity={8} className="h-full">
                  <Card 
                    className={`h-full relative flex flex-col ${
                      isAnnualPlan ? 'shadow-2xl border-2 border-amber-500 dark:border-amber-600 bg-card' :
                      isPremium ? 'shadow-2xl border-2 border-emerald-500 dark:border-emerald-600 bg-card' :
                      isBasic ? 'shadow-xl border-2 border-blue-400 dark:border-blue-600 bg-card' :
                      'shadow-md border border-border bg-card'
                    }`}
                    style={{ transform: "translateZ(10px)", transformStyle: "preserve-3d" }}
                  >
                  {(isPremium || isAnnualPlan) && (
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                      <Badge className={`px-4 py-1 text-sm font-bold shadow-sm ${isAnnualPlan ? 'bg-amber-600 text-white' : 'bg-primary text-white'}`}>
                        {isAnnualPlan ? '20% OFF' : 'Mais Popular'}
                      </Badge>
                    </div>
                  )}
                  
                  <CardHeader className="text-center pb-2">
                    <h3 className="text-2xl font-bold text-foreground">{product.product_name}</h3>
                    <div className="mt-4 flex items-baseline justify-center gap-1">
                      <span className="text-4xl font-bold tracking-tight text-foreground">{priceDisplay}</span>
                      {tier !== "free" && <span className="text-muted-foreground font-medium">{periodLabel}</span>}
                    </div>
                    {isAnnualPlan && (
                      <p className="text-sm text-green-600 dark:text-green-400 font-medium mt-2">
                        Economia de R$ 239,76 por ano
                      </p>
                    )}
                  </CardHeader>
                  
                  <CardContent className="flex-1 px-8 py-6">
                    <p className="text-sm text-muted-foreground mb-4">{product.product_description}</p>
                    <ul className="space-y-4">
                      {features.map((feature) => (
                        <li key={feature} className="flex items-start gap-3">
                          <div className={`rounded-full p-1 ${isPremium ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}`}>
                            <Check className="h-3 w-3" />
                          </div>
                          <span className="text-sm font-medium text-foreground/80">{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                  
                  <CardFooter className="px-8 pb-8">
                    {tier === 'free' ? (
                      <Button 
                        className="w-full h-12 font-bold text-lg bg-secondary text-foreground hover:bg-secondary/80"
                        onClick={() => window.location.href = '/register'}
                        data-testid="button-checkout-free"
                      >
                        Começar Grátis
                      </Button>
                    ) : (
                      <Button 
                        className={`w-full h-12 font-bold text-lg ${
                          isPremium ? 'bg-primary text-white hover:bg-primary/90' :
                          'bg-accent text-accent-foreground hover:bg-accent/90'
                        }`}
                        disabled={loading === product.price_id}
                        onClick={() => handleCheckout(product.price_id, tier)}
                        data-testid={`button-checkout-${product.product_name.toLowerCase().replace(/\s+/g, '-')}`}
                      >
                        {loading === product.price_id ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                            Processando...
                          </>
                        ) : (
                          'Assinar Agora'
                        )}
                      </Button>
                    )}
                  </CardFooter>
                  </Card>
                </Tilt>
              );
            });
            })()
          ) : (
            <div className="col-span-full text-center py-20 text-muted-foreground">
              Carregando planos...
            </div>
          )}
        </div>

        <div className="mt-16 text-center bg-card shadow-sm border border-border max-w-6xl mx-auto p-12 rounded-xl">
          <h2 className="text-3xl font-bold mb-4">Começando agora?</h2>
          <p className="text-muted-foreground mb-6 text-lg">Oferecemos um plano 100% gratuito que te permite ter 1 anúncio ativo na plataforma.</p>
          <Button 
            variant="outline"
            className="h-12 px-8 text-lg font-bold border-foreground hover:bg-muted"
            onClick={() => window.location.href = '/register'}
          >
            Cadastrar no Plano Grátis
          </Button>
        </div>

        <div className="mt-24 text-center">
          <h3 className="text-2xl font-bold mb-4">Dúvidas Frequentes</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto text-left mt-8">
            <div className="bg-card p-6 rounded-lg border border-border">
              <h4 className="font-bold mb-2">Posso cancelar a qualquer momento?</h4>
              <p className="text-muted-foreground">Sim, não temos fidelidade. Você pode cancelar ou alterar seu plano quando quiser através do painel.</p>
            </div>
            <div className="bg-card p-6 rounded-lg border border-border">
              <h4 className="font-bold mb-2">Como funciona o pagamento?</h4>
              <p className="text-muted-foreground">Aceitamos cartão de crédito (débito e crédito). O processamento é seguro e criptografado via Stripe.</p>
            </div>
            <div className="bg-card p-6 rounded-lg border border-border">
              <h4 className="font-bold mb-2">O que acontece se eu atingir o limite de anúncios?</h4>
              <p className="text-muted-foreground">Você será notificado e poderá fazer um upgrade de plano ou arquivar anúncios antigos para liberar espaço.</p>
            </div>
            <div className="bg-card p-6 rounded-lg border border-border">
              <h4 className="font-bold mb-2">A verificação de vendedor é obrigatória?</h4>
              <p className="text-muted-foreground">Não para o plano Free, mas é altamente recomendada para aumentar a confiança dos compradores e suas vendas.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
