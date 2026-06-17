import { NextResponse } from "next/server";
import { addReview, deleteReview, getReviews } from "@/lib/reviews";

export const runtime = "nodejs";

const MAX_LENGTHS = {
  name: 80,
  eventType: 120,
  text: 1200,
};

function getAdminPassword() {
  const password = process.env.ADMIN_PASSWORD;

  if (!password) {
    throw new Error("ADMIN_PASSWORD не задан.");
  }

  return password;
}

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
  try {
    const reviews = await getReviews();
    return NextResponse.json({ reviews });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Не удалось загрузить отзывы." }, { status: 500 });
  }
}

export async function POST(request) {
  const review = normalizeReviewBody(await request.json().catch(() => null));
  const error = validateReview(review);

  if (error) {
    return NextResponse.json({ error }, { status: 400 });
  }

  try {
    const savedReview = await addReview(review);
    return NextResponse.json({ review: savedReview }, { status: 201 });
  } catch (saveError) {
    console.error(saveError);
    return NextResponse.json({ error: "Не удалось сохранить отзыв." }, { status: 500 });
  }
}

export async function DELETE(request) {
  const body = await request.json().catch(() => null);
  const id = Number(body?.id);
  const password = String(body?.password || "");

  try {
    if (password !== getAdminPassword()) {
      return NextResponse.json({ error: "Неверный пароль." }, { status: 401 });
    }
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Админ-панель не настроена." }, { status: 503 });
  }

  if (!Number.isInteger(id) || id <= 0) {
    return NextResponse.json({ error: "Некорректный идентификатор отзыва." }, { status: 400 });
  }

  try {
    if (!(await deleteReview(id))) {
      return NextResponse.json({ error: "Отзыв не найден." }, { status: 404 });
    }
  } catch (deleteError) {
    console.error(deleteError);
    return NextResponse.json({ error: "Не удалось удалить отзыв." }, { status: 500 });
  }

  return NextResponse.json({ ok: true, id });
}
