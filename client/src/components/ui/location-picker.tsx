import { useState, useMemo, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MapPin, Loader2, Navigation } from "lucide-react";
import { BRAZIL_STATES } from "@/lib/constants";

interface LocationPickerProps {
  onLocationChange: (location: { lat: number; lng: number; city?: string; state?: string }) => void;
  defaultLocation?: { city?: string; state?: string };
}

export function LocationPicker({ onLocationChange, defaultLocation }: LocationPickerProps) {
  const [loading, setLoading] = useState(false);
  const [selectedState, setSelectedState] = useState(defaultLocation?.state || "");
  const [city, setCity] = useState(defaultLocation?.city || "");
  const [citySearch, setCitySearch] = useState("");
  const [stateSearch, setStateSearch] = useState("");
  const [availableCities, setAvailableCities] = useState<string[]>([]);
  const [loadingCities, setLoadingCities] = useState(false);

  useEffect(() => {
    if (selectedState) {
      setLoadingCities(true);
      fetch(`/api/cities/${selectedState}`)
        .then(res => res.json())
        .then(data => {
          setAvailableCities(data.cities || []);
          setLoadingCities(false);
        })
        .catch(() => {
          setAvailableCities([]);
          setLoadingCities(false);
        });
    } else {
      setAvailableCities([]);
    }
  }, [selectedState]);

  const filteredCities = useMemo(() => {
    if (!citySearch) return availableCities;
    return availableCities.filter(c => 
      c.toLowerCase().includes(citySearch.toLowerCase())
    );
  }, [availableCities, citySearch]);

  const filteredStates = useMemo(() => {
    if (!stateSearch) return BRAZIL_STATES;
    return BRAZIL_STATES.filter(s => 
      s.label.toLowerCase().includes(stateSearch.toLowerCase()) ||
      s.value.toLowerCase().includes(stateSearch.toLowerCase())
    );
  }, [stateSearch]);

  const handleGeolocation = () => {
    if (!navigator.geolocation) {
      alert("Geolocalização não é suportada pelo seu navegador.");
      return;
    }

    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const mockCity = "Localização Atual (Detectada)"; 
        const mockState = "SP";
        
        setCity(mockCity);
        setSelectedState(mockState);
        
        onLocationChange({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          city: mockCity,
          state: mockState
        });
        
        setLoading(false);
      },
      (error) => {
        alert("Erro ao obter localização. Por favor, preencha manualmente.");
        setLoading(false);
      }
    );
  };

  const handleStateChange = (value: string) => {
    setSelectedState(value);
    setCity("");
    setCitySearch("");
    onLocationChange({ lat: 0, lng: 0, city: "", state: value });
  };

  const handleCityChange = (value: string) => {
    setCity(value);
    onLocationChange({ lat: 0, lng: 0, city: value, state: selectedState });
  };

  return (
    <div className="space-y-4 p-4 border rounded-lg bg-muted/10">
      <div className="flex items-center justify-between">
        <Label className="text-base font-semibold flex items-center gap-2">
          <MapPin className="h-4 w-4 text-primary" /> Localização da Fazenda
        </Label>
        <Button 
          type="button" 
          variant="outline" 
          size="sm" 
          onClick={handleGeolocation}
          disabled={loading}
          className="text-xs gap-2 text-primary border-primary/20 hover:bg-primary/5"
        >
          {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Navigation className="h-3 w-3" />}
          Usar GPS
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label className="text-xs mb-1.5 block">Estado (UF)</Label>
          <Select value={selectedState} onValueChange={handleStateChange}>
            <SelectTrigger>
              <SelectValue placeholder="Selecione o estado..." />
            </SelectTrigger>
            <SelectContent className="max-h-[300px]">
              <div className="px-2 pb-2 sticky top-0 bg-popover z-10">
                <Input
                  placeholder="Buscar estado..."
                  value={stateSearch}
                  onChange={(e) => setStateSearch(e.target.value)}
                  className="h-8"
                />
              </div>
              {filteredStates.length > 0 ? (
                filteredStates.map((state) => (
                  <SelectItem key={state.value} value={state.value}>
                    {state.value} - {state.label}
                  </SelectItem>
                ))
              ) : (
                <div className="px-2 py-4 text-sm text-muted-foreground text-center">
                  Nenhum estado encontrado
                </div>
              )}
            </SelectContent>
          </Select>
        </div>
        
        <div>
          <Label className="text-xs mb-1.5 block">Cidade</Label>
          <Select value={city} onValueChange={handleCityChange} disabled={!selectedState || loadingCities}>
            <SelectTrigger>
              <SelectValue placeholder={
                loadingCities ? "Carregando cidades..." : 
                selectedState ? "Selecione a cidade..." : 
                "Selecione o estado primeiro"
              } />
            </SelectTrigger>
            <SelectContent className="max-h-[300px]">
              <div className="px-2 pb-2 sticky top-0 bg-popover z-10">
                <Input
                  placeholder="Buscar cidade..."
                  value={citySearch}
                  onChange={(e) => setCitySearch(e.target.value)}
                  className="h-8"
                />
              </div>
              {loadingCities ? (
                <div className="px-2 py-4 text-sm text-muted-foreground text-center flex items-center justify-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Carregando cidades...
                </div>
              ) : filteredCities.length > 0 ? (
                filteredCities.map((cityName) => (
                  <SelectItem key={cityName} value={cityName}>
                    {cityName}
                  </SelectItem>
                ))
              ) : (
                <div className="px-2 py-4 text-sm text-muted-foreground text-center">
                  {selectedState ? "Nenhuma cidade encontrada" : "Selecione um estado"}
                </div>
              )}
            </SelectContent>
          </Select>
        </div>
      </div>
      
      {loading && <p className="text-xs text-muted-foreground animate-pulse">Buscando coordenadas...</p>}
    </div>
  );
}
