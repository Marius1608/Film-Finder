'use client';

import { Star } from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';

interface RatingStarsProps {
  rating: number;
  onRatingChange?: (rating: number) => void;
  readonly?: boolean;
  size?: 'sm' | 'md' | 'lg';
  maxStars?: number;
  className?: string;
  showValue?: boolean;
}

export default function RatingStars({ 
  rating, 
  onRatingChange, 
  readonly = false,
  size = 'md',
  maxStars = 5,
  className,
  showValue = true
}: RatingStarsProps) {
  const [hoverRating, setHoverRating] = useState(0);

  const getSizeClass = () => {
    switch (size) {
      case 'sm': return 'w-4 h-4';
      case 'lg': return 'w-8 h-8';
      default: return 'w-6 h-6';
    }
  };

  const handleMouseEnter = (starIndex: number) => {
    if (!readonly) setHoverRating(starIndex);
  };

  const handleMouseLeave = () => {
    if (!readonly) setHoverRating(0);
  };

  const handleClick = (starIndex: number) => {
    if (!readonly && onRatingChange) {
      // If clicking the same star as current rating, remove the rating
      const newRating = rating === starIndex ? 0 : starIndex;
      onRatingChange(newRating);
    }
  };

  const isStarFilled = (starIndex: number) => {
    if (hoverRating > 0) {
      return starIndex <= hoverRating;
    }
    return starIndex <= rating;
  };

  return (
    <div className={cn("flex items-center gap-1", className)}>
      {Array.from({ length: maxStars }, (_, i) => i + 1).map((star) => (
        <button
          key={star}
          className={`${!readonly && 'hover:scale-110'} transition-transform focus:outline-none`}
          onMouseEnter={() => handleMouseEnter(star)}
          onMouseLeave={handleMouseLeave}
          onClick={() => handleClick(star)}
          disabled={readonly}
          aria-label={`Rate ${star} out of ${maxStars} stars`}
          type="button"
        >
          <Star 
            className={`${getSizeClass()} ${
              isStarFilled(star) 
                ? 'fill-yellow-400 text-yellow-400' 
                : 'text-gray-300'
            }`}
          />
        </button>
      ))}
      {showValue && rating > 0 && (
        <span className="ml-2 text-sm text-gray-600">
          {rating.toFixed(1)}
        </span>
      )}
    </div>
  );
}