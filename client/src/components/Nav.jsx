import { NavLink, useNavigate } from 'react-router-dom';
import { MapPin, Users, Search, Settings, Sun, Moon, LogOut, Film } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { updateSetting } from '../api/settings';
import './Nav.css';

export default function Nav({ theme, onThemeChange }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

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
        <Film size={20} />
        <span>Video Archive</span>
      </div>

      <div className="nav__user">
        <span className="nav__username">{user?.username}</span>
        <span className="badge">{user?.role}</span>
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
