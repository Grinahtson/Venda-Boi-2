import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { useAppContext } from "@/context/AppContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { User, Edit2, LogOut, ArrowLeft, Shield, MapPin, Phone, Camera } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { authAPI } from "@/lib/api";

export default function Profile() {
  const { user, logout, sessionId, setUser } = useAppContext();
  const [, setLocation] = useLocation();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState(() => ({
    name: user?.name || "",
    email: user?.email || "",
    phone: user?.phone || "",
    city: user?.city || "",
    state: user?.state || "",
    avatar: user?.avatar || "",
  }));
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [kycStatus, setKycStatus] = useState<string | null>(null);
  const [kycForm, setKycForm] = useState({ cpfCnpj: "", documentType: "cpf" });
  const [kycLoading, setKycLoading] = useState(false);

  // Load profile on mount
  useEffect(() => {
    if (!sessionId) return;

    const loadProfile = async () => {
      try {
        const userData = await authAPI.getMe(sessionId);
        setFormData(prev => ({
          ...prev,
          name: userData.name || "",
          email: userData.email || "",
          phone: userData.phone || "",
          city: userData.city || "",
          state: userData.state || "",
        }));

        // Load KYC status
        if (userData?.id) {
          try {
            const vRes = await fetch(`/api/sellers/${userData.id}/verification`);
            if (vRes.ok) {
              const vData = await vRes.json();
              if (vData.status && vData.status !== 'not_verified') {
                setKycStatus(vData.status);
              }
            }
          } catch (e) {
            console.error("Failed to load KYC status:", e);
          }
        }
      } catch (error) {
        console.error("Failed to load profile:", error);
      }
    };

    loadProfile();
  }, [sessionId, user?.id]);

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="max-w-md w-full">
          <CardContent className="pt-8 text-center">
            <p className="text-muted-foreground mb-4">Você precisa estar autenticado para ver esta página.</p>
            <Link href="/">
              <Button>Voltar ao Login</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !sessionId) return;

    if (file.size > 2 * 1024 * 1024) {
      toast.error("A imagem deve ter no máximo 2MB");
      return;
    }

    setUploadingAvatar(true);
    try {
      const reader = new FileReader();
      reader.onload = async () => {
        const base64 = reader.result as string;
        const updatedUser = await authAPI.updateProfile(sessionId, { avatar: base64 });
        setUser(updatedUser);
        setFormData(prev => ({ ...prev, avatar: base64 }));
        toast.success("Foto atualizada com sucesso!");
      };
      reader.readAsDataURL(file);
    } catch (error: any) {
      toast.error(error.message || "Erro ao atualizar foto");
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleSaveProfile = async () => {
    if (!sessionId) return;
    
    setLoading(true);
    try {
      const updatedUser = await authAPI.updateProfile(sessionId, formData);
      setUser(updatedUser);
      setIsEditing(false);
      toast.success("Perfil atualizado com sucesso! ✅");
    } catch (error: any) {
      toast.error(error.message || "Erro ao atualizar perfil");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    if (sessionId) {
      try {
        await authAPI.logout(sessionId);
      } catch (error) {
        console.error("Logout error:", error);
      }
    }
    logout();
    toast.success("Desconectado com sucesso! 👋");
    setLocation("/", { replace: true });
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="container mx-auto px-4 py-12 max-w-2xl">
        {/* Header */}
        <div className="mb-8">
          <Link href="/marketplace">
            <Button variant="ghost" className="gap-2 mb-4" data-testid="button-back-profile">
              <ArrowLeft className="h-4 w-4" /> Voltar
            </Button>
          </Link>
        </div>

        {/* Profile Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <Card className="shadow-lg border-primary/20" data-testid="card-profile">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-4">
                  <div className="relative group">
                    <Avatar className="w-16 h-16">
                      <AvatarImage src={formData.avatar || user?.avatar || ""} />
                      <AvatarFallback className="bg-green-600 text-white text-xl">
                        {user.name?.substring(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <label className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity">
                      <Camera className="h-6 w-6 text-white" />
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleAvatarUpload}
                        className="hidden"
                        disabled={uploadingAvatar}
                      />
                    </label>
                    {uploadingAvatar && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full">
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      </div>
                    )}
                  </div>
                  <div>
                    <CardTitle className="text-2xl" data-testid="text-profile-name">
                      {user.name}
                    </CardTitle>
                    <CardDescription className="text-base mt-1">
                      {user.email}
                    </CardDescription>
                    <div className="flex gap-2 mt-2">
                      <span className="text-xs bg-primary/10 text-primary px-3 py-1 rounded-full font-semibold">
                        Plano: {user.plan}
                      </span>
                      {user.state && (
                        <span className="text-xs bg-accent/10 text-accent px-3 py-1 rounded-full">
                          {user.city} - {user.state}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsEditing(!isEditing)}
                    data-testid="button-edit-profile"
                  >
                    <Edit2 className="h-4 w-4 mr-2" />
                    {isEditing ? "Cancelar" : "Editar"}
                  </Button>
                </motion.div>
              </div>
            </CardHeader>

            <CardContent className="space-y-6">
              {/* Info Grid */}
              <motion.div
                className="grid grid-cols-1 md:grid-cols-2 gap-4"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.1 }}
              >
                <div className="bg-muted/50 p-4 rounded-lg">
                  <p className="text-xs text-muted-foreground uppercase font-bold mb-1">Telefone</p>
                  <p className="flex items-center gap-2 text-foreground font-medium" data-testid="text-profile-phone">
                    <Phone className="h-4 w-4 text-primary" />
                    {user.phone || "Não informado"}
                  </p>
                </div>
                <div className="bg-muted/50 p-4 rounded-lg">
                  <p className="text-xs text-muted-foreground uppercase font-bold mb-1">Localização</p>
                  <p className="flex items-center gap-2 text-foreground font-medium" data-testid="text-profile-location">
                    <MapPin className="h-4 w-4 text-primary" />
                    {user.city && user.state ? `${user.city}, ${user.state}` : "Não informado"}
                  </p>
                </div>
              </motion.div>

              {/* Edit Form */}
              {isEditing && (
                <motion.div
                  className="space-y-4 pt-4 border-t border-border"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                >
                  <div className="space-y-2">
                    <Label htmlFor="name">Nome da Empresa</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      disabled={loading}
                      data-testid="input-edit-name"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      disabled={loading}
                      data-testid="input-edit-email"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone">Telefone</Label>
                    <Input
                      id="phone"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="(11) 98765-4321"
                      disabled={loading}
                      data-testid="input-edit-phone"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="city">Cidade</Label>
                      <Input
                        id="city"
                        value={formData.city}
                        onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                        placeholder="São Paulo"
                        disabled={loading}
                        data-testid="input-edit-city"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="state">Estado</Label>
                      <Input
                        id="state"
                        value={formData.state}
                        onChange={(e) => setFormData({ ...formData, state: e.target.value.toUpperCase() })}
                        placeholder="SP"
                        maxLength={2}
                        disabled={loading}
                        data-testid="input-edit-state"
                      />
                    </div>
                  </div>

                  <Button
                    onClick={handleSaveProfile}
                    disabled={loading}
                    className="w-full"
                    data-testid="button-save-profile"
                  >
                    {loading ? "Salvando..." : "Salvar Alterações"}
                  </Button>
                </motion.div>
              )}

              {/* Plan Info */}
              <motion.div
                className="bg-primary/10 border border-primary/20 rounded-lg p-4"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
              >
                <div className="flex items-center gap-2 mb-2">
                  <Shield className="h-5 w-5 text-primary" />
                  <h3 className="font-semibold">Informações da Conta</h3>
                </div>
                <ul className="text-sm text-muted-foreground space-y-1 ml-7">
                  <li>✓ Acesso ao marketplace</li>
                  <li>✓ Painel do vendedor</li>
                  {user.plan !== "Free" && <li>✓ Suporte prioritário</li>}
                  {user.plan === "Premium" && (
                    <>
                      <li>✓ Analytics avançada</li>
                      <li>✓ Prioridade em buscas</li>
                    </>
                  )}
                </ul>
              </motion.div>

              {/* KYC Info */}
              <motion.div
                className="bg-accent/5 border border-accent/20 rounded-lg p-5 mt-4"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
              >
                <div className="flex items-center gap-2 mb-3">
                  <Shield className="h-5 w-5 text-green-600" />
                  <h3 className="font-semibold text-lg">Selo de Verificação (KYC)</h3>
                  {user.verified && (
                    <Badge className="bg-green-100 text-green-800 ml-auto border-0">
                      Verificado ✓
                    </Badge>
                  )}
                </div>
                
                {user.verified ? (
                  <p className="text-sm text-green-700 bg-green-50 p-3 rounded-md">
                    Sua conta está verificada. As suas publicações possuem o selo de confiança para outros negociantes.
                  </p>
                ) : kycStatus === 'pending' ? (
                  <Alert className="bg-amber-50 text-amber-800 border-amber-200">
                    <AlertDescription className="flex items-center gap-2">
                       Sua documentação está em análise. Você será notificado quando for aprovada.
                    </AlertDescription>
                  </Alert>
                ) : (
                  <div className="space-y-4 pt-2">
                    <p className="text-sm text-muted-foreground">
                      Aumente a confiança dos compradores enviando seu documento. Ganhos de até 30% em velocidade de venda.
                    </p>
                    <div className="space-y-3">
                      <div>
                        <Label htmlFor="docType" className="text-xs">Tipo de Documento</Label>
                        <select 
                          id="docType" 
                          className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                          value={kycForm.documentType}
                          onChange={e => setKycForm(prev => ({...prev, documentType: e.target.value}))}
                        >
                          <option value="cpf">CPF (Produtor Físico)</option>
                          <option value="cnpj">CNPJ (Agropecuária/Empresa)</option>
                        </select>
                      </div>
                      <div>
                        <Label htmlFor="cpfCnpj" className="text-xs">Número do Documento</Label>
                        <Input 
                          id="cpfCnpj" 
                          placeholder="Somente números" 
                          value={kycForm.cpfCnpj}
                          onChange={e => setKycForm(prev => ({...prev, cpfCnpj: e.target.value}))}
                        />
                      </div>
                      <Button 
                        className="w-full bg-green-600 hover:bg-green-700 text-white" 
                        disabled={kycLoading || !kycForm.cpfCnpj}
                        onClick={async () => {
                          setKycLoading(true);
                          try {
                            const params = {
                              method: 'POST',
                              headers: {
                                'Content-Type': 'application/json',
                                'Authorization': `Bearer ${sessionId}`
                              },
                              body: JSON.stringify({
                                cpfCnpj: kycForm.cpfCnpj,
                                documentType: kycForm.documentType,
                                documentUrl: "https://example.com/documento_mockup.pdf" // MVP mock
                              })
                            };
                            const res = await fetch('/api/verify-seller', params);
                            if (res.ok) {
                              toast.success("Documentação enviada para análise!");
                              setKycStatus('pending');
                            } else {
                              const err = await res.json();
                              toast.error(err?.message || "Erro ao enviar documentação");
                            }
                          } catch (e) {
                            toast.error("Erro ao enviar documentação");
                          } finally {
                            setKycLoading(false);
                          }
                        }}
                      >
                        {kycLoading ? "Enviando..." : "Solicitar Selo de Verificado"}
                      </Button>
                    </div>
                  </div>
                )}
              </motion.div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Logout Button */}
        <motion.div
          className="mt-8"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="destructive"
                size="lg"
                className="w-full gap-2"
                data-testid="button-logout-trigger"
              >
                <LogOut className="h-4 w-4" />
                Sair da Conta
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Tem certeza que deseja sair?</AlertDialogTitle>
                <AlertDialogDescription>
                  Você será desconectado da plataforma. Para acessar novamente, faça login com suas credenciais.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <motion.div
                className="flex gap-2"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleLogout}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  data-testid="button-logout-confirm"
                >
                  Sair Agora
                </AlertDialogAction>
              </motion.div>
            </AlertDialogContent>
          </AlertDialog>
        </motion.div>
      </div>
    </div>
  );
}
