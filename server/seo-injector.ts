import type { Request, Response, NextFunction } from "express";
import fs from "fs/promises";
import path from "path";
import { storage } from "./storage";

export async function seoInjectorOverlay(req: Request, res: Response, next: NextFunction) {
  const userAgent = req.headers["user-agent"]?.toLowerCase() || "";
  const isSocialBot = /whatsapp|facebook|twitterbot|linkedin|slackbot|telegrambot/i.test(userAgent);

  // Somente intercepta bots de compartilhamento acessando a URL do produto
  if (isSocialBot && req.originalUrl.startsWith("/product/")) {
    const productId = req.originalUrl.split("/product/")[1]?.split("?")[0];
    
    if (productId) {
      try {
        const ad = await storage.getAd(productId);
        
        if (ad) {
          const isProd = process.env.NODE_ENV === "production";
          const templatePath = isProd 
            ? path.resolve(process.cwd(), "dist", "public", "index.html")
            : path.resolve(process.cwd(), "client", "index.html");
            
          let template = await fs.readFile(templatePath, "utf-8");
          
          const imageUrl = Array.isArray(ad.images) && ad.images.length > 0 
              ? ad.images[0] 
              : "https://boinarede.com/placeholder-cattle.jpg";
              
          const title = `${ad.title} - R$ ${Number(ad.pricePerHead).toLocaleString('pt-BR')}`;
          const description = `${ad.quantity} cabeças de ${ad.breed} disponíveis na Boi na Rede.`;
          
          // Injetando as Meta Tags no Head
          const metaTags = `
            <meta property="og:title" content="${title}">
            <meta property="og:description" content="${description}">
            <meta property="og:image" content="${imageUrl}">
            <meta property="og:url" content="https://boinarede.com${req.originalUrl}">
            <meta property="og:type" content="product">
            <meta name="twitter:card" content="summary_large_image">
          `;
          
          template = template.replace("<head>", `<head>\n${metaTags}`);
          
          return res.status(200).send(template);
        }
      } catch (error) {
        console.error("Erro ao injetar SEO:", error);
      }
    }
  }

  // Deixa seguir o fluxo normal pro Vite resolver se não for um bot
  next();
}
