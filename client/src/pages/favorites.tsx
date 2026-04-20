import { useState, useEffect } from "react";
import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Heart, ShoppingCart, ArrowLeft } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { AnimalCard } from "@/components/ui/animal-card";
import { useAppContext } from "@/context/AppContext";
import { favoritesAPI } from "@/lib/api";
import { toast } from "sonner";

export default function Favorites() {
  const { sessionId } = useAppContext();
  const [favoriteAnimals, setFavoriteAnimals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!sessionId) return;

    const loadFavorites = async () => {
      try {
        setLoading(true);
        const ads = await favoritesAPI.list(sessionId);
        setFavoriteAnimals(ads);
      } catch (error) {
        console.error("Failed to load favorites:", error);
        toast.error("Erro ao carregar favoritos");
      } finally {
        setLoading(false);
      }
    };

    loadFavorites();
  }, [sessionId]);

  const handleRemoveFavorite = async (adId: string) => {
    if (!sessionId) return;

    try {
      await favoritesAPI.remove(sessionId, adId);
      setFavoriteAnimals(favoriteAnimals.filter(ad => ad.id !== adId));
      toast.success("Removido dos favoritos!");
    } catch (error: any) {
      toast.error("Erro ao remover dos favoritos");
    }
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="container mx-auto px-4 py-12">
        {/* Header */}
        <div className="mb-8">
          <Link href="/marketplace">
            <Button variant="ghost" className="gap-2 mb-4" data-testid="button-back-marketplace">
              <ArrowLeft className="h-4 w-4" /> Voltar
            </Button>
          </Link>
          <h1 className="text-4xl font-bold font-serif mb-2" data-testid="text-favorites-title">
            ❤️ Meus Favoritos
          </h1>
          <p className="text-muted-foreground" data-testid="text-favorites-subtitle">
            {favoriteAnimals.length} animal{favoriteAnimals.length !== 1 ? "is" : ""} salvado{favoriteAnimals.length !== 1 ? "s" : ""}
          </p>
        </div>

        {/* Empty State */}
        {favoriteAnimals.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <Card className="text-center py-16 border-dashed" data-testid="card-empty-favorites">
              <CardContent className="space-y-4">
                <Heart className="h-16 w-16 mx-auto text-muted-foreground opacity-50" />
                <div>
                  <h2 className="text-2xl font-bold mb-2">Nenhum Favorito Ainda</h2>
                  <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                    Explore o marketplace e clique no ❤️ dos animais que você gostaria de acompanhar.
                  </p>
                  <Link href="/marketplace">
                    <Button className="gap-2" data-testid="button-explore-marketplace">
                      <ShoppingCart className="h-4 w-4" /> Explorar Marketplace
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ) : (
          <>
            {/* Summary Card */}
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-8 grid grid-cols-1 md:grid-cols-3 gap-4"
            >
              <Card data-testid="card-total-favorites">
                <CardContent className="p-4">
                  <p className="text-sm text-muted-foreground mb-1">Total Favoritos</p>
                  <p className="text-3xl font-bold text-primary">{favoriteAnimals.length}</p>
                </CardContent>
              </Card>
              <Card data-testid="card-avg-price">
                <CardContent className="p-4">
                  <p className="text-sm text-muted-foreground mb-1">Preço Médio</p>
                  <p className="text-3xl font-bold text-accent">
                    R$ {Math.round(
                      favoriteAnimals.reduce((acc, animal) => acc + animal.pricePerHead, 0) / 
                      favoriteAnimals.length
                    )}
                  </p>
                </CardContent>
              </Card>
              <Card data-testid="card-total-quantity">
                <CardContent className="p-4">
                  <p className="text-sm text-muted-foreground mb-1">Total de Cabeças</p>
                  <p className="text-3xl font-bold text-green-600">
                    {favoriteAnimals.reduce((acc, animal) => acc + animal.quantity, 0)}
                  </p>
                </CardContent>
              </Card>
            </motion.div>

            {/* Grid de Favoritos */}
            <AnimatePresence mode="popLayout">
              <motion.div
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ staggerChildren: 0.1 }}
              >
                {favoriteAnimals.map((animal, index) => (
                  <motion.div
                    key={animal.id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ delay: index * 0.05 }}
                    layoutId={`favorite-${animal.id}`}
                  >
                    <AnimalCard animal={animal} />
                  </motion.div>
                ))}
              </motion.div>
            </AnimatePresence>

            {/* CTA */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="mt-12 text-center"
            >
              <Card className="bg-gradient-to-r from-primary/10 to-accent/10" data-testid="card-cta-section">
                <CardContent className="p-8">
                  <h2 className="text-2xl font-bold mb-2">Pronto para Comprar?</h2>
                  <p className="text-muted-foreground mb-4 max-w-md mx-auto">
                    Entre em contato com os vendedores direto pelo WhatsApp para negociar as melhores condições.
                  </p>
                  <Link href="/marketplace">
                    <Button size="lg" className="gap-2" data-testid="button-contact-sellers">
                      <ShoppingCart className="h-4 w-4" /> Voltar ao Marketplace
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </motion.div>
          </>
        )}
      </div>
    </div>
  );
}
