import path from 'path';
import * as personService from '../services/personService.js';
import { relativeStoragePath } from '../middleware/upload.js';
import { encryptFileInPlace } from '../services/cryptoService.js';

export async function getAll(req, res, next) {
  try {
    const people = await personService.getAllPeople();
    return res.json(people);
  } catch (err) {
    next(err);
  }
}

export async function getOne(req, res, next) {
  try {
    const person = await personService.getPersonById(req.params.id);
    return res.json(person);
  } catch (err) {
    next(err);
  }
}

export async function getVideos(req, res, next) {
  try {
    const videos = await personService.getPersonVideos(req.params.id);
    return res.json(videos);
  } catch (err) {
    next(err);
  }
}

export async function create(req, res, next) {
  try {
    const { name, attributes } = req.body;
    if (!name) {
      return res.status(400).json({ error: 'name is required' });
    }
    const data = { name };
    if (attributes !== undefined) data.attributes = attributes;
    const person = await personService.createPerson(data);
    return res.status(201).json(person);
  } catch (err) {
    next(err);
  }
}

export async function update(req, res, next) {
  try {
    const { name, attributes } = req.body;
    const data = {};
    if (name !== undefined) data.name = name;
    if (attributes !== undefined) data.attributes = attributes;
    const person = await personService.updatePerson(req.params.id, data);
    return res.json(person);
  } catch (err) {
    next(err);
  }
}

export async function remove(req, res, next) {
  try {
    await personService.deletePerson(req.params.id);
    return res.json({ message: 'Person deleted' });
  } catch (err) {
    next(err);
  }
}

export async function updateProfilePic(req, res, next) {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
    const picUrl = relativeStoragePath(req.file);
    await encryptFileInPlace(path.resolve(process.env.STORAGE_PATH || './uploads', picUrl));
    const person = await personService.updatePerson(req.params.id, { profilePicUrl: picUrl });
    return res.json(person);
  } catch (err) {
    next(err);
  }
}
