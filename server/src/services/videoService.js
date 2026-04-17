import path from 'path';
import fs from 'fs';
import mongoose from 'mongoose';
import Video from '../models/Video.js';
import PersonVideo from '../models/PersonVideo.js';

export async function getAllVideos(sessionId) {
  if (sessionId) {
    return Video.aggregate([
      { $match: { sessionId: new mongoose.Types.ObjectId(sessionId) } },
      {
        $lookup: {
          from: 'personvideos',
          localField: '_id',
          foreignField: 'videoId',
          as: 'personVideoLinks',
        },
      },
      {
        $addFields: {
          people: '$personVideoLinks.personId',
        },
      },
      { $project: { personVideoLinks: 0 } },
      { $sort: { createdAt: -1 } },
    ]);
  }
  return Video.find({}).sort({ createdAt: -1 });
}

export async function getVideoById(id) {
  const video = await Video.findById(id);
  if (!video) {
    throw Object.assign(new Error('Video not found'), { status: 404 });
  }
  return video;
}

export async function createVideo(data) {
  return Video.create(data);
}

export async function updateVideo(id, data) {
  const video = await Video.findByIdAndUpdate(id, data, {
    new: true,
    runValidators: true,
  });
  if (!video) {
    throw Object.assign(new Error('Video not found'), { status: 404 });
  }
  return video;
}

export async function deleteVideo(id) {
  const video = await Video.findByIdAndDelete(id);
  if (!video) {
    throw Object.assign(new Error('Video not found'), { status: 404 });
  }
  return video;
}

export function resolveVideoFilePath(filePath) {
  const storagePath = process.env.STORAGE_PATH || './uploads';
  const resolved = path.isAbsolute(filePath)
    ? filePath
    : path.resolve(storagePath, filePath);

  if (!fs.existsSync(resolved)) {
    throw Object.assign(new Error('Video file not found on disk'), { status: 404 });
  }
  return resolved;
}
