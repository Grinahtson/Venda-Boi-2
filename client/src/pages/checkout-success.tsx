import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useAppContext } from "@/context/AppContext";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Check, Loader2 } from "lucide-react";

export default function CheckoutSuccess() {
  const [, setLocation] = useLocation();
  const { user, refreshUser } = useAppContext();
  const [refreshing, setRefreshing] = useState(true);

  useEffect(() => {
    // Redirect to home if not authenticated
    if (!user) {
      setLocation("/auth");
      return;
    }

    // Refresh user data to get the updated plan
    const updateUserData = async () => {
      try {
        await refreshUser();
      } catch (error) {
        console.error("Failed to refresh user:", error);
      } finally {
        setRefreshing(false);
      }
    };

    // Wait a bit for webhook to process, then refresh
    const timer = setTimeout(updateUserData, 2000);
    return () => clearTimeout(timer);
  }, [user, setLocation, refreshUser]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary/5 to-background flex items-center justify-center py-20 px-4">
      <Card className="max-w-md w-full border-2 border-primary">
        <div className="p-8 text-center">
          <div className="mb-6 flex justify-center">
            <div className="rounded-full bg-primary/10 p-4">
              <Check className="h-8 w-8 text-primary" />
            </div>
          </div>

          <h1 className="text-3xl font-bold mb-2">Pagamento Confirmado!</h1>
          <p className="text-muted-foreground mb-6">
            {refreshing ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Ativando seu plano...
              </span>
            ) : (
              <>Sua inscrição foi ativada com sucesso. Seu plano atual: <strong>{user?.plan}</strong></>
            )}
          </p>

          <div className="bg-secondary/30 rounded-lg p-4 mb-6 text-left">
            <p className="text-sm font-medium mb-2">✓ Plano ativado</p>
            <p className="text-sm font-medium mb-2">✓ Acesso imediato</p>
            <p className="text-sm font-medium">✓ Suporte prioritário</p>
          </div>

          <div className="space-y-3">
            <Button
              className="w-full h-12"
              onClick={() => setLocation("/dashboard")}
              data-testid="button-go-dashboard"
            >
              Ir para Dashboard
            </Button>
            <Button
              variant="outline"
              className="w-full h-12"
              onClick={() => setLocation("/create-ad")}
              data-testid="button-create-ad"
            >
              Criar Novo Anúncio
            </Button>
          </div>

          <p className="text-xs text-muted-foreground mt-6">
            Número da transação disponível no seu email.
          </p>
        </div>
      </Card>
    </div>
  );
}
