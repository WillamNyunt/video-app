import Person from '../models/Person.js';
import PersonVideo from '../models/PersonVideo.js';
import Video from '../models/Video.js';

/**
 * Search people by name (text) and/or attribute values.
 *
 * filters is a JSON-encoded object of { attributeKey: value } pairs.
 * Person.attributes is treated as opaque — we match against it but never
 * log or expose it in error messages.
 *
 * Returns: { people: [...], videos: [...] }
 * Each person entry does NOT include .attributes in the response.
 */
export async function searchPeople(q, filtersParam) {
  const mongoQuery = {};

  // Name search
  if (q && q.trim()) {
    mongoQuery.name = { $regex: q.trim(), $options: 'i' };
  }

  // Attribute filters — parse and apply directly
  if (filtersParam) {
    let filters;
    try {
      filters = typeof filtersParam === 'string' ? JSON.parse(filtersParam) : filtersParam;
    } catch {
      throw Object.assign(new Error('Invalid filters parameter — must be JSON'), { status: 400 });
    }

    if (filters && typeof filters === 'object') {
      for (const [key, value] of Object.entries(filters)) {
        if (value !== undefined && value !== null && value !== '') {
          mongoQuery[`attributes.${key}`] = value;
        }
      }
    }
  }

  // Use lean() to get raw documents so we can read attributes for filtering,
  // but strip them before returning
  const rawPeople = await Person.find(mongoQuery).lean();

  // Build safe person objects — no .attributes
  const safePeople = rawPeople.map(({ attributes: _attrs, ...rest }) => rest);

  // Fetch videos for matched people
  const personIds = rawPeople.map((p) => p._id);
  const links = await PersonVideo.find({ personId: { $in: personIds } });
  const videoIds = links.map((l) => l.videoId);
  const videos = await Video.find({ _id: { $in: videoIds } });

  return { people: safePeople, videos };
}
