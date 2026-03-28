import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth, API_BASE } from '../context/AuthContext';
import GameCard from '../components/GameCard';
import GameModal from '../components/GameModal';
import Toast from '../components/Toast';
import { Plus, LogOut, Gamepad2, Search, Trophy, Shield, Users, Crown } from 'lucide-react';
import styles from './Admin.module.css';

export default function Admin() {
  const { user, logout, token } = useAuth();
  const [activeTab, setActiveTab] = useState('games');
  const [games, setGames] = useState([]);
  const [users, setUsers] = useState([]);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingGame, setEditingGame] = useState(null);
  const [toasts, setToasts] = useState([]);

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
    } catch (err) {
      showToast('Failed to load games', 'error');
    } finally {
      setLoading(false);
    }
  }, [token, filter, search]);

  const fetchUsers = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/users`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setUsers(data.users);
    } catch (err) {
      showToast('Failed to load users', 'error');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (activeTab === 'games') {
      fetchGames();
    } else {
      fetchUsers();
    }
  }, [activeTab, fetchGames, fetchUsers]);

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

      showToast(editingGame ? 'Game updated!' : 'Game added!');
      setModalOpen(false);
      setEditingGame(null);
      fetchGames();
    } catch (err) {
      showToast(err.message, 'error');
    }
  }

  async function handleDeleteGame(id) {
    if (!confirm('Remove this game from the vault?')) return;

    try {
      const res = await fetch(`${API_BASE}/games/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed to delete');
      showToast('Game removed');
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
      showToast(`Status updated`);
      fetchGames();
    } catch (err) {
      showToast(err.message, 'error');
    }
  }

  async function handlePromoteToRoot(id) {
    try {
      const res = await fetch(`${API_BASE}/users/${id}/role`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ role: 'root' }),
      });
      if (!res.ok) throw new Error('Failed to promote');
      showToast('User promoted to root');
      fetchUsers();
    } catch (err) {
      showToast(err.message, 'error');
    }
  }

  async function handleDemoteToUser(id) {
    try {
      const res = await fetch(`${API_BASE}/users/${id}/role`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ role: 'user' }),
      });
      if (!res.ok) throw new Error('Failed to demote');
      showToast('User demoted to user');
      fetchUsers();
    } catch (err) {
      showToast(err.message, 'error');
    }
  }

  async function handleApprove(id) {
    try {
      const res = await fetch(`${API_BASE}/users/${id}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: 'approved' }),
      });
      if (!res.ok) throw new Error('Failed to approve');
      showToast('User approved');
      fetchUsers();
    } catch (err) {
      showToast(err.message, 'error');
    }
  }

  async function handleReject(id) {
    try {
      const res = await fetch(`${API_BASE}/users/${id}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: 'rejected' }),
      });
      if (!res.ok) throw new Error('Failed to reject');
      showToast('User rejected');
      fetchUsers();
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

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.headerLeft}>
          <Shield size={28} className={styles.adminIcon} />
          <h1 className={styles.title}>ADMIN PANEL</h1>
        </div>
        <div className={styles.headerRight}>
          <Link to="/" className={styles.backLink}>
            <Gamepad2 size={16} />
            BACK TO VAULT
          </Link>
          <span className={styles.userEmail}>{user?.email}</span>
          <button onClick={logout} className={styles.logoutBtn} title="Sign out">
            <LogOut size={20} />
          </button>
        </div>
      </header>

      <nav className={styles.tabs}>
        <button
          className={`${styles.tab} ${activeTab === 'games' ? styles.tabActive : ''}`}
          onClick={() => setActiveTab('games')}
        >
          <Trophy size={16} />
          GAMES
        </button>
        <button
          className={`${styles.tab} ${activeTab === 'users' ? styles.tabActive : ''}`}
          onClick={() => setActiveTab('users')}
        >
          <Users size={16} />
          USERS
        </button>
      </nav>

      <main className={styles.main}>
        {activeTab === 'games' ? (
          <>
            <div className={styles.gamesHeader}>
              <div className={styles.searchWrapper}>
                <Search size={18} className={styles.searchIcon} />
                <input
                  type="text"
                  placeholder="Search games..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className={styles.searchInput}
                />
              </div>
              <button onClick={openAddModal} className={styles.addBtn}>
                <Plus size={18} />
                ADD GAME
              </button>
            </div>

            {loading ? (
              <div className={styles.loading}>LOADING...</div>
            ) : games.length === 0 ? (
              <div className={styles.empty}>
                <p>No games in the vault yet.</p>
                <button onClick={openAddModal} className={styles.addBtn}>
                  <Plus size={18} />
                  ADD FIRST GAME
                </button>
              </div>
            ) : (
              <div className={styles.grid}>
                {games.map((game, index) => (
                  <GameCard
                    key={game.id}
                    game={game}
                    onEdit={() => openEditModal(game)}
                    onDelete={() => handleDeleteGame(game.id)}
                    onStatusChange={(status) => handleStatusChange(game.id, status)}
                    style={{ animationDelay: `${index * 50}ms` }}
                  />
                ))}
              </div>
            )}
          </>
        ) : (
          <>
            <section className={styles.userSection}>
              <h2 className={styles.sectionTitle}>
                <Users size={16} />
                ALL USERS ({users.length})
              </h2>
              <div className={styles.userList}>
                {users.map(u => (
                  <div key={u.id} className={styles.userCard}>
                    <div className={styles.userInfo}>
                      <span className={styles.userEmail}>
                        {u.email}
                        {u.role === 'root' && <Crown size={12} className={styles.crownIcon} />}
                      </span>
                      <span className={styles.userMeta}>
                        {u.role === 'root' ? 'Admin' : 'User'} — Registered {new Date(u.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    <div className={styles.userActions}>
                      <span className={`${styles.statusBadge} ${styles[`status_${u.status}`]}`}>
                        {u.status}
                      </span>
                      {u.status === 'pending' && (
                        <>
                          <button onClick={() => handleApprove(u.id)} className={styles.approveBtn}>
                            Approve
                          </button>
                          <button onClick={() => handleReject(u.id)} className={styles.rejectBtn}>
                            Reject
                          </button>
                        </>
                      )}
                      {u.status === 'approved' && (
                        u.role === 'user' ? (
                          <button onClick={() => handlePromoteToRoot(u.id)} className={styles.promoteBtn} title="Promote to root">
                            <Crown size={16} />
                          </button>
                        ) : (
                          <button onClick={() => handleDemoteToUser(u.id)} className={styles.demoteBtn} title="Demote to user">
                            Demote
                          </button>
                        )
                      )}
                      {u.status === 'rejected' && (
                        <button onClick={() => handleApprove(u.id)} className={styles.approveBtn}>
                          Approve
                        </button>
                      )}
                    </div>
                  </div>
                ))}
                {users.length === 0 && <p className={styles.noUsers}>No users yet.</p>}
              </div>
            </section>
          </>
        )}
      </main>

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
    </div>
  );
}
