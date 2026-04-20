import { useEffect, useState } from "react";
import { StarRating } from "@/components/ui/star-rating";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Review {
  id: string;
  buyerId: string;
  sellerId: string;
  adId: string;
  rating: number;
  comment: string | null;
  createdAt: string;
  buyer?: {
    name: string;
    avatar?: string;
  };
}

interface ReviewListProps {
  sellerId: string;
  showTitle?: boolean;
}

export function ReviewList({ sellerId, showTitle = true }: ReviewListProps) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [avgRating, setAvgRating] = useState(0);

  useEffect(() => {
    const fetchReviews = async () => {
      try {
        const [reviewsRes, ratingRes] = await Promise.all([
          fetch(`/api/sellers/${sellerId}/reviews`),
          fetch(`/api/sellers/${sellerId}/average-rating`),
        ]);

        if (reviewsRes.ok) {
          const data = await reviewsRes.json();
          setReviews(data.data || []);
        }

        if (ratingRes.ok) {
          const data = await ratingRes.json();
          setAvgRating(data.averageRating || 0);
        }
      } catch (error) {
        console.error("Failed to fetch reviews:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchReviews();
  }, [sellerId]);

  if (loading) {
    return (
      <div className="animate-pulse space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-24 bg-muted rounded-lg" />
        ))}
      </div>
    );
  }

  return (
    <Card>
      {showTitle && (
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-serif">Avaliações</CardTitle>
            <div className="flex items-center gap-2">
              <StarRating rating={avgRating} size="sm" showValue />
              <span className="text-sm text-muted-foreground">
                ({reviews.length})
              </span>
            </div>
          </div>
        </CardHeader>
      )}
      <CardContent className="space-y-4">
        {reviews.length === 0 ? (
          <p className="text-center text-muted-foreground py-6">
            Este vendedor ainda não possui avaliações.
          </p>
        ) : (
          reviews.map((review) => (
            <div
              key={review.id}
              className="flex gap-3 pb-4 border-b last:border-0 last:pb-0"
              data-testid={`review-${review.id}`}
            >
              <Avatar className="h-10 w-10">
                <AvatarImage
                  src={
                    review.buyer?.avatar ||
                    `https://api.dicebear.com/7.x/avataaars/svg?seed=${review.buyerId}`
                  }
                />
                <AvatarFallback>
                  {review.buyer?.name?.substring(0, 2).toUpperCase() || "U"}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-medium text-sm">
                    {review.buyer?.name || "Usuário"}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(review.createdAt), {
                      addSuffix: true,
                      locale: ptBR,
                    })}
                  </span>
                </div>
                <StarRating rating={review.rating} size="sm" />
                {review.comment && (
                  <p className="text-sm text-muted-foreground mt-2">
                    {review.comment}
                  </p>
                )}
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
