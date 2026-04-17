const BASE = '/api/person-pictures';

export async function getPersonPictures(personId) {
  const res = await fetch(`${BASE}?personId=${personId}`, { credentials: 'include' });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || 'Failed to fetch pictures');
  }
  return res.json();
}

export async function uploadPersonPictures(formData) {
  const res = await fetch(BASE, {
    method: 'POST',
    credentials: 'include',
    body: formData,
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || 'Failed to upload pictures');
  }
  return res.json();
}

export async function deletePersonPicture(id) {
  const res = await fetch(`${BASE}/${id}`, {
    method: 'DELETE',
    credentials: 'include',
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || 'Failed to delete picture');
  }
  return res.json();
}
