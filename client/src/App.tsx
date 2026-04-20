import { Switch, Route } from "wouter";
import { Suspense, lazy } from "react";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as SonnerToaster } from "sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AppProvider } from "@/context/AppContext";
import { FavoritesProvider } from "@/context/FavoritesContext";
import NotFound from "@/pages/not-found";
import { Layout } from "@/components/layout";
import Home from "@/pages/home";

// Lazy load non-critical pages
const Marketplace = lazy(() => import("@/pages/marketplace"));
const ProductDetails = lazy(() => import("@/pages/product-details"));
const Calculator = lazy(() => import("@/pages/calculator"));
const Pricing = lazy(() => import("@/pages/pricing"));
const Dashboard = lazy(() => import("@/pages/dashboard"));
const CreateAd = lazy(() => import("@/pages/create-ad"));
const Admin = lazy(() => import("@/pages/admin"));
const Favorites = lazy(() => import("@/pages/favorites"));
const Profile = lazy(() => import("@/pages/profile"));
const Chat = lazy(() => import("@/pages/chat"));
const Auth = lazy(() => import("@/pages/auth"));
const Register = lazy(() => import("@/pages/register"));
const CheckoutSuccess = lazy(() => import("@/pages/checkout-success"));
const CheckoutCancel = lazy(() => import("@/pages/checkout-cancel"));
const Cotacoes = lazy(() => import("@/pages/cotacoes"));
const Verification = lazy(() => import("@/pages/verification"));
const ForgotPassword = lazy(() => import("@/pages/forgot-password"));
const ResetPassword = lazy(() => import("@/pages/reset-password"));
const Contact = lazy(() => import("@/pages/contact"));

// Loading fallback
function PageLoader() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="animate-pulse">Carregando...</div>
    </div>
  );
}

function Router() {
  return (
    <Switch>
      <Route path="/auth">
        <Suspense fallback={<PageLoader />}>
          <Auth />
        </Suspense>
      </Route>
      <Route path="/register">
        <Suspense fallback={<PageLoader />}>
          <Register />
        </Suspense>
      </Route>
      <Route path="/forgot-password">
        <Suspense fallback={<PageLoader />}>
          <ForgotPassword />
        </Suspense>
      </Route>
      <Route path="/reset-password">
        <Suspense fallback={<PageLoader />}>
          <ResetPassword />
        </Suspense>
      </Route>
      <Route path="/contato">
        <Suspense fallback={<PageLoader />}>
          <Contact />
        </Suspense>
      </Route>
      <Route path="/checkout/success">
        <Suspense fallback={<PageLoader />}>
          <CheckoutSuccess />
        </Suspense>
      </Route>
      <Route path="/checkout/cancel">
        <Suspense fallback={<PageLoader />}>
          <CheckoutCancel />
        </Suspense>
      </Route>
      
      {/* Wrapped Routes */}
      <Route path="/">
        <Layout>
          <Home />
        </Layout>
      </Route>
      <Route path="/marketplace">
        <Layout>
          <Suspense fallback={<PageLoader />}>
            <Marketplace />
          </Suspense>
        </Layout>
      </Route>
      <Route path="/product/:id">
        <Layout>
          <Suspense fallback={<PageLoader />}>
            <ProductDetails />
          </Suspense>
        </Layout>
      </Route>
      <Route path="/calculator">
        <Layout>
          <Suspense fallback={<PageLoader />}>
            <Calculator />
          </Suspense>
        </Layout>
      </Route>
      <Route path="/pricing">
        <Layout>
          <Suspense fallback={<PageLoader />}>
            <Pricing />
          </Suspense>
        </Layout>
      </Route>
      <Route path="/dashboard">
        <Layout>
          <Suspense fallback={<PageLoader />}>
            <Dashboard />
          </Suspense>
        </Layout>
      </Route>
      <Route path="/create-ad">
        <Layout>
          <Suspense fallback={<PageLoader />}>
            <CreateAd />
          </Suspense>
        </Layout>
      </Route>
      <Route path="/profile">
        <Layout>
          <Suspense fallback={<PageLoader />}>
            <Profile />
          </Suspense>
        </Layout>
      </Route>
      <Route path="/admin">
        <Layout>
          <Suspense fallback={<PageLoader />}>
            <Admin />
          </Suspense>
        </Layout>
      </Route>
      <Route path="/favorites">
        <Layout>
          <Suspense fallback={<PageLoader />}>
            <Favorites />
          </Suspense>
        </Layout>
      </Route>
      <Route path="/chat">
        <Layout>
          <Suspense fallback={<PageLoader />}>
            <Chat />
          </Suspense>
        </Layout>
      </Route>
      <Route path="/chat/:userId">
        <Layout>
          <Suspense fallback={<PageLoader />}>
            <Chat />
          </Suspense>
        </Layout>
      </Route>
      <Route path="/cotacoes">
        <Layout>
          <Suspense fallback={<PageLoader />}>
            <Cotacoes />
          </Suspense>
        </Layout>
      </Route>
      <Route path="/verificacao">
        <Layout>
          <Suspense fallback={<PageLoader />}>
            <Verification />
          </Suspense>
        </Layout>
      </Route>

      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <AppProvider>
      <FavoritesProvider>
        <QueryClientProvider client={queryClient}>
          <TooltipProvider>
            <Toaster />
            <SonnerToaster position="top-right" richColors />
            <Router />
          </TooltipProvider>
        </QueryClientProvider>
      </FavoritesProvider>
    </AppProvider>
  );
}

export default App;
