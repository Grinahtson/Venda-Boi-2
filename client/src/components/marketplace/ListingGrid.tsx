import { Animal, calculateDistance } from "@/lib/data";
import { AnimalCard } from "@/components/ui/animal-card";
import { Button } from "@/components/ui/button";

interface ListingGridProps {
  listings: Animal[];
  userLocation: { lat: number; lng: number } | null;
  onClearFilters: () => void;
}

export function ListingGrid({ listings, userLocation, onClearFilters }: ListingGridProps) {
  if (listings.length === 0) {
    return (
      <div className="text-center py-20 bg-muted/30 rounded-lg border border-dashed border-muted-foreground/30">
        <h3 className="text-lg font-bold mb-2">Nenhum animal encontrado</h3>
        <p className="text-muted-foreground mb-6">Tente aumentar o raio de busca ou limpar os filtros.</p>
        <Button onClick={onClearFilters}>Expandir Busca</Button>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
      {listings.map((animal) => (
        <div key={animal.id} className="relative">
          <AnimalCard animal={animal} />
          {userLocation && animal.location.lat && animal.location.lng && (
            <div className="absolute top-2 left-2 bg-black/70 text-white text-xs px-2 py-1 rounded-md backdrop-blur-sm z-10">
              {calculateDistance(userLocation.lat, userLocation.lng, animal.location.lat, animal.location.lng).toFixed(0)} km
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
