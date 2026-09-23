import { useState } from 'react';
import { Star } from 'lucide-react';
import styles from './StarRating.module.css';

const STAR_VALUES = [1, 2, 3, 4, 5];

function fillFractionFor(rating, starValue) {
  // Round first to absorb floating point noise (e.g. 3.4 - 3 === 0.39999999999999997).
  const fraction = Math.round((rating - (starValue - 1)) * 10) / 10;
  if (fraction <= 0) return 0;
  if (fraction >= 1) return 1;
  return fraction;
}

function valueFromPointer(e, starValue) {
  const rect = e.currentTarget.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const fraction = Math.min(Math.max(x / rect.width, 0), 1);
  const decile = Math.min(9, Math.floor(fraction * 10));
  const value = (starValue - 1) + (decile + 1) / 10;
  return Math.round(value * 10) / 10;
}

export default function StarRating({
  rating = 0,
  onChange,
  readonly = false,
  size = 20,
  showValue = false,
}) {
  const [hoverRating, setHoverRating] = useState(0);
  const [hovering, setHovering] = useState(false);

  function handleMouseMove(e, starValue) {
    if (readonly) return;
    setHoverRating(valueFromPointer(e, starValue));
    setHovering(true);
  }

  function handleClick(e, starValue) {
    if (readonly || !onChange) return;
    // Keyboard activation (Enter/Space) fires a click with no pointer position,
    // so fall back to selecting the whole star in that case.
    const value = e.detail === 0 ? starValue : valueFromPointer(e, starValue);
    onChange(value === rating ? 0 : value);
  }

  function handleMouseLeave() {
    setHovering(false);
    setHoverRating(0);
  }

  const displayRating = hovering ? hoverRating : rating;

  return (
    <div className={styles.wrapper}>
      <div
        className={`${styles.container} ${readonly ? styles.readonly : ''}`}
        onMouseLeave={handleMouseLeave}
      >
        {STAR_VALUES.map((value) => {
          const fraction = fillFractionFor(displayRating, value);
          return (
            <button
              key={value}
              type="button"
              className={styles.star}
              onClick={(e) => handleClick(e, value)}
              onMouseMove={(e) => handleMouseMove(e, value)}
              disabled={readonly}
              style={{ '--star-size': `${size}px` }}
            >
              <span className={styles.starTrack}>
                <Star size={size} strokeWidth={1.5} className={styles.starBase} />
                <span
                  className={styles.starFillClip}
                  style={{ width: `${fraction * 100}%` }}
                  data-fill-wrapper
                >
                  <Star size={size} strokeWidth={1.5} fill="currentColor" className={styles.starFill} />
                </span>
              </span>
            </button>
          );
        })}
      </div>
      {showValue && (
        <span className={styles.value} data-testid="rating-value">
          {displayRating > 0 ? `${displayRating.toFixed(1)} / 5` : '—'}
        </span>
      )}
    </div>
  );
}
