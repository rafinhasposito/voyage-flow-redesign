export function isGoogleMediaUrl(url: string | null | undefined): boolean {
  if (!url) return false;
  const blockedDomains = [
    'places.googleapis.com',
    'maps.googleapis.com',
    'maps.gstatic.com',
    'googleusercontent.com',
    'lh3.googleusercontent.com',
  ];
  const blockedPaths = [
    '/maps/api/place/photo',
    'photo_reference',
    'photoreference'
  ];
  const lowerUrl = url.toLowerCase();
  if (blockedDomains.some(domain => lowerUrl.includes(domain))) return true;
  if (blockedPaths.some(path => lowerUrl.includes(path))) return true;
  return false;
}

export function getSafeMediaUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  if (isGoogleMediaUrl(url)) return null;
  return url;
}
