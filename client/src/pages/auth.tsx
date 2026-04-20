import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Store, AlertCircle, Loader2, Shield, Lock } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Checkbox } from "@/components/ui/checkbox";
import { motion } from "framer-motion";
import { useAppContext } from "@/context/AppContext";
import { toast } from "sonner";
import { authAPI } from "@/lib/api";

export default function Auth() {
  const [, setLocation] = useLocation();
  const { login } = useAppContext();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(true);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      if (!email || !password) {
        setError("Preencha todos os campos");
        setLoading(false);
        return;
      }
      const result = await authAPI.login(email, password, rememberMe);
      login(result.user, result.sessionId, rememberMe);
      toast.success("Bem-vindo de volta!");
      setLocation("/marketplace", { replace: true });
    } catch (err: any) {
      setError(err.message || "Email ou senha incorretos. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30 flex items-center justify-center p-4">
      <motion.div
        className="w-full max-w-md"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-6">
            <div className="bg-primary text-white p-2 rounded-lg">
              <Store className="h-7 w-7" />
            </div>
            <span className="text-2xl font-serif font-bold text-primary">
              Boi na Rede
            </span>
          </Link>
        </div>

        <Card className="shadow-xl border border-border/50">
          <CardHeader className="text-center pb-4">
            <CardTitle className="text-2xl font-bold">Acesse sua conta</CardTitle>
            <CardDescription className="text-base">
              Entre com seu email e senha
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input 
                  id="email" 
                  type="email" 
                  placeholder="seu@email.com" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading}
                  className="h-11"
                  data-testid="input-email"
                />
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Senha</Label>
                  <Link href="/forgot-password" className="text-xs text-muted-foreground hover:text-primary transition-colors">
                    Esqueceu a senha?
                  </Link>
                </div>
                <Input 
                  id="password" 
                  type="password" 
                  placeholder="Digite sua senha"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                  className="h-11"
                  data-testid="input-password"
                />
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="remember" 
                  checked={rememberMe}
                  onCheckedChange={(checked) => setRememberMe(checked === true)}
                  data-testid="checkbox-remember"
                />
                <Label 
                  htmlFor="remember" 
                  className="text-sm font-normal cursor-pointer"
                >
                  Manter conectado
                </Label>
              </div>

              <Button 
                type="submit" 
                className="w-full h-12 font-bold text-base"
                disabled={loading}
                data-testid="button-login"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Entrando...
                  </>
                ) : (
                  "Entrar"
                )}
              </Button>
            </form>

            <div className="flex items-center justify-center gap-6 pt-4 border-t border-border">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Shield className="h-4 w-4 text-green-600" />
                <span>Dados protegidos</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Lock className="h-4 w-4 text-green-600" />
                <span>Conexao segura</span>
              </div>
            </div>
          </CardContent>
          
          <CardFooter className="flex flex-col gap-4 pt-0">
            <div className="w-full text-center">
              <p className="text-sm text-muted-foreground">
                Novo por aqui?{" "}
                <Link href="/register" className="font-semibold text-primary hover:underline">
                  Crie sua conta gratis
                </Link>
              </p>
            </div>
          </CardFooter>
        </Card>

        <p className="text-center text-xs text-muted-foreground mt-6">
          Ao entrar, voce concorda com nossos{" "}
          <span className="text-primary cursor-pointer hover:underline">Termos de Uso</span>
          {" "}e{" "}
          <span className="text-primary cursor-pointer hover:underline">Politica de Privacidade</span>
        </p>
      </motion.div>
    </div>
  );
}
