import { useState } from 'react';
import { Pencil, CheckCircle, Trophy, Clock, XCircle } from 'lucide-react';
import StarRating from './StarRating';
import styles from './GameCard.module.css';

const STATUS_CONFIG = {
  completed: { label: 'COMPLETED', color: 'var(--success)', icon: Trophy },
  to_play: { label: 'TO PLAY', color: 'var(--amber-glow)', icon: Clock },
  playing: { label: 'PLAYING', color: 'var(--amber-glow)', icon: Clock },
  given_up: { label: 'GIVEN UP', color: 'var(--danger)', icon: XCircle },
};

const STATUS_TRANSITIONS = {
  completed: 'to_play',
  to_play: 'playing',
  playing: 'completed',
  given_up: 'completed',
};

export default function GameCard({ game, onEdit, onDelete, onStatusChange, style }) {
  const [showActions, setShowActions] = useState(false);
  const config = STATUS_CONFIG[game.status];
  const StatusIcon = config.icon;

  function formatDate(dateStr) {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }

  return (
    <article
      className={`${styles.card} animate-fade-in-up`}
      style={{
        ...style,
        '--status-color': config.color,
        transform: `rotate(${(game.id % 5 - 2) * 0.3}deg)`,
      }}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      <div className={styles.statusBar} />

      {game.cover_url && (
        <div className={styles.coverWrapper}>
          <img src={game.cover_url} alt={game.title} className={styles.cover} />
        </div>
      )}

      <div className={styles.content}>
        <header className={styles.header}>
          <div className={styles.statusBadge} style={{ color: config.color }}>
            <StatusIcon size={12} />
            <span>{config.label}</span>
          </div>
          <div className={`${styles.actions} ${showActions ? styles.actionsVisible : ''}`}>
            {onEdit && (
              <button onClick={onEdit} className={styles.actionBtn} title="Edit">
                <Pencil size={14} />
              </button>
            )}
            {game.status !== 'given_up' && onStatusChange && (
              <button
                onClick={() => onStatusChange('given_up')}
                className={`${styles.actionBtn} ${styles.givenUpBtn}`}
                title="Give Up"
              >
                <XCircle size={14} />
              </button>
            )}
          </div>
        </header>

        <h3 className={styles.title}>{game.title}</h3>

        {game.rating && (
          <div className={styles.rating}>
            <StarRating rating={game.rating} readonly size={16} />
          </div>
        )}

        {game.comment && (
          <p className={styles.comment}>{game.comment}</p>
        )}

        <footer className={styles.footer}>
          <span className={styles.date}>Added {formatDate(game.created_at)}</span>
          {game.status === 'to_play' && onStatusChange && (
            <button
              onClick={() => onStatusChange('playing')}
              className={styles.completeBtn}
              title="Start Playing"
            >
              <span className={styles.statusBtnLabel}>PLAYING</span>
            </button>
          )}
          {game.status === 'playing' && onStatusChange && (
            <button
              onClick={() => onStatusChange('completed')}
              className={styles.completeBtn}
              title="Mark as Completed"
            >
              <span className={styles.statusBtnLabel}>COMPLETE</span>
            </button>
          )}
        </footer>
      </div>

      <div className={styles.cornerTL} />
      <div className={styles.cornerBR} />
    </article>
  );
}
