import { useState, useEffect } from "react";
import { Animal, categories, calculateDistance } from "@/lib/data";
import { BRAZIL_STATES, REGIONS } from "@/lib/constants";
import { adsAPI } from "@/lib/api";
import { useAppContext } from "@/context/AppContext";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, SelectGroup, SelectLabel } from "@/components/ui/select";
import { Search, Filter, Map as MapIcon, List } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import MapView from "@/components/ui/map-view";
import { ShieldCheck } from "lucide-react";
import { FilterSidebar } from "@/components/marketplace/FilterSidebar";
import { ListingGrid } from "@/components/marketplace/ListingGrid";

function transformAdToAnimal(ad: any): Animal {
  return {
    id: ad.id,
    title: ad.title,
    category: ad.category,
    breed: ad.breed,
    weight: Number(ad.weight) || 0,
    quantity: Number(ad.quantity) || 0,
    pricePerHead: Number(ad.pricePerHead) || 0,
    pricePerArroba: ad.pricePerArroba ? Number(ad.pricePerArroba) : undefined,
    image: ad.images?.[0] || ad.image || "/placeholder-cattle.jpg",
    images: ad.images || [],
    location: {
      city: ad.city || ad.location?.city || "N/A",
      state: ad.state || ad.location?.state || "N/A",
      country: "Brasil",
      lat: Number(ad.latitude) || ad.location?.lat,
      lng: Number(ad.longitude) || ad.location?.lng,
    },
    seller: ad.seller || {
      id: ad.sellerId,
      name: "Vendedor",
      rating: 0,
    },
    featured: ad.featured || false,
    createdAt: ad.createdAt || new Date().toISOString(),
  };
}

