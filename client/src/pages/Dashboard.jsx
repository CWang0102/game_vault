import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth, API_BASE } from '../context/AuthContext';
import GameCard from '../components/GameCard';
import GameModal from '../components/GameModal';
import Toast from '../components/Toast';
import { Plus, LogOut, Gamepad2, Search, Trophy, Clock, XCircle, Shield } from 'lucide-react';
import styles from './Dashboard.module.css';

const STATUS_LABELS = {
  all: 'ALL',
  completed: 'COMPLETED',
  to_play: 'TO PLAY',
  given_up: 'GIVEN UP',
  playing: 'PLAYING',
};

const STATUS_COUNTS_INITIAL = { all: 0, completed: 0, to_play: 0, given_up: 0, playing: 0 };

export default function Dashboard() {
  const { user, logout, token, isRoot } = useAuth();
  const [games, setGames] = useState([]);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingGame, setEditingGame] = useState(null);
  const [toasts, setToasts] = useState([]);
  const [statusCounts, setStatusCounts] = useState(STATUS_COUNTS_INITIAL);

  const fetchGames = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (filter !== 'all') params.set('status', filter);
      if (search) params.set('search', search);

      const res = await fetch(`${API_BASE}/games?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setGames(data.games);

      const counts = { all: data.games.length, completed: 0, to_play: 0, given_up: 0, playing: 0 };
      data.games.forEach((g) => {
        if (g.status === 'completed') counts.completed++;
        else if (g.status === 'to_play') counts.to_play++;
        else if (g.status === 'given_up') counts.given_up++;
        else if (g.status === 'playing') counts.playing++;
      });
      setStatusCounts((prev) => ({ ...prev, ...counts, all: data.games.length }));
    } catch (err) {
      showToast('Failed to load games', 'error');
    } finally {
      setLoading(false);
    }
  }, [token, filter, search]);

  useEffect(() => {
    fetchGames();
  }, [fetchGames]);

  function showToast(message, type = 'success') {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3000);
  }

  async function handleSaveGame(gameData) {
    try {
      const method = editingGame ? 'PUT' : 'POST';
      const url = editingGame ? `${API_BASE}/games/${editingGame.id}` : `${API_BASE}/games`;

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(gameData),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to save game');
      }

      showToast(editingGame ? 'Game updated!' : 'Game added to vault!');
      setModalOpen(false);
      setEditingGame(null);
      fetchGames();
    } catch (err) {
      showToast(err.message, 'error');
    }
  }

  async function handleDeleteGame(id) {
    if (!confirm('Remove this game from your vault?')) return;

    try {
      const res = await fetch(`${API_BASE}/games/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed to delete');
      showToast('Game removed from vault');
      fetchGames();
    } catch (err) {
      showToast(err.message, 'error');
    }
  }

  async function handleStatusChange(id, newStatus) {
    try {
      const res = await fetch(`${API_BASE}/games/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) throw new Error('Failed to update status');
      showToast(`Status updated to ${STATUS_LABELS[newStatus]}`);
      fetchGames();
    } catch (err) {
      showToast(err.message, 'error');
    }
  }

  function openEditModal(game) {
    setEditingGame(game);
    setModalOpen(true);
  }

  function openAddModal() {
    setEditingGame(null);
    setModalOpen(true);
  }

  const completionRate = statusCounts.completed
    ? Math.round((statusCounts.completed / statusCounts.all) * 100)
    : 0;

  const avgRating =
    games.filter((g) => g.rating).length > 0
      ? (games.reduce((sum, g) => sum + (g.rating || 0), 0) / games.filter((g) => g.rating).length).toFixed(1)
      : '—';

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.headerLeft}>
          <Gamepad2 size={32} className={styles.logo} />
          <h1 className={styles.title}>GAME VAULT</h1>
        </div>
        <div className={styles.headerRight}>
          {isRoot && (
            <Link to="/admin" className={styles.adminLink}>
              <Shield size={16} />
              ADMIN
            </Link>
          )}
          <span className={styles.userEmail}>{user?.email}</span>
          <button onClick={logout} className={styles.logoutBtn} title="Sign out">
            <LogOut size={20} />
          </button>
        </div>
      </header>

      <div className={styles.stats}>
        <div className={styles.statItem}>
          <Trophy size={18} className={styles.statIcon} />
          <span className={styles.statValue}>{statusCounts.all}</span>
          <span className={styles.statLabel}>TOTAL</span>
        </div>
        <div className={styles.statItem}>
          <span className={styles.statValue}>{completionRate}%</span>
          <span className={styles.statLabel}>COMPLETED</span>
        </div>
        <div className={styles.statItem}>
          <span className={styles.statValue}>{avgRating}</span>
          <span className={styles.statLabel}>AVG RATING</span>
        </div>
      </div>

      <nav className={styles.filters}>
        <div className={styles.tabs}>
          {Object.entries(STATUS_LABELS).map(([key, label]) => (
            <button
              key={key}
              className={`${styles.tab} ${filter === key ? styles.tabActive : ''}`}
              onClick={() => setFilter(key)}
            >
              {label}
              {statusCounts[key] > 0 && (
                <span className={styles.tabCount}>{statusCounts[key]}</span>
              )}
            </button>
          ))}
        </div>
        <div className={styles.searchWrapper}>
          <Search size={18} className={styles.searchIcon} />
          <input
            type="text"
            placeholder="Search games..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className={styles.searchInput}
          />
          {search && (
            <button onClick={() => setSearch('')} className={styles.searchClear}>
              <XCircle size={16} />
            </button>
          )}
        </div>
      </nav>

      <main className={styles.main}>
        {loading ? (
          <div className={styles.loading}>
            <div className={styles.loadingText}>LOADING VAULT...</div>
          </div>
        ) : games.length === 0 ? (
          <div className={styles.empty}>
            <svg
              width="120"
              height="120"
              viewBox="0 0 120 120"
              fill="none"
              className={styles.emptySvg}
            >
              <rect x="20" y="40" width="80" height="50" rx="4" stroke="currentColor" strokeWidth="2" />
              <rect x="30" y="50" width="25" height="25" rx="2" stroke="currentColor" strokeWidth="2" />
              <circle cx="80" cy="62" r="12" stroke="currentColor" strokeWidth="2" />
              <circle cx="80" cy="62" r="4" fill="currentColor" />
              <rect x="60" y="82" width="20" height="8" rx="2" stroke="currentColor" strokeWidth="2" />
              <line x1="35" y1="35" x2="85" y2="35" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              <line x1="40" y1="30" x2="40" y2="40" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              <line x1="80" y1="30" x2="80" y2="40" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
            <h3 className={styles.emptyTitle}>Your vault is empty</h3>
            <p className={styles.emptyText}>
              {search
                ? 'No games match your search'
                : filter === 'all'
                ? 'Add your first game to start building your collection'
                : `No games marked as ${STATUS_LABELS[filter].toLowerCase()}`}
            </p>
            {!search && filter === 'all' && isRoot && (
              <button onClick={openAddModal} className={styles.emptyBtn}>
                <Plus size={18} />
                ADD YOUR FIRST GAME
              </button>
            )}
          </div>
        ) : (
          <div className={styles.grid}>
            {games.map((game, index) => (
              <GameCard
                key={game.id}
                game={game}
                onEdit={isRoot ? () => openEditModal(game) : undefined}
                onDelete={isRoot ? () => handleDeleteGame(game.id) : undefined}
                onStatusChange={isRoot ? (status) => handleStatusChange(game.id, status) : undefined}
                style={{ animationDelay: `${index * 50}ms` }}
              />
            ))}
          </div>
        )}
      </main>

      {isRoot && (
        <button onClick={openAddModal} className={styles.fab} title="Add game">
          <Plus size={28} />
        </button>
      )}

      {modalOpen && (
        <GameModal
          game={editingGame}
          onSave={handleSaveGame}
          onClose={() => {
            setModalOpen(false);
            setEditingGame(null);
          }}
        />
      )}

      <div className={styles.toastContainer}>
        {toasts.map((toast) => (
          <Toast key={toast.id} message={toast.message} type={toast.type} />
        ))}
      </div>

      <footer className={styles.footer}>
        <Clock size={14} />
        <span>Your collection, your rules</span>
      </footer>
    </div>
  );
}
