import path from 'path';
import * as locationService from '../services/locationService.js';
import { relativeStoragePath } from '../middleware/upload.js';
import { encryptFileInPlace } from '../services/cryptoService.js';

function resolveUpload(relativePath) {
  return path.resolve(process.env.STORAGE_PATH || './uploads', relativePath);
}

export async function getAll(req, res, next) {
  try {
    const locations = await locationService.getAllLocations();
    return res.json(locations);
  } catch (err) {
    next(err);
  }
}

export async function getOne(req, res, next) {
  try {
    const location = await locationService.getLocationById(req.params.id);
    return res.json(location);
  } catch (err) {
    next(err);
  }
}

export async function create(req, res, next) {
  try {
    const { address } = req.body;
    if (!address) {
      return res.status(400).json({ error: 'address is required' });
    }

    const data = { address };
    if (req.files?.picture?.[0]) {
      data.pictureUrl = relativeStoragePath(req.files.picture[0]);
    }
    if (req.files?.thumbnail?.[0]) {
      data.thumbnailUrl = relativeStoragePath(req.files.thumbnail[0]);
    }

    const location = await locationService.createLocation(data);

    try {
      if (data.pictureUrl)   await encryptFileInPlace(resolveUpload(data.pictureUrl));
      if (data.thumbnailUrl) await encryptFileInPlace(resolveUpload(data.thumbnailUrl));
    } catch (encErr) {
      console.error('[location] file encrypt failed:', encErr);
      throw encErr;
    }

    return res.status(201).json(location);
  } catch (err) {
    next(err);
  }
}

export async function update(req, res, next) {
  try {
    const data = { ...req.body };
    if (req.files?.picture?.[0]) {
      data.pictureUrl = relativeStoragePath(req.files.picture[0]);
    }
    if (req.files?.thumbnail?.[0]) {
      data.thumbnailUrl = relativeStoragePath(req.files.thumbnail[0]);
    }

    const location = await locationService.updateLocation(req.params.id, data);

    try {
      if (req.files?.picture?.[0])   await encryptFileInPlace(resolveUpload(data.pictureUrl));
      if (req.files?.thumbnail?.[0]) await encryptFileInPlace(resolveUpload(data.thumbnailUrl));
    } catch (encErr) {
      console.error('[location] file encrypt failed:', encErr);
      throw encErr;
    }

    return res.json(location);
  } catch (err) {
    next(err);
  }
}

export async function remove(req, res, next) {
  try {
    await locationService.deleteLocation(req.params.id);
    return res.json({ message: 'Location deleted' });
  } catch (err) {
    next(err);
  }
}
