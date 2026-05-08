import path from 'path';
import * as personService from '../services/personService.js';
import { relativeStoragePath } from '../middleware/upload.js';
import { encryptFileInPlace, encryptText, decryptText } from '../services/cryptoService.js';
import PersonAttributeSchema from '../models/PersonAttributeSchema.js';

async function getTextAttributeLabels() {
  const schemas = await PersonAttributeSchema.find({ type: { $in: ['text', 'richtext'] } });
  return schemas.map((s) => s.label); // label is already decrypted by the plugin
}

function encryptTextAttrs(attributes, textLabels) {
  if (!attributes || !textLabels.length) return attributes;
  const result = { ...attributes };
  for (const label of textLabels) {
    if (result[label] != null && result[label] !== '') {
      result[label] = encryptText(String(result[label]));
    }
  }
  return result;
}

function decryptTextAttrs(attributes, textLabels) {
  if (!attributes || !textLabels.length) return attributes;
  const result = { ...attributes };
  for (const label of textLabels) {
    if (result[label] != null && result[label] !== '') {
      try { result[label] = decryptText(String(result[label])); } catch { /* not encrypted */ }
    }
  }
  return result;
}

function serializePerson(doc, textLabels) {
  const obj = typeof doc.toObject === 'function' ? doc.toObject() : { ...doc };
  obj.attributes = decryptTextAttrs(obj.attributes, textLabels);
  return obj;
}

export async function getAll(req, res, next) {
  try {
    const people = await personService.getAllPeople();
    const textLabels = await getTextAttributeLabels();
    return res.json(people.map((p) => serializePerson(p, textLabels)));
  } catch (err) {
    next(err);
  }
}

export async function getOne(req, res, next) {
  try {
    const person = await personService.getPersonById(req.params.id);
    const textLabels = await getTextAttributeLabels();
    return res.json(serializePerson(person, textLabels));
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
    const textLabels = await getTextAttributeLabels();
    const data = { name };
    if (attributes !== undefined) data.attributes = encryptTextAttrs(attributes, textLabels);
    const person = await personService.createPerson(data);
    return res.status(201).json(serializePerson(person, textLabels));
  } catch (err) {
    next(err);
  }
}

export async function update(req, res, next) {
  try {
    const { name, attributes } = req.body;
    const textLabels = await getTextAttributeLabels();
    const data = {};
    if (name !== undefined) data.name = name;
    if (attributes !== undefined) data.attributes = encryptTextAttrs(attributes, textLabels);
    const person = await personService.updatePerson(req.params.id, data);
    return res.json(serializePerson(person, textLabels));
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
    const textLabels = await getTextAttributeLabels();
    const person = await personService.updatePerson(req.params.id, { profilePicUrl: picUrl });
    return res.json(serializePerson(person, textLabels));
  } catch (err) {
    next(err);
  }
}
