import { useRoute, Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useState, useEffect } from "react";
import { adsAPI } from "@/lib/api";
import { 
  MapPin, 
  Scale, 
  Info, 
  Share2, 
  Heart, 
  MessageCircle, 
  Phone, 
  Calendar, 
  ShieldCheck,
  Loader2
} from "lucide-react";
import { generateWhatsAppLink, getDefaultMessage } from "@/lib/whatsapp";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { StarRating } from "@/components/ui/star-rating";
import { ReviewList } from "@/components/ui/review-list";
import { useAppContext } from "@/context/AppContext";

export default function ProductDetails() {
  const [match, params] = useRoute("/product/:id");
  const id = params?.id;
  const [animal, setAnimal] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showPhone, setShowPhone] = useState(false);
  const [isFavorited, setIsFavorited] = useState(false);
  const [similarAnimals, setSimilarAnimals] = useState<any[]>([]);
  const [sellerRating, setSellerRating] = useState<number>(0);
  const [reviewCount, setReviewCount] = useState<number>(0);
  const { user } = useAppContext();

  useEffect(() => {
    if (!id) return;

    const loadAd = async () => {
      try {
        setLoading(true);
        const ad = await adsAPI.get(id);
        setAnimal(ad);
        
        // Load similar ads from same category
        const allAds = await adsAPI.list({ category: ad.category });
        setSimilarAnimals(allAds.filter((a: any) => a.id !== ad.id).slice(0, 3));
        
        // Load seller rating
        if (ad.sellerId) {
          try {
            const [ratingRes, reviewsRes] = await Promise.all([
              fetch(`/api/sellers/${ad.sellerId}/average-rating`),
              fetch(`/api/sellers/${ad.sellerId}/reviews`)
            ]);
            if (ratingRes.ok) {
              const ratingData = await ratingRes.json();
              setSellerRating(ratingData.averageRating || 0);
            }
            if (reviewsRes.ok) {
              const reviewsData = await reviewsRes.json();
              setReviewCount(reviewsData.data?.length || 0);
            }
          } catch (e) {
            console.log("Could not load seller rating");
          }
        }
      } catch (error) {
        console.error("Failed to load ad:", error);
      } finally {
        setLoading(false);
      }
    };

    loadAd();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!animal) {
    return <div className="p-20 text-center text-lg text-muted-foreground">Anúncio não encontrado</div>;
  }

  if (!user || user.plan?.toLowerCase() === 'free') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="max-w-2xl w-full bg-card rounded-2xl shadow-xl border border-border text-center p-12">
          <ShieldCheck className="h-24 w-24 text-primary mx-auto mb-8 opacity-90" />
          <h2 className="text-4xl font-black mb-4">Acesso Exclusivo</h2>
          <p className="text-xl text-muted-foreground mb-8">
            Os detalhes dos anúncios, preços e contatos no <strong>Boi na Rede</strong> são exclusivos para assinantes.
          </p>
          <Button className="h-14 px-10 text-lg font-bold" onClick={() => window.location.href = '/pricing'}>
            Desbloquear Acesso Agora
          </Button>
        </div>
      </div>
    );
  }

  const sellerPhone = animal.phone || "85987654321";
  const whatsappLink = generateWhatsAppLink(
    sellerPhone,
    getDefaultMessage(animal.title, animal.quantity, parseInt(animal.pricePerHead || "0"))
  );

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left Column: Images */}
          <div className="lg:col-span-2 space-y-6">
            <div className="rounded-xl overflow-hidden border border-border shadow-sm bg-card">
              <Carousel className="w-full">
                <CarouselContent>
                  {animal.videoUrl && (
                    <CarouselItem key="video">
                      <div className="aspect-video relative bg-black flex items-center justify-center">
                         {animal.videoUrl.includes('mp4') || animal.videoUrl.match(/\.(webm|ogg)$/i) ? (
                            <video 
                              src={animal.videoUrl} 
                              controls 
                              className="w-full h-full object-contain"
                            />
                         ) : (
                            <iframe 
                              src={animal.videoUrl.includes('youtube.com/watch?v=') ? animal.videoUrl.replace('watch?v=', 'embed/') : animal.videoUrl} 
                              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                              allowFullScreen
                              className="w-full h-full border-0 object-cover"
                            />
                         )}
                      </div>
                    </CarouselItem>
                  )}
                  {(animal.images && animal.images.length > 0 ? animal.images : [animal.image || ""]).map((imgSrc: string, index: number) => (
                    <CarouselItem key={index}>
                      <div className="aspect-video relative bg-muted flex items-center justify-center">
                        <img 
                          src={imgSrc} 
                          alt={`${animal.title} - Foto ${index + 1}`}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="300"%3E%3Crect fill="%23ddd" width="400" height="300"/%3E%3Ctext x="50%25" y="50%25" font-size="20" fill="%23999" text-anchor="middle" dy=".3em"%3EImagem indisponível%3C/text%3E%3C/svg%3E';
                          }}
                        />
                      </div>
                    </CarouselItem>
                  ))}
                </CarouselContent>
                {((animal.images && animal.images.length > 1) || animal.videoUrl) && (
                  <>
                    <CarouselPrevious className="left-4" />
                    <CarouselNext className="right-4" />
                  </>
                )}
              </Carousel>
              {((animal.images && animal.images.length > 1) || animal.videoUrl) && (
                <div className="flex gap-2 p-4 overflow-x-auto">
                  {animal.videoUrl && (
                    <div className="w-16 h-16 flex-shrink-0 flex items-center justify-center rounded-md overflow-hidden border-2 border-border bg-black text-white hover:border-primary cursor-pointer transition-colors">
                      <span className="text-[10px] font-bold">VÍDEO ▶</span>
                    </div>
                  )}
                  {animal.images && animal.images.map((imgSrc: string, index: number) => (
                    <div 
                      key={index}
                      className="w-16 h-16 flex-shrink-0 rounded-md overflow-hidden border-2 border-border hover:border-primary cursor-pointer transition-colors"
                    >
                      <img 
                        src={imgSrc} 
                        alt={`Miniatura ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="bg-card rounded-xl border border-border p-6 shadow-sm space-y-6">
              <div>
                <h1 className="text-2xl md:text-3xl font-bold font-serif text-foreground mb-2">
                  {animal.title}
                </h1>
                <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
                  <span className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" /> Publicado em {new Date(animal.createdAt).toLocaleDateString('pt-BR')}
                  </span>
                  <span className="flex items-center gap-1">
                    <MapPin className="h-4 w-4" /> {animal.city}, {animal.state}
                  </span>
                </div>
                <div className="flex flex-wrap gap-2">
                   <Badge variant="secondary" className="text-base py-1 px-3">
                    {animal.category}
                   </Badge>
                   <Badge variant="outline" className="text-base py-1 px-3">
                    {animal.breed}
                   </Badge>
                </div>
              </div>

              <div className="prose max-w-none text-muted-foreground">
                <h3 className="text-foreground font-bold text-lg mb-2">Descrição</h3>
                <p>{animal.description}</p>
                <p>
                  Animais de excelente procedência, com todas as vacinas em dia. 
                  Prontos para transporte. Aceitamos visita na fazenda para conferência.
                </p>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-6 border-t border-border">
                <div className="p-4 bg-secondary/30 rounded-lg text-center">
                  <p className="text-xs text-muted-foreground uppercase font-bold mb-1">Peso Médio</p>
                  <p className="text-lg font-bold text-foreground">{animal.weight} kg</p>
                </div>
                <div className="p-4 bg-secondary/30 rounded-lg text-center">
                  <p className="text-xs text-muted-foreground uppercase font-bold mb-1">Quantidade</p>
                  <p className="text-lg font-bold text-foreground">{animal.quantity} cab</p>
                </div>
                <div className="p-4 bg-secondary/30 rounded-lg text-center">
                  <p className="text-xs text-muted-foreground uppercase font-bold mb-1">Idade Est.</p>
                  <p className="text-lg font-bold text-foreground">18-20 m</p>
                </div>
                <div className="p-4 bg-secondary/30 rounded-lg text-center">
                  <p className="text-xs text-muted-foreground uppercase font-bold mb-1">Era</p>
                  <p className="text-lg font-bold text-foreground">2023</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Price & Seller */}
          <div className="space-y-6">
            <div className="bg-card rounded-xl border border-border p-6 shadow-md sticky top-24">
              <div className="mb-6">
                <p className="text-sm text-muted-foreground mb-1">Valor Total Estimado</p>
                <div className="flex items-baseline gap-2 mb-2">
                  <span className="text-3xl font-bold text-primary">
                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Math.max(0, parseInt(animal.pricePerHead || "0") * animal.quantity))}
                  </span>
                </div>
                <div className="flex justify-between text-sm py-2 border-y border-border">
                  <span className="text-muted-foreground">Preço por cabeça:</span>
                  <span className="font-semibold">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Math.max(0, parseInt(animal.pricePerHead || "0")))}</span>
                </div>
                {animal.pricePerArroba && (
                  <div className="flex justify-between text-sm py-2 border-b border-border mb-4">
                    <span className="text-muted-foreground">Preço por Arroba (@):</span>
                    <span className="font-semibold">~ {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(parseInt(animal.pricePerArroba) || 0)}</span>
                  </div>
                )}
              </div>

              <div className="space-y-3">
                {animal.sellerId && user?.id !== animal.sellerId && (
                  <Button 
                    asChild
                    className="w-full h-12 text-md font-bold bg-primary hover:bg-primary/90 gap-2 shadow-sm"
                  >
                    <Link href={`/chat/${animal.sellerId}`}>
                      <ShieldCheck className="h-5 w-5" />
                      Chat Seguro na Plataforma
                    </Link>
                  </Button>
                )}
                <Button 
                  asChild
                  className="w-full h-12 text-md font-bold bg-green-600 hover:bg-green-700 text-white gap-2 shadow-sm"
                >
                  <a href={whatsappLink} target="_blank" rel="noopener noreferrer">
                    <MessageCircle className="h-5 w-5" />
                    Negociar via WhatsApp
                  </a>
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full h-12 font-semibold gap-2"
                  onClick={() => setShowPhone(!showPhone)}
                >
                  <Phone className="h-4 w-4" />
                  {showPhone ? animal.phone : "Ver Telefone"}
                </Button>
              </div>

              <div className="mt-6 pt-6 border-t border-border">
                <h4 className="font-bold text-sm text-muted-foreground uppercase mb-4">Vendedor</h4>
                <div className="flex items-center gap-3 mb-4">
                  <Avatar className="h-12 w-12 border border-border">
                    <AvatarFallback className="bg-primary/10 text-primary font-bold">
                      {animal.seller?.name?.substring(0, 2).toUpperCase() || "VD"}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-bold text-foreground flex items-center gap-1">
                      {animal.seller?.name || "Vendedor"}
                      {animal.seller?.verified && <ShieldCheck className="h-4 w-4 text-blue-500" />}
                    </p>
                    <div className="flex items-center gap-2">
                      <StarRating rating={sellerRating} size="sm" />
                      <span className="text-xs text-muted-foreground">
                        ({reviewCount} {reviewCount === 1 ? "avaliação" : "avaliações"})
                      </span>
                    </div>
                  </div>
                </div>
                <Button variant="ghost" className="w-full text-sm h-8">
                  Ver perfil do vendedor
                </Button>
              </div>
              
              <div className="flex gap-2 mt-4">
                 <Button 
                   variant={isFavorited ? "default" : "secondary"}
                   size="icon" 
                   className="flex-1"
                   onClick={() => setIsFavorited(!isFavorited)}
                   data-testid="button-favorite"
                 >
                   <Heart className={`h-5 w-5 ${isFavorited ? "fill-current" : ""}`} />
                 </Button>
                 <Button 
                   variant="secondary" 
                   size="icon" 
                   className="flex-1"
                   onClick={() => {
                     const url = window.location.href;
                     navigator.clipboard.writeText(url);
                     alert("Link copiado!");
                   }}
                 >
                   <Share2 className="h-5 w-5" />
                 </Button>
              </div>
            </div>
            
            {/* Safety Card */}
            <div className="bg-blue-50 border border-blue-100 p-4 rounded-xl text-sm text-blue-900">
              <div className="flex items-center gap-2 font-bold mb-2">
                <ShieldCheck className="h-5 w-5" /> Dicas de Segurança
              </div>
              <ul className="list-disc list-inside space-y-1 opacity-90">
                <li>Nunca faça pagamentos antecipados.</li>
                <li>Agende uma visita para ver os animais.</li>
                <li>Verifique a documentação sanitária.</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Reviews Section */}
        {animal.sellerId && (
          <div className="mt-12">
            <ReviewList sellerId={animal.sellerId} />
          </div>
        )}

        {/* Similar Animals Section */}
        {similarAnimals.length > 0 && (
          <div className="mt-16 py-8 border-t border-border">
            <h2 className="text-2xl font-bold font-serif mb-6">Animais Similares</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {similarAnimals.map((sim) => (
                <Link key={sim.id} href={`/product/${sim.id}`}>
                  <div className="group cursor-pointer block">
                    <div className="relative aspect-[4/3] overflow-hidden rounded-lg mb-3">
                      <img 
                        src={sim.image} 
                        alt={sim.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                      <Badge className="absolute top-2 right-2">{sim.category}</Badge>
                    </div>
                    <h3 className="font-bold text-sm mb-1 group-hover:text-primary transition-colors">{sim.title}</h3>
                    <p className="text-xs text-muted-foreground mb-2">{sim.breed} • {sim.quantity} cab</p>
                    <p className="text-primary font-bold">
                      {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(sim.pricePerHead)}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
