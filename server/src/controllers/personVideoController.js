import * as personVideoService from '../services/personVideoService.js';

export async function link(req, res, next) {
  try {
    const { personId, videoId } = req.body;
    if (!personId || !videoId) {
      return res.status(400).json({ error: 'personId and videoId are required' });
    }
    const result = await personVideoService.linkPersonVideo(personId, videoId);
    return res.status(201).json(result);
  } catch (err) {
    next(err);
  }
}

export async function unlink(req, res, next) {
  try {
    const { personId, videoId } = req.body;
    if (!personId || !videoId) {
      return res.status(400).json({ error: 'personId and videoId are required' });
    }
    await personVideoService.unlinkPersonVideo(personId, videoId);
    return res.json({ message: 'Link removed' });
  } catch (err) {
    next(err);
  }
}
