import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { stripeService } from "./stripeService";
import { sendEmail, sendVerificationEmail, sendMessageNotificationEmail, sendWelcomeEmail, sendFavoriteNotification } from "./emailService";
import { sendContactEmail } from "./resendService";
import { setupWebSocket } from "./websocket";
import { handleGetArrobaPrice, handleGetArrobaPrices, handleGetAllQuotes } from "./market-pricing";
import { calculatePriceSuggestion, getMarketInsights } from "./pricing-ai";
import bcrypt from "bcryptjs";
import fs from "fs";
import path from "path";
import { randomBytes } from "crypto";
import validator from "validator";
import {
  loginSchema,
  registerSchema,
  createAdSchema,
  updateProfileSchema,
} from "@shared/schema";

// Extend Express Request type
declare global {
  namespace Express {
    interface Request {
      userId?: string;
    }
  }
}

// Middleware to check authentication
async function checkAuth(req: Request, res: Response, next: NextFunction) {
  const sessionId = req.headers.authorization?.replace("Bearer ", "") 
    || req.headers["x-session-id"] as string;
  if (!sessionId) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  try {
    const session = await storage.getSession(sessionId);
    if (!session) {
      console.error("Session check failed:", { sessionId: sessionId?.slice(0, 10) });
      return res.status(401).json({ message: "Session expired" });
    }

    // Refresh session expiration on each request
    const newExpiresAt = new Date();
    newExpiresAt.setDate(newExpiresAt.getDate() + 30); // 30 days
    await storage.createSession(sessionId, session.userId, newExpiresAt);

    req.userId = session.userId;
    next();
  } catch (error: any) {
    console.error("Auth middleware error:", error);
    res.status(401).json({ message: "Authentication error" });
  }
}

