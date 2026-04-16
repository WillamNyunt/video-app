import * as locationService from '../services/locationService.js';
import { relativeStoragePath } from '../middleware/upload.js';

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
