# Boi na Rede - Cattle Trading Marketplace

## Overview

Boi na Rede is a modern micro-SaaS platform for buying and selling cattle in Brazil. It connects farmers and ranchers through a location-aware marketplace with real-time market pricing, profit calculators, and subscription-based features.

The platform enables sellers to create detailed livestock listings with photos, specifications (weight, breed, quantity), and GPS coordinates. Buyers can filter by category, location radius, genetics, carcass yield, and price ranges. The system includes integrated WhatsApp messaging, favorites management, and a comprehensive seller dashboard.

## User Preferences

Preferred communication style: Simple, everyday language.

## Recent Changes (April 2026)

- **PlanType Consistency Fix**: Unified plan names across frontend and backend
  - `AppContext.tsx` PlanType updated from `"Free" | "Plus" | "Premium"` to `"Free" | "Basic" | "Premium" | "Anual"`
  - Plan limits now include "Anual" (unlimited ads, same as Premium)
- **Authentication Improvements**:
  - `checkAuth` middleware now accepts both `Authorization: Bearer` and `x-session-id` headers
  - `refreshUser` fixed to use correct `Authorization` header
  - Session IDs now generated with `crypto.randomBytes(32)` instead of `Math.random()` (security fix)
  - `isAdmin` field now included in `/api/users/me` response
- **Location Persistence**: `updateUserLocation` now persists coordinates to server via API call
- **Ad Limit UX**: Create-ad page now checks user's ad count before showing form, displays upgrade prompt if limit reached
- **Pricing Page**: Payment FAQ updated to accurately reflect card-only subscriptions via Stripe

## Recent Changes (January 2026)

- **AI-Powered Pricing**: Added intelligent pricing suggestion system with machine learning-based recommendations
  - Analyzes breed, weight, quantity, state, and market trends
  - Provides confidence levels (high/medium/low) and price ranges
  - Integrated into create-ad page with one-click price application
  - API endpoints: `/api/pricing/suggest` and `/api/pricing/insights/:state`
- **SEO Optimization**: Complete overhaul for search engine visibility
  - Schema.org markup (Organization, WebSite, FAQPage)
  - Enhanced meta tags with local geo-targeting
  - Canonical URLs and Open Graph optimization
  - FAQ structured data for rich snippets
- **Domain**: Live at vendaboi.com.br with SSL certificate
- **Contact Page**: Added `/contato` with email form via Resend API

## Previous Changes (December 2025)

- Added password recovery system with `/forgot-password` and `/reset-password` pages
- Switched email service from SendGrid to Gmail API via Replit connector
- Added `password_reset_tokens` table for secure token-based password reset
- Added 5-star review system for sellers with StarRating, ReviewForm, and ReviewList components
- Implemented seller verification (KYC) page at `/verificacao` with document upload
- Enhanced GPS-based filtering with radius slider (10-500km) and distance sorting
- Added email notification system for favorites, messages, and weekly summaries
- Created price history chart with Recharts on `/cotacoes` page
- Added `price_history` table for tracking arroba prices over time
- Integrated SCOT Consultoria web scraping for real-time market data (13 quotes)
- Added WhatsApp contact buttons directly on animal cards in marketplace
- Implemented advanced weight filter (min/max kg) in marketplace sidebar
- Enhanced image gallery with carousel and thumbnails on product details page
- Added admin panel with tabs for Dashboard, Moderation, and Users
- Added ad toggle (active/inactive) and delete functions for admin moderation
- Implemented push notification hooks with `useNotifications` and service worker
- Added `active` field to ads table for moderation control

## System Architecture

### Frontend Architecture

**Framework**: React 18 + TypeScript + Vite  
**UI Components**: Shadcn/UI with Radix UI primitives  
**Styling**: Tailwind CSS with custom AgriTech theme  
**State Management**: React Context API (AppContext, FavoritesContext)  
**Routing**: Wouter (lightweight React Router alternative)  
**Data Fetching**: TanStack React Query v5  
**Forms**: React Hook Form with Zod validation
**Charts**: Recharts for data visualization

**Key Design Decisions**:
- Lazy loading for non-critical pages to improve initial load time
- LocalStorage persistence for user authentication and favorites (survives page reloads)
- Dark mode support with system preference detection
- Mobile-first responsive design with collapsible sidebar navigation
- Comprehensive data-testid attributes for E2E testing with Playwright

**Component Structure**:
- Layout wrapper with persistent navbar and mobile menu
- Reusable UI components from Shadcn/UI library
- Custom domain components (AnimalCard, MapView, MarketTicker, LocationPicker, StarRating, ReviewForm, PriceHistoryChart)
- Isolated page components with lazy loading

