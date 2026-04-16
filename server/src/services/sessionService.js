import Session from '../models/Session.js';

export async function getAllSessions(locationId) {
  const query = locationId ? { locationId } : {};
  return Session.find(query).sort({ date: -1, time: -1 });
}

export async function getSessionById(id) {
  const session = await Session.findById(id);
  if (!session) {
    throw Object.assign(new Error('Session not found'), { status: 404 });
  }
  return session;
}

export async function createSession(data) {
  return Session.create(data);
}

export async function updateSession(id, data) {
  const session = await Session.findByIdAndUpdate(id, data, {
    new: true,
    runValidators: true,
  });
  if (!session) {
    throw Object.assign(new Error('Session not found'), { status: 404 });
  }
  return session;
}

export async function deleteSession(id) {
  const session = await Session.findByIdAndDelete(id);
  if (!session) {
    throw Object.assign(new Error('Session not found'), { status: 404 });
  }
  return session;
}
