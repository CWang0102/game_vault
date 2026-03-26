import { useState } from 'react';
import { Star } from 'lucide-react';
import styles from './StarRating.module.css';

export default function StarRating({
  rating = 0,
  onChange,
  readonly = false,
  size = 20,
}) {
  const [hoverRating, setHoverRating] = useState(0);

  function handleClick(value) {
    if (!readonly && onChange) {
      onChange(value === rating ? 0 : value);
    }
  }

  function handleMouseEnter(value) {
    if (!readonly) {
      setHoverRating(value);
    }
  }

  function handleMouseLeave() {
    setHoverRating(0);
  }

  const displayRating = hoverRating || rating;

  return (
    <div
      className={`${styles.container} ${readonly ? styles.readonly : ''}`}
      onMouseLeave={handleMouseLeave}
    >
      {[1, 2, 3, 4, 5].map((value) => (
        <button
          key={value}
          type="button"
          className={`${styles.star} ${value <= displayRating ? styles.filled : ''}`}
          onClick={() => handleClick(value)}
          onMouseEnter={() => handleMouseEnter(value)}
          disabled={readonly}
          style={{ '--star-size': `${size}px` }}
        >
          <Star
            size={size}
            fill={value <= displayRating ? 'currentColor' : 'none'}
            strokeWidth={1.5}
          />
        </button>
      ))}
    </div>
  );
}
