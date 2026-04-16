import AppSettings from '../models/AppSettings.js';

export async function getAllSettings() {
  return AppSettings.find();
}

export async function upsertSetting(key, value) {
  const setting = await AppSettings.findOneAndUpdate(
    { key },
    { key, value },
    { upsert: true, new: true, runValidators: true }
  );
  return setting;
}
