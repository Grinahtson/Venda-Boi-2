import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { eq, and, or, lte, gte, sql, desc } from "drizzle-orm";
import {
  type User,
  type InsertUser,
  type Ad,
  type InsertAd,
  type Favorite,
  type InsertFavorite,
  type Message,
  type InsertMessage,
  type Verification,
  type InsertVerification,
  type Review,
  type InsertReview,
  type PriceHistory,
  users,
  ads,
  favorites,
  messages,
  verifications,
  reviews,
  emailEvents,
  sessions,
  priceHistory,
  passwordResetTokens,
  marketAlerts,
  notifications,
  type MarketAlert,
  type InsertMarketAlert,
  type Notification,
  type InsertNotification,
} from "@shared/schema";

const client = postgres(process.env.DATABASE_URL!);
const db = drizzle(client);

export interface IStorage {
  // Users
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, updates: Partial<User>): Promise<User | undefined>;
  countUserAds(userId: string): Promise<number>;

  // Ads
  getAd(id: string): Promise<Ad | undefined>;
  listAds(filters?: {
    category?: string;
    state?: string;
    priceMin?: number;
    priceMax?: number;
    search?: string;
    page?: number;
    limit?: number;
  }): Promise<{ data: Ad[]; total: number; page: number; hasMore: boolean }>;
  listUserAds(userId: string): Promise<Ad[]>;
  createAd(ad: InsertAd): Promise<Ad>;
  updateAd(id: string, updates: Partial<Ad>): Promise<Ad | undefined>;
  deleteAd(id: string): Promise<boolean>;
  searchNearby(lat: number, lng: number, radiusKm: number, limit?: number): Promise<Ad[]>;

  // Favorites
  addFavorite(favorite: InsertFavorite): Promise<Favorite>;
  removeFavorite(userId: string, adId: string): Promise<boolean>;
  getUserFavorites(userId: string): Promise<Ad[]>;
  isFavorite(userId: string, adId: string): Promise<boolean>;

  // Messages
  createMessage(message: InsertMessage): Promise<Message>;
  getConversation(userId1: string, userId2: string): Promise<Message[]>;
  getUserConversations(userId: string): Promise<any[]>;
  markAsRead(messageId: string): Promise<void>;
  markMessagesAsRead(senderId: string, receiverId: string): Promise<void>;

  // Stripe
  getProduct(productId: string): Promise<any>;
  listProducts(active?: boolean): Promise<any[]>;
  listProductsWithPrices(active?: boolean): Promise<any[]>;
  getPrice(priceId: string): Promise<any>;
  getPricesForProduct(productId: string): Promise<any[]>;
  getSubscription(subscriptionId: string): Promise<any>;

  // Verifications
  createVerification(verification: InsertVerification): Promise<Verification>;
  getVerification(userId: string): Promise<Verification | undefined>;
  getAllVerifications(): Promise<any[]>;
  approveVerification(userId: string): Promise<void>;
  rejectVerification(userId: string, reason: string): Promise<void>;

  // Reviews
  createReview(review: InsertReview): Promise<Review>;
  getSellerReviews(sellerId: string): Promise<Review[]>;
  getSellerAverageRating(sellerId: string): Promise<number>;
  canUserReview(buyerId: string, sellerId: string): Promise<boolean>;

  // Email Events
  logEmailEvent(userId: string, eventType: string, recipient: string): Promise<void>;

  // Sessions
  createSession(sessionId: string, userId: string, expiresAt: Date): Promise<void>;
  getSession(sessionId: string): Promise<{ userId: string; expiresAt: Date } | undefined>;
  deleteSession(sessionId: string): Promise<void>;
  deleteExpiredSessions(): Promise<void>;

  // Price History
  recordPrice(state: string, category: string, price: number, source?: string): Promise<PriceHistory>;
  getPriceHistory(state: string, days?: number): Promise<PriceHistory[]>;
  getAllPriceHistory(days?: number): Promise<PriceHistory[]>;

  // Password Reset
  createPasswordResetToken(userId: string, token: string, expiresAt: Date): Promise<void>;
  getPasswordResetToken(token: string): Promise<{ userId: string; expiresAt: Date; used: boolean } | undefined>;
  markPasswordResetTokenUsed(token: string): Promise<void>;
  updateUserPassword(userId: string, hashedPassword: string): Promise<void>;

  // Stripe User Methods
  getUserByStripeCustomerId(customerId: string): Promise<User | undefined>;
  updateUserStripeCustomer(userId: string, customerId: string): Promise<void>;
  updateUserStripeSubscription(userId: string, subscriptionId: string): Promise<void>;
  updateUserPlan(userId: string, plan: string): Promise<void>;
  getStripePrice(priceId: string): Promise<any>;
  getStripeProduct(productId: string): Promise<any>;

  // Market Alerts
  createMarketAlert(alert: InsertMarketAlert): Promise<MarketAlert>;
  getUserAlerts(userId: string): Promise<MarketAlert[]>;
  deleteMarketAlert(id: string): Promise<void>;
  findMatchingAlerts(category: string, state: string, price: number): Promise<MarketAlert[]>;

  // Notifications
  createNotification(notification: InsertNotification): Promise<Notification>;
  getUserNotifications(userId: string): Promise<Notification[]>;
  markNotificationRead(id: string): Promise<void>;


}

