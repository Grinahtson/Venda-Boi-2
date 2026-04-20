import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { Animal } from '@/lib/data';
import L from 'leaflet';

// Fix for default marker icon
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

interface MapViewProps {
  listings: Animal[];
  center?: [number, number];
}

export default function MapView({ listings, center = [-15.7975, -47.8919] }: MapViewProps) {
  return (
    <div className="h-[500px] w-full rounded-lg overflow-hidden border border-border shadow-md z-0 relative">
      <MapContainer center={center} zoom={4} scrollWheelZoom={false} style={{ height: '100%', width: '100%' }}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {listings.map((animal) => (
          animal.location.lat && animal.location.lng ? (
            <Marker key={animal.id} position={[animal.location.lat, animal.location.lng]}>
              <Popup>
                <div className="p-1">
                  <h3 className="font-bold text-sm">{animal.title}</h3>
                  <p className="text-xs">{animal.category} - {animal.weight}kg</p>
                  <p className="text-xs font-bold text-primary">
                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(animal.pricePerHead)}
                  </p>
                </div>
              </Popup>
            </Marker>
          ) : null
        ))}
      </MapContainer>
    </div>
  );
}
