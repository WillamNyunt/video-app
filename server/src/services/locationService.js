import Location from '../models/Location.js';

export async function getAllLocations() {
  return Location.find().sort({ createdAt: -1 });
}

export async function getLocationById(id) {
  const location = await Location.findById(id);
  if (!location) {
    throw Object.assign(new Error('Location not found'), { status: 404 });
  }
  return location;
}

export async function createLocation(data) {
  const location = await Location.create(data);
  return location;
}

export async function updateLocation(id, data) {
  const location = await Location.findByIdAndUpdate(id, data, {
    new: true,
    runValidators: true,
  });
  if (!location) {
    throw Object.assign(new Error('Location not found'), { status: 404 });
  }
  return location;
}

export async function deleteLocation(id) {
  const location = await Location.findByIdAndDelete(id);
  if (!location) {
    throw Object.assign(new Error('Location not found'), { status: 404 });
  }
  return location;
}
