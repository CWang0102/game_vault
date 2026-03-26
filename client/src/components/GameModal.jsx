import { useState, useEffect } from 'react';
import { X, Gamepad2 } from 'lucide-react';
import StarRating from './StarRating';
import styles from './GameModal.module.css';

const STATUS_OPTIONS = [
  { value: 'to_play', label: 'To Play' },
  { value: 'completed', label: 'Completed' },
  { value: 'given_up', label: 'Given Up' },
];

export default function GameModal({ game, onSave, onClose }) {
  const [title, setTitle] = useState('');
  const [status, setStatus] = useState('to_play');
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (game) {
      setTitle(game.title || '');
      setStatus(game.status || 'to_play');
      setRating(game.rating || 0);
      setComment(game.comment || '');
    }
  }, [game]);

  useEffect(() => {
    function handleEsc(e) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    if (!title.trim()) {
      setError('Game title is required');
      return;
    }

    setLoading(true);

    try {
      await onSave({
        title: title.trim(),
        status,
        rating: rating || null,
        comment: comment.trim() || null,
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <div className={styles.headerIcon}>
            <Gamepad2 size={24} />
          </div>
          <h2 className={styles.title}>{game ? 'EDIT GAME' : 'ADD GAME'}</h2>
          <button onClick={onClose} className={styles.closeBtn}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          {error && <div className={styles.error}>{error}</div>}

          <div className={styles.field}>
            <label htmlFor="title">GAME TITLE</label>
            <input
              id="title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="The Legend of Zelda: Tears of the Kingdom"
              autoFocus
            />
          </div>

          <div className={styles.field}>
            <label htmlFor="status">STATUS</label>
            <div className={styles.selectWrapper}>
              <select
                id="status"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
              >
                {STATUS_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className={styles.field}>
            <label>RATING</label>
            <div className={styles.ratingWrapper}>
              <StarRating rating={rating} onChange={setRating} size={28} />
              {rating > 0 && (
                <span className={styles.ratingLabel}>{rating} / 5</span>
              )}
            </div>
          </div>

          <div className={styles.field}>
            <label htmlFor="comment">YOUR THOUGHTS</label>
            <textarea
              id="comment"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="What did you think? Any memorable moments, recommendations, or warnings?"
              rows={4}
            />
          </div>

          <div className={styles.actions}>
            <button type="button" onClick={onClose} className={styles.cancelBtn}>
              CANCEL
            </button>
            <button type="submit" className={styles.saveBtn} disabled={loading}>
              {loading ? 'SAVING...' : game ? 'UPDATE GAME' : 'ADD TO VAULT'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
