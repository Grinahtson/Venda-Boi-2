import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { StarRating } from "@/components/ui/star-rating";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Send } from "lucide-react";
import { toast } from "sonner";

interface ReviewFormProps {
  sellerId: string;
  adId: string;
  sellerName: string;
  onSuccess?: () => void;
}

export function ReviewForm({ sellerId, adId, sellerName, onSuccess }: ReviewFormProps) {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (rating === 0) {
      toast.error("Por favor, selecione uma avaliação de 1 a 5 estrelas");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          sellerId,
          adId,
          rating,
          comment: comment.trim() || null,
        }),
      });

      if (response.ok) {
        toast.success("Avaliação enviada com sucesso!");
        setRating(0);
        setComment("");
        onSuccess?.();
      } else {
        const data = await response.json();
        toast.error(data.message || "Erro ao enviar avaliação");
      }
    } catch (error) {
      toast.error("Erro ao enviar avaliação");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="border-primary/20">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-serif">Avaliar {sellerName}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-2 block">Sua avaliação</label>
            <StarRating
              rating={rating}
              interactive
              onRatingChange={setRating}
              size="lg"
            />
          </div>
          
          <div>
            <label className="text-sm font-medium mb-2 block">
              Comentário (opcional)
            </label>
            <Textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Conte sua experiência com este vendedor..."
              rows={3}
              className="resize-none"
              data-testid="input-review-comment"
            />
          </div>

          <Button
            type="submit"
            disabled={loading || rating === 0}
            className="w-full"
            data-testid="button-submit-review"
          >
            <Send className="h-4 w-4 mr-2" />
            {loading ? "Enviando..." : "Enviar Avaliação"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
