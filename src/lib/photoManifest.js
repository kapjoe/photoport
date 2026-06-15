export function normalizeManifest(manifest) {
  if (Array.isArray(manifest)) {
    return {
      categories: {},
      photos: manifest,
    };
  }

  return {
    categories: manifest?.categories || {},
    photos: Array.isArray(manifest?.photos) ? manifest.photos : [],
  };
}

export function pickFeaturedPhotos(manifest, limit = 12) {
  const albums = Object.values(manifest.categories || {}).flatMap((category) => category.albums || []);

  if (albums.length === 0) {
    return manifest.photos.slice(0, limit);
  }

  const featured = [];
  const usedIds = new Set();

  const pushPhoto = (photo) => {
    if (!photo || usedIds.has(photo.id)) {
      return false;
    }

    featured.push(photo);
    usedIds.add(photo.id);
    return true;
  };

  for (const album of albums) {
    if (featured.length >= limit) {
      break;
    }

    pushPhoto(album.cover || album.photos?.[0]);
  }

  let index = 1;

  while (featured.length < limit) {
    let added = false;

    for (const album of albums) {
      if (featured.length >= limit) {
        break;
      }

      if (pushPhoto(album.photos?.[index])) {
        added = true;
      }
    }

    if (!added) {
      break;
    }

    index += 1;
  }

  for (const photo of manifest.photos) {
    if (featured.length >= limit) {
      break;
    }

    pushPhoto(photo);
  }

  return featured;
}
