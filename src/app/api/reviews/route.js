import { NextResponse } from "next/server";
import { addReview, deleteReview, getReviews } from "@/lib/reviews";

export const runtime = "nodejs";

const ADMIN_PASSWORD = "kapj12345";

const MAX_LENGTHS = {
  name: 80,
  eventType: 120,
  text: 1200,
};

function normalizeReviewBody(body) {
  return {
    name: String(body?.name || "").trim(),
    eventDate: String(body?.eventDate || "").trim(),
    eventType: String(body?.eventType || "").trim(),
    text: String(body?.text || "").trim(),
  };
}

function validateReview(review) {
  if (!review.name || !review.eventDate || !review.eventType || !review.text) {
    return "Заполните имя, дату мероприятия, тип мероприятия и текст отзыва.";
  }

  if (review.name.length > MAX_LENGTHS.name) {
    return `Имя должно быть не длиннее ${MAX_LENGTHS.name} символов.`;
  }

  if (review.eventType.length > MAX_LENGTHS.eventType) {
    return `Тип мероприятия должен быть не длиннее ${MAX_LENGTHS.eventType} символов.`;
  }

  if (review.text.length > MAX_LENGTHS.text) {
    return `Отзыв должен быть не длиннее ${MAX_LENGTHS.text} символов.`;
  }

  return null;
}

export async function GET() {
  return NextResponse.json({ reviews: getReviews() });
}

export async function POST(request) {
  const review = normalizeReviewBody(await request.json().catch(() => null));
  const error = validateReview(review);

  if (error) {
    return NextResponse.json({ error }, { status: 400 });
  }

  return NextResponse.json({ review: addReview(review) }, { status: 201 });
}

export async function DELETE(request) {
  const body = await request.json().catch(() => null);
  const id = Number(body?.id);
  const password = String(body?.password || "");

  if (password !== ADMIN_PASSWORD) {
    return NextResponse.json({ error: "Неверный пароль." }, { status: 401 });
  }

  if (!Number.isInteger(id) || id <= 0) {
    return NextResponse.json({ error: "Некорректный идентификатор отзыва." }, { status: 400 });
  }

  if (!deleteReview(id)) {
    return NextResponse.json({ error: "Отзыв не найден." }, { status: 404 });
  }

  return NextResponse.json({ ok: true, id });
}
