import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { X } from "lucide-react";

export default function CheckoutCancel() {
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen bg-gradient-to-b from-destructive/5 to-background flex items-center justify-center py-20 px-4">
      <Card className="max-w-md w-full border-2 border-destructive">
        <div className="p-8 text-center">
          <div className="mb-6 flex justify-center">
            <div className="rounded-full bg-destructive/10 p-4">
              <X className="h-8 w-8 text-destructive" />
            </div>
          </div>

          <h1 className="text-3xl font-bold mb-2">Pagamento Cancelado</h1>
          <p className="text-muted-foreground mb-6">
            Você cancelou o processo de pagamento. Sem encargos em sua conta.
          </p>

          <div className="bg-secondary/30 rounded-lg p-4 mb-6 text-left">
            <p className="text-sm font-medium mb-2">💡 Sem problemas!</p>
            <p className="text-sm text-muted-foreground">
              Você pode tentar novamente a qualquer momento. Todos os seus dados foram salvos.
            </p>
          </div>

          <div className="space-y-3">
            <Button
              className="w-full h-12"
              onClick={() => setLocation("/pricing")}
              data-testid="button-retry-pricing"
            >
              Voltar aos Planos
            </Button>
            <Button
              variant="outline"
              className="w-full h-12"
              onClick={() => setLocation("/")}
              data-testid="button-go-home"
            >
              Ir para Home
            </Button>
          </div>

          <p className="text-xs text-muted-foreground mt-6">
            Ficou com dúvida? Consulte nossa página de pricing para mais informações.
          </p>
        </div>
      </Card>
    </div>
  );
}
