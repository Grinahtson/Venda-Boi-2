import { Animal } from "@/lib/data";
import { MapPin, Scale, Info, Heart, TrendingUp, MessageCircle, ShieldCheck } from "lucide-react";
import { Link } from "wouter";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useFavorites } from "@/context/FavoritesContext";
import { motion } from "framer-motion";
import { ArrobaTicker } from "@/components/ui/arroba-ticker";
import { generateWhatsAppLink, getDefaultMessage } from "@/lib/whatsapp";
import { Tilt } from "@/components/ui/tilt";

interface AnimalCardProps {
  animal: Animal;
}

export function AnimalCard({ animal }: AnimalCardProps) {
  const { isFavorite, addFavorite, removeFavorite } = useFavorites();
  const favorited = isFavorite(animal.id);

  const handleToggleFavorite = (e: React.MouseEvent) => {
    e.preventDefault();
    if (favorited) {
      removeFavorite(animal.id);
    } else {
      addFavorite(animal.id);
    }
  };
  return (
    <Tilt intensity={5} className="h-full">
      <Card 
        className="group overflow-hidden rounded-xl border border-border bg-card shadow-sm transition-shadow hover:shadow-2xl h-full flex flex-col"
        style={{ transform: "translateZ(10px)", transformStyle: "preserve-3d" }}
      >
        <Link href={`/product/${animal.id}`}>
          <div className="relative aspect-[4/3] overflow-hidden cursor-pointer">
        <img 
          src={animal.image} 
          alt={animal.title} 
          className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-500"
        />
        <div className="absolute top-3 left-3">
          <Badge variant="secondary" className="bg-white/90 text-foreground font-bold backdrop-blur-sm shadow-sm">
            {animal.category}
          </Badge>
        </div>
        <div className="absolute top-3 right-3 flex gap-2">
          {animal.featured && (
            <Badge className="bg-accent text-accent-foreground font-bold shadow-sm border-none">
              Destaque
            </Badge>
          )}
          <motion.button
            onClick={handleToggleFavorite}
            className="p-2 bg-white/90 rounded-full hover:bg-white transition-colors backdrop-blur-sm shadow-sm"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            data-testid={`button-favorite-${animal.id}`}
          >
            <Heart
              className={`h-5 w-5 transition-colors ${
                favorited ? "fill-red-500 text-red-500" : "text-gray-600"
              }`}
            />
          </motion.button>
        </div>
      </div>
      </Link>
      
      <CardContent className="p-4">
        <div className="flex justify-between items-start mb-2">
          <div className="flex-1">
             <h3 className="font-bold text-lg leading-tight line-clamp-1 group-hover:text-primary transition-colors">
              {animal.title}
            </h3>
            <div className="flex items-center gap-2 mt-1">
              <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
                {animal.seller?.name || "Vendedor"}
                {animal.seller?.verified && (
                  <span className="bg-green-100 text-green-700 text-[10px] px-1 rounded flex items-center" title="Produtor Verificado">
                    ✓
                  </span>
                )}
              </p>
              <span className="text-muted-foreground/30">•</span>
              <p className="text-sm text-muted-foreground font-medium">{animal.breed}</p>
              {animal.seller?.rating && (
                <div className="flex items-center gap-0.5 ml-auto">
                  {[...Array(5)].map((_, i) => (
                    <span
                      key={i}
                      className={`text-[10px] ${
                        i < Math.floor(animal.seller?.rating || 0)
                          ? "text-yellow-400"
                          : "text-gray-300"
                      }`}
                    >
                      ★
                    </span>
                  ))}
                  <span className="text-[10px] text-muted-foreground ml-0.5">({animal.seller?.rating || 0})</span>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 my-4 text-sm">
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <Scale className="h-4 w-4 text-primary" />
            <span>{animal.weight} kg (médio)</span>
          </div>
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <Info className="h-4 w-4 text-primary" />
            <span>{animal.quantity} cabeças</span>
          </div>
          <div className="flex items-center gap-1.5 text-muted-foreground col-span-2">
            <MapPin className="h-4 w-4 text-primary" />
            <span className="truncate">{animal.location?.city || (animal as any).city || "N/A"} - {animal.location?.state || (animal as any).state || "N/A"}</span>
          </div>
        </div>
        
        <div className="pt-2 border-t border-border">
          <p className="text-xs text-muted-foreground uppercase font-semibold tracking-wider mb-1">Preço por cabeça</p>
          <div className="flex items-baseline gap-1">
            <span className="text-xl font-bold text-primary">
              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(animal.pricePerHead)}
            </span>
          </div>
          {animal.pricePerArroba && (
            <motion.div 
              className="flex items-center gap-2 mt-2 p-2 bg-gradient-to-r from-accent/10 to-accent/5 rounded-lg border border-accent/20"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <TrendingUp className="h-4 w-4 text-accent animate-pulse" />
              <div className="flex-1">
                <p className="text-xs text-muted-foreground mb-0.5">Por arroba</p>
                <motion.p 
                  className="text-sm font-bold text-accent"
                  whileHover={{ scale: 1.05 }}
                >
                  <ArrobaTicker 
                    value={animal.pricePerArroba} 
                    animated={true}
                  />
                </motion.p>
              </div>
            </motion.div>
          )}
        </div>
      </CardContent>

      <CardFooter className="p-4 pt-0 gap-2">
        <Link href={`/product/${animal.id}`} className="flex-1">
          <Button className="w-full font-medium" variant="outline">
            Ver Detalhes
          </Button>
        </Link>
        <Button 
          asChild
          className="bg-green-600 hover:bg-green-700 text-white"
          size="icon"
          data-testid={`button-whatsapp-${animal.id}`}
        >
          <a 
            href={generateWhatsAppLink(
              animal.seller?.phone || "85987654321",
              getDefaultMessage(animal.title, animal.quantity, animal.pricePerHead)
            )} 
            target="_blank" 
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            title="WhatsApp"
          >
            <MessageCircle className="h-5 w-5" />
          </a>
        </Button>
        <Button 
          asChild
          variant="outline"
          className="border-primary text-primary hover:bg-primary hover:text-white"
          size="icon"
          title="Chat Seguro"
        >
          <Link href={`/chat/${animal.seller?.id || (animal as any).sellerId || ""}`} onClick={(e) => e.stopPropagation()}>
             <ShieldCheck className="h-5 w-5" />
          </Link>
        </Button>
        </CardFooter>
      </Card>
    </Tilt>
  );
}
