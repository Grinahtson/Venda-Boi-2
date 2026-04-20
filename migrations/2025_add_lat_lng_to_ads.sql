-- Migration: Add latitude and longitude columns to ads table
-- Created: 2025-11-24
-- Purpose: Enable geographic filtering and nearby search functionality

-- Add columns
ALTER TABLE ads ADD COLUMN latitude DECIMAL(10, 8);
ALTER TABLE ads ADD COLUMN longitude DECIMAL(11, 8);

-- Create composite index for geographic queries
CREATE INDEX idx_ads_location ON ads(latitude, longitude);

-- Add constraint to ensure both lat/lng are provided together
ALTER TABLE ads ADD CONSTRAINT check_coordinates 
  CHECK ((latitude IS NULL AND longitude IS NULL) 
         OR (latitude IS NOT NULL AND longitude IS NOT NULL));

-- Add comment for documentation
COMMENT ON COLUMN ads.latitude IS 'Geographic latitude in decimal degrees (-90 to 90)';
COMMENT ON COLUMN ads.longitude IS 'Geographic longitude in decimal degrees (-180 to 180)';
