export function isProxyPhotoPath(src) {
  return typeof src === "string" && src.startsWith("/api/photos/image/");
}
