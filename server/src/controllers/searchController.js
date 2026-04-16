import * as searchService from '../services/searchService.js';

export async function search(req, res, next) {
  try {
    const { q, filters } = req.query;
    const results = await searchService.searchPeople(q, filters);
    return res.json(results);
  } catch (err) {
    next(err);
  }
}
