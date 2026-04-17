import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';

export async function loginUser(username, password) {
  const user = await User.findOne({ username });
  if (!user) {
    throw Object.assign(new Error('Invalid credentials'), { status: 401 });
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    throw Object.assign(new Error('Invalid credentials'), { status: 401 });
  }

  const token = jwt.sign(
    { id: user._id, username: user.username, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );

  return { token, user: { id: user._id, username: user.username, role: user.role } };
}

export async function getMe(userId) {
  const user = await User.findById(userId).select('-passwordHash');
  if (!user) {
    throw Object.assign(new Error('User not found'), { status: 404 });
  }
  return user;
}

export async function updateUserPicture(userId, pictureUrl) {
  const user = await User.findByIdAndUpdate(
    userId,
    { pictureUrl },
    { new: true }
  ).select('-passwordHash');
  if (!user) throw Object.assign(new Error('User not found'), { status: 404 });
  return user;
}
