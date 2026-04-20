import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, SelectGroup, SelectLabel } from "@/components/ui/select";
import { Filter, Navigation, Loader2, Zap } from "lucide-react";
import { BRAZIL_STATES, REGIONS } from "@/lib/constants";

interface FilterSidebarProps {
  selectedCategory: string;
  onCategoryChange: (value: string) => void;
  selectedState: string;
  onStateChange: (value: string) => void;
  priceRange: [number, number];
  onPriceChange: (range: [number, number]) => void;
  userLocation: { lat: number; lng: number } | null;
  onUseLocation: () => void;
  loading: boolean;
  radius: number;
  onRadiusChange: (radius: number) => void;
  onClear: () => void;
  selectedBreed?: string;
  onBreedChange?: (breed: string) => void;
  yieldMin?: number;
  onYieldChange?: (yieldPercentage: number) => void;
  weightRange?: [number, number];
  onWeightChange?: (range: [number, number]) => void;
}

export function FilterSidebar({
  selectedCategory,
  onCategoryChange,
  selectedState,
  onStateChange,
  priceRange,
  onPriceChange,
  userLocation,
  onUseLocation,
  loading,
  radius,
  onRadiusChange,
  onClear,
  selectedBreed = "all",
  onBreedChange,
  yieldMin = 45,
  onYieldChange,
  weightRange = [0, 800],
  onWeightChange,
}: FilterSidebarProps) {
  const breeds = ["Nelore", "Angus", "Mestiça", "Angus x Nelore", "Brahman", "Guzerá"];

  return (
    <div className="bg-card p-6 rounded-lg border border-border shadow-sm sticky top-24">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-bold flex items-center gap-2">
          <Filter className="h-4 w-4" /> Filtros Avançados
        </h3>
        <Button variant="ghost" size="sm" className="h-8 text-xs" onClick={onClear}>
          Limpar
        </Button>
      </div>

      <div className="space-y-6">
        {/* Geolocation */}
        <div>
          <Label className="mb-2 block">Localização</Label>
          <Button
            variant={userLocation ? "default" : "outline"}
            className="w-full gap-2 mb-3"
            onClick={onUseLocation}
            disabled={loading}
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Navigation className="h-4 w-4" />}
            {userLocation ? "Localização Ativa" : "Usar minha localização"}
          </Button>

          {userLocation && (
            <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Raio de busca</span>
                <span className="font-bold">{radius} km</span>
              </div>
              <Slider value={[radius]} onValueChange={(v) => onRadiusChange(v[0])} max={500} step={10} min={10} />
            </div>
          )}
        </div>

        <div className="h-px bg-border" />

        {/* Raça/Genética */}
        <div>
          <Label className="mb-2 block">Genética/Raça</Label>
          <Select value={selectedBreed} onValueChange={onBreedChange || (() => {})}>
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as raças</SelectItem>
              {breeds.map(breed => (
                <SelectItem key={breed} value={breed}>{breed}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="h-px bg-border" />

        {/* Peso */}
        {onWeightChange && (
          <div>
            <Label className="mb-2 block">Peso Médio (kg)</Label>
            <Slider
              value={weightRange}
              onValueChange={(v) => onWeightChange([v[0], v[1]])}
              min={0}
              max={800}
              step={20}
              className="my-4"
            />
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>{weightRange[0]} kg</span>
              <span>{weightRange[1]} kg</span>
            </div>
          </div>
        )}

        <div className="h-px bg-border" />

        {/* Rendimento */}
        {onYieldChange && (
          <div>
            <div className="flex justify-between items-center mb-2">
              <Label>Rendimento Mín.</Label>
              <span className="font-bold text-sm">{yieldMin}%</span>
            </div>
            <Slider 
              value={[yieldMin]} 
              onValueChange={(v) => onYieldChange(v[0])} 
              min={40} 
              max={60} 
              step={1}
            />
            <p className="text-xs text-muted-foreground mt-2">Carcaça mínima esperada</p>
          </div>
        )}

        <div className="h-px bg-border" />

        {/* Price */}
        <div>
          <Label className="mb-2 block">Preço (R$)</Label>
          <Slider
            value={priceRange}
            onValueChange={(v) => onPriceChange([v[0], v[1]])}
            max={20000}
            step={500}
            className="my-4"
          />
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>R$ {priceRange[0]}</span>
            <span>R$ {priceRange[1]}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
