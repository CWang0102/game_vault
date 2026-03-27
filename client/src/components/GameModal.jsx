import { useState, useEffect, useRef, useCallback } from 'react';
import { X, Gamepad2 } from 'lucide-react';
import StarRating from './StarRating';
import styles from './GameModal.module.css';

const STATUS_OPTIONS = [
  { value: 'to_play', label: 'To Play' },
  { value: 'playing', label: 'Playing' },
  { value: 'completed', label: 'Completed' },
  { value: 'given_up', label: 'Given Up' },
];

export default function GameModal({ game, onSave, onClose }) {
  const [title, setTitle] = useState('');
  const [status, setStatus] = useState('to_play');
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [coverUrl, setCoverUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const debounceTimer = useRef(null);
  const wrapperRef = useRef(null);

  useEffect(() => {
    if (game) {
      setTitle(game.title || '');
      setStatus(game.status || 'to_play');
      setRating(game.rating || 0);
      setComment(game.comment || '');
      setCoverUrl(game.cover_url || '');
    }
  }, [game]);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(e) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const searchIGDB = useCallback(async (query) => {
    if (!query.trim()) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }
    try {
      const token = localStorage.getItem('token');
      console.log('[IGDB Search] Query:', query, 'Token exists:', !!token);
      const res = await fetch(`/api/igdb/search?q=${encodeURIComponent(query)}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      console.log('[IGDB Search] Response status:', res.status);
      if (!res.ok) return;
      const data = await res.json();
      console.log('[IGDB Search] Received games:', data.games?.length || 0);
      setSuggestions(data.games || []);
      setShowSuggestions(true);
    } catch (err) {
      console.error('[IGDB Search] Error:', err);
      // silently fail — search is non-critical
    }
  }, []);

  function handleTitleChange(e) {
    const value = e.target.value;
    setTitle(value);
    clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => searchIGDB(value), 350);
  }

  function handleSuggestionClick(suggestion) {
    setTitle(suggestion.name);
    setCoverUrl(suggestion.cover_url || '');
    setSuggestions([]);
    setShowSuggestions(false);
  }

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
        cover_url: coverUrl || null,
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          {coverUrl ? (
            <img src={coverUrl} alt="" className={styles.headerCover} />
          ) : (
            <div className={styles.headerIcon}>
              <Gamepad2 size={24} />
            </div>
          )}
          <h2 className={styles.title}>{game ? 'EDIT GAME' : 'ADD GAME'}</h2>
          <button onClick={onClose} className={styles.closeBtn}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          {error && <div className={styles.error}>{error}</div>}

          <div className={styles.field} ref={wrapperRef}>
            <label htmlFor="title">GAME TITLE</label>
            <div className={styles.autocompleteWrapper}>
              <input
                id="title"
                type="text"
                value={title}
                onChange={handleTitleChange}
                onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
                placeholder="The Legend of Zelda: Tears of the Kingdom"
                autoFocus
                autoComplete="off"
              />
              {showSuggestions && suggestions.length > 0 && (
                <ul className={styles.suggestions}>
                  {suggestions.map((suggestion) => (
                    <li
                      key={suggestion.name}
                      className={styles.suggestionItem}
                      onMouseDown={() => handleSuggestionClick(suggestion)}
                    >
                      {suggestion.cover_url ? (
                        <img
                          src={suggestion.cover_url.replace('t_cover_big', 't_thumb')}
                          alt=""
                          className={styles.suggestionCover}
                        />
                      ) : (
                        <div className={styles.suggestionCoverPlaceholder}>
                          <Gamepad2 size={16} />
                        </div>
                      )}
                      <span>{suggestion.name}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
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
