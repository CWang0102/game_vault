import { useEffect, useState } from 'react';
import { X, Trophy, XCircle } from 'lucide-react';
import StarRating from './StarRating';
import styles from './StatusConfirmModal.module.css';

const STATUS_DISPLAY = {
  completed: { label: 'MARK AS COMPLETED', color: 'var(--success)', Icon: Trophy },
  given_up: { label: 'GIVE UP ON GAME', color: 'var(--danger)', Icon: XCircle },
};

export default function StatusConfirmModal({ game, newStatus, onConfirm, onCancel }) {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const { label, color, Icon } = STATUS_DISPLAY[newStatus];

  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === 'Escape') onCancel();
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onCancel]);

  function handleConfirm() {
    onConfirm({ rating: rating || null, comment });
  }

  return (
    <div className={styles.overlay} onClick={onCancel}>
      <div
        className={styles.modal}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="scm-title"
      >
        <div className={styles.header} style={{ '--status-color': color }}>
          <div className={styles.statusIcon}>
            <Icon size={20} />
          </div>
          <h2 className={styles.title} id="scm-title">{label}</h2>
          <button onClick={onCancel} className={styles.closeBtn} aria-label="Cancel">
            <X size={20} />
          </button>
        </div>

        <div className={styles.gameContext}>
          {game.cover_url ? (
            <img src={game.cover_url} alt="" className={styles.cover} />
          ) : (
            <div className={styles.coverPlaceholder} />
          )}
          <span className={styles.gameTitle}>{game.title}</span>
        </div>

        <div className={styles.body}>
          <div className={styles.field}>
            <label className={styles.fieldLabel}>RATING (OPTIONAL)</label>
            <div className={styles.ratingRow}>
              <StarRating rating={rating} onChange={setRating} size={28} />
              {rating > 0 && (
                <span className={styles.ratingLabel}>{rating} / 5</span>
              )}
            </div>
          </div>

          <div className={styles.field}>
            <label className={styles.fieldLabel} htmlFor="scm-comment">
              YOUR THOUGHTS (OPTIONAL)
            </label>
            <textarea
              id="scm-comment"
              className={styles.textarea}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Any memorable moments, notes, or reflections..."
              rows={4}
            />
          </div>
        </div>

        <div className={styles.actions}>
          <button onClick={onCancel} className={styles.cancelBtn}>
            CANCEL
          </button>
          <button
            onClick={handleConfirm}
            className={styles.confirmBtn}
            style={{ '--btn-color': color }}
          >
            CONFIRM
          </button>
        </div>
      </div>
    </div>
  );
}
