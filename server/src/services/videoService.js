import path from 'path';
import fs from 'fs';
import Video from '../models/Video.js';

export async function getAllVideos(sessionId) {
  const query = sessionId ? { sessionId } : {};
  return Video.find(query).sort({ createdAt: -1 });
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
  // filePath stored in DB is relative, e.g. "videos/abc.mp4"
  // Resolve from storagePath
  const resolved = path.isAbsolute(filePath)
    ? filePath
    : path.resolve(storagePath, filePath);

  if (!fs.existsSync(resolved)) {
    throw Object.assign(new Error('Video file not found on disk'), { status: 404 });
  }
  return resolved;
}
