export function getUploadUrl(relativePath) {
  if (!relativePath) return null;
  return `/api/uploads/${relativePath}`;
}