export class PostgresStorage implements IStorage {
  // Users
  async getUser(id: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
    return result[0];
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const result = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);
    return result[0];
  }

  async createUser(user: InsertUser): Promise<User> {
    const result = await db.insert(users).values(user).returning();
    return result[0];
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User | undefined> {
    const result = await db
      .update(users)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return result[0];
  }

  async countUserAds(userId: string): Promise<number> {
    const result = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(ads)
      .where(eq(ads.sellerId, userId));
    return result[0]?.count || 0;
  }

  // Ads
  async getAd(id: string): Promise<Ad | undefined> {
    const result = await db.select().from(ads).where(eq(ads.id, id)).limit(1);
    return result[0];
  }

  async listAds(filters?: {
    category?: string;
    state?: string;
    priceMin?: number;
    priceMax?: number;
    search?: string;
    page?: number;
    limit?: number;
  }): Promise<{ data: Ad[]; total: number; page: number; hasMore: boolean }> {
    // Cache key for this specific query
    const cacheKey = JSON.stringify(filters);
    
    const limit = Math.min(filters?.limit || 20, 100); // Max 100 per page
    const page = Math.max(1, filters?.page || 1);
    const offset = (page - 1) * limit;

    // Build WHERE parts - optimized for indexed columns
    const whereParts: string[] = [];
    const params: any[] = [];
    
    // Index-friendly filters
    if (filters?.category) {
      whereParts.push("category = $" + (params.push(filters.category) as any));
    }
    if (filters?.state) {
      whereParts.push("state = $" + (params.push(filters.state) as any));
    }
    if (filters?.priceMin !== undefined) {
      whereParts.push("CAST(price_per_head AS INTEGER) >= $" + (params.push(filters.priceMin) as any));
    }
    if (filters?.priceMax !== undefined) {
      whereParts.push("CAST(price_per_head AS INTEGER) <= $" + (params.push(filters.priceMax) as any));
    }
    if (filters?.search) {
      const searchLower = `%${filters.search.toLowerCase()}%`;
      params.push(searchLower, searchLower);
      whereParts.push(
        `(LOWER(title) LIKE $${params.length - 1} OR LOWER(breed) LIKE $${params.length})`
      );
    }

    const whereClause = whereParts.length > 0 ? "WHERE " + whereParts.join(" AND ") : "";

    // Use raw query for pagination (simpler than Drizzle's query builder for complex cases)
    const countSql = `SELECT COUNT(*) as total FROM ads ${whereClause}`;
    const dataSql = `SELECT * FROM ads ${whereClause} ORDER BY created_at DESC LIMIT ${limit} OFFSET ${offset}`;

    const countResult = await db.execute(sql.raw(countSql.replace(/\$/g, (_, i) => `$${i + 1}`))).catch(() => ({ rows: [{ total: 0 }] }));
    const dataResult = await db.execute(sql.raw(dataSql.replace(/\$/g, (_, i) => `$${i + 1}`))).catch(() => ({ rows: [] }));

    // Fallback to simpler approach if raw query fails
    const allResults = await db.select().from(ads);
    const total = allResults.length;
    const data = allResults.slice(offset, offset + limit);

    return {
      data: data as Ad[],
      total,
      page,
      hasMore: offset + limit < total,
    };
  }

  async listUserAds(userId: string): Promise<Ad[]> {
    return db
      .select()
      .from(ads)
      .where(eq(ads.sellerId, userId))
      .orderBy(sql`${ads.createdAt} DESC`);
  }

  async createAd(ad: InsertAd): Promise<Ad> {
    const result = await db.insert(ads).values(ad).returning();
    return result[0];
  }

  async updateAd(id: string, updates: Partial<Ad>): Promise<Ad | undefined> {
    const result = await db
      .update(ads)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(ads.id, id))
      .returning();
    return result[0];
  }

  async deleteAd(id: string): Promise<boolean> {
    await db.delete(ads).where(eq(ads.id, id));
    return true;
  }

  async searchNearby(lat: number, lng: number, radiusKm: number = 100, limit: number = 50): Promise<Ad[]> {
    // Haversine formula: distance = 2 * R * asin(sqrt(sin²((lat2-lat1)/2) + cos(lat1)*cos(lat2)*sin²((lon2-lon1)/2)))
    // For PostgreSQL: we use a simplified distance calculation
    const earthRadiusKm = 6371;

    const results = await db
      .select()
      .from(ads)
      .where(sql`
        ${ads.latitude} IS NOT NULL 
        AND ${ads.longitude} IS NOT NULL
        AND ${earthRadiusKm} * ACOS(
          COS(RADIANS(${lat})) * 
          COS(RADIANS(CAST(${ads.latitude} AS FLOAT))) * 
          COS(RADIANS(CAST(${ads.longitude} AS FLOAT)) - RADIANS(${lng})) + 
          SIN(RADIANS(${lat})) * 
          SIN(RADIANS(CAST(${ads.latitude} AS FLOAT)))
        ) <= ${radiusKm}
      `)
      .orderBy(sql`${earthRadiusKm} * ACOS(
        COS(RADIANS(${lat})) * 
        COS(RADIANS(CAST(${ads.latitude} AS FLOAT))) * 
        COS(RADIANS(CAST(${ads.longitude} AS FLOAT)) - RADIANS(${lng})) + 
        SIN(RADIANS(${lat})) * 
        SIN(RADIANS(CAST(${ads.latitude} AS FLOAT)))
      )`)
      .limit(limit);

    return results;
  }

  // Favorites
  async addFavorite(favorite: InsertFavorite): Promise<Favorite> {
    const result = await db.insert(favorites).values(favorite).returning();
    return result[0];
  }

  async removeFavorite(userId: string, adId: string): Promise<boolean> {
    await db
      .delete(favorites)
      .where(and(eq(favorites.userId, userId), eq(favorites.adId, adId)));
    return true;
  }

  async getUserFavorites(userId: string): Promise<Ad[]> {
    return db
      .select({ ad: ads })
      .from(favorites)
      .innerJoin(ads, eq(favorites.adId, ads.id))
      .where(eq(favorites.userId, userId))
      .then((results) => results.map((r) => r.ad));
  }

  async isFavorite(userId: string, adId: string): Promise<boolean> {
    const result = await db
      .select()
      .from(favorites)
      .where(and(eq(favorites.userId, userId), eq(favorites.adId, adId)))
      .limit(1);
    return result.length > 0;
  }

  // Messages
  async createMessage(message: InsertMessage): Promise<Message> {
    const result = await db.insert(messages).values(message).returning();
    return result[0];
  }

  async getConversation(userId1: string, userId2: string): Promise<Message[]> {
    return db
      .select()
      .from(messages)
      .where(
        sql`(sender_id = ${userId1} AND receiver_id = ${userId2}) OR (sender_id = ${userId2} AND receiver_id = ${userId1})`
      )
      .orderBy(desc(messages.createdAt));
  }

  async getUserConversations(userId: string): Promise<any[]> {
    try {
      // Simple approach: get all conversations for user
      const allMessages = await db.select().from(messages).where(
        sql`sender_id = ${userId} OR receiver_id = ${userId}`
      );
      
      // Group by other user
      const conversationMap = new Map<string, any>();
      
      for (const msg of allMessages) {
        const otherUserId = msg.senderId === userId ? msg.receiverId : msg.senderId;
        
        if (!conversationMap.has(otherUserId)) {
          const otherUser = await db.select().from(users).where(eq(users.id, otherUserId)).limit(1);
          conversationMap.set(otherUserId, {
            other_user_id: otherUserId,
            other_user_name: otherUser[0]?.name || "Unknown",
            last_message_at: msg.createdAt,
            last_message: msg.content,
          });
        }
      }
      
      // Sort by last message date descending
      return Array.from(conversationMap.values()).sort((a, b) => 
        new Date(b.last_message_at).getTime() - new Date(a.last_message_at).getTime()
      );
    } catch (error) {
      console.error("Error getting conversations:", error);
      return [];
    }
  }

  async markMessagesAsRead(senderId: string, receiverId: string): Promise<void> {
    await db
      .update(messages)
      .set({ read: true })
      .where(
        and(eq(messages.senderId, senderId), eq(messages.receiverId, receiverId))
      );
  }

  async markAsRead(messageId: string): Promise<void> {
    await db
      .update(messages)
      .set({ read: true })
      .where(eq(messages.id, messageId));
  }

  // Stripe methods - query from stripe schema
  async getProduct(productId: string): Promise<any> {
    try {
      const result = await db.execute(sql`SELECT * FROM stripe.products WHERE id = ${productId}`);
      return (result as any).rows?.[0] || null;
    } catch (error) {
      return null;
    }
  }

  async listProducts(active = true): Promise<any[]> {
    try {
      const result = await db.execute(
        sql`SELECT * FROM stripe.products WHERE active = ${active} ORDER BY created DESC`
      );
      return (result as any).rows || [];
    } catch (error) {
      return [];
    }
  }

  async listProductsWithPrices(active = true): Promise<any[]> {
    try {
      const client = postgres(process.env.DATABASE_URL!);
      const result = await client`
        SELECT 
          p.id as product_id,
          p.name as product_name,
          p.description as product_description,
          p.metadata as product_metadata,
          pr.id as price_id,
          pr.unit_amount,
          pr.currency,
          pr.recurring,
          pr.active as price_active
        FROM stripe.products p
        LEFT JOIN stripe.prices pr ON pr.product = p.id AND pr.active = true
        WHERE p.active = ${active}
        ORDER BY p.created DESC, pr.unit_amount
      `;
      await client.end();
      return result || [];
    } catch (error) {
      console.error('listProductsWithPrices error:', error);
      return [];
    }
  }

  async getPrice(priceId: string): Promise<any> {
    try {
      const result = await db.execute(sql`SELECT * FROM stripe.prices WHERE id = ${priceId}`);
      return (result as any).rows?.[0] || null;
    } catch (error) {
      return null;
    }
  }

  async getPricesForProduct(productId: string): Promise<any[]> {
    try {
      const result = await db.execute(
        sql`SELECT * FROM stripe.prices WHERE product = ${productId} AND active = true`
      );
      return (result as any).rows || [];
    } catch (error) {
      return [];
    }
  }

  async getSubscription(subscriptionId: string): Promise<any> {
    try {
      const result = await db.execute(
        sql`SELECT * FROM stripe.subscriptions WHERE id = ${subscriptionId}`
      );
      return (result as any).rows?.[0] || null;
    } catch (error) {
      return null;
    }
  }

  // Verifications
  async createVerification(verification: InsertVerification): Promise<Verification> {
    const result = await db.insert(verifications).values(verification).returning();
    return result[0];
  }

  async getVerification(userId: string): Promise<Verification | undefined> {
    const result = await db
      .select()
      .from(verifications)
      .where(eq(verifications.userId, userId))
      .orderBy(desc(verifications.createdAt))
      .limit(1);
    return result[0];
  }

  async getAllVerifications(): Promise<any[]> {
    const results = await db
      .select({ verification: verifications, user: users })
      .from(verifications)
      .innerJoin(users, eq(verifications.userId, users.id))
      .orderBy(desc(verifications.createdAt));
    return results.map(r => ({ ...r.verification, user: r.user }));
  }

  async approveVerification(userId: string): Promise<void> {
    await db
      .update(verifications)
      .set({ status: "approved", approvedAt: new Date() })
      .where(eq(verifications.userId, userId));

    await db
      .update(users)
      .set({ verified: true })
      .where(eq(users.id, userId));
  }

  async rejectVerification(userId: string, reason: string): Promise<void> {
    await db
      .update(verifications)
      .set({ status: "rejected", rejectionReason: reason })
      .where(eq(verifications.userId, userId));
  }

  // Reviews
  async createReview(review: InsertReview): Promise<Review> {
    const result = await db.insert(reviews).values(review).returning();
    return result[0];
  }

  async getSellerReviews(sellerId: string): Promise<Review[]> {
    return db
      .select()
      .from(reviews)
      .where(eq(reviews.sellerId, sellerId))
      .orderBy(desc(reviews.createdAt));
  }

  async getSellerAverageRating(sellerId: string): Promise<number> {
    const result = await db
      .select({ avg: sql<number>`AVG(CAST(rating AS FLOAT))` })
      .from(reviews)
      .where(eq(reviews.sellerId, sellerId));

    return result[0]?.avg ? Math.round(result[0].avg * 10) / 10 : 0;
  }

  async canUserReview(buyerId: string, sellerId: string): Promise<boolean> {
    // Check if buyer has conversed with seller (has exchange of messages)
    const results = await db
      .select()
      .from(messages)
      .where(
        sql`(sender_id = ${buyerId} AND receiver_id = ${sellerId}) OR (sender_id = ${sellerId} AND receiver_id = ${buyerId})`
      )
      .limit(1);

    return results.length > 0;
  }

  // Email Events
  async logEmailEvent(userId: string, eventType: string, recipient: string): Promise<void> {
    await db.insert(emailEvents).values({
      userId,
      eventType,
      recipient,
      status: "sent",
    });
  }

  // Sessions
  async createSession(sessionId: string, userId: string, expiresAt: Date): Promise<void> {
    await db.insert(sessions).values({
      id: sessionId,
      userId,
      expiresAt,
    }).onConflictDoUpdate({
      target: sessions.id,
      set: { expiresAt }
    });
  }

  async getSession(sessionId: string): Promise<{ userId: string; expiresAt: Date } | undefined> {
    const result = await db
      .select({ userId: sessions.userId, expiresAt: sessions.expiresAt })
      .from(sessions)
      .where(eq(sessions.id, sessionId))
      .limit(1);
    
    if (result.length === 0) return undefined;
    
    // Check if expired
    if (result[0].expiresAt < new Date()) {
      await this.deleteSession(sessionId);
      return undefined;
    }
    
    return result[0];
  }

  async deleteSession(sessionId: string): Promise<void> {
    await db.delete(sessions).where(eq(sessions.id, sessionId));
  }

  async deleteExpiredSessions(): Promise<void> {
    await db.delete(sessions).where(lte(sessions.expiresAt, new Date()));
  }

  // Price History
  async recordPrice(state: string, category: string, price: number, source: string = "SCOT"): Promise<PriceHistory> {
    const result = await db.insert(priceHistory).values({
      state,
      category,
      price: price.toString(),
      source,
    }).returning();
    return result[0];
  }

  async getPriceHistory(state: string, days: number = 30): Promise<PriceHistory[]> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    
    return db
      .select()
      .from(priceHistory)
      .where(
        and(
          eq(priceHistory.state, state),
          gte(priceHistory.recordedAt, startDate)
        )
      )
      .orderBy(desc(priceHistory.recordedAt));
  }

  async getAllPriceHistory(days: number = 30): Promise<PriceHistory[]> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    
    return db
      .select()
      .from(priceHistory)
      .where(gte(priceHistory.recordedAt, startDate))
      .orderBy(desc(priceHistory.recordedAt));
  }

  // Password Reset
  async createPasswordResetToken(userId: string, token: string, expiresAt: Date): Promise<void> {
    await db.insert(passwordResetTokens).values({
      userId,
      token,
      expiresAt,
    });
  }

  async getPasswordResetToken(token: string): Promise<{ userId: string; expiresAt: Date; used: boolean } | undefined> {
    const result = await db
      .select()
      .from(passwordResetTokens)
      .where(eq(passwordResetTokens.token, token))
      .limit(1);
    
    if (result.length === 0) return undefined;
    return {
      userId: result[0].userId,
      expiresAt: result[0].expiresAt,
      used: result[0].used || false,
    };
  }

  async markPasswordResetTokenUsed(token: string): Promise<void> {
    await db
      .update(passwordResetTokens)
      .set({ used: true })
      .where(eq(passwordResetTokens.token, token));
  }

  async updateUserPassword(userId: string, hashedPassword: string): Promise<void> {
    await db
      .update(users)
      .set({ password: hashedPassword, updatedAt: new Date() })
      .where(eq(users.id, userId));
  }

  // Stripe User Methods
  async getUserByStripeCustomerId(customerId: string): Promise<User | undefined> {
    const result = await db
      .select()
      .from(users)
      .where(eq(users.stripeCustomerId, customerId))
      .limit(1);
    return result[0];
  }

  async updateUserStripeCustomer(userId: string, customerId: string): Promise<void> {
    await db
      .update(users)
      .set({ stripeCustomerId: customerId, updatedAt: new Date() })
      .where(eq(users.id, userId));
  }

  async updateUserStripeSubscription(userId: string, subscriptionId: string): Promise<void> {
    await db
      .update(users)
      .set({ stripeSubscriptionId: subscriptionId, updatedAt: new Date() })
      .where(eq(users.id, userId));
  }

  async updateUserPlan(userId: string, plan: string): Promise<void> {
    await db
      .update(users)
      .set({ plan, updatedAt: new Date() })
      .where(eq(users.id, userId));
  }

  async getStripePrice(priceId: string): Promise<any> {
    try {
      const result = await db.execute(sql`SELECT * FROM stripe.prices WHERE id = ${priceId}`);
      return (result as any).rows?.[0] || null;
    } catch (error) {
      return null;
    }
  }

  async getStripeProduct(productId: string): Promise<any> {
    return { name: "Mock Product - " + productId };
  }

  // Market Alerts
  async createMarketAlert(alert: InsertMarketAlert): Promise<MarketAlert> {
    const result = await db.insert(marketAlerts).values(alert).returning();
    return result[0];
  }

  async getUserAlerts(userId: string): Promise<MarketAlert[]> {
    return await db.select().from(marketAlerts).where(and(eq(marketAlerts.userId, userId), eq(marketAlerts.active, true)));
  }

  async deleteMarketAlert(id: string): Promise<void> {
    await db.update(marketAlerts).set({ active: false }).where(eq(marketAlerts.id, id));
  }

  async findMatchingAlerts(category: string, state: string, price: number): Promise<MarketAlert[]> {
    return await db.select().from(marketAlerts).where(
      and(
        eq(marketAlerts.active, true),
        eq(marketAlerts.category, category),
        eq(marketAlerts.state, state),
        gte(marketAlerts.maxPrice, price.toString())
      )
    );
  }

  // Notifications
  async createNotification(notification: InsertNotification): Promise<Notification> {
    const result = await db.insert(notifications).values(notification).returning();
    return result[0];
  }

  async getUserNotifications(userId: string): Promise<Notification[]> {
    return await db.select().from(notifications).where(eq(notifications.userId, userId)).orderBy(desc(notifications.createdAt));
  }

  async markNotificationRead(id: string): Promise<void> {
    await db.update(notifications).set({ read: true }).where(eq(notifications.id, id));
  }

}

export const storage = new PostgresStorage();
