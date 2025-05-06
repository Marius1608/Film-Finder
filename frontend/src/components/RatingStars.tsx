import { useState, useEffect } from 'react';
import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';

interface RatingStarsProps {
  rating: number;
  onRatingChange?: (rating: number) => void;
  readonly?: boolean;
  size?: 'sm' | 'md' | 'lg';
  count?: number;
  className?: string;
  showValue?: boolean;
  precision?: 'half' | 'full';
  color?: string;
  emptyColor?: string;
  animated?: boolean;
}

const RatingStars = ({ 
  rating = 0, 
  onRatingChange, 
  readonly = false,
  size = 'md',
  count = 5,
  className = '',
  showValue = true,
  precision = 'full',
  color = 'text-yellow-400',
  emptyColor = 'text-gray-300',
  animated = true
}: RatingStarsProps) => {
  const [hoverRating, setHoverRating] = useState(0);
  const [displayRating, setDisplayRating] = useState(rating);

  // Update internal state when prop changes
  useEffect(() => {
    setDisplayRating(rating);
  }, [rating]);

  const getSizeClass = () => {
    switch (size) {
      case 'sm': return 'w-4 h-4';
      case 'lg': return 'w-8 h-8';
      default: return 'w-6 h-6';
    }
  };

  const isStarFilled = (starIndex: number) => {
    const value = hoverRating > 0 ? hoverRating : displayRating;
    
    if (precision === 'half') {
      return starIndex <= Math.floor(value) || 
             (starIndex === Math.ceil(value) && value % 1 >= 0.5);
    }
    
    return starIndex <= value;
  };

  const isStarHalfFilled = (starIndex: number) => {
    if (precision !== 'half') return false;
    
    const value = hoverRating > 0 ? hoverRating : displayRating;
    return starIndex === Math.ceil(value) && value % 1 > 0 && value % 1 < 0.5;
  };

  const getRatingValue = (starIndex: number, event: React.MouseEvent) => {
    if (precision === 'half') {
      const rect = (event.target as HTMLElement).getBoundingClientRect();
      const halfPoint = rect.left + rect.width / 2;
      return event.clientX < halfPoint ? starIndex - 0.5 : starIndex;
    }
    return starIndex;
  };

  return (
    <div className={cn("flex items-center", className)}>
      <div className="flex gap-1">
        {Array.from({ length: count }, (_, i) => i + 1).map((starIndex) => (
          <button
            key={starIndex}
            type="button"
            className={cn(
              "focus:outline-none transition-transform", 
              !readonly && animated && "hover:scale-110",
              "disabled:cursor-not-allowed"
            )}
            onMouseEnter={() => !readonly && setHoverRating(starIndex)}
            onMouseMove={(e) => {
              if (readonly || precision === 'full') return;
              const value = getRatingValue(starIndex, e);
              if (value !== hoverRating) {
                setHoverRating(value);
              }
            }}
            onMouseLeave={() => !readonly && setHoverRating(0)}
            onClick={(e) => {
              if (readonly || !onRatingChange) return;
              const value = getRatingValue(starIndex, e);
              onRatingChange(value);
              setDisplayRating(value);
            }}
            disabled={readonly}
            aria-label={`Rate ${starIndex} out of ${count}`}
          >
            <Star 
              className={cn(
                getSizeClass(),
                isStarFilled(starIndex) 
                  ? `fill-current ${color} ${color}` 
                  : isStarHalfFilled(starIndex)
                    ? `fill-current ${color} ${color}`
                    : emptyColor,
                "transition-colors"
              )}
              style={
                isStarHalfFilled(starIndex) 
                  ? { clipPath: 'inset(0 50% 0 0)' } 
                  : undefined
              }
            />
          </button>
        ))}
      </div>
      
      {showValue && displayRating > 0 && (
        <span className="ml-2 text-sm font-medium text-gray-600">
          {displayRating.toFixed(precision === 'half' ? 1 : 0)}
        </span>
      )}
    </div>
  );
};

export default RatingStars;