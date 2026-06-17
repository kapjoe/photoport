import { getReviewsDiskPath, readDiskJson, writeDiskJson } from "./yandex-disk";

const EMPTY_STORE = { reviews: [], nextId: 1 };

async function loadStore() {
  const data = await readDiskJson(getReviewsDiskPath());

  if (!data || !Array.isArray(data.reviews)) {
    return { ...EMPTY_STORE };
  }

  const nextId = Number.isInteger(data.nextId) && data.nextId > 0
    ? data.nextId
    : data.reviews.reduce((maxId, review) => Math.max(maxId, Number(review.id) || 0), 0) + 1;

  return {
    reviews: data.reviews,
    nextId,
  };
}

async function saveStore(store) {
  await writeDiskJson(getReviewsDiskPath(), store);
}

export async function getReviews() {
  const store = await loadStore();

  return [...store.reviews].sort((left, right) => {
    const dateCompare = String(right.createdAt || "").localeCompare(String(left.createdAt || ""));

    if (dateCompare !== 0) {
      return dateCompare;
    }

    return Number(right.id) - Number(left.id);
  });
}

export async function addReview({ name, eventDate, eventType, text }) {
  const store = await loadStore();
  const review = {
    id: store.nextId,
    name,
    eventDate,
    eventType,
    text,
    createdAt: new Date().toISOString(),
  };

  store.reviews.push(review);
  store.nextId += 1;
  await saveStore(store);

  return review;
}

export async function deleteReview(id) {
  const store = await loadStore();
  const index = store.reviews.findIndex((review) => review.id === id);

  if (index === -1) {
    return false;
  }

  store.reviews.splice(index, 1);
  await saveStore(store);

  return true;
}
