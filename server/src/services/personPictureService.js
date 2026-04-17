import PersonPicture from '../models/PersonPicture.js';

export async function getPicturesByPerson(personId) {
  return PersonPicture.find({ personId }).sort({ createdAt: -1 });
}

export async function createPicture(personId, url) {
  return PersonPicture.create({ personId, url });
}

export async function deletePicture(id) {
  const pic = await PersonPicture.findByIdAndDelete(id);
  if (!pic) throw Object.assign(new Error('Picture not found'), { status: 404 });
  return pic;
}
