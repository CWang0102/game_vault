import { useEffect, useRef, useState } from 'react';
import { Star } from 'lucide-react';
import styles from './StarRating.module.css';

const STAR_VALUES = [1, 2, 3, 4, 5];
const GHOST_CLICK_GUARD_MS = 500;

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function fillFractionFor(rating, starValue) {
  // Round first to absorb floating point noise (e.g. 3.4 - 3 === 0.39999999999999997).
  const fraction = Math.round((rating - (starValue - 1)) * 10) / 10;
  if (fraction <= 0) return 0;
  if (fraction >= 1) return 1;
  return fraction;
}

function rawFillFractionFor(rawRating, starValue) {
  return clamp(rawRating - (starValue - 1), 0, 1);
}

function rawValueFromClientX(clientX, rect) {
  const fraction = clamp((clientX - rect.left) / rect.width, 0, 1);
  return fraction * STAR_VALUES.length;
}

function quantizeToDecile(raw) {
  const starIndex = Math.min(STAR_VALUES.length - 1, Math.floor(raw));
  const withinStarFraction = raw - starIndex;
  const decile = Math.min(9, Math.floor(withinStarFraction * 10));
  const value = starIndex + (decile + 1) / 10;
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
  const [hoverRawRating, setHoverRawRating] = useState(0);
  const [hovering, setHovering] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const containerRef = useRef(null);
  const containerRectRef = useRef(null);
  const latestQuantizedRef = useRef(0);
  const rafRef = useRef(null);
  const pendingPreviewRef = useRef(null);
  const recentTouchRef = useRef(0);

  function schedulePreviewUpdate(raw) {
    const quantized = quantizeToDecile(raw);
    latestQuantizedRef.current = quantized;
    pendingPreviewRef.current = { raw, quantized };
    if (rafRef.current) return;
    rafRef.current = requestAnimationFrame(() => {
      rafRef.current = null;
      const pending = pendingPreviewRef.current;
      if (!pending) return;
      setHoverRawRating(pending.raw);
      setHoverRating(pending.quantized);
      setHovering(true);
    });
  }

  function beginDrag(clientX) {
    containerRectRef.current = containerRef.current.getBoundingClientRect();
    schedulePreviewUpdate(rawValueFromClientX(clientX, containerRectRef.current));
    setIsDragging(true);
  }

  function handleContainerMouseDown(e) {
    if (readonly || !onChange) return;
    // Mobile browsers fire a synthetic mousedown/click shortly after a real
    // touch interaction; ignore it so a tap-drag doesn't double-commit.
    if (Date.now() - recentTouchRef.current < GHOST_CLICK_GUARD_MS) return;
    beginDrag(e.clientX);
  }

  function handleContainerTouchStart(e) {
    if (readonly || !onChange) return;
    recentTouchRef.current = Date.now();
    beginDrag(e.touches[0].clientX);
  }

  function handleContainerMouseMove(e) {
    if (readonly || isDragging) return;
    if (!containerRectRef.current) {
      containerRectRef.current = containerRef.current.getBoundingClientRect();
    }
    schedulePreviewUpdate(rawValueFromClientX(e.clientX, containerRectRef.current));
  }

  function handleContainerMouseLeave() {
    if (isDragging) return;
    setHovering(false);
    setHoverRating(0);
    setHoverRawRating(0);
    containerRectRef.current = null;
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
  }

  function handleClick(e, starValue) {
    if (readonly || !onChange) return;
    // Keyboard activation (Enter/Space) fires a click with no pointer position.
    // Real mouse clicks are committed via the mousedown/mouseup drag handlers
    // below, so a click with pointer info is ignored here.
    if (e.detail !== 0) return;
    onChange(starValue === rating ? 0 : starValue);
  }

  useEffect(() => {
    if (!isDragging) return undefined;

    function handleDocumentMouseMove(e) {
      if (!containerRectRef.current) return;
      schedulePreviewUpdate(rawValueFromClientX(e.clientX, containerRectRef.current));
    }

    function handleDocumentTouchMove(e) {
      if (!containerRectRef.current) return;
      schedulePreviewUpdate(rawValueFromClientX(e.touches[0].clientX, containerRectRef.current));
    }

    function commitDrag() {
      const finalValue = latestQuantizedRef.current;
      const nextRating = finalValue === rating ? 0 : finalValue;
      onChange(nextRating);
      // Cancel any in-flight preview flush so it can't overwrite the
      // resynced values below with the stale pre-commit pointer position.
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
      setHoverRawRating(nextRating);
      setHoverRating(nextRating);
      setIsDragging(false);
    }

    document.addEventListener('mousemove', handleDocumentMouseMove);
    document.addEventListener('mouseup', commitDrag);
    document.addEventListener('touchmove', handleDocumentTouchMove);
    document.addEventListener('touchend', commitDrag);
    return () => {
      document.removeEventListener('mousemove', handleDocumentMouseMove);
      document.removeEventListener('mouseup', commitDrag);
      document.removeEventListener('touchmove', handleDocumentTouchMove);
      document.removeEventListener('touchend', commitDrag);
    };
  }, [isDragging, rating, onChange]);

  useEffect(() => {
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  const displayRating = hovering ? hoverRating : rating;

  return (
    <div className={styles.wrapper}>
      <div
        ref={containerRef}
        data-testid="star-rating-container"
        className={`${styles.container} ${readonly ? styles.readonly : ''} ${isDragging ? styles.dragging : ''}`}
        onMouseDown={handleContainerMouseDown}
        onTouchStart={handleContainerTouchStart}
        onMouseMove={handleContainerMouseMove}
        onMouseLeave={handleContainerMouseLeave}
      >
        {STAR_VALUES.map((value) => {
          const fraction = hovering
            ? rawFillFractionFor(hoverRawRating, value)
            : fillFractionFor(rating, value);
          return (
            <button
              key={value}
              type="button"
              className={styles.star}
              onClick={(e) => handleClick(e, value)}
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
          {displayRating.toFixed(1)} / 5
        </span>
      )}
    </div>
  );
}
