const BASE = '/api/person-video';

export async function linkPersonVideo(personId, videoId) {
  const res = await fetch(BASE, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ personId, videoId }),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || 'Failed to link person to video');
  }
  return res.json();
}

export async function unlinkPersonVideo(personId, videoId) {
  const res = await fetch(BASE, {
    method: 'DELETE',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ personId, videoId }),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || 'Failed to unlink person from video');
  }
  return res.json();
}
