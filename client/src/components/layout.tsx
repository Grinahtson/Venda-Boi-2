import { Link, useLocation } from "wouter";
import { 
  LayoutDashboard, 
  Store, 
  Calculator, 
  Menu, 
  X, 
  User, 
  LogOut, 
  PlusCircle,
  TrendingUp,
  Moon,
  Sun,
  BarChart3,
  Heart,
  Settings,
  MessageSquare
} from "lucide-react";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAppContext } from "@/context/AppContext";
import { motion } from "framer-motion";
import { toast } from "sonner";
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

export function Layout({ children }: { children: React.ReactNode }) {
  const [location, setLocation] = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const { user, logout } = useAppContext();

  useEffect(() => {
    const saved = localStorage.getItem("theme");
    if (saved === "dark" || (!saved && window.matchMedia("(prefers-color-scheme: dark)").matches)) {
      setIsDarkMode(true);
      document.documentElement.classList.add("dark");
    }
  }, []);

  const toggleDarkMode = () => {
    const newMode = !isDarkMode;
    setIsDarkMode(newMode);
    localStorage.setItem("theme", newMode ? "dark" : "light");
    if (newMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  };

  const handleLogout = () => {
    logout();
    toast.success("Desconectado com sucesso! 👋");
    setLocation("/", { replace: true });
  };

  const navigation = [
    { name: "Home", href: "/" },
    { name: "Marketplace", href: "/marketplace", icon: Store },
    { name: "Cotações", href: "/cotacoes", icon: TrendingUp },
    { name: "Calculadora", href: "/calculator", icon: Calculator },
    { name: "Planos", href: "/pricing", icon: BarChart3 },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-background font-sans">
      {/* Navbar */}
      <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 hover:opacity-90 transition-opacity">
              <div className="bg-primary text-white p-1.5 rounded-md">
                <Store className="h-6 w-6" />
              </div>
              <span className="text-xl font-serif font-bold text-primary tracking-tight">
                Boi na Rede
              </span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-6">
            {navigation.map((item) => {
              const isActive = location === item.href;
              return (
                <Link 
                  key={item.name} 
                  href={item.href}
                  className={`text-sm font-medium transition-colors hover:text-primary ${
                    isActive ? "text-primary font-bold" : "text-muted-foreground"
                  }`}
                >
                  {item.name}
                </Link>
              );
            })}
            <Link 
              href="/favorites"
              className={`text-sm font-medium transition-colors hover:text-primary ${
                location === "/favorites" ? "text-primary font-bold" : "text-muted-foreground"
              }`}
              data-testid="link-favorites"
            >
              Favoritos
            </Link>
          </nav>

          {/* Actions */}
          <div className="hidden md:flex items-center gap-4">
            {!user && (
              <Link href="/register">
                <Button variant="outline" size="sm" className="font-medium" data-testid="button-register">
                  Cadastro
                </Button>
              </Link>
            )}
            <Link href="/create-ad">
              <Button variant="default" size="sm" className="bg-primary hover:bg-primary/90 text-white font-medium gap-2" data-testid="button-create-ad">
                <PlusCircle className="h-4 w-4" />
                Anunciar Gado
              </Button>
            </Link>

            <Button 
              variant="ghost" 
              size="icon"
              onClick={toggleDarkMode}
              data-testid="button-toggle-theme"
            >
              {isDarkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>

            <Link href="/chat">
              <Button variant="ghost" size="icon" data-testid="button-chat-nav">
                <MessageSquare className="h-4 w-4" />
              </Button>
            </Link>

            <Link href="/favorites">
              <Button variant="ghost" size="icon" data-testid="button-favorites-nav">
                <Heart className="h-4 w-4" />
              </Button>
            </Link>

            <Link href="/admin">
              <Button variant="ghost" size="icon" data-testid="button-admin">
                <BarChart3 className="h-4 w-4" />
              </Button>
            </Link>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="relative" data-testid="button-user-menu">
                  <User className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                {user ? (
                  <>
                    <DropdownMenuLabel className="font-normal">
                      <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium leading-none" data-testid="text-user-name">{user.name}</p>
                        <p className="text-xs leading-none text-muted-foreground" data-testid="text-user-email">
                          {user.email}
                        </p>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link href="/dashboard">
                        <div className="flex items-center cursor-pointer w-full" data-testid="menu-item-dashboard">
                          <LayoutDashboard className="mr-2 h-4 w-4" />
                          <span>Painel do Vendedor</span>
                        </div>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/admin">
                        <div className="flex items-center cursor-pointer w-full" data-testid="menu-item-admin">
                          <BarChart3 className="mr-2 h-4 w-4" />
                          <span>Painel Administrativo</span>
                        </div>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/profile">
                        <div className="flex items-center cursor-pointer w-full" data-testid="menu-item-profile">
                          <User className="mr-2 h-4 w-4" />
                          <span>Meu Perfil</span>
                        </div>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <DropdownMenuItem onSelect={(e) => e.preventDefault()} data-testid="menu-item-logout-trigger">
                          <LogOut className="mr-2 h-4 w-4" />
                          <span>Sair</span>
                        </DropdownMenuItem>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Desconectar?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Você será desconectado da plataforma. Tem certeza?
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <div className="flex gap-2">
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={handleLogout}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            data-testid="button-logout-confirm"
                          >
                            Sair Agora
                          </AlertDialogAction>
                        </div>
                      </AlertDialogContent>
                    </AlertDialog>
                  </>
                ) : (
                  <DropdownMenuLabel className="font-normal text-center py-4">
                    <Link href="/auth" className="text-sm font-medium text-primary hover:underline">
                        Faça login para continuar
                    </Link>
                  </DropdownMenuLabel>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2 text-muted-foreground hover:text-foreground"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-border bg-background p-4 space-y-4 animate-in slide-in-from-top-5">
            <nav className="flex flex-col gap-4">
              {navigation.map((item) => (
                <Link 
                  key={item.name} 
                  href={item.href}
                  className="flex items-center gap-2 text-base font-medium text-foreground p-2 rounded-md hover:bg-secondary"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  {item.icon && <item.icon className="h-5 w-5 text-muted-foreground" />}
                  {item.name}
                </Link>
              ))}
              <hr className="border-border" />
              {!user && (
                <Link href="/register">
                  <Button variant="outline" className="w-full justify-start" onClick={() => setIsMobileMenuOpen(false)}>
                    Cadastro
                  </Button>
                </Link>
              )}
              <Link href="/create-ad">
                <Button className="w-full justify-start bg-primary text-white" onClick={() => setIsMobileMenuOpen(false)}>
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Anunciar Gado
                </Button>
              </Link>
              <Link href="/dashboard">
                <Button variant="outline" className="w-full justify-start" onClick={() => setIsMobileMenuOpen(false)} data-testid="mobile-link-dashboard">
                  <LayoutDashboard className="mr-2 h-4 w-4" />
                  Painel do Vendedor
                </Button>
              </Link>
              {user && (
                <>
                  <Link href="/profile">
                    <Button variant="outline" className="w-full justify-start" onClick={() => setIsMobileMenuOpen(false)} data-testid="mobile-link-profile">
                      <User className="mr-2 h-4 w-4" />
                      Meu Perfil
                    </Button>
                  </Link>
                  <Link href="/favorites">
                    <Button variant="outline" className="w-full justify-start" onClick={() => setIsMobileMenuOpen(false)} data-testid="mobile-link-favorites">
                      <Heart className="mr-2 h-4 w-4" />
                      Favoritos
                    </Button>
                  </Link>
                  <Link href="/admin">
                    <Button variant="outline" className="w-full justify-start" onClick={() => setIsMobileMenuOpen(false)} data-testid="mobile-link-admin">
                      <BarChart3 className="mr-2 h-4 w-4" />
                      Painel Administrativo
                    </Button>
                  </Link>
                </>
              )}
              <Button 
                variant="outline" 
                className="w-full justify-start"
                onClick={() => {
                  toggleDarkMode();
                  setIsMobileMenuOpen(false);
                }}
                data-testid="mobile-button-theme"
              >
                {isDarkMode ? <Sun className="mr-2 h-4 w-4" /> : <Moon className="mr-2 h-4 w-4" />}
                {isDarkMode ? "Modo Claro" : "Modo Escuro"}
              </Button>
            </nav>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="flex-1">
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-secondary border-t border-border py-12 text-secondary-foreground">
        <div className="container mx-auto px-4 grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="bg-primary text-white p-1.5 rounded-md">
                <Store className="h-5 w-5" />
              </div>
              <span className="text-lg font-serif font-bold text-primary dark:text-secondary-foreground">
                Boi na Rede
              </span>
            </div>
            <p className="text-sm text-secondary-foreground/80 leading-relaxed">
              Conectando pecuaristas de todo o Brasil. O mercado digital mais seguro e eficiente para compra e venda de gado.
            </p>
          </div>
          
          <div>
            <h4 className="font-bold mb-4 text-secondary-foreground">Plataforma</h4>
            <ul className="space-y-2 text-sm text-secondary-foreground/80">
              <li><Link href="/marketplace" className="hover:text-primary">Comprar Gado</Link></li>
              <li><Link href="/create-ad" className="hover:text-primary">Vender Gado</Link></li>
              <li><Link href="/calculator" className="hover:text-primary">Calculadora de Lucro</Link></li>
              <li><Link href="/pricing" className="hover:text-primary">Planos e Preços</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold mb-4 text-secondary-foreground">Suporte</h4>
            <ul className="space-y-2 text-sm text-secondary-foreground/80">
              <li><a href="#" className="hover:text-primary">Central de Ajuda</a></li>
              <li><a href="#" className="hover:text-primary">Termos de Uso</a></li>
              <li><a href="#" className="hover:text-primary">Política de Privacidade</a></li>
              <li><a href="#" className="hover:text-primary">Fale Conosco</a></li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold mb-4 text-secondary-foreground">Contato</h4>
            <p className="text-sm text-secondary-foreground/80 mb-2">
              suporte@boinarede.com.br
            </p>
            <p className="text-sm text-secondary-foreground/80">
              Av. Paulista, 1000 - SP
            </p>
          </div>
        </div>
        <div className="container mx-auto px-4 mt-12 pt-8 border-t border-border/50 text-center text-sm text-secondary-foreground/60">
          © 2025 Boi na Rede. Todos os direitos reservados.
        </div>
      </footer>
    </div>
  );
}
