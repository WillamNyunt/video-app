import { useRef } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { MapPin, Users, Search, Settings, Sun, Moon, LogOut, Film, Pencil } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { updateSetting } from '../api/settings';
import { updateProfilePicture } from '../api/auth';
import { getUploadUrl } from '../api/files';
import './Nav.css';

export default function Nav({ theme, onThemeChange }) {
  const { user, setUser, logout } = useAuth();
  const navigate = useNavigate();
  const isAdmin = user?.role === 'admin';
  const pictureInputRef = useRef(null);

  async function handleAvatarChange(e) {
    const file = e.target.files[0];
    if (!file) return;
    try {
      const fd = new FormData();
      fd.append('picture', file);
      const updated = await updateProfilePicture(fd);
      setUser(updated);
    } catch {
      // silently ignore — no error UI in the nav
    } finally {
      e.target.value = '';
    }
  }

  async function handleThemeToggle() {
    const next = theme === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    onThemeChange(next);
    try {
      await updateSetting('theme', next);
    } catch {
      // revert on failure
      document.documentElement.setAttribute('data-theme', theme);
      onThemeChange(theme);
    }
  }

  async function handleLogout() {
    await logout();
    navigate('/login');
  }

  return (
    <nav className="nav">
      <div className="nav__brand">
        <div className="nav__brand-icon">
          <Film size={16} />
        </div>
        <span className="nav__brand-name">Video Archive</span>
      </div>

      <div className="nav__avatar-section">
        <div
          className={`nav__avatar${isAdmin ? ' nav__avatar--clickable' : ''}`}
          onClick={isAdmin ? () => pictureInputRef.current?.click() : undefined}
          title={isAdmin ? 'Change profile picture' : undefined}
        >
          {user?.pictureUrl ? (
            <img
              src={getUploadUrl(user.pictureUrl)}
              alt={user.username}
              className="nav__avatar-img"
            />
          ) : (
            <span className="nav__avatar-initials">
              {user?.username?.[0]?.toUpperCase() ?? '?'}
            </span>
          )}
          {isAdmin && (
            <span className="nav__avatar-edit-hint">
              <Pencil size={10} />
            </span>
          )}
        </div>
        {isAdmin && (
          <input
            ref={pictureInputRef}
            type="file"
            accept="image/*"
            style={{ display: 'none' }}
            onChange={handleAvatarChange}
          />
        )}
        <div className="nav__user-info">
          <span className="nav__username">{user?.username}</span>
          <span className="badge">{user?.role}</span>
        </div>
      </div>

      <ul className="nav__links">
        <li>
          <NavLink to="/" end className={({ isActive }) => isActive ? 'nav__link active' : 'nav__link'}>
            <MapPin size={16} />
            Locations
          </NavLink>
        </li>
        <li>
          <NavLink to="/people" className={({ isActive }) => isActive ? 'nav__link active' : 'nav__link'}>
            <Users size={16} />
            People
          </NavLink>
        </li>
        <li>
          <NavLink to="/search" className={({ isActive }) => isActive ? 'nav__link active' : 'nav__link'}>
            <Search size={16} />
            Search
          </NavLink>
        </li>
        {user?.role === 'admin' && (
          <li>
            <NavLink to="/admin/settings" className={({ isActive }) => isActive ? 'nav__link active' : 'nav__link'}>
              <Settings size={16} />
              Settings
            </NavLink>
          </li>
        )}
      </ul>

      <div className="nav__footer">
        <button
          className="nav__icon-btn"
          onClick={handleThemeToggle}
          title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          aria-label="Toggle theme"
        >
          {theme === 'dark' ? <Sun size={17} /> : <Moon size={17} />}
        </button>
        <button
          className="nav__icon-btn"
          onClick={handleLogout}
          title="Logout"
          aria-label="Logout"
        >
          <LogOut size={17} />
        </button>
      </div>
    </nav>
  );
}
