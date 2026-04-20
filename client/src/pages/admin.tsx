import { useState, useEffect } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, ShoppingCart, DollarSign, TrendingUp, AlertCircle, CheckCircle2, Trash2, Eye, Ban, RefreshCw, ShieldAlert } from "lucide-react";
import { adsAPI } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { useAppContext } from "@/context/AppContext";
import { useLocation } from "wouter";

const chartData = [
  { month: "Jan", sales: 4000, revenue: 24000 },
  { month: "Fev", sales: 3000, revenue: 18000 },
  { month: "Mar", sales: 2000, revenue: 12000 },
  { month: "Abr", sales: 2780, revenue: 16680 },
  { month: "Mai", sales: 1890, revenue: 11340 },
  { month: "Jun", sales: 2390, revenue: 14340 },
];

const generateCategoryData = (ads: any[]) => {
  return ads.reduce((acc: any, item) => {
    const existing = acc.find((d: any) => d.name === item.category);
    if (existing) {
      existing.value += 1;
    } else {
      acc.push({ name: item.category, value: 1 });
    }
    return acc;
  }, []);
};

const COLORS = ["#10b981", "#f59e0b", "#ef4444", "#3b82f6", "#8b5cf6", "#ec4899"];

export default function Admin() {
  const [allAds, setAllAds] = useState<any[]>([]);
  const [verifications, setVerifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("dashboard");
  const { toast } = useToast();
  const { user } = useAppContext();
  const [, setLocation] = useLocation();

  const loadData = async () => {
    try {
      setLoading(true);
      const result = await adsAPI.list({ limit: 1000 });
      const ads = (result.data || result || []) as any[];
      setAllAds(ads);

      const vResult = await fetch('/api/admin/verifications');
      if (vResult.ok) {
        setVerifications(await vResult.json());
      }
    } catch (error) {
      console.error("Failed to load admin data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Verificar se é administrador
  if (!user?.isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <ShieldAlert className="h-16 w-16 mx-auto text-red-500 mb-4" />
            <CardTitle className="text-2xl">Acesso Restrito</CardTitle>
            <CardDescription>
              Esta área é exclusiva para administradores do sistema.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Button onClick={() => setLocation("/")} className="bg-green-600 hover:bg-green-700">
              Voltar ao Início
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleDeleteAd = async (adId: string) => {
    if (!confirm("Tem certeza que deseja excluir este anúncio?")) return;
    try {
      await fetch(`/api/ads/${adId}`, { method: "DELETE" });
      toast({ title: "Anúncio excluído", description: "O anúncio foi removido com sucesso." });
      loadData();
    } catch (error) {
      toast({ title: "Erro", description: "Não foi possível excluir o anúncio.", variant: "destructive" });
    }
  };

  const handleToggleAd = async (adId: string, currentStatus: boolean) => {
    try {
      await fetch(`/api/ads/${adId}/toggle`, { 
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active: !currentStatus })
      });
      toast({ title: currentStatus ? "Anúncio desativado" : "Anúncio ativado" });
      loadData();
    } catch (error) {
      toast({ title: "Erro", description: "Não foi possível alterar o status.", variant: "destructive" });
    }
  };

  const handleVerificationAction = async (userId: string, status: string) => {
    try {
      await fetch(`/api/admin/verifications/${userId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status })
      });
      toast({ title: status === 'approved' ? "Produtor Verificado" : "Verificação Rejeitada" });
      loadData();
    } catch (error) {
      toast({ title: "Erro", description: "Não foi possível alterar a verificação.", variant: "destructive" });
    }
  };

  const totalListings = allAds.length;
  const totalSellers = new Set(allAds.map((a: any) => a.sellerId)).size || 847;
  const totalRevenue = allAds.reduce((sum: number, ad: any) => sum + (Math.max(0, parseInt(ad.pricePerHead || "0")) * ad.quantity || 0), 0) || 234500;
  const activeSellers = Math.ceil(totalSellers * 0.72) || 612;
  const categoryData = generateCategoryData(allAds);

  const recentActions = [
    { id: 1, action: "Novo anúncio publicado", seller: allAds[0]?.title || "Fazenda Santa Fé", time: "2min atrás", status: "active" },
    { id: 2, action: "Vendedor Premium registrado", seller: "Agropecuária Brasil", time: "15min atrás", status: "active" },
    { id: 3, action: "Anúncio removido por denúncia", seller: "Fazenda do Vale", time: "45min atrás", status: "warning" },
    { id: 4, action: "Plano Plus renovado", seller: "Pecuária Central", time: "1h atrás", status: "active" },
  ];

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="container mx-auto px-4 py-12">
        {/* Header */}
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-4xl font-bold font-serif mb-2" data-testid="text-admin-title">Painel Administrativo</h1>
            <p className="text-muted-foreground" data-testid="text-admin-subtitle">Gerenciamento completo da plataforma</p>
          </div>
          <Button onClick={loadData} variant="outline" className="gap-2" data-testid="button-refresh">
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-8">
          <TabsList className="grid w-full grid-cols-4 mb-6">
            <TabsTrigger value="dashboard" data-testid="tab-dashboard">Dashboard</TabsTrigger>
            <TabsTrigger value="moderation" data-testid="tab-moderation">Moderação</TabsTrigger>
            <TabsTrigger value="users" data-testid="tab-users">Usuários</TabsTrigger>
            <TabsTrigger value="verifications" data-testid="tab-verifications">Verificações</TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard">
        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card data-testid="card-total-sellers">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Users className="h-4 w-4 text-primary" /> Total de Vendedores
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{totalSellers}</div>
              <p className="text-xs text-muted-foreground mt-1">+12% vs mês passado</p>
            </CardContent>
          </Card>

          <Card data-testid="card-active-listings">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <ShoppingCart className="h-4 w-4 text-accent" /> Anúncios Ativos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{totalListings}</div>
              <p className="text-xs text-muted-foreground mt-1">+8% vs semana passada</p>
            </CardContent>
          </Card>

          <Card data-testid="card-total-revenue">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-green-600" /> Receita Total
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">R$ {(totalRevenue / 1000).toFixed(0)}k</div>
              <p className="text-xs text-muted-foreground mt-1">+23% vs mês passado</p>
            </CardContent>
          </Card>

          <Card data-testid="card-active-sellers">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-blue-600" /> Vendedores Ativos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{activeSellers}</div>
              <p className="text-xs text-muted-foreground mt-1">{Math.round((activeSellers / totalSellers) * 100)}% do total</p>
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          {/* Sales Chart */}
          <Card className="lg:col-span-2" data-testid="card-sales-chart">
            <CardHeader>
              <CardTitle>Vendas e Receita</CardTitle>
              <CardDescription>Últimos 6 meses</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="sales" fill="#10b981" />
                  <Bar dataKey="revenue" fill="#f59e0b" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Category Distribution */}
          <Card data-testid="card-category-chart">
            <CardHeader>
              <CardTitle>Distribuição por Categoria</CardTitle>
              <CardDescription>% de anúncios</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value }) => `${name}: ${value}`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {categoryData.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity */}
        <Card data-testid="card-recent-activity">
          <CardHeader>
            <CardTitle>Atividade Recente</CardTitle>
            <CardDescription>Últimas ações na plataforma</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActions.map((action) => (
                <div key={action.id} className="flex items-center justify-between p-3 border border-border rounded-lg hover:bg-secondary/30 transition" data-testid={`row-action-${action.id}`}>
                  <div className="flex items-center gap-4 flex-1">
                    <div>
                      {action.status === "active" ? (
                        <CheckCircle2 className="h-5 w-5 text-green-600" />
                      ) : (
                        <AlertCircle className="h-5 w-5 text-yellow-600" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-sm">{action.action}</p>
                      <p className="text-xs text-muted-foreground">{action.seller}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge variant={action.status === "active" ? "secondary" : "outline"}>
                      {action.status === "active" ? "✓ OK" : "⚠ Atenção"}
                    </Badge>
                    <p className="text-xs text-muted-foreground mt-1">{action.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Management Buttons */}
        <div className="mt-8 flex gap-4 flex-wrap" data-testid="group-admin-actions">
          <Button variant="outline" onClick={() => setActiveTab("moderation")} data-testid="button-manage-listings">Gerenciar Anúncios</Button>
          <Button variant="outline" onClick={() => setActiveTab("users")} data-testid="button-manage-sellers">Gerenciar Usuários</Button>
          <Button variant="outline" data-testid="button-view-reports">Ver Relatórios</Button>
        </div>
          </TabsContent>

          <TabsContent value="moderation">
            <Card>
              <CardHeader>
                <CardTitle>Moderação de Anúncios</CardTitle>
                <CardDescription>Gerencie e modere todos os anúncios da plataforma</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {allAds.length === 0 ? (
                    <p className="text-muted-foreground text-center py-8">Nenhum anúncio encontrado</p>
                  ) : (
                    allAds.slice(0, 20).map((ad) => (
                      <div key={ad.id} className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-secondary/30 transition" data-testid={`row-ad-${ad.id}`}>
                        <div className="flex items-center gap-4 flex-1">
                          <img 
                            src={ad.images?.[0] || ad.image} 
                            alt={ad.title}
                            className="w-16 h-16 object-cover rounded-md"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="64" height="64"%3E%3Crect fill="%23ddd" width="64" height="64"/%3E%3C/svg%3E';
                            }}
                          />
                          <div>
                            <p className="font-medium">{ad.title}</p>
                            <p className="text-sm text-muted-foreground">{ad.category} • {ad.breed} • {ad.quantity} cab</p>
                            <p className="text-xs text-muted-foreground">{ad.city}, {ad.state}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <Badge variant={ad.active !== false ? "secondary" : "outline"}>
                            {ad.active !== false ? "Ativo" : "Inativo"}
                          </Badge>
                          <div className="flex gap-2">
                            <Button 
                              variant="ghost" 
                              size="icon"
                              onClick={() => window.open(`/product/${ad.id}`, '_blank')}
                              data-testid={`button-view-${ad.id}`}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon"
                              onClick={() => handleToggleAd(ad.id, ad.active !== false)}
                              data-testid={`button-toggle-${ad.id}`}
                            >
                              <Ban className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon"
                              className="text-destructive hover:text-destructive"
                              onClick={() => handleDeleteAd(ad.id)}
                              data-testid={`button-delete-${ad.id}`}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="users">
            <Card>
              <CardHeader>
                <CardTitle>Gestão de Usuários</CardTitle>
                <CardDescription>Visualize e gerencie os usuários da plataforma</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12 text-muted-foreground">
                  <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p className="text-lg font-medium mb-2">Gestão de Usuários</p>
                  <p className="text-sm">Total de {totalSellers} vendedores registrados</p>
                  <p className="text-sm">{activeSellers} vendedores ativos na plataforma</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="verifications">
            <Card>
              <CardHeader>
                <CardTitle>Verificação de Produtores (KYC)</CardTitle>
                <CardDescription>Aprove ou rejeite selos de verificação para aumentar a confiança no mercado</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {verifications.length === 0 ? (
                    <p className="text-muted-foreground text-center py-8">Nenhuma solicitação de verificação no momento</p>
                  ) : (
                    verifications.map((v) => (
                      <div key={v.id} className="flex items-center justify-between p-4 border border-border rounded-lg">
                        <div className="flex items-center gap-4">
                          <div>
                            <p className="font-medium">{v.user?.name || "Produtor"}</p>
                            <p className="text-sm text-muted-foreground">Documento: {v.cpfCnpj} ({v.documentType})</p>
                            <p className="text-xs text-muted-foreground">Status atual: {v.status}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          {v.status === 'pending' && (
                            <>
                              <Button 
                                variant="outline" 
                                size="sm"
                                className="text-green-600 hover:text-green-700 hover:bg-green-50"
                                onClick={() => handleVerificationAction(v.userId, 'approved')}
                              >
                                <CheckCircle2 className="h-4 w-4 mr-2" /> Aprovar
                              </Button>
                              <Button 
                                variant="outline" 
                                size="sm"
                                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                onClick={() => handleVerificationAction(v.userId, 'rejected')}
                              >
                                <Ban className="h-4 w-4 mr-2" /> Rejeitar
                              </Button>
                            </>
                          )}
                          {v.status === 'approved' && (
                            <Badge className="bg-green-100 text-green-800">Aprovado</Badge>
                          )}
                          {v.status === 'rejected' && (
                            <Badge className="bg-red-100 text-red-800">Rejeitado</Badge>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
