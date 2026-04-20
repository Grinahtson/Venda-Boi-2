import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Store, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { authAPI } from "@/lib/api";
import { useAppContext } from "@/context/AppContext";
import { toast } from "sonner";

export default function Register() {
  const [, navigate] = useLocation();
  const { login } = useAppContext();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const [formData, setFormData] = useState({
    companyName: "",
    ownerName: "",
    email: "",
    password: "",
    confirmPassword: "",
    phone: "",
    city: "",
    state: "",
  });

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setError("");
  };

  const validateStep1 = () => {
    if (!formData.companyName.trim()) {
      setError("Nome da empresa é obrigatório");
      return false;
    }
    if (!formData.ownerName.trim()) {
      setError("Nome do proprietário é obrigatório");
      return false;
    }
    return true;
  };

  const validateStep2 = () => {
    if (!formData.email.includes("@")) {
      setError("Email inválido");
      return false;
    }
    if (formData.password.length < 6) {
      setError("Senha deve ter no mínimo 6 caracteres");
      return false;
    }
    if (formData.password !== formData.confirmPassword) {
      setError("As senhas não coincidem");
      return false;
    }
    return true;
  };

  const validateStep3 = () => {
    if (!formData.phone.trim()) {
      setError("Telefone é obrigatório");
      return false;
    }
    if (!formData.city.trim()) {
      setError("Cidade é obrigatória");
      return false;
    }
    if (!formData.state.trim()) {
      setError("Estado é obrigatório");
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      if (!validateStep3()) {
        setLoading(false);
        return;
      }

      const result = await authAPI.register(
        formData.email, 
        formData.password, 
        formData.companyName,
        formData.phone
      );

      login(result.user, result.sessionId);
      setSuccess(true);
      toast.success("Conta criada com sucesso! 🎉");
      
      setTimeout(() => {
        navigate("/dashboard", { replace: true });
      }, 1500);
    } catch (err: any) {
      setError(err.message || "Erro ao registrar. Tente novamente.");
      toast.error("Erro no cadastro");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-primary/5 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/">
            <a className="inline-flex items-center gap-2 hover:opacity-90 transition-opacity mb-4">
              <div className="bg-primary text-white p-2 rounded-lg">
                <Store className="h-6 w-6" />
              </div>
              <span className="text-2xl font-serif font-bold text-primary">Boi na Rede</span>
            </a>
          </Link>
          <h1 className="text-2xl font-bold mt-4">Crie sua conta</h1>
          <p className="text-muted-foreground mt-2">Comece a vender gado agora mesmo</p>
        </div>

        <Card className="shadow-xl border-primary/20">
          <CardHeader>
            <CardTitle>Passo {step} de 3</CardTitle>
            <CardDescription>
              {step === 1 && "Informações da empresa"}
              {step === 2 && "Segurança da conta"}
              {step === 3 && "Localização e contato"}
            </CardDescription>
          </CardHeader>

          <CardContent>
            {success ? (
              <div className="space-y-4 text-center py-8">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 mb-4">
                  <CheckCircle2 className="h-8 w-8 text-green-600" />
                </div>
                <h3 className="font-bold text-lg">Cadastro realizado com sucesso!</h3>
                <p className="text-muted-foreground">Redirecionando para o marketplace...</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                {error && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                {/* Step 1: Company Info */}
                {step === 1 && (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="companyName">Nome da Empresa/Fazenda</Label>
                      <Input
                        id="companyName"
                        placeholder="Ex: Fazenda Santa Fé"
                        value={formData.companyName}
                        onChange={(e) => handleChange("companyName", e.target.value)}
                        className="bg-secondary/30"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="ownerName">Nome do Proprietário</Label>
                      <Input
                        id="ownerName"
                        placeholder="Ex: João da Silva"
                        value={formData.ownerName}
                        onChange={(e) => handleChange("ownerName", e.target.value)}
                        className="bg-secondary/30"
                      />
                    </div>
                  </div>
                )}

                {/* Step 2: Security */}
                {step === 2 && (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="seu@email.com"
                        value={formData.email}
                        onChange={(e) => handleChange("email", e.target.value)}
                        className="bg-secondary/30"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="password">Senha</Label>
                      <Input
                        id="password"
                        type="password"
                        placeholder="Mínimo 6 caracteres"
                        value={formData.password}
                        onChange={(e) => handleChange("password", e.target.value)}
                        className="bg-secondary/30"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="confirmPassword">Confirmar Senha</Label>
                      <Input
                        id="confirmPassword"
                        type="password"
                        placeholder="Digite novamente"
                        value={formData.confirmPassword}
                        onChange={(e) => handleChange("confirmPassword", e.target.value)}
                        className="bg-secondary/30"
                      />
                    </div>
                  </div>
                )}

                {/* Step 3: Location */}
                {step === 3 && (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="phone">Telefone</Label>
                      <Input
                        id="phone"
                        placeholder="(11) 98765-4321"
                        value={formData.phone}
                        onChange={(e) => handleChange("phone", e.target.value)}
                        className="bg-secondary/30"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="city">Cidade</Label>
                        <Input
                          id="city"
                          placeholder="São Paulo"
                          value={formData.city}
                          onChange={(e) => handleChange("city", e.target.value)}
                          className="bg-secondary/30"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="state">Estado</Label>
                        <Input
                          id="state"
                          placeholder="SP"
                          maxLength={2}
                          value={formData.state}
                          onChange={(e) => handleChange("state", e.target.value.toUpperCase())}
                          className="bg-secondary/30"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Buttons */}
                <div className="flex gap-3 pt-4">
                  {step > 1 && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setStep(step - 1)}
                      className="flex-1"
                    >
                      Anterior
                    </Button>
                  )}
                  {step < 3 ? (
                    <Button
                      type="button"
                      onClick={() => {
                        if (step === 1 && validateStep1()) setStep(2);
                        else if (step === 2 && validateStep2()) setStep(3);
                      }}
                      className="flex-1 bg-primary hover:bg-primary/90"
                    >
                      Próximo
                    </Button>
                  ) : (
                    <Button
                      type="submit"
                      disabled={loading}
                      className="flex-1 bg-primary hover:bg-primary/90"
                      data-testid="button-submit-register"
                    >
                      {loading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Criando conta...
                        </>
                      ) : (
                        "Criar Conta"
                      )}
                    </Button>
                  )}
                </div>
              </form>
            )}

            <div className="mt-6 pt-6 border-t border-border text-center">
              <p className="text-sm text-muted-foreground">
                Já tem uma conta?{" "}
                <Link href="/auth" className="font-medium text-primary hover:underline">
                  Entre aqui
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
