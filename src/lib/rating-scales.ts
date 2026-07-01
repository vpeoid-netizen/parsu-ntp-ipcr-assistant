export function ipcrRatingHealthColor(rating: number): string {
  if (rating > 4) return "bg-green-500";
  if (rating > 3) return "bg-yellow-500";
  return "bg-red-500";
}

export function ratingHealthColor(rating: number): string {
  if (rating >= 4.5) return "bg-blue-600";
  if (rating >= 4) return "bg-blue-500";
  if (rating >= 3) return "bg-sky-500";
  if (rating >= 2) return "bg-amber-500";
  if (rating > 0) return "bg-orange-500";
  return "bg-muted";
}

export function ratingHealthPercent(rating: number): number {
  if (rating <= 0) return 0;
  return Math.min(100, (rating / 5) * 100);
}
