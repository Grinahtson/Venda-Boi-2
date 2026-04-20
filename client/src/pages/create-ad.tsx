import { useState, useEffect } from "react";
import { adsAPI } from "@/lib/api";
import { useAppContext } from "@/context/AppContext";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { categories } from "@/lib/data";
import { Upload, ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { LocationPicker } from "@/components/ui/location-picker";
import { AIPriceSuggestion } from "@/components/ui/ai-price-suggestion";

export default function CreateAd() {
  const [, setLocation] = useLocation();
  const { user, sessionId } = useAppContext();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [adLimitReached, setAdLimitReached] = useState(false);

  // Redirect if not authenticated
  useEffect(() => {
    if (!user || !sessionId) {
      setLocation("/auth");
    }
  }, [user, sessionId, setLocation]);

  // Check ad limit before showing form
  useEffect(() => {
    if (!sessionId) return;
    const checkLimit = async () => {
      try {
        const res = await fetch("/api/ads/user/me", {
          headers: { "Authorization": `Bearer ${sessionId}` }
        });
        if (res.ok) {
          const ads = await res.json();
          const planLimits: Record<string, number> = {
            "Free": 0, // Free users cannot create ads
            "Basic": 50,
            "Premium": Infinity,
            "Anual": Infinity,
          };
          const plan = user?.plan || "Free";
          const limit = planLimits[plan] ?? 5;
          if (Array.isArray(ads) && ads.length >= limit) {
            setAdLimitReached(true);
          }
        }
      } catch {}
    };
    checkLimit();
  }, [sessionId, user?.plan]);
  
  // Form State
  const [formData, setFormData] = useState({
    title: "",
    category: "",
    breed: "",
    quantity: 0,
    weight: 0,
    price: 0,
    priceArroba: 0,
    phone: "",
    description: "",
    videoUrl: "",
    images: [] as File[]
  });
  const [adLocation, setAdLocation] = useState<{lat: number; lng: number; city?: string; state?: string}>({ lat: 0, lng: 0 });
  const [imagePreview, setImagePreview] = useState<string[]>([]);

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length + formData.images.length > 10) {
      toast({
        title: "Limite de fotos",
        description: "Máximo de 10 fotos por anúncio.",
        variant: "destructive"
      });
      return;
    }
    
    setFormData(prev => ({ ...prev, images: [...prev.images, ...files] }));
    
    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(prev => [...prev, e.target?.result as string]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (index: number) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }));
    setImagePreview(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validações
    if (!formData.title.trim()) {
      toast({
        title: "Título obrigatório",
        description: "Por favor, adicione um título para o anúncio.",
        variant: "destructive"
      });
      return;
    }

    if (!formData.category) {
      toast({
        title: "Categoria obrigatória",
        description: "Por favor, selecione uma categoria.",
        variant: "destructive"
      });
      return;
    }

    if (!formData.breed.trim()) {
      toast({
        title: "Raça obrigatória",
        description: "Por favor, especifique a raça do animal.",
        variant: "destructive"
      });
      return;
    }

    if (!formData.quantity || formData.quantity <= 0) {
      toast({
        title: "Quantidade inválida",
        description: "Por favor, insira uma quantidade válida.",
        variant: "destructive"
      });
      return;
    }

    if (!formData.weight || formData.weight <= 0) {
      toast({
        title: "Peso inválido",
        description: "Por favor, insira um peso válido.",
        variant: "destructive"
      });
      return;
    }

    if (!formData.price || formData.price <= 0) {
      toast({
        title: "Preço inválido",
        description: "Por favor, insira um preço válido.",
        variant: "destructive"
      });
      return;
    }

    if (!adLocation.city || !adLocation.state) {
      toast({
        title: "Localização obrigatória",
        description: "Por favor, selecione a localização da fazenda.",
        variant: "destructive"
      });
      return;
    }

    if (!formData.phone.trim()) {
      toast({
        title: "Telefone obrigatório",
        description: "Por favor, adicione um telefone/WhatsApp.",
        variant: "destructive"
      });
      return;
    }

    if (formData.images.length === 0) {
      toast({
        title: "Fotos obrigatórias",
        description: "Por favor, adicione pelo menos 1 foto do animal.",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);
    
    try {
      // Upload photos first
      let photoUrls: string[] = [];
      if (formData.images.length > 0) {
        photoUrls = await adsAPI.uploadPhotos(sessionId!, formData.images);
      }

      const adData = {
        title: formData.title,
        breed: formData.breed,
        category: formData.category,
        quantity: formData.quantity,
        weight: formData.weight,
        pricePerHead: formData.price,
        pricePerArroba: formData.priceArroba || null,
        phone: formData.phone,
        description: formData.description,
        videoUrl: formData.videoUrl ? formData.videoUrl : undefined,
        images: photoUrls,
        city: adLocation.city,
        state: adLocation.state,
        latitude: adLocation.lat,
        longitude: adLocation.lng,
      };
      
      await adsAPI.create(sessionId!, adData);
      
      toast({
        title: "🎉 Anúncio criado com sucesso!",
        description: `Seu lote de ${formData.quantity} cabeças foi publicado!`,
      });
      setLocation("/dashboard");
    } catch (error: any) {
      toast({
        title: "Erro ao criar anúncio",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (adLimitReached) {
    const planLimits: Record<string, number> = { "Free": 5, "Basic": 50, "Premium": Infinity, "Anual": Infinity };
    const plan = user?.plan || "Free";
    const limit = planLimits[plan] ?? 5;
    return (
      <div className="min-h-screen bg-background py-12">
        <div className="container mx-auto px-4 max-w-3xl">
          <Button variant="ghost" className="mb-6 gap-2" onClick={() => setLocation("/dashboard")}>
            <ArrowLeft className="h-4 w-4" /> Voltar ao Painel
          </Button>
          <Card className="border-border/50 shadow-lg text-center py-16 px-8">
            <div className="text-5xl mb-4">🔒</div>
            <h2 className="text-3xl font-black mb-4">
              {plan.toLowerCase() === "free" ? "Acesso Exclusivo para Assinantes" : "Limite de anúncios atingido"}
            </h2>
            <p className="text-lg text-muted-foreground mb-8 max-w-md mx-auto">
              {plan.toLowerCase() === "free" 
                ? <>No plano <strong>Free</strong>, você não tem direito a publicar anúncios nem a visualizar os anúncios do marketplace. Faça um upgrade para destravar a plataforma.</>
                : <>Seu plano <strong>{plan}</strong> permite até <strong>{isFinite(limit) ? limit : "ilimitados"}</strong> anúncios. Você atingiu esse limite. Faça um upgrade para aumentar sua cota.</>}
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button onClick={() => setLocation("/pricing")} className="bg-primary text-white">
                Fazer Upgrade de Plano
              </Button>
              <Button variant="outline" onClick={() => setLocation("/dashboard")}>
                Gerenciar Anúncios
              </Button>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-12">
      <div className="container mx-auto px-4 max-w-3xl">
        <Button variant="ghost" className="mb-6 gap-2" onClick={() => setLocation("/dashboard")}>
          <ArrowLeft className="h-4 w-4" /> Voltar ao Painel
        </Button>

        <Card className="border-border/50 shadow-lg">
          <CardHeader>
            <CardTitle className="text-2xl font-serif">Anunciar Lote</CardTitle>
            <CardDescription>
              Preencha as informações abaixo para colocar seus animais à venda.
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-8">
              
              {/* Basic Info */}
              <div className="space-y-4">
                <h3 className="text-lg font-bold border-b pb-2">Informações Básicas</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">Título do Anúncio *</Label>
                    <Input 
                      id="title" 
                      placeholder="Ex: Lote de Novilhas Nelore" 
                      value={formData.title}
                      onChange={(e) => handleInputChange("title", e.target.value)}
                      data-testid="input-title"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="category">Categoria *</Label>
                    <Select value={formData.category} onValueChange={(val) => handleInputChange("category", val)}>
                      <SelectTrigger data-testid="select-category">
                        <SelectValue placeholder="Selecione..." />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map(cat => (
                          <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="breed">Raça *</Label>
                    <Input 
                      id="breed" 
                      placeholder="Ex: Nelore" 
                      value={formData.breed}
                      onChange={(e) => handleInputChange("breed", e.target.value)}
                      data-testid="input-breed"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="quantity">Quantidade (Cabeças) *</Label>
                    <Input 
                      id="quantity" 
                      type="number" 
                      placeholder="0" 
                      value={formData.quantity || ""}
                      onChange={(e) => handleInputChange("quantity", parseInt(e.target.value) || 0)}
                      data-testid="input-quantity"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="weight">Peso Médio (kg) *</Label>
                    <Input 
                      id="weight" 
                      type="number" 
                      placeholder="0" 
                      value={formData.weight || ""}
                      onChange={(e) => handleInputChange("weight", parseInt(e.target.value) || 0)}
                      data-testid="input-weight"
                    />
                  </div>
                </div>
              </div>

              {/* Price & Location */}
              <div className="space-y-4">
                <h3 className="text-lg font-bold border-b pb-2">Preço e Localização</h3>
                
                <AIPriceSuggestion
                  category={formData.category}
                  breed={formData.breed}
                  weight={formData.weight}
                  quantity={formData.quantity}
                  state={adLocation.state || ""}
                  onApplyPrice={(pricePerHead, pricePerArroba) => {
                    handleInputChange("price", pricePerHead);
                    handleInputChange("priceArroba", pricePerArroba);
                  }}
                />
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="price">Preço por Cabeça (R$) *</Label>
                    <Input 
                      id="price" 
                      type="number" 
                      placeholder="0,00" 
                      value={formData.price || ""}
                      onChange={(e) => handleInputChange("price", parseFloat(e.target.value) || 0)}
                      data-testid="input-price"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="priceArroba">Preço por Arroba (R$) - Opcional</Label>
                    <Input 
                      id="priceArroba" 
                      type="number" 
                      placeholder="0,00" 
                      value={formData.priceArroba || ""}
                      onChange={(e) => handleInputChange("priceArroba", parseFloat(e.target.value) || 0)}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <LocationPicker onLocationChange={setAdLocation} />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Telefone / WhatsApp *</Label>
                  <Input 
                    id="phone" 
                    placeholder="(00) 00000-0000" 
                    value={formData.phone}
                    onChange={(e) => handleInputChange("phone", e.target.value)}
                    data-testid="input-phone"
                  />
                </div>
              </div>

              {/* Media */}
              <div className="space-y-4">
                <h3 className="text-lg font-bold border-b pb-2">Fotos e Detalhes</h3>
                
                {/* Image Upload */}
                <div>
                  <Label className="block mb-3">Adicionar Fotos *</Label>
                  <label className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:bg-secondary/20 transition-colors cursor-pointer block">
                    <div className="flex flex-col items-center gap-2">
                      <Upload className="h-8 w-8 text-primary" />
                      <p className="font-medium text-muted-foreground">Clique para adicionar fotos</p>
                      <p className="text-xs text-muted-foreground">{formData.images.length}/10 fotos</p>
                      <p className="text-xs text-muted-foreground">JPG, PNG até 5MB cada</p>
                    </div>
                    <input 
                      type="file" 
                      multiple 
                      accept="image/*" 
                      onChange={handleImageChange}
                      disabled={formData.images.length >= 10}
                      className="hidden"
                      data-testid="input-images"
                    />
                  </label>
                  
                  {/* Image Preview */}
                  {imagePreview.length > 0 && (
                    <div className="mt-4 grid grid-cols-2 md:grid-cols-3 gap-4">
                      {imagePreview.map((preview, idx) => (
                        <div key={idx} className="relative group">
                          <img 
                            src={preview} 
                            alt={`Preview ${idx + 1}`}
                            className="w-full h-32 object-cover rounded-lg border border-border"
                          />
                          <button
                            type="button"
                            onClick={() => removeImage(idx)}
                            className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                            data-testid={`button-remove-image-${idx}`}
                          >
                            ✕
                          </button>
                          <p className="text-xs text-muted-foreground mt-1">Foto {idx + 1}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="videoUrl">URL do Vídeo (Recomendado)</Label>
                  <Input 
                    id="videoUrl" 
                    type="url"
                    placeholder="Ex: Link do YouTube, Google Drive ou Vimeo" 
                    value={formData.videoUrl}
                    onChange={(e) => handleInputChange("videoUrl", e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">Anúncios com vídeos do lote vendem 3x mais rápido!</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Observações / Descrição Detalhada</Label>
                  <Textarea 
                    id="description" 
                    placeholder="Descreva detalhes sobre manejo, sanidade, genética, etc." 
                    className="h-32"
                    value={formData.description}
                    onChange={(e) => handleInputChange("description", e.target.value)}
                  />
                </div>
              </div>

            </CardContent>
            <CardFooter className="flex justify-end gap-4 border-t p-6">
              <Button variant="outline" type="button" onClick={() => setLocation("/dashboard")}>Cancelar</Button>
              <Button type="submit" disabled={isSubmitting} className="w-32 font-bold">
                {isSubmitting ? "Enviando..." : "Publicar"}
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
}
