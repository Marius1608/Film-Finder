// components/common/RatingStars.jsx
import React from 'react';

const RatingStars = ({ rating, maxStars = 5, size = 'md', editable = false, onChange }) => {
  const fullStars = Math.floor(rating);
  const hasHalfStar = rating % 1 >= 0.5;
  
  const sizeClasses = {
    sm: 'w-3 h-3',
    md: 'w-5 h-5',
    lg: 'w-6 h-6'
  };
  
  const starSize = sizeClasses[size] || sizeClasses.md;
  
  const handleClick = (index) => {
    if (editable && onChange) {
      onChange(index + 1);
    }
  };
  
  return (
    <div className="flex items-center">
      {[...Array(maxStars)].map((_, i) => (
        <span 
          key={i} 
          className={`${editable ? 'cursor-pointer' : ''} mr-0.5`}
          onClick={() => handleClick(i)}
        >
          {i < fullStars ? (
           
            <svg xmlns="http://www.w3.org/2000/svg" className={starSize} viewBox="0 0 20 20" fill="#FBBF24">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
          ) : i === fullStars && hasHalfStar ? (
            
            <svg xmlns="http://www.w3.org/2000/svg" className={starSize} viewBox="0 0 20 20" fill="#FBBF24">
              <defs>
                <linearGradient id="half-star" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="50%" stopColor="#FBBF24" />
                  <stop offset="50%" stopColor="#E5E7EB" />
                </linearGradient>
              </defs>
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" fill="url(#half-star)" />
            </svg>
          ) : (
            
            <svg xmlns="http://www.w3.org/2000/svg" className={starSize} viewBox="0 0 20 20" fill="#E5E7EB">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
          )}
        </span>
      ))}
    </div>
  );
};

export default RatingStars;