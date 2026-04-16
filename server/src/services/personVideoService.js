import PersonVideo from '../models/PersonVideo.js';
import Person from '../models/Person.js';
import Video from '../models/Video.js';

export async function linkPersonVideo(personId, videoId) {
  // Verify both exist
  const person = await Person.findById(personId);
  if (!person) {
    throw Object.assign(new Error('Person not found'), { status: 404 });
  }
  const video = await Video.findById(videoId);
  if (!video) {
    throw Object.assign(new Error('Video not found'), { status: 404 });
  }

  // upsert to handle duplicates gracefully
  const link = await PersonVideo.findOneAndUpdate(
    { personId, videoId },
    { personId, videoId },
    { upsert: true, new: true }
  );
  return link;
}

export async function unlinkPersonVideo(personId, videoId) {
  const link = await PersonVideo.findOneAndDelete({ personId, videoId });
  if (!link) {
    throw Object.assign(new Error('Link not found'), { status: 404 });
  }
  return link;
}
