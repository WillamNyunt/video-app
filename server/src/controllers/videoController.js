import * as videoService from '../services/videoService.js';
import { relativeStoragePath } from '../middleware/upload.js';
import PersonVideo from '../models/PersonVideo.js';

export async function getAll(req, res, next) {
  try {
    const videos = await videoService.getAllVideos(req.query.sessionId);
    return res.json(videos);
  } catch (err) {
    next(err);
  }
}

export async function getOne(req, res, next) {
  try {
    const video = await videoService.getVideoById(req.params.id);
    return res.json(video);
  } catch (err) {
    next(err);
  }
}

export async function create(req, res, next) {
  try {
    const { sessionId, title, timestamp, durationSeconds, fileSizeBytes, personIds } = req.body;

    if (!sessionId || !title) {
      return res.status(400).json({ error: 'sessionId and title are required' });
    }
    if (!req.files?.video?.[0]) {
      return res.status(400).json({ error: 'video file is required' });
    }

    const videoFile = req.files.video[0];
    const data = {
      sessionId,
      title,
      filePath: relativeStoragePath(videoFile),
      fileSizeBytes: fileSizeBytes ? Number(fileSizeBytes) : videoFile.size,
    };

    if (timestamp) data.timestamp = timestamp;
    if (durationSeconds) data.durationSeconds = Number(durationSeconds);
    if (req.files?.thumbnail?.[0]) {
      data.thumbnailUrl = relativeStoragePath(req.files.thumbnail[0]);
    }

    const video = await videoService.createVideo(data);

    if (personIds) {
      try {
        const ids = JSON.parse(personIds);
        await Promise.all(ids.map((pid) => PersonVideo.create({ personId: pid, videoId: video._id })));
      } catch {
        // non-fatal: video created, link failed
      }
    }

    return res.status(201).json(video);
  } catch (err) {
    next(err);
  }
}

export async function update(req, res, next) {
  try {
    const data = { ...req.body };

    if (req.files?.thumbnail?.[0]) {
      data.thumbnailUrl = relativeStoragePath(req.files.thumbnail[0]);
    }
    if (req.files?.video?.[0]) {
      data.filePath = relativeStoragePath(req.files.video[0]);
    }

    const video = await videoService.updateVideo(req.params.id, data);
    return res.json(video);
  } catch (err) {
    next(err);
  }
}

export async function remove(req, res, next) {
  try {
    await videoService.deleteVideo(req.params.id);
    return res.json({ message: 'Video deleted' });
  } catch (err) {
    next(err);
  }
}

export async function serveFile(req, res, next) {
  try {
    const video = await videoService.getVideoById(req.params.id);
    const absolutePath = videoService.resolveVideoFilePath(video.filePath);
    return res.sendFile(absolutePath);
  } catch (err) {
    next(err);
  }
}
