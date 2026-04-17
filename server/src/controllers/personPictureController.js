import path from 'path';
import * as service from '../services/personPictureService.js';
import { relativeStoragePath } from '../middleware/upload.js';

export async function list(req, res, next) {
  try {
    const { personId } = req.query;
    if (!personId) return res.status(400).json({ error: 'personId is required' });
    const pictures = await service.getPicturesByPerson(personId);
    return res.json(pictures);
  } catch (err) {
    next(err);
  }
}

export async function create(req, res, next) {
  try {
    const { personId } = req.body;
    if (!personId) return res.status(400).json({ error: 'personId is required' });
    if (!req.files || req.files.length === 0) return res.status(400).json({ error: 'No files uploaded' });

    const created = await Promise.all(
      req.files.map((file) => service.createPicture(personId, relativeStoragePath(file)))
    );
    return res.status(201).json(created);
  } catch (err) {
    next(err);
  }
}

export async function remove(req, res, next) {
  try {
    await service.deletePicture(req.params.id);
    return res.json({ message: 'Deleted' });
  } catch (err) {
    next(err);
  }
}
