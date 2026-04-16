const BASE = '/api/auth';

export async function login(username, password) {
  const res = await fetch(`${BASE}/login`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || 'Login failed');
  }
  return res.json();
}

export async function logout() {
  const res = await fetch(`${BASE}/logout`, {
    method: 'POST',
    credentials: 'include',
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || 'Logout failed');
  }
  return res.json();
}

export async function me() {
  const res = await fetch(`${BASE}/me`, {
    credentials: 'include',
  });
  if (!res.ok) {
    if (res.status === 401) return null;
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || 'Failed to fetch user');
  }
  return res.json();
}
