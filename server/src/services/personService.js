import path from 'path';
import fs from 'fs';
import Person from '../models/Person.js';
import PersonVideo from '../models/PersonVideo.js';
import PersonPicture from '../models/PersonPicture.js';
import Video from '../models/Video.js';

export async function getAllPeople() {
  return Person.find().sort({ name: 1 });
}

export async function getPersonById(id) {
  const person = await Person.findById(id);
  if (!person) {
    throw Object.assign(new Error('Person not found'), { status: 404 });
  }
  return person;
}

export async function createPerson(data) {
  return Person.create(data);
}

export async function updatePerson(id, data) {
  const person = await Person.findByIdAndUpdate(id, data, {
    new: true,
    runValidators: true,
  });
  if (!person) {
    throw Object.assign(new Error('Person not found'), { status: 404 });
  }
  return person;
}

export async function setProfilePic(id, url) {
  return Person.findByIdAndUpdate(id, { profilePicUrl: url }, { new: true });
}

export async function deletePerson(id) {
  const person = await Person.findByIdAndDelete(id);
  if (!person) {
    throw Object.assign(new Error('Person not found'), { status: 404 });
  }

  await PersonVideo.deleteMany({ personId: id });

  const storagePath = process.env.STORAGE_PATH || './uploads';

  if (person.profilePicUrl) {
    try { fs.unlinkSync(path.resolve(storagePath, person.profilePicUrl)); } catch { /* already gone */ }
  }

  const pictures = await PersonPicture.find({ personId: id });
  await PersonPicture.deleteMany({ personId: id });
  for (const pic of pictures) {
    try { fs.unlinkSync(path.resolve(storagePath, pic.url)); } catch { /* already gone */ }
  }

  return person;
}

export async function getPersonVideos(personId) {
  // Verify person exists
  const person = await Person.findById(personId);
  if (!person) {
    throw Object.assign(new Error('Person not found'), { status: 404 });
  }

  const links = await PersonVideo.find({ personId });
  const videoIds = links.map((l) => l.videoId);
  const videos = await Video.find({ _id: { $in: videoIds } }).sort({ createdAt: -1 });
  return videos;
}
