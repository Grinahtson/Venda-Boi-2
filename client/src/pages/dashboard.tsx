import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Bar, BarChart, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { LayoutDashboard, Package, DollarSign, Users, Bell, Settings, LogOut, Edit2, Trash2, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAppContext } from "@/context/AppContext";
import { adsAPI } from "@/lib/api";
import { categories } from "@/lib/data";
import { toast } from "sonner";
import { useLocation } from "wouter";

const chartData = [
  { name: "Jan", total: 0 },
  { name: "Fev", total: 0 },
  { name: "Mar", total: 0 },
  { name: "Abr", total: 0 },
  { name: "Mai", total: 0 },
  { name: "Jun", total: 0 },
];

export default function Dashboard() {
  const { user, logout, sessionId } = useAppContext();
  const [, navigate] = useLocation();
  const [myAds, setMyAds] = useState<any[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasUnreadNotifications, setHasUnreadNotifications] = useState(false);
  const [currentPlan, setCurrentPlan] = useState<string>(user?.plan || "Free");
  const [marketData, setMarketData] = useState<any[]>([]);
  const [marketState, setMarketState] = useState("SP");
  
  // Matchmaking
  const [marketAlerts, setMarketAlerts] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [newAlert, setNewAlert] = useState({ category: "Gado de Corte", state: "SP", maxPrice: 0 });

  // Fetch latest user data directly from server using localStorage session
  useEffect(() => {
    const fetchUserPlan = async () => {
      // Try context sessionId first, then localStorage
      const activeSessionId = sessionId || localStorage.getItem("boi-na-rede-session");
      
      if (!activeSessionId) {
        console.log("No session found for fetching plan");
        return;
      }
      
      try {
        const response = await fetch("/api/users/me", {
          headers: { "x-session-id": activeSessionId }
        });
        if (response.ok) {
          const userData = await response.json();
          console.log("Fetched user plan:", userData.plan);
          setCurrentPlan(userData.plan || "Free");
        } else {
          console.log("Failed to fetch user, status:", response.status);
        }
      } catch (error) {
        console.error("Failed to fetch user plan:", error);
      }
    };
    
    fetchUserPlan();
  }, [sessionId]);

  // Load user's ads on mount
  useEffect(() => {
    if (!sessionId) return;
    
    const loadAds = async () => {
      try {
        setLoading(true);
        const ads = await adsAPI.userAds(sessionId);
        setMyAds(ads);
      } catch (error) {
        console.error("Failed to load ads:", error);
        toast.error("Erro ao carregar anúncios");
      } finally {
        setLoading(false);
      }
    };
    
    loadAds();
  }, [sessionId]);

  useEffect(() => {
    const fetchMarketData = async () => {
      try {
        const res = await fetch(`/api/market/history?state=${marketState}`);
        if (res.ok) {
          const data = await res.json();
          // Certificar de que dados existem ou mockar se estiver vazio
          if (data && data.length > 0) {
            // Sort by date ascending for chart
            setMarketData([...data].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()));
          } else {
            // Mock data se banco vazio
            setMarketData([
              { date: '2025-01-01', price: 220 },
              { date: '2025-02-01', price: 231 },
              { date: '2025-03-01', price: 228 },
              { date: '2025-04-01', price: 235 }
            ]);
          }
        }
      } catch (e) {
        console.error("Failed to load market data", e);
      }
    };
    fetchMarketData();
  }, [marketState]);

  useEffect(() => {
    if (!sessionId) return;
    const fetchNotifsAndAlerts = async () => {
      try {
        const headers = { Authorization: `Bearer ${sessionId}` };
        const [alertsRes, notifsRes] = await Promise.all([
          fetch("/api/alerts", { headers }),
          fetch("/api/notifications", { headers })
        ]);
        if (alertsRes.ok) setMarketAlerts(await alertsRes.json());
        if (notifsRes.ok) {
          const data = await notifsRes.json();
          setNotifications(data);
          setHasUnreadNotifications(data.some((n: any) => !n.read));
        }
      } catch (e) { console.error("Failed to fetch alerts", e); }
    };
    fetchNotifsAndAlerts();
  }, [sessionId]);

  const handleCreateAlert = async () => {
    if (newAlert.maxPrice <= 0) return toast.error("Preço deve ser maior que 0");
    try {
      const res = await fetch("/api/alerts", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${sessionId}` },
        body: JSON.stringify(newAlert)
      });
      if (res.ok) {
        const created = await res.json();
        setMarketAlerts([created, ...marketAlerts]);
        toast.success("Alerta criado! Avisaremos se encontrarmos um lote.");
      }
    } catch (e) { toast.error("Erro ao criar alerta."); }
  };

  const handleDeleteAlert = async (id: string) => {
    try {
      await fetch(`/api/alerts/${id}`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${sessionId}` }
      });
      setMarketAlerts(marketAlerts.filter(a => a.id !== id));
      toast.success("Alerta removido");
    } catch (e) { toast.error("Erro ao deletar alerta."); }
  };

  const handleDeleteAd = async (id: string) => {
    if (!sessionId) return;
    
    try {
      await adsAPI.delete(sessionId, id);
      setMyAds(myAds.filter(ad => ad.id !== id));
      setShowDeleteConfirm(null);
      toast.success("Anúncio deletado com sucesso!");
    } catch (error: any) {
      toast.error("Erro ao deletar anúncio");
    }
  };

  const toggleAdStatus = (id: string) => {
    setMyAds(myAds.map(ad =>
      ad.id === id ? { ...ad, featured: !ad.featured } : ad
    ));
  };

  const handleLogout = () => {
    logout();
    window.location.href = "/";
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="flex h-screen overflow-hidden">
        
        {/* Sidebar */}
        <aside className="hidden w-64 border-r bg-card md:block">
          <div className="flex h-full flex-col">
            <div className="p-6">
              <h2 className="text-xl font-bold font-serif text-primary">Boi na Rede</h2>
            </div>
            <div className="flex-1 px-4 space-y-2">
              <Button variant="secondary" className="w-full justify-start gap-2">
                <LayoutDashboard className="h-4 w-4" /> Painel Geral
              </Button>
              <Button variant="ghost" className="w-full justify-start gap-2">
                <Package className="h-4 w-4" /> Meus Anúncios
              </Button>
              <Button variant="ghost" className="w-full justify-start gap-2">
                <DollarSign className="h-4 w-4" /> Vendas
              </Button>
              <Button variant="ghost" className="w-full justify-start gap-2">
                <Users className="h-4 w-4" /> Mensagens
              </Button>
            </div>
            <div className="p-4 border-t border-border space-y-2">
               <Button variant="ghost" className="w-full justify-start gap-2">
                <Settings className="h-4 w-4" /> Configurações
              </Button>
              <Button 
                variant="ghost" 
                className="w-full justify-start gap-2 text-red-500 hover:text-red-600 hover:bg-red-50"
                onClick={handleLogout}
              >
                <LogOut className="h-4 w-4" /> Sair
              </Button>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto p-8">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold font-serif">Olá, {user?.name || "Vendedor"}</h1>
              <p className="text-muted-foreground">Aqui está o resumo da sua operação hoje.</p>
            </div>
            <div className="flex items-center gap-4">
              <Button 
                variant="outline" 
                size="icon" 
                className="rounded-full relative"
                onClick={() => toast.info("Nenhuma notificação no momento")}
              >
                <Bell className="h-5 w-5" />
                {hasUnreadNotifications && (
                  <span className="absolute top-0 right-0 h-2.5 w-2.5 bg-red-500 rounded-full border-2 border-background"></span>
                )}
              </Button>
              <Avatar className="cursor-pointer" onClick={() => window.location.href = "/profile"}>
                <AvatarImage src={user?.avatar || ""} />
                <AvatarFallback className="bg-green-600 text-white">{user?.name?.substring(0, 2).toUpperCase()}</AvatarFallback>
              </Avatar>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Vendas Totais</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">R$ 0,00</div>
                <p className="text-xs text-muted-foreground">Nenhuma venda ainda</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Anúncios Ativos</CardTitle>
                <Package className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{myAds.filter(a => a.featured).length}</div>
                <p className="text-xs text-muted-foreground">{myAds.length} total</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Visualizações</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">0</div>
                <p className="text-xs text-muted-foreground">Nenhuma visualização ainda</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Seu Plano</CardTitle>
                <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100 border-emerald-200">{currentPlan}</Badge>
              </CardHeader>
              <CardContent>
                <div className="text-xs font-medium mt-2">Renova em 15 dias</div>
                <Button variant="link" className="h-auto p-0 text-xs text-primary" onClick={() => navigate("/pricing")}>Fazer Upgrade</Button>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
            {/* Chart */}
            <Card className="col-span-4">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <div>
                  <CardTitle>Inteligência de Mercado</CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">Evolução do Preço da Arroba</p>
                </div>
                <Select value={marketState} onValueChange={setMarketState}>
                  <SelectTrigger className="w-[100px]">
                    <SelectValue placeholder="Estado" />
                  </SelectTrigger>
                  <SelectContent>
                    {["SP", "MG", "MS", "MT", "GO", "PR"].map(uf => (
                       <SelectItem key={uf} value={uf}>{uf}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </CardHeader>
              <CardContent className="pl-2 pt-4">
                <ResponsiveContainer width="100%" height={330}>
                  <LineChart data={marketData}>
                    <XAxis 
                      dataKey="date" 
                      stroke="#888888" 
                      fontSize={12} 
                      tickLine={false} 
                      axisLine={false} 
                      tickFormatter={(val) => new Date(val).toLocaleDateString('pt-BR', { month: 'short' })} 
                    />
                    <YAxis 
                      stroke="#888888" 
                      fontSize={12} 
                      tickLine={false} 
                      axisLine={false} 
                      domain={['auto', 'auto']} 
                      tickFormatter={(value) => `R$${value}`} 
                    />
                    <Tooltip 
                      contentStyle={{ background: 'var(--background)', borderColor: 'var(--border)', borderRadius: '8px' }}
                      itemStyle={{ color: 'var(--foreground)' }}
                      labelFormatter={(val) => new Date(val).toLocaleDateString('pt-BR')}
                      formatter={(val: number) => [`R$ ${val.toFixed(2)}`, "Preço da Arroba"]}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="price" 
                      stroke="#10b981" 
                      strokeWidth={3} 
                      dot={{ r: 4, strokeWidth: 2 }}
                      activeDot={{ r: 8 }} 
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Ads Management */}
            <Card className="col-span-3">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Seus Anúncios</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {myAds.map((ad) => (
                    <div key={ad.id} className="flex items-center justify-between p-3 border border-border rounded-lg hover:bg-secondary/20 transition">
                      <div className="flex items-center gap-3 flex-1">
                        <Avatar className="h-10 w-10 rounded">
                          <AvatarImage src={ad.image} alt={ad.title} className="object-cover" />
                          <AvatarFallback>AD</AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <p className="text-sm font-medium line-clamp-1">{ad.title}</p>
                          <p className="text-xs text-muted-foreground">{ad.category} • {ad.quantity} cab</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge 
                          variant={ad.featured ? "default" : "secondary"} 
                          className="text-xs cursor-pointer"
                          onClick={() => toggleAdStatus(ad.id)}
                        >
                          {ad.featured ? "Ativo" : "Inativo"}
                        </Badge>
                        <Button size="sm" variant="ghost" className="h-7 w-7 p-0">
                          <Edit2 className="h-4 w-4 text-blue-500" />
                        </Button>
                        <div className="relative">
                          <Button 
                            size="sm" 
                            variant="ghost" 
                            className="h-7 w-7 p-0"
                            onClick={() => setShowDeleteConfirm(ad.id)}
                          >
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                          {showDeleteConfirm === ad.id && (
                            <div className="absolute right-0 top-8 bg-card border border-border rounded-lg p-2 shadow-lg z-10">
                              <p className="text-xs text-muted-foreground mb-2 whitespace-nowrap">Deletar anúncio?</p>
                              <div className="flex gap-2">
                                <Button size="sm" variant="destructive" className="h-6 text-xs" onClick={() => handleDeleteAd(ad.id)}>
                                  Sim
                                </Button>
                                <Button size="sm" variant="outline" className="h-6 text-xs" onClick={() => setShowDeleteConfirm(null)}>
                                  Não
                                </Button>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 md:grid-cols-2 mt-8">
            {/* Matchmaking Alerts */}
            <Card className="col-span-1">
              <CardHeader className="flex flex-row items-center justify-between pb-2 bg-gradient-to-r from-emerald-900 to-green-800 text-white rounded-t-xl">
                <div>
                  <CardTitle className="flex items-center gap-2"><Bell className="h-5 w-5" /> Radar de Mercado</CardTitle>
                  <p className="text-sm opacity-90 mt-1">Crie alertas para ser avisado quando um gado novo for postado.</p>
                </div>
              </CardHeader>
              <CardContent className="pt-4 space-y-4">
                <div className="flex gap-2 mb-4">
                  <Select value={newAlert.category} onValueChange={(val) => setNewAlert({...newAlert, category: val})}>
                    <SelectTrigger className="w-1/3 text-xs"><SelectValue placeholder="Categoria" /></SelectTrigger>
                    <SelectContent>
                      {categories.map(c => <SelectItem key={c.id} value={c.id} className="text-xs">{c.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <Select value={newAlert.state} onValueChange={(val) => setNewAlert({...newAlert, state: val})}>
                    <SelectTrigger className="w-1/4 text-xs"><SelectValue placeholder="Estado" /></SelectTrigger>
                    <SelectContent>
                      {["SP", "MG", "MS", "MT", "GO", "PR", "BA", "TO", "PA"].map(uf => <SelectItem key={uf} value={uf}>{uf}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <input 
                    type="number" 
                    className="flex h-9 w-1/4 rounded-md border border-input bg-transparent px-3 py-1 text-xs shadow-sm transition-colors"
                    placeholder="Máx R$" 
                    value={newAlert.maxPrice || ""}
                    onChange={(e) => setNewAlert({...newAlert, maxPrice: parseFloat(e.target.value) || 0})}
                  />
                  <Button size="sm" className="w-auto h-9" onClick={handleCreateAlert}>Criar</Button>
                </div>
                
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {marketAlerts.length === 0 && <p className="text-xs text-muted-foreground text-center py-4">Nenhum radar ativo</p>}
                  {marketAlerts.map(alert => (
                    <div key={alert.id} className="flex items-center justify-between p-3 border border-border bg-secondary/20 rounded-md">
                      <div>
                        <p className="text-sm font-bold">{alert.category} - {alert.state}</p>
                        <p className="text-xs text-muted-foreground">Orçamento máx: R$ {alert.maxPrice}</p>
                      </div>
                      <Button size="sm" variant="ghost" onClick={() => handleDeleteAlert(alert.id)}>
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Notifications */}
            <Card className="col-span-1">
              <CardHeader className="flex flex-row items-center justify-between pb-2 bg-secondary rounded-t-xl border-b">
                <div>
                  <CardTitle className="flex items-center gap-2"><Bell className="h-5 w-5 text-primary" /> Suas Notificações</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="pt-4 p-0">
                <div className="space-y-0 max-h-80 overflow-y-auto">
                  {notifications.length === 0 && <p className="text-sm text-muted-foreground text-center py-8">Você não possui notificações.</p>}
                  {notifications.map(notif => (
                    <div key={notif.id} className={`p-4 border-b border-border hover:bg-secondary/20 transition-colors ${!notif.read ? 'bg-primary/5' : ''}`}>
                      <div className="flex justify-between items-start">
                        <div className="space-y-1">
                          <p className="text-sm font-bold flex items-center gap-2">
                            {notif.title}
                            {!notif.read && <span className="h-2 w-2 rounded-full bg-red-500 block"></span>}
                          </p>
                          <p className="text-sm text-muted-foreground">{notif.message}</p>
                          {notif.link && (
                            <Button 
                              variant="link" 
                              className="h-auto p-0 text-xs text-primary mt-2 flex items-center" 
                              onClick={async () => {
                                if (!notif.read) {
                                  await fetch(`/api/notifications/${notif.id}/read`, { method: "PUT", headers: { "Authorization": `Bearer ${sessionId}` }});
                                  setNotifications(notifications.map(n => n.id === notif.id ? {...n, read: true} : n));
                                }
                                window.location.href = notif.link;
                              }}
                            >
                              Ver Detalhes <Eye className="h-3 w-3 ml-1" />
                            </Button>
                          )}
                        </div>
                        <span className="text-[10px] text-muted-foreground whitespace-nowrap ml-2">
                          {new Date(notif.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
}
