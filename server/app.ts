import { type Server } from "node:http";

import express, { type Express, type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { runMigrations } from 'stripe-replit-sync';
import { getStripeSync } from './stripeClient';
import { WebhookHandlers } from './webhookHandlers';
import { setupWebSocket } from './websocket';

export function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  console.log(`${formattedTime} [${source}] ${message}`);
}

export const app = express();

declare module 'http' {
  interface IncomingMessage {
    rawBody: unknown
  }
}

// Initialize Stripe on startup
async function initStripe() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.warn('DATABASE_URL not set - Stripe integration skipped');
    return;
  }

  try {
    console.log('Initializing Stripe schema...');
    await runMigrations({ 
      databaseUrl
    });
    console.log('✅ Stripe schema ready');

    // Get StripeSync instance
    const stripeSync = await getStripeSync();

    // Set up managed webhook
    console.log('Setting up managed webhook...');
    try {
      const webhookBaseUrl = `https://${process.env.REPLIT_DOMAINS?.split(',')[0]}`;
      const { webhook, uuid } = await stripeSync.findOrCreateManagedWebhook(
        `${webhookBaseUrl}/api/stripe/webhook`,
        {
          enabled_events: ['*'],
          description: 'Managed webhook for Stripe sync',
        }
      );
      console.log(`✅ Webhook configured: ${webhook.url}`);
    } catch (webhookError) {
      console.warn('Webhook setup skipped (may be in development)');
    }

    // Sync data in background
    console.log('Syncing Stripe data...');
    stripeSync.syncBackfill()
      .then(() => console.log('✅ Stripe data synced'))
      .catch((err: any) => console.warn('Stripe sync warning:', err.message));
  } catch (error) {
    console.warn('Stripe initialization warning:', (error as any).message);
  }
}

// Initialize Stripe before setting up middleware
initStripe().catch(console.error);

// Webhook handler function
const handleStripeWebhook = async (req: any, res: any) => {
  const signature = req.headers['stripe-signature'];
  if (!signature) {
    return res.status(400).json({ error: 'Missing stripe-signature' });
  }

  try {
    const sig = Array.isArray(signature) ? signature[0] : signature;
    if (!Buffer.isBuffer(req.body)) {
      return res.status(400).json({ error: 'Invalid payload' });
    }
    const uuid = req.params?.uuid;
    await WebhookHandlers.processWebhook(req.body as Buffer, sig, uuid);
    res.status(200).json({ received: true });
  } catch (error: any) {
    console.error('Webhook error:', error.message);
    res.status(400).json({ error: 'Webhook processing error' });
  }
};

// Webhook routes BEFORE express.json() - both with and without UUID
app.post('/api/stripe/webhook/:uuid', express.raw({ type: 'application/json' }), handleStripeWebhook);
app.post('/api/stripe/webhook', express.raw({ type: 'application/json' }), handleStripeWebhook);

import path from "node:path";

app.use(express.json({
  limit: '50mb',
  verify: (req, _res, buf) => {
    req.rawBody = buf;
  }
}));
app.use(express.urlencoded({ extended: false, limit: '50mb' }));

// Serve uploaded images
app.use('/uploads', express.static(path.join(process.cwd(), 'public', 'uploads')));

// Rate limiting map (simple in-memory implementation)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
function rateLimit(req: Request, res: Response, next: NextFunction) {
  const key = (req as any).ip || (req.socket as any).remoteAddress;
  const now = Date.now();
  const limit = rateLimitMap.get(key);
  
  if (limit && limit.resetTime > now) {
    limit.count += 1;
    if (limit.count > 100) { // 100 requests per minute
      return res.status(429).json({ message: "Rate limit exceeded" });
    }
  } else {
    rateLimitMap.set(key, { count: 1, resetTime: now + 60000 });
  }
  
  next();
}
app.use("/api", rateLimit);

// Security & Performance Headers
app.use((req, res, next) => {
  // CORS
  res.header("Access-Control-Allow-Origin", process.env.FRONTEND_URL || "*");
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
  
  // Cache control for assets
  if (req.path.match(/\.(js|css|jpg|jpeg|png|gif|ico|svg|woff|woff2)$/)) {
    res.header("Cache-Control", "public, max-age=31536000, immutable");
  } else if (req.path.startsWith("/api")) {
    res.header("Cache-Control", "no-cache, no-store, must-revalidate");
  }
  
  // Security headers
  res.header("X-Content-Type-Options", "nosniff");
  res.header("X-Frame-Options", "DENY");
  res.header("X-XSS-Protection", "1; mode=block");
  res.header("Content-Security-Policy", "default-src 'self' https: 'unsafe-inline'");
  
  if (req.method === "OPTIONS") {
    return res.sendStatus(200);
  }
  
  next();
});

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

export default async function runApp(
  setup: (app: Express, server: Server) => Promise<void>,
) {
  const server = await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // importantly run the final setup after setting up all the other routes so
  // the catch-all route doesn't interfere with the other routes
  await setup(app, server);

  // ALWAYS serve the app on the port specified in the environment variable PORT
  // Other ports are firewalled. Default to 5000 if not specified.
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = parseInt(process.env.PORT || '5000', 10);
  server.listen({
    port,
    host: "0.0.0.0"
  }, () => {
    log(`serving on port ${port}`);
  });
}
