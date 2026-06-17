import { NextResponse } from "next/server";

export const runtime = "nodejs";

function getAdminPassword() {
  const password = process.env.ADMIN_PASSWORD;

  if (!password) {
    throw new Error("ADMIN_PASSWORD не задан.");
  }

  return password;
}

export async function POST(request) {
  const body = await request.json().catch(() => null);
  const password = String(body?.password || "");

  try {
    if (password !== getAdminPassword()) {
      return NextResponse.json({ error: "Неверный пароль." }, { status: 401 });
    }
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Админ-панель не настроена." }, { status: 503 });
  }

  return NextResponse.json({ ok: true });
}
