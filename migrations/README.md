# Database Migrations

## How to Run Migrations

```bash
# Using Drizzle Kit (recommended)
npm run db:push

# Or using raw SQL
psql $DATABASE_URL < migrations/2025_add_lat_lng_to_ads.sql
```

## Available Migrations

### 2025_add_lat_lng_to_ads.sql
- **Date**: 2025-11-24
- **Description**: Add geographic coordinates to ads table
- **Changes**:
  - `latitude` (DECIMAL 10,8)
  - `longitude` (DECIMAL 11,8)
  - Index on (latitude, longitude)
  - Check constraint for coordinate pairs
- **Status**: Ready for backend implementation

## Rollback

```sql
-- Rollback 2025_add_lat_lng_to_ads migration
DROP INDEX IF EXISTS idx_ads_location;
ALTER TABLE ads DROP CONSTRAINT check_coordinates;
ALTER TABLE ads DROP COLUMN latitude;
ALTER TABLE ads DROP COLUMN longitude;
```
