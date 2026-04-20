import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Store, AlertCircle, Loader2, CheckCircle2, XCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { motion } from "framer-motion";

export default function ResetPassword() {
  const [, setLocation] = useLocation();
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [tokenValid, setTokenValid] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const urlParams = new URLSearchParams(window.location.search);
  const token = urlParams.get("token");

  useEffect(() => {
    const verifyToken = async () => {
      if (!token) {
        setVerifying(false);
        return;
      }

      try {
        const response = await fetch(`/api/auth/verify-reset-token?token=${token}`);
        const data = await response.json();
        setTokenValid(data.valid);
      } catch {
        setTokenValid(false);
      } finally {
        setVerifying(false);
      }
    };

    verifyToken();
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      if (!password || !confirmPassword) {
        setError("Preencha todos os campos");
        setLoading(false);
        return;
      }

      if (password.length < 6) {
        setError("Senha deve ter no minimo 6 caracteres");
        setLoading(false);
        return;
      }

      if (password !== confirmPassword) {
        setError("As senhas nao coincidem");
        setLoading(false);
        return;
      }

      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || "Erro ao redefinir senha");
      }

      setSuccess(true);
      setTimeout(() => {
        setLocation("/auth");
      }, 3000);
    } catch (err: any) {
      setError(err.message || "Erro ao redefinir senha");
    } finally {
      setLoading(false);
    }
  };

  if (verifying) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-muted/30 flex items-center justify-center p-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

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
            <CardTitle className="text-2xl font-bold">
              {success ? "Senha Alterada!" : tokenValid ? "Nova Senha" : "Link Invalido"}
            </CardTitle>
            <CardDescription className="text-base">
              {success 
                ? "Redirecionando para o login..." 
                : tokenValid 
                  ? "Digite sua nova senha" 
                  : "Este link expirou ou e invalido"
              }
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-6">
            {success ? (
              <div className="text-center py-6">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 mb-4">
                  <CheckCircle2 className="h-8 w-8 text-green-600" />
                </div>
                <p className="text-muted-foreground">
                  Sua senha foi alterada com sucesso!
                </p>
              </div>
            ) : !tokenValid ? (
              <div className="text-center py-6">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-100 mb-4">
                  <XCircle className="h-8 w-8 text-red-600" />
                </div>
                <p className="text-muted-foreground">
                  Solicite um novo link de recuperacao.
                </p>
                <Link href="/forgot-password" className="block mt-4">
                  <Button>Solicitar Novo Link</Button>
                </Link>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}
                
                <div className="space-y-2">
                  <Label htmlFor="password">Nova Senha</Label>
                  <Input 
                    id="password" 
                    type="password" 
                    placeholder="Minimo 6 caracteres" 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={loading}
                    className="h-11"
                    data-testid="input-password"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirmar Senha</Label>
                  <Input 
                    id="confirmPassword" 
                    type="password" 
                    placeholder="Digite novamente" 
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    disabled={loading}
                    className="h-11"
                    data-testid="input-confirm-password"
                  />
                </div>

                <Button 
                  type="submit" 
                  className="w-full h-12 font-bold text-base"
                  disabled={loading}
                  data-testid="button-reset-password"
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Alterando...
                    </>
                  ) : (
                    "Alterar Senha"
                  )}
                </Button>
              </form>
            )}
          </CardContent>
          
          {!success && tokenValid && (
            <CardFooter className="flex flex-col gap-4 pt-0">
              <Link href="/auth" className="text-sm text-muted-foreground hover:text-primary">
                Voltar para o Login
              </Link>
            </CardFooter>
          )}
        </Card>
      </motion.div>
    </div>
  );
}
