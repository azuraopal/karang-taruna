export function imageVariantUrl(source: string, width: 160 | 640 | 1280): string {
  if (!/^\/uploads\/(galeri|berita|profiles)\/[a-zA-Z0-9_-]+\.(jpe?g|png|webp)$/i.test(source)) return source;
  return `${source}?w=${width}`;
}
