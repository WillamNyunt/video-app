import * as settingsService from '../services/settingsService.js';

export async function getAll(req, res, next) {
  try {
    const settings = await settingsService.getAllSettings();
    return res.json(settings);
  } catch (err) {
    next(err);
  }
}

export async function upsert(req, res, next) {
  try {
    const { key, value } = req.body;
    if (!key || value === undefined) {
      return res.status(400).json({ error: 'key and value are required' });
    }
    const setting = await settingsService.upsertSetting(key, value);
    return res.json(setting);
  } catch (err) {
    next(err);
  }
}