### Backend Architecture

**Runtime**: Node.js with Express  
**Language**: TypeScript with ESM modules  
**Database**: PostgreSQL via Drizzle ORM  
**Database Connection**: Neon Serverless (cloud-hosted Postgres)  
**Schema Management**: Drizzle Kit for migrations  
**Authentication**: Session-based with bcrypt password hashing  
**File Storage**: Base64 image encoding in database (temporary solution)

**Key Design Decisions**:
- Session-based auth instead of JWT to simplify state management
- 30-day session expiration with automatic renewal on each request
- Drizzle ORM chosen for type-safe database queries and auto-migrations
- RESTful API design with clear separation of concerns
- Rate limiting middleware to prevent abuse
- WebSocket support for real-time messaging (basic implementation)

**API Endpoints**:
- `/api/auth/*` - Login, registration, logout
- `/api/ads/*` - CRUD operations for livestock listings
- `/api/ads/nearby` - Geographic search with Haversine distance calculation
- `/api/market/*` - Real-time arroba (pricing unit) quotes by state/category
- `/api/market/history` - Historical price data for charts
- `/api/messages/*` - Direct messaging between buyers and sellers
- `/api/users/*` - Profile management and location updates
- `/api/stripe/*` - Webhook handlers for subscription payments
- `/api/reviews` - Seller review system
- `/api/verification` - Seller document verification
- `/api/sellers/:id/reviews` - Get seller reviews
- `/api/sellers/:id/average-rating` - Get seller average rating

### Data Storage

**Primary Database**: PostgreSQL (Neon Serverless)  
**Schema**: 9 core tables managed by Drizzle ORM

**Tables**:
- `users` - Authentication, profiles, subscription plans, GPS coordinates
- `ads` - Livestock listings with category, breed, weight, price, location (lat/lng)
- `favorites` - Many-to-many relationship tracking saved listings
- `messages` - Direct messaging between users
- `reviews` - Seller ratings and feedback (1-5 stars with comments)
- `verifications` - Document verification for trusted sellers (CPF/CNPJ)
- `sessions` - Active authentication sessions with expiration
- `email_events` - Email notification tracking
- `price_history` - Historical arroba prices by state and category

**Data Validation**:
- Zod schemas in `shared/schema.ts` enforce type safety
- Server-side validation before database writes
- Client-side validation for immediate user feedback

### External Dependencies

**Payment Processing**:
- Stripe integration via `stripe-replit-sync` package
- Managed webhook endpoint for subscription lifecycle events
- 3 subscription tiers: Free, Plus, Premium

**Email Service**:
- SendGrid for transactional emails
- Email templates: verification, message notifications, welcome, favorite notifications, weekly summary, price alerts
- API key stored in environment variables (SENDGRID_API_KEY required)

**Market Data**:
- SCOT Consultoria web scraping (cheerio library)
- 4-hour cache with fallback to simulated data
- Real-time arroba prices for 13+ categories

**Mapping & Location**:
- Leaflet.js for interactive map views in marketplace
- Browser Geolocation API for GPS coordinate capture
- Haversine formula for distance calculation
- Static Brazilian states database in `data/br_states.json` (27 entries)

**Communication**:
- WhatsApp Business API integration for direct seller contact
- Link generation utility with pre-filled messages
- Phone number validation and formatting

**Real-Time Features**:
- WebSocket server on `/api/ws` for live chat
- Service worker registration for push notifications (production only)
- Market ticker component with auto-refresh pricing data

**Development Tools**:
- Playwright for E2E testing (9 comprehensive tests in `tests/create-ad.spec.js`)
- TypeScript compilation with strict mode enabled
- Vite dev server with HMR and custom plugins (meta images, error overlay)

**Third-Party UI Libraries**:
- Recharts for data visualization (price history charts)
- Lucide React for icons (consistent icon system)
- date-fns for date formatting (pt-BR locale)

### Pages

- `/` - Home page with hero section and featured listings
- `/marketplace` - Main marketplace with filters and map view
- `/product/:id` - Product details with seller info and reviews
- `/cotacoes` - Real-time arroba prices with history chart
- `/calculator` - Profit calculator tool
- `/pricing` - Subscription plans
- `/dashboard` - Seller dashboard
- `/create-ad` - Create new listing
- `/profile` - User profile settings
- `/favorites` - Saved listings
- `/chat` - Messaging system
- `/verificacao` - Seller verification (KYC)
- `/admin` - Admin analytics panel
- `/auth` - Login page
- `/register` - Registration page
