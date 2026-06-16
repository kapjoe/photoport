Это сайт-портфолио фотографа на [Next.js](https://nextjs.org). Проект разрабатывается для российского рынка и используется как дипломная работа.

## Стек

- **Next.js 16** (App Router) + **React 19**
- **SQLite** (`better-sqlite3`) — отзывы
- **Яндекс.Диск API** — фотографии с локальным кешем
- **Swiper** — слайдеры
- **CSS Modules** + шрифт **Jura**

## Первый запуск после клонирования

```bash
npm install
cp .env.example .env.local   # Windows: copy .env.example .env.local
```

Заполните `.env.local` токеном и путями Яндекс.Диска, затем:

```bash
npm run sync:yandex
npm run dev
```

Сайт: [http://localhost:3000](http://localhost:3000)

## Кеш фотографий с Яндекс.Диска

Фотографии хранятся на Яндекс.Диске и скачиваются в локальный кеш проекта. Переменные окружения:

- `YANDEX_DISK_TOKEN` — OAuth-токен Яндекс.Диска;
- `YANDEX_DISK_WEDDINGS_PATH` — папка со свадебными фотосессиями;
- `YANDEX_DISK_EVENTS_PATH` — папка с остальными мероприятиями.

Ожидаемая структура на Яндекс.Диске:

```text
/portfolio
  /weddings
    /Свадьба Ивановых
      photo-1.jpg
  /events
    /Корпоратив 2026
      photo-1.jpg
```

Внутри `weddings` и `events` каждая папка — одна фотосессия.

```bash
npm run sync:yandex
npm run sync:yandex:list
npm run sync:yandex:next
npm run sync:yandex -- --category weddings --album "Свадьба Ивановых"
```

Скрипт скачивает изображения в `public/cache/photos`, определяет ориентацию и обновляет `manifest.json` **после каждой папки-альбома**. Если синхронизация прервётся, уже скачанные альбомы останутся в кеше и в `manifest.json`.

Для Vercel фото и `manifest.json` хранятся в Git. Синхронизацию запускайте локально, затем коммитьте изменения:

```bash
npm run sync:yandex:next
git add public/cache/photos
git commit -m "Sync next photo album"
git push
```

На Vercel Build Command должен быть только:

```bash
npm run build
```

## Отзывы

Регистрации нет. Форма на `/reviews`: имя, дата, тип мероприятия, текст. Данные сохраняются в `data/reviews.sqlite`.

## Команды

```bash
npm run dev
npm run build
npm run start
npm run lint
npm run sync:yandex
npm run sync:yandex:list
npm run sync:yandex:next
```

## Что не попадает в Git

- `.env.local` — секреты
- `node_modules`, `.next`
- `data/` — локальная база отзывов

Фото в `public/cache/photos/` коммитятся в Git, чтобы Vercel не скачивал их заново при каждом деплое.
