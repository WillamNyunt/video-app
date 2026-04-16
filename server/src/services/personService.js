import Person from '../models/Person.js';
import PersonVideo from '../models/PersonVideo.js';
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

export async function deletePerson(id) {
  const person = await Person.findByIdAndDelete(id);
  if (!person) {
    throw Object.assign(new Error('Person not found'), { status: 404 });
  }
  // Clean up PersonVideo links
  await PersonVideo.deleteMany({ personId: id });
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
