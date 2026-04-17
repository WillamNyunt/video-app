import path from 'path';
import * as authService from '../services/authService.js';

const COOKIE_OPTIONS = {
  httpOnly: true,
  sameSite: 'lax',
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  // secure: true in production
};

export async function login(req, res, next) {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: 'username and password are required' });
    }
    const { token, user } = await authService.loginUser(username, password);
    res.cookie('token', token, COOKIE_OPTIONS);
    return res.json({ user });
  } catch (err) {
    next(err);
  }
}

export function logout(req, res) {
  res.clearCookie('token');
  return res.json({ message: 'Logged out' });
}

export async function me(req, res, next) {
  try {
    const user = await authService.getMe(req.user.id);
    return res.json(user);
  } catch (err) {
    next(err);
  }
}

export async function updateProfilePicture(req, res, next) {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    const relativePath = path.relative(
      path.resolve(process.env.STORAGE_PATH || './uploads'),
      req.file.path
    ).replace(/\\/g, '/');
    const user = await authService.updateUserPicture(req.user.id, relativePath);
    return res.json(user);
  } catch (err) {
    next(err);
  }
}
