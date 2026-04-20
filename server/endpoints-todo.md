# Backend Endpoints TO IMPLEMENT

## To-Do: GET /api/ads/nearby

### Endpoint
```
GET /api/ads/nearby?lat=LATITUDE&lng=LONGITUDE&radius_km=RADIUS&limit=50
```

### Query Parameters
- `lat` (required): User latitude (-90 to 90)
- `lng` (required): User longitude (-180 to 180)  
- `radius_km` (optional): Search radius in kilometers (default: 100)
- `limit` (optional): Max results (default: 50, max: 100)

### Response
```json
{
  "success": true,
  "count": 25,
  "listings": [
    {
      "id": "ad-1",
      "title": "Lote de Novilhas Nelore",
      "distance_km": 45.3,
      "price_per_head": 2800,
      "location": {
        "latitude": -22.125,
        "longitude": -51.389,
        "city": "Presidente Prudente",
        "state": "SP"
      }
    }
  ]
}
```

### Implementation Notes

Use Haversine formula for distance calculation:

```typescript
const EARTH_RADIUS_KM = 6371;

function haversineDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lng2 - lng1) * Math.PI) / 180;

  const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return EARTH_RADIUS_KM * c;
}
```

Or use PostGIS (recommended for production):

```sql
SELECT id, title, price_per_head,
  ST_Distance(
    ST_MakePoint(longitude, latitude)::geography,
    ST_MakePoint($2, $1)::geography
  ) / 1000 as distance_km
FROM ads
WHERE ST_DWithin(
  ST_MakePoint(longitude, latitude)::geography,
  ST_MakePoint($2, $1)::geography,
  $3 * 1000
)
ORDER BY distance_km ASC
LIMIT $4;
```

### Backend Framework
- **Stack**: Express.js + Drizzle ORM or raw SQL
- **Database**: PostgreSQL with PostGIS (optional but recommended)

### Status
⏳ **PENDING**: Requires full-stack mode to implement
