import mongoose from 'mongoose';
import Session from '../models/Session.js';

export async function getAllSessions(locationId) {
  const match = locationId
    ? { locationId: new mongoose.Types.ObjectId(locationId) }
    : {};

  return Session.aggregate([
    { $match: match },
    {
      $lookup: {
        from: 'videos',
        localField: '_id',
        foreignField: 'sessionId',
        as: 'videos',
      },
    },
    {
      $addFields: {
        videoCount: { $size: '$videos' },
        _timestamps: {
          $filter: {
            input: '$videos.timestamp',
            cond: { $and: [{ $ne: ['$$this', null] }, { $ne: ['$$this', ''] }] },
          },
        },
      },
    },
    {
      $addFields: {
        earliestTimestamp: { $min: '$_timestamps' },
        latestTimestamp: { $max: '$_timestamps' },
      },
    },
    { $project: { videos: 0, _timestamps: 0 } },
    { $sort: { date: -1 } },
  ]);
}

export async function getSessionById(id) {
  const session = await Session.findById(id);
  if (!session) {
    throw Object.assign(new Error('Session not found'), { status: 404 });
  }
  return session;
}

export async function createSession({ locationId, date, notes, title }) {
  if (!locationId || !date) {
    throw Object.assign(new Error('locationId and date are required'), { status: 400 });
  }
  return Session.create({ locationId, date, notes, title });
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