export default function Marketplace() {
  const { user } = useAppContext();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 20000]);
  const [selectedState, setSelectedState] = useState<string>("all");
  const [viewMode, setViewMode] = useState<"list" | "map">("list");
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [radius, setRadius] = useState(100);
  const [loading, setLoading] = useState(false);
  const [listings, setListings] = useState<any[]>([]);
  const [selectedBreed, setSelectedBreed] = useState<string>("all");
  const [yieldMin, setYieldMin] = useState(45);
  const [weightRange, setWeightRange] = useState<[number, number]>([0, 800]);
  const [page, setPage] = useState(1);
  const [totalAds, setTotalAds] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  // Load listings on mount and when filters change
  useEffect(() => {
    const loadListings = async () => {
      try {
        setLoading(true);
        setPage(1);
        const result = await adsAPI.list({
          category: selectedCategory,
          state: selectedState,
          search: searchTerm,
          priceMin: priceRange[0],
          priceMax: priceRange[1],
          page: 1,
          limit: 20,
        });
        const rawData = result.data || result;
        setListings(rawData.map(transformAdToAnimal));
        setTotalAds(result.total || result.length);
        setHasMore(result.hasMore || false);
      } catch (error) {
        console.error("Failed to load listings:", error);
        setListings([]);
      } finally {
        setLoading(false);
      }
    };
    loadListings();
  }, [selectedCategory, selectedState, searchTerm, priceRange]);

  const loadMore = async () => {
    try {
      setLoadingMore(true);
      const nextPage = page + 1;
      const result = await adsAPI.list({
        category: selectedCategory,
        state: selectedState,
        search: searchTerm,
        priceMin: priceRange[0],
        priceMax: priceRange[1],
        page: nextPage,
        limit: 20,
      });
      const newData = (result.data || []).map(transformAdToAnimal);
      setListings([...listings, ...newData]);
      setTotalAds(result.total || 0);
      setHasMore(result.hasMore || false);
      setPage(nextPage);
    } catch (error) {
      console.error("Failed to load more listings:", error);
    } finally {
      setLoadingMore(false);
    }
  };

  const handleUseLocation = async () => {
    if (navigator.geolocation) {
      setLoading(true);
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const loc = { lat: position.coords.latitude, lng: position.coords.longitude };
          setUserLocation(loc);
          
          try {
            // Load nearby listings
            const nearbyAds = await adsAPI.nearby(loc.lat, loc.lng, radius);
            setListings(nearbyAds.map(transformAdToAnimal));
          } catch (error) {
            console.error("Failed to load nearby listings:", error);
          } finally {
            setLoading(false);
          }
        },
        (error) => {
          alert("Erro ao obter localização.");
          setLoading(false);
        }
      );
    }
  };

  const filteredListings = listings
    .filter((item) => {
      const matchesSearch =
        item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.breed.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = selectedCategory === "all" || item.category === selectedCategory;
      const matchesPrice = item.pricePerHead >= priceRange[0] && item.pricePerHead <= priceRange[1];
      const matchesState = selectedState === "all" || item.location.state === selectedState;
      const matchesBreed = selectedBreed === "all" || item.breed === selectedBreed;
      const matchesWeight = item.weight >= weightRange[0] && item.weight <= weightRange[1];

      let matchesDistance = true;
      if (userLocation && item.location.lat && item.location.lng) {
        const dist = calculateDistance(userLocation.lat, userLocation.lng, item.location.lat, item.location.lng);
        matchesDistance = dist <= radius;
      }

      return matchesSearch && matchesCategory && matchesPrice && matchesState && matchesBreed && matchesWeight && matchesDistance;
    })
    .sort((a, b) => {
      if (userLocation && a.location.lat && a.location.lng && b.location.lat && b.location.lng) {
        const distA = calculateDistance(userLocation.lat, userLocation.lng, a.location.lat, a.location.lng);
        const distB = calculateDistance(userLocation.lat, userLocation.lng, b.location.lat, b.location.lng);
        return distA - distB;
      }
      return 0;
    });

  const handleClear = () => {
    setSelectedCategory("all");
    setSelectedState("all");
    setPriceRange([0, 20000]);
    setSearchTerm("");
    setUserLocation(null);
    setRadius(100);
    setSelectedBreed("all");
    setYieldMin(45);
    setWeightRange([0, 800]);
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <div className="bg-secondary/30 border-b border-border py-8">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-end md:items-center gap-4 mb-6">
            <h1 className="text-3xl font-bold font-serif">Marketplace de Gado</h1>
            <div className="flex gap-2 bg-background p-1 rounded-lg border border-border">
              <Button
                variant={viewMode === "list" ? "secondary" : "ghost"}
                size="sm"
                onClick={() => setViewMode("list")}
                className="gap-2"
              >
                <List className="h-4 w-4" /> Lista
              </Button>
              <Button
                variant={viewMode === "map" ? "secondary" : "ghost"}
                size="sm"
                onClick={() => setViewMode("map")}
                className="gap-2"
              >
                <MapIcon className="h-4 w-4" /> Mapa
              </Button>
            </div>
          </div>

          <div className="flex flex-col lg:flex-row gap-4">
            <div className="relative flex-grow">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por raça, categoria ou local..."
                className="pl-10 bg-background"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            {/* Desktop Filters */}
            <div className="hidden lg:flex gap-3">
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-[180px] bg-background">
                  <SelectValue placeholder="Categoria" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.name}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={selectedState} onValueChange={setSelectedState}>
                <SelectTrigger className="w-[180px] bg-background">
                  <SelectValue placeholder="Estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  {REGIONS.map((region) => (
                    <SelectGroup key={region}>
                      <SelectLabel>{region}</SelectLabel>
                      {BRAZIL_STATES.filter((s) => s.region === region).map((state) => (
                        <SelectItem key={state.value} value={state.value}>
                          {state.label}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Mobile Filters */}
            <div className="lg:hidden">
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="outline" className="w-full gap-2">
                    <Filter className="h-4 w-4" /> Filtros
                  </Button>
                </SheetTrigger>
                <SheetContent side="left">
                  <SheetHeader>
                    <SheetTitle>Filtros</SheetTitle>
                  </SheetHeader>
                  <div className="mt-6 space-y-6">
                    <div className="space-y-2">
                      <Label>Categoria</Label>
                      <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Todas</SelectItem>
                          {categories.map((cat) => (
                            <SelectItem key={cat.id} value={cat.name}>
                              {cat.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-8 grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Sidebar */}
        <div className="hidden lg:block">
          <FilterSidebar
            selectedCategory={selectedCategory}
            onCategoryChange={setSelectedCategory}
            selectedState={selectedState}
            onStateChange={setSelectedState}
            priceRange={priceRange}
            onPriceChange={setPriceRange}
            userLocation={userLocation}
            onUseLocation={handleUseLocation}
            loading={loading}
            radius={radius}
            onRadiusChange={setRadius}
            onClear={handleClear}
            selectedBreed={selectedBreed}
            onBreedChange={setSelectedBreed}
            yieldMin={yieldMin}
            onYieldChange={setYieldMin}
            weightRange={weightRange}
            onWeightChange={setWeightRange}
          />
        </div>

        {/* Main */}
        <div className="lg:col-span-3">
          {(!user || user.plan?.toLowerCase() === 'free') ? (
            <div className="h-full min-h-[500px] flex flex-col items-center justify-center bg-card rounded-xl shadow-lg border border-border text-center p-12">
               <ShieldCheck className="h-24 w-24 text-primary mb-8 opacity-90" />
               <h2 className="text-4xl font-black mb-4">Acesso Protegido</h2>
               <p className="text-xl text-muted-foreground max-w-lg mb-8">
                 Usuários do Plano Grátis ou Visitantes não tem permissão para visualizar o Marketplace. Escolha um plano para destravar as negociações.
               </p>
               <Button className="h-14 px-10 text-lg font-bold" onClick={() => window.location.href = '/pricing'}>
                 Ver Planos Disponíveis
               </Button>
            </div>
          ) : (
            <>
              <div className="mb-4 flex justify-between items-center">
            <p className="text-muted-foreground">
              Mostrando <strong>{filteredListings.length}</strong> de <strong>{totalAds}</strong> resultados
              {userLocation && <span className="text-primary ml-1 text-sm">(Por proximidade)</span>}
            </p>
          </div>

          {viewMode === "list" ? (
            <>
              <ListingGrid listings={filteredListings} userLocation={userLocation} onClearFilters={handleClear} />
              {hasMore && (
                <div className="mt-8 text-center">
                  <Button
                    onClick={loadMore}
                    disabled={loadingMore}
                    variant="outline"
                    className="px-8 py-2"
                  >
                    {loadingMore ? "Carregando..." : "Carregar Mais Anúncios"}
                  </Button>
                </div>
              )}
            </>
          ) : (
            <MapView listings={filteredListings} center={userLocation ? [userLocation.lat, userLocation.lng] : [-15.7975, -47.8919]} />
            )}
          </>
        )}
        </div>
      </div>
    </div>
  );
}
