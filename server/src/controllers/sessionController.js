import * as sessionService from '../services/sessionService.js';

export async function getAll(req, res, next) {
  try {
    const sessions = await sessionService.getAllSessions(req.query.locationId);
    return res.json(sessions);
  } catch (err) {
    next(err);
  }
}

export async function getOne(req, res, next) {
  try {
    const session = await sessionService.getSessionById(req.params.id);
    return res.json(session);
  } catch (err) {
    next(err);
  }
}

export async function create(req, res, next) {
  try {
    const { locationId, date, title } = req.body;
    if (!locationId || !date) {
      return res.status(400).json({ error: 'locationId and date are required' });
    }
    const session = await sessionService.createSession({ locationId, date, title });
    return res.status(201).json(session);
  } catch (err) {
    next(err);
  }
}

export async function update(req, res, next) {
  try {
    const session = await sessionService.updateSession(req.params.id, req.body);
    return res.json(session);
  } catch (err) {
    next(err);
  }
}

export async function remove(req, res, next) {
  try {
    await sessionService.deleteSession(req.params.id);
    return res.json({ message: 'Session deleted' });
  } catch (err) {
    next(err);
  }
}
