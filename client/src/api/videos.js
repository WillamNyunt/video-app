const BASE = '/api/videos';

export async function getVideos(sessionId) {
  const url = sessionId ? `${BASE}?sessionId=${sessionId}` : BASE;
  const res = await fetch(url, { credentials: 'include' });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || 'Failed to fetch videos');
  }
  return res.json();
}

export async function getVideo(id) {
  const res = await fetch(`${BASE}/${id}`, { credentials: 'include' });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || 'Failed to fetch video');
  }
  return res.json();
}

export async function createVideo(formData) {
  const res = await fetch(BASE, {
    method: 'POST',
    credentials: 'include',
    body: formData,
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || 'Failed to upload video');
  }
  return res.json();
}

export async function updateVideo(id, data) {
  const res = await fetch(`${BASE}/${id}`, {
    method: 'PUT',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || 'Failed to update video');
  }
  return res.json();
}

export async function deleteVideo(id) {
  const res = await fetch(`${BASE}/${id}`, {
    method: 'DELETE',
    credentials: 'include',
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || 'Failed to delete video');
  }
  return res.json();
}

export function getVideoFileUrl(id) {
  return `${BASE}/${id}/file`;
}
