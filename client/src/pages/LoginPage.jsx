import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Film, LogIn } from 'lucide-react';
import { login } from '../api/auth';
import { useAuth } from '../context/AuthContext';
import './LoginPage.css';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { setUser } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    if (!username.trim() || !password.trim()) {
      setError('Username and password are required.');
      return;
    }
    setLoading(true);
    try {
      const data = await login(username.trim(), password);
      setUser(data.user || data);
      navigate('/', { replace: true });
    } catch (err) {
      setError(err.message || 'Invalid credentials. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-brand">
          <Film size={28} />
          <h1 className="login-title">Video Archive</h1>
        </div>
        <p className="login-subtitle">Sign in to continue</p>

        {error && <p className="error-message">{error}</p>}

        <form onSubmit={handleSubmit} className="login-form" noValidate>
          <div className="form-group">
            <label htmlFor="username" className="form-label">Username</label>
            <input
              id="username"
              type="text"
              className="form-input"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="username"
              autoFocus
              disabled={loading}
            />
          </div>
          <div className="form-group">
            <label htmlFor="password" className="form-label">Password</label>
            <input
              id="password"
              type="password"
              className="form-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              disabled={loading}
            />
          </div>
          <button
            type="submit"
            className="btn btn-primary login-submit"
            disabled={loading}
          >
            <LogIn size={16} />
            {loading ? 'Signing in...' : 'Sign in'}
          </button>
        </form>
      </div>
    </div>
  );
}