// Middleware to check admin role
async function checkAdmin(req: Request, res: Response, next: NextFunction) {
  if (!req.userId) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  try {
    const user = await storage.getUser(req.userId);
    if (!user?.isAdmin) {
      return res.status(403).json({ message: "Forbidden: Admin access only" });
    }
    next();
  } catch (error) {
    console.error("Admin middleware error:", error);
    res.status(500).json({ message: "Check admin error" });
  }
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth routes
  app.post("/api/auth/register", async (req, res) => {
    try {
      const data = registerSchema.parse(req.body);
      const existing = await storage.getUserByEmail(data.email);
      if (existing) {
        return res.status(400).json({ message: "Email already registered" });
      }

      const hashedPassword = await bcrypt.hash(data.password, 10);
      const user = await storage.createUser({
        ...data,
        password: hashedPassword,
      });

      const sessionId = randomBytes(32).toString("hex");
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 30); // 30 days
      await storage.createSession(sessionId, user.id, expiresAt);

      // Send welcome email
      await sendWelcomeEmail(user.email, user.name);
      await storage.logEmailEvent(user.id, "welcome", user.email);

      console.log("User registered and session created:", { userId: user.id, sessionId: sessionId.slice(0, 10) });
      res.json({ sessionId, user: { id: user.id, email: user.email, name: user.name } });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      const data = loginSchema.parse(req.body);
      const user = await storage.getUserByEmail(data.email);
      if (!user) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      const passwordMatch = await bcrypt.compare(data.password, user.password);
      if (!passwordMatch) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      const sessionId = randomBytes(32).toString("hex");
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 30); // 30 days
      await storage.createSession(sessionId, user.id, expiresAt);

      console.log("User logged in and session created:", { userId: user.id, sessionId: sessionId.slice(0, 10) });
      res.json({ 
        sessionId, 
        user: { 
          id: user.id, 
          email: user.email, 
          name: user.name,
          phone: user.phone,
          city: user.city,
          state: user.state,
          plan: user.plan,
          avatar: user.avatar,
          latitude: user.latitude,
          longitude: user.longitude,
          isAdmin: user.isAdmin,
          verified: user.verified,
        } 
      });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.post("/api/auth/logout", async (req, res) => {
    const sessionId = req.headers.authorization?.replace("Bearer ", "");
    if (sessionId) {
      await storage.deleteSession(sessionId);
    }
    res.json({ message: "Logged out" });
  });

  // Password reset - request
  app.post("/api/auth/forgot-password", async (req, res) => {
    try {
      const { email } = req.body;
      if (!email) {
        return res.status(400).json({ message: "Email é obrigatório" });
      }

      const user = await storage.getUserByEmail(email);
      if (!user) {
        return res.json({ message: "Se o email existir, você receberá um link de recuperação" });
      }

      const token = Math.random().toString(36).substring(2) + Math.random().toString(36).substring(2);
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 1);

      await storage.createPasswordResetToken(user.id, token, expiresAt);

      const baseUrl = `${req.protocol}://${req.get("host")}`;
      const { sendPasswordResetEmail } = await import("./emailService");
      await sendPasswordResetEmail(user.email, user.name, token, baseUrl);

      res.json({ message: "Se o email existir, você receberá um link de recuperação" });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Password reset - verify token
  app.get("/api/auth/verify-reset-token", async (req, res) => {
    try {
      const { token } = req.query;
      if (!token || typeof token !== "string") {
        return res.status(400).json({ valid: false, message: "Token inválido" });
      }

      const resetToken = await storage.getPasswordResetToken(token);
      if (!resetToken || resetToken.used || new Date() > resetToken.expiresAt) {
        return res.status(400).json({ valid: false, message: "Token expirado ou inválido" });
      }

      res.json({ valid: true });
    } catch (error: any) {
      res.status(500).json({ valid: false, message: error.message });
    }
  });

  // Password reset - set new password
  app.post("/api/auth/reset-password", async (req, res) => {
    try {
      const { token, password } = req.body;
      if (!token || !password) {
        return res.status(400).json({ message: "Token e senha são obrigatórios" });
      }

      if (password.length < 6) {
        return res.status(400).json({ message: "Senha deve ter no mínimo 6 caracteres" });
      }

      const resetToken = await storage.getPasswordResetToken(token);
      if (!resetToken || resetToken.used || new Date() > resetToken.expiresAt) {
        return res.status(400).json({ message: "Token expirado ou inválido" });
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      await storage.updateUserPassword(resetToken.userId, hashedPassword);
      await storage.markPasswordResetTokenUsed(token);

      res.json({ message: "Senha alterada com sucesso!" });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Media & Upload routes
  app.post("/api/upload", checkAuth, async (req, res) => {
    try {
      const { images } = req.body;
      if (!images || !Array.isArray(images)) {
        return res.status(400).json({ message: "Invalid payload: images must be an array of base64 strings" });
      }

      const { uploadImageBase64 } = await import("./storage-client");
      
      const uploadPromises = images.map(async (base64) => {
        return uploadImageBase64(base64);
      });

      const urls = await Promise.all(uploadPromises);
      res.json({ urls });
    } catch (error: any) {
      console.error("Upload error:", error);
      res.status(500).json({ message: "Error uploading photos" });
    }
  });

  // User routes
  app.get("/api/users/me", checkAuth, async (req, res) => {
    try {
      if (!req.userId) {
        return res.status(400).json({ message: "userId required" });
      }
      const user = await storage.getUser(req.userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      res.json({ 
        id: user.id,
        email: user.email,
        name: user.name,
        phone: user.phone,
        city: user.city,
        state: user.state,
        plan: user.plan,
        avatar: user.avatar,
        latitude: user.latitude,
        longitude: user.longitude,
        isAdmin: user.isAdmin,
        verified: user.verified,
      });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.put("/api/users/me", checkAuth, async (req, res) => {
    try {
      if (!req.userId) {
        return res.status(400).json({ message: "userId required" });
      }
      const data = updateProfileSchema.parse(req.body);
      const updateData: any = { ...data };
      if (data.latitude !== undefined) {
        updateData.latitude = data.latitude?.toString();
      }
      if (data.longitude !== undefined) {
        updateData.longitude = data.longitude?.toString();
      }
      const user = await storage.updateUser(req.userId, updateData);
      res.json({ 
        id: user?.id,
        email: user?.email,
        name: user?.name,
        phone: user?.phone,
        city: user?.city,
        state: user?.state,
        plan: user?.plan,
        avatar: user?.avatar,
        latitude: user?.latitude,
        longitude: user?.longitude,
        verified: user?.verified,
      });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // Ad routes
  app.get("/api/ads", async (req, res) => {
    try {
      const filters = {
        category: req.query.category as string,
        state: req.query.state as string,
        priceMin: req.query.priceMin ? parseFloat(req.query.priceMin as string) : undefined,
        priceMax: req.query.priceMax ? parseFloat(req.query.priceMax as string) : undefined,
        search: req.query.search as string,
        page: req.query.page ? parseInt(req.query.page as string) : 1,
        limit: req.query.limit ? parseInt(req.query.limit as string) : 20,
      };
      const result = await storage.listAds(filters);
      
      const populatedAds = await Promise.all(result.data.map(async (ad) => {
        const seller = await storage.getUser(ad.sellerId);
        return {
          ...ad,
          seller: seller ? { id: seller.id, name: seller.name, rating: 0, verified: seller.verified } : null
        };
      }));
      
      res.json({ ...result, data: populatedAds });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/ads/nearby", async (req, res) => {
    try {
      if (!req.query.lat || !req.query.lng) {
        return res.status(400).json({ message: "lat and lng are required" });
      }
      const lat = parseFloat(req.query.lat as string);
      const lng = parseFloat(req.query.lng as string);
      const radiusKm = req.query.radius_km ? parseFloat(req.query.radius_km as string) : 100;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;

      if (isNaN(lat) || isNaN(lng)) {
        return res.status(400).json({ message: "Invalid latitude or longitude" });
      }

      const listings = await storage.searchNearby(lat, lng, radiusKm, limit);
      
      const populatedAds = await Promise.all(listings.map(async (ad) => {
        const seller = await storage.getUser(ad.sellerId);
        return {
          ...ad,
          seller: seller ? { id: seller.id, name: seller.name, rating: 0, verified: seller.verified } : null
        };
      }));
      
      res.json(populatedAds);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/ads/:id", async (req, res) => {
    try {
      const ad = await storage.getAd(req.params.id);
      if (!ad) {
        return res.status(404).json({ message: "Ad not found" });
      }
      const seller = await storage.getUser(ad.sellerId);
      
      res.json({
        ...ad,
        seller: seller ? { id: seller.id, name: seller.name, rating: 0, verified: seller.verified } : null
      });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/ads", checkAuth, async (req, res) => {
    try {
      const user = await storage.getUser(req.userId!);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Check plan limits
      const planLimits: Record<string, number> = {
        "Free": 5,
        "Basic": 50,
        "Premium": Infinity,
        "Anual": Infinity
      };
      
      const currentPlan = user.plan || "Free";
      const limit = planLimits[currentPlan] || 5;
      
      const adCount = await storage.countUserAds(req.userId!);
      if (adCount >= limit) {
        return res.status(403).json({ 
          message: `Limite de anúncios atingido para o plano ${currentPlan}. Máximo: ${limit}` 
        });
      }

      const data = createAdSchema.parse(req.body);
      const ad = await storage.createAd({
        ...data,
        sellerId: req.userId!,
        pricePerHead: data.pricePerHead.toString(),
        pricePerArroba: data.pricePerArroba?.toString(),
        latitude: data.latitude?.toString(),
        longitude: data.longitude?.toString(),
      });

      // Matchmaking Alerts Logic
      try {
        const matches = await storage.findMatchingAlerts(
          ad.category,
          ad.state,
          parseFloat(ad.pricePerHead?.toString() || "0")
        );
        for (const match of matches) {
           // Skip if the alert creator is the one posting the ad
           if (match.userId === req.userId) continue;
           
           await storage.createNotification({
             userId: match.userId,
             title: "Novo lote encontrado!",
             message: `Um lote de ${ad.category} em ${ad.state} por R$${ad.pricePerHead} foi recém-adicionado!`,
             link: `/product/${ad.id}`
           });
        }
      } catch (e) {
        console.error("Error matchmaking alerts:", e);
      }

      res.status(201).json(ad);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.put("/api/ads/:id", checkAuth, async (req, res) => {
    try {
      const ad = await storage.getAd(req.params.id);
      if (!ad) {
        return res.status(404).json({ message: "Ad not found" });
      }
      if (ad.sellerId !== req.userId) {
        return res.status(403).json({ message: "Unauthorized" });
      }

      const data = createAdSchema.parse(req.body);
      const updated = await storage.updateAd(req.params.id, {
        ...data,
        pricePerHead: data.pricePerHead.toString(),
        pricePerArroba: data.pricePerArroba?.toString(),
        latitude: data.latitude?.toString(),
        longitude: data.longitude?.toString(),
      });
      res.json(updated);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.delete("/api/ads/:id", checkAuth, async (req, res) => {
    try {
      const ad = await storage.getAd(req.params.id);
      if (!ad) {
        return res.status(404).json({ message: "Ad not found" });
      }
      if (ad.sellerId !== req.userId) {
        return res.status(403).json({ message: "Unauthorized" });
      }

      await storage.deleteAd(req.params.id);
      res.json({ message: "Ad deleted" });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.patch("/api/ads/:id/toggle", checkAuth, async (req, res) => {
    try {
      const ad = await storage.getAd(req.params.id);
      if (!ad) {
        return res.status(404).json({ message: "Ad not found" });
      }
      const { active } = req.body;
      const updated = await storage.updateAd(req.params.id, { active: !!active });
      res.json(updated);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/ads/user/me", checkAuth, async (req, res) => {
    try {
      if (!req.userId) {
        return res.status(400).json({ message: "userId required" });
      }
      const myAds = await storage.listAds({});
      const filtered = myAds.data.filter(a => a.sellerId === req.userId);
      res.json(filtered);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Alerts and Notifications
  app.post("/api/alerts", checkAuth, async (req, res) => {
    try {
      const alert = await storage.createMarketAlert({
         ...req.body,
         userId: req.userId!
      });
      res.json(alert);
    } catch (error: any) { res.status(400).json({ message: error.message }); }
  });
  
  app.get("/api/alerts", checkAuth, async (req, res) => {
    try {
      const alerts = await storage.getUserAlerts(req.userId!);
      res.json(alerts);
    } catch (e: any) { res.status(500).json({ message: e.message }); }
  });
  
  app.delete("/api/alerts/:id", checkAuth, async (req, res) => {
    try {
      await storage.deleteMarketAlert(req.params.id);
      res.json({ success: true });
    } catch (e: any) { res.status(500).json({ message: e.message }); }
  });

  app.get("/api/notifications", checkAuth, async (req, res) => {
    try {
      const notifs = await storage.getUserNotifications(req.userId!);
      res.json(notifs);
    } catch (e: any) { res.status(500).json({ message: e.message }); }
  });
  
  app.put("/api/notifications/:id/read", checkAuth, async (req, res) => {
    try {
      await storage.markNotificationRead(req.params.id);
      res.json({ success: true });
    } catch (e: any) { res.status(500).json({ message: e.message }); }
  });



  // Favorites routes
  app.get("/api/favorites", checkAuth, async (req, res) => {
    try {
      if (!req.userId) {
        return res.status(400).json({ message: "userId required" });
      }
      const favorites = await storage.getUserFavorites(req.userId);
      res.json(favorites);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/favorites/:adId", checkAuth, async (req, res) => {
    try {
      if (!req.userId || !req.params.adId) {
        return res.status(400).json({ message: "userId and adId are required" });
      }
      const ad = await storage.getAd(req.params.adId);
      if (!ad) {
        return res.status(404).json({ message: "Ad not found" });
      }

      await storage.addFavorite({
        userId: req.userId,
        adId: req.params.adId,
      });

      const [seller, buyer] = await Promise.all([
        storage.getUser(ad.sellerId),
        storage.getUser(req.userId)
      ]);
      if (seller && buyer && seller.email) {
        sendFavoriteNotification(seller.email, seller.name, ad.title, buyer.name).catch(console.error);
      }

      res.status(201).json({ message: "Added to favorites" });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.delete("/api/favorites/:adId", checkAuth, async (req, res) => {
    try {
      if (!req.userId || !req.params.adId) {
        return res.status(400).json({ message: "userId and adId are required" });
      }
      await storage.removeFavorite(req.userId, req.params.adId);
      res.json({ message: "Removed from favorites" });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Messages endpoints
  app.post("/api/messages", checkAuth, async (req, res) => {
    try {
      if (!req.userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const { receiverId, adId, content } = req.body;
      if (!receiverId || !content) {
        return res.status(400).json({ message: "receiverId and content are required" });
      }

      const message = await storage.createMessage({
        senderId: req.userId,
        receiverId,
        adId: adId || undefined,
        content,
      });

      res.status(201).json(message);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/messages/:userId", checkAuth, async (req, res) => {
    try {
      if (!req.userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const conversation = await storage.getConversation(req.userId, req.params.userId);
      res.json(conversation);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/conversations", checkAuth, async (req, res) => {
    try {
      if (!req.userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const conversations = await storage.getUserConversations(req.userId);
      res.json(conversations);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.put("/api/messages/:messageId/read", checkAuth, async (req, res) => {
    try {
      if (!req.userId || !req.params.messageId) {
        return res.status(400).json({ message: "messageId is required" });
      }

      await storage.markAsRead(req.params.messageId);
      res.json({ message: "Message marked as read" });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // SEO Routes
  app.get("/sitemap.xml", (req, res) => {
    res.setHeader("Content-Type", "application/xml");
    res.sendFile(path.join(process.cwd(), "public", "sitemap.xml"));
  });

  app.get("/robots.txt", (req, res) => {
    res.setHeader("Content-Type", "text/plain");
    res.sendFile(path.join(process.cwd(), "public", "robots.txt"));
  });

  // Upload endpoint for photos
  app.post("/api/upload", checkAuth, async (req, res) => {
    try {
      if (!req.userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const uploadDir = path.join(process.cwd(), "public", "uploads");
      
      // Ensure upload directory exists
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }

      // Get images from parsed JSON body (express.json() already parsed it)
      const { images } = req.body;
      if (!images || !Array.isArray(images)) {
        return res.status(400).json({ message: "No images provided" });
      }

      const urls: string[] = [];
      
      for (const imageData of images) {
        const filename = `${randomBytes(8).toString("hex")}.jpg`;
        const filepath = path.join(uploadDir, filename);
        
        // Save base64 image
        const imageBuffer = Buffer.from(imageData, "base64");
        fs.writeFileSync(filepath, imageBuffer);
        
        urls.push(`/uploads/${filename}`);
      }

      res.json({ urls });
    } catch (error: any) {
      console.error("Upload error:", error);
      res.status(500).json({ message: error.message });
    }
  });

  // Verification endpoints
  app.post("/api/verify-seller", checkAuth, async (req, res) => {
    try {
      if (!req.userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const { cpfCnpj, documentType, documentUrl } = req.body;
      if (!cpfCnpj || !documentType) {
        return res.status(400).json({ message: "cpfCnpj and documentType are required" });
      }

      // Validate CPF/CNPJ format
      const cleanCpf = cpfCnpj.replace(/\D/g, "");
      if (!validator.isLength(cleanCpf, { min: 11, max: 14 })) {
        return res.status(400).json({ message: "Invalid CPF/CNPJ format" });
      }

      const verification = await storage.createVerification({
        userId: req.userId,
        cpfCnpj: cleanCpf,
        documentType,
        documentUrl: documentUrl || null,
      });

      // Send verification email
      const user = await storage.getUser(req.userId);
      if (user?.email) {
        await sendVerificationEmail(user.email, user.name, documentType);
        await storage.logEmailEvent(req.userId, "verification", user.email);
      }

      res.json({ message: "Verification request submitted", verification });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/sellers/:id/verification", async (req, res) => {
    try {
      const verification = await storage.getVerification(req.params.id);
      if (!verification) {
        return res.json({ status: "not_verified" });
      }
      res.json({
        status: verification.status,
        approvedAt: verification.approvedAt,
        documentType: verification.documentType,
      });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Admin Verification endpoints
  app.get("/api/admin/verifications", checkAuth, async (req, res) => {
    try {
      const user = await storage.getUser(req.userId!);
      if (!user?.isAdmin) {
        return res.status(403).json({ message: "Forbidden" });
      }
      const verifications = await storage.getAllVerifications();
      res.json(verifications);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.put("/api/admin/verifications/:userId", checkAuth, async (req, res) => {
    try {
      const admin = await storage.getUser(req.userId!);
      if (!admin?.isAdmin) {
        return res.status(403).json({ message: "Forbidden" });
      }
      
      const { status, reason } = req.body;
      if (status === 'approved') {
        await storage.approveVerification(req.params.userId);
      } else if (status === 'rejected') {
        await storage.rejectVerification(req.params.userId, reason || 'Rejeitado pelo administrador');
      }
      res.json({ message: `Verification ${status}` });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Reviews endpoints
  app.post("/api/reviews", checkAuth, async (req, res) => {
    try {
      if (!req.userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const { sellerId, adId, rating, comment } = req.body;
      if (!sellerId || !adId || !rating) {
        return res.status(400).json({ message: "sellerId, adId, and rating are required" });
      }

      if (rating < 1 || rating > 5) {
        return res.status(400).json({ message: "Rating must be between 1 and 5" });
      }

      // Check if user can review (must have communicated)
      const canReview = await storage.canUserReview(req.userId, sellerId);
      if (!canReview) {
        return res.status(403).json({ message: "You can only review sellers you've conversed with" });
      }

      const review = await storage.createReview({
        buyerId: req.userId,
        sellerId,
        adId,
        rating,
        comment: comment || null,
      });

      res.json(review);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/sellers/:id/reviews", async (req, res) => {
    try {
      const reviews = await storage.getSellerReviews(req.params.id);
      res.json({ data: reviews });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/sellers/:id/average-rating", async (req, res) => {
    try {
      const avgRating = await storage.getSellerAverageRating(req.params.id);
      res.json({ averageRating: avgRating });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Stripe endpoints
  app.get("/api/pricing-plans", async (req, res) => {
    try {
      const products = await storage.listProductsWithPrices();
      
      // If no products from Stripe, return default plans
      if (!products || products.length === 0) {
        const defaultPlans = [
          {
            product_id: "default_free",
            product_name: "Free",
            product_description: "Comece gratuitamente",
            price_id: null,
            unit_amount: 0,
            currency: "brl",
            recurring: { interval: "month" },
            product_metadata: { tier: "free", maxAds: "1", features: "1 anúncio ativo" }
          },
          {
            product_id: "default_basic",
            product_name: "Basic",
            product_description: "Ideal para pequenos produtores",
            price_id: "default_basic_price",
            unit_amount: 1990,
            currency: "brl",
            recurring: { interval: "month" },
            product_metadata: { tier: "basic", maxAds: "5", features: "5 anúncios ativos,Suporte por email" }
          },
          {
            product_id: "default_premium",
            product_name: "Premium",
            product_description: "Para produtores profissionais",
            price_id: "default_premium_price",
            unit_amount: 5990,
            currency: "brl",
            recurring: { interval: "month" },
            product_metadata: { tier: "premium", maxAds: "20", features: "20 anúncios ativos,Suporte prioritário,Destaque nos resultados" }
          },
          {
            product_id: "default_annual",
            product_name: "Plano Anual",
            product_description: "Melhor custo-benefício - Economize no ano",
            price_id: "default_annual_price",
            unit_amount: 49900,
            currency: "brl",
            recurring: { interval: "year" },
            product_metadata: { tier: "premium_annual", maxAds: "unlimited", features: "Anúncios ilimitados,Suporte prioritário,Destaque nos resultados,Economia no ano" }
          }
        ];
        return res.json({ data: defaultPlans });
      }
      
      // Override Stripe retrieved prices if they are disconnected or outdated
      const updatedProducts = products.map((p: any) => {
        if (p.product_metadata?.tier === 'basic') p.unit_amount = 1990;
        if (p.product_metadata?.tier === 'premium') p.unit_amount = 5990;
        if (p.product_metadata?.tier === 'premium_annual') {
          p.unit_amount = 49900;
          if (p.product_metadata) {
            p.product_metadata.maxAds = "unlimited";
            p.product_metadata.features = "Anúncios ilimitados,Suporte prioritário,Destaque nos resultados,Economia no ano";
          }
        }
        return p;
      });
      
      res.json({ data: updatedProducts });
    } catch (error: any) {
      // Return default plans on error
      const defaultPlans = [
        {
          product_id: "default_free",
          product_name: "Free",
          product_description: "Comece gratuitamente",
          price_id: null,
          unit_amount: 0,
          currency: "brl",
          recurring: { interval: "month" },
          product_metadata: { tier: "free", maxAds: "1", features: "1 anúncio ativo" }
        },
        {
          product_id: "default_basic",
          product_name: "Basic",
          product_description: "Ideal para pequenos produtores",
          price_id: "default_basic_price",
          unit_amount: 1990,
          currency: "brl",
          recurring: { interval: "month" },
          product_metadata: { tier: "basic", maxAds: "5", features: "5 anúncios ativos,Suporte por email" }
        },
        {
          product_id: "default_premium",
          product_name: "Premium",
          product_description: "Para produtores profissionais",
          price_id: "default_premium_price",
          unit_amount: 5990,
          currency: "brl",
          recurring: { interval: "month" },
          product_metadata: { tier: "premium", maxAds: "20", features: "20 anúncios ativos,Suporte prioritário,Destaque nos resultados" }
        },
        {
          product_id: "default_annual",
          product_name: "Plano Anual",
          product_description: "Melhor custo-benefício - Economize no ano",
          price_id: "default_annual_price",
          unit_amount: 49900,
          currency: "brl",
          recurring: { interval: "year" },
          product_metadata: { tier: "premium_annual", maxAds: "20", features: "20 anúncios ativos,Suporte prioritário,Destaque nos resultados,Economia no ano" }
        }
      ];
      res.json({ data: defaultPlans });
    }
  });

  // Rename annual plan
  app.post("/api/admin/rename-annual-plan", async (req, res) => {
    try {
      const { getUncachableStripeClient, getStripeSync } = await import('./stripeClient');
      const stripe = await getUncachableStripeClient();
      const { newName } = req.body;
      
      const products = await stripe.products.list({ limit: 20 });
      const annualProduct = products.data.find(p => 
        p.metadata?.tier === 'premium_annual' || p.name === 'Premium Anual'
      );
      
      if (annualProduct) {
        await stripe.products.update(annualProduct.id, { name: newName || 'Plano Anual' });
        
        const stripeSync = await getStripeSync();
        await stripeSync.syncProducts();
        
        res.json({ message: 'Nome atualizado com sucesso!', productId: annualProduct.id });
      } else {
        res.status(404).json({ message: 'Plano anual não encontrado' });
      }
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Create annual Premium plan if it doesn't exist
  app.post("/api/admin/create-annual-plan", async (req, res) => {
    try {
      const { getUncachableStripeClient } = await import('./stripeClient');
      const stripe = await getUncachableStripeClient();
      
      // Check if annual price already exists
      const existingPrices = await stripe.prices.list({
        lookup_keys: ['premium_annual'],
        limit: 1,
      });
      
      if (existingPrices.data.length > 0) {
        return res.json({ message: 'Plano anual já existe', priceId: existingPrices.data[0].id });
      }

      // Find existing Premium product
      const products = await stripe.products.list({ limit: 10 });
      let premiumProduct = products.data.find(p => 
        p.metadata?.tier === 'premium' || p.name?.toLowerCase().includes('premium')
      );

      if (!premiumProduct) {
        // Create Premium product if it doesn't exist
        premiumProduct = await stripe.products.create({
          name: 'Premium Anual',
          description: 'Plano Premium com desconto de 20% no pagamento anual. Ideal para grandes pecuaristas.',
          metadata: {
            tier: 'premium_annual',
            maxAds: 'ilimitado',
            features: 'Anúncios ilimitados,Destaque na busca,Verificação prioritária,Suporte VIP,Dashboard avançado,Relatórios de mercado,Desconto de 20%',
          },
        });
      }

      // Create annual price with 20% discount (monthly R$99.90 * 12 = R$1198.80, with 20% off = R$959.04)
      const annualPrice = await stripe.prices.create({
        product: premiumProduct.id,
        unit_amount: 95904, // R$959.04 in cents
        currency: 'brl',
        recurring: {
          interval: 'year',
        },
        lookup_key: 'premium_annual',
        metadata: {
          tier: 'premium_annual',
          billing_cycle: 'annual',
        },
      });

      // Also create the annual product entry
      const annualProduct = await stripe.products.create({
        name: 'Premium Anual',
        description: 'Plano Premium com desconto de 20% no pagamento anual. Ideal para grandes pecuaristas.',
        metadata: {
          tier: 'premium_annual',
          maxAds: 'ilimitado',
          features: 'Anúncios ilimitados,Destaque na busca,Verificação prioritária,Suporte VIP,Dashboard avançado,Relatórios de mercado,Desconto de 20%',
        },
      });

      const productAnnualPrice = await stripe.prices.create({
        product: annualProduct.id,
        unit_amount: 95904,
        currency: 'brl',
        recurring: {
          interval: 'year',
        },
        metadata: {
          tier: 'premium_annual',
          billing_cycle: 'annual',
        },
      });

      // Sync with database
      const { getStripeSync } = await import('./stripeClient');
      const stripeSync = await getStripeSync();
      await stripeSync.syncProducts();
      await stripeSync.syncPrices();

      res.json({ 
        message: 'Plano Premium Anual criado com sucesso!', 
        productId: annualProduct.id,
        priceId: productAnnualPrice.id,
        amount: 'R$ 959,04/ano (economia de R$ 239,76)'
      });
    } catch (error: any) {
      console.error('Error creating annual plan:', error);
      res.status(500).json({ message: error.message });
    }
  });

  // Market pricing API
  app.get("/api/market/arroba-price", (req: Request, res: Response) => {
    handleGetArrobaPrice(req, res);
  });

  app.get("/api/market/arroba-prices", (req: Request, res: Response) => {
    handleGetArrobaPrices(req, res);
  });

  app.get("/api/market/quotes", (req: Request, res: Response) => {
    handleGetAllQuotes(req, res);
  });

  app.get("/api/market/history", async (req: Request, res: Response) => {
    try {
      const { state, days = "30" } = req.query;
      const daysNum = parseInt(days as string) || 30;
      
      let history;
      if (state && state !== "all") {
        history = await storage.getPriceHistory(state as string, daysNum);
      } else {
        history = await storage.getAllPriceHistory(daysNum);
      }
      
      res.json({ data: history });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // IBGE Cities API - Get all cities for a state
  const citiesCache = new Map<string, { data: string[]; timestamp: number }>();
  const CITIES_CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

  app.get("/api/cities/:uf", async (req: Request, res: Response) => {
    try {
      const { uf } = req.params;
      const upperUf = uf.toUpperCase();
      
      // Check cache
      const cached = citiesCache.get(upperUf);
      if (cached && Date.now() - cached.timestamp < CITIES_CACHE_DURATION) {
        return res.json({ cities: cached.data });
      }

      // Fetch from IBGE API
      const response = await fetch(
        `https://servicodados.ibge.gov.br/api/v1/localidades/estados/${upperUf}/municipios?orderBy=nome`
      );
      
      if (!response.ok) {
        throw new Error(`IBGE API error: ${response.status}`);
      }

      const municipalities = await response.json() as Array<{ nome: string }>;
      const cities = municipalities.map((m) => m.nome);
      
      // Cache results
      citiesCache.set(upperUf, { data: cities, timestamp: Date.now() });
      
      res.json({ cities });
    } catch (error: any) {
      console.error("Error fetching cities:", error.message);
      res.status(500).json({ message: "Error fetching cities", cities: [] });
    }
  });

  app.post("/api/checkout", checkAuth, async (req: any, res) => {
    try {
      if (!req.userId) {
        console.error("Checkout: No userId");
        return res.status(401).json({ message: "Unauthorized" });
      }

      const user = await storage.getUser(req.userId);
      if (!user) {
        console.error("Checkout: User not found", req.userId);
        return res.status(404).json({ message: "User not found" });
      }

      const { priceId } = req.body;
      if (!priceId) {
        console.error("Checkout: No priceId");
        return res.status(400).json({ message: "priceId is required" });
      }

      console.log("Checkout request:", { userId: user.id, priceId, email: user.email });

      // Get or create Stripe customer
      const customer = await stripeService.getOrCreateCustomer(user.email, user.id);
      console.log("Customer retrieved/created:", { customerId: customer.id, email: customer.email });

      // Save stripe customer id to user
      if (!user.stripeCustomerId) {
        await storage.updateUserStripeCustomer(user.id, customer.id);
      }

      const session = await stripeService.createCheckoutSession(
        customer.id,
        priceId,
        `https://${req.get("host")}/checkout/success`,
        `https://${req.get("host")}/checkout/cancel`
      );

      console.log("Checkout session created:", { sessionUrl: session.url?.slice(0, 50) });
      res.json({ url: session.url });
    } catch (error: any) {
      console.error("Checkout error:", error);
      res.status(500).json({ message: error.message });
    }
  });

  // AI Pricing endpoints
  app.post("/api/pricing/suggest", async (req, res) => {
    try {
      const { category, breed, weight, quantity, state, carcassYield } = req.body;
      
      if (!category || !breed || !weight || !quantity || !state) {
        return res.status(400).json({ message: "Categoria, raça, peso, quantidade e estado são obrigatórios" });
      }

      const suggestion = await calculatePriceSuggestion({
        category,
        breed,
        weight: parseFloat(weight),
        quantity: parseInt(quantity),
        state,
        carcassYield: carcassYield ? parseFloat(carcassYield) : undefined,
      });

      res.json(suggestion);
    } catch (error: any) {
      console.error("Pricing AI error:", error);
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/pricing/insights/:state", async (req, res) => {
    try {
      const { state } = req.params;
      const insights = await getMarketInsights(state.toUpperCase());
      res.json(insights);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Contact form endpoint
  app.post("/api/contact", async (req, res) => {
    try {
      const { name, email, subject, message } = req.body;
      
      if (!name || !email || !message) {
        return res.status(400).json({ message: "Nome, email e mensagem são obrigatórios" });
      }

      if (!validator.isEmail(email)) {
        return res.status(400).json({ message: "Email inválido" });
      }

      await sendContactEmail({ name, email, subject, message });
      
      res.json({ success: true, message: "Mensagem enviada com sucesso" });
    } catch (error: any) {
      console.error("Contact form error:", error);
      res.status(500).json({ message: "Erro ao enviar mensagem" });
    }
  });

  // Admin & Backoffice Endpoints
  app.get("/api/admin/verifications", checkAuth, checkAdmin, async (req, res) => {
    try {
      const verifications = await storage.getAllVerifications();
      res.json(verifications);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.put("/api/admin/verifications/:userId", checkAuth, checkAdmin, async (req, res) => {
    try {
      const { userId } = req.params;
      const { status, rejectionReason } = req.body;
      
      if (status === "approved") {
        await storage.approveVerification(userId);
      } else if (status === "rejected") {
        await storage.rejectVerification(userId, rejectionReason || "Documentos não conferem");
      }
      
      res.json({ message: "Verification status updated" });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.patch("/api/ads/:id/toggle", checkAuth, checkAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const { active } = req.body;
      
      await storage.updateAd(id, { active: !!active });
      res.json({ message: "Ad visibility toggled" });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.delete("/api/ads/:id", checkAuth, async (req, res) => {
    try {
      const { id } = req.params;
      const ad = await storage.getAd(id);
      if (!ad) return res.status(404).json({ message: "Ad not found" });

      const user = await storage.getUser(req.userId!);
      // Allow if owner OR admin
      if (ad.sellerId !== req.userId && !user?.isAdmin) {
        return res.status(403).json({ message: "Forbidden" });
      }

      await storage.deleteAd(id);
      res.json({ message: "Ad deleted" });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  const httpServer = createServer(app);
  
  // Setup WebSocket for real-time chat and notifications
  setupWebSocket(httpServer);
  
  return httpServer;
}
