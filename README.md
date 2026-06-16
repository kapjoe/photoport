Это сайт-портфолио фотографа на [Next.js](https://nextjs.org). Проект разрабатывается для российского рынка и используется как дипломная работа.

## Стек

- **Next.js 16** (App Router) + **React 19**
- **SQLite** (`better-sqlite3`) — отзывы
- **Яндекс.Диск API** — фотографии в полном качестве через серверный proxy
- **Swiper** — слайдеры
- **CSS Modules** + шрифт **Jura**

## Первый запуск после клонирования

```bash
npm install
cp .env.example .env.local   # Windows: copy .env.example .env.local
```

Заполните `.env.local` токеном и путями Яндекс.Диска, затем:

```bash
npm run sync:yandex:manifest
npm run dev
```

Сайт: [http://localhost:3000](http://localhost:3000)

## Фотографии с Яндекс.Диска

Фотографии хранятся на Яндекс.Диске. Скрипт синхронизации строит `manifest.json`, а сами файлы на Vercel отдаются через `/api/photos/image/...` в **оригинальном качестве** — без скачивания гигабайтов при деплое.

Переменные окружения:

- `YANDEX_DISK_TOKEN` — OAuth-токен Яндекс.Диска (нужен и локально, и на Vercel);
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
npm run sync:yandex:manifest
npm run sync:yandex:list
npm run sync:yandex:next -- --metadata-only
npm run sync:yandex -- --metadata-only --category weddings --album "Свадьба Ивановых"
```

`sync:yandex:manifest` обновляет только `manifest.json` и не сохраняет фото на диск. После добавления новых папок на Диске запустите синхронизацию локально и закоммитьте `manifest.json`.

Для Vercel:

```bash
npm run build
```

Токен `YANDEX_DISK_TOKEN` и пути к папкам должны быть в Environment Variables на Vercel — они нужны API-прокси в рантайме.

Команда `npm run sync:yandex` без флагов по-прежнему скачивает фото локально в `public/cache/photos/` для офлайн-разработки.

## Отзывы

Регистрации нет. Форма на `/reviews`: имя, дата, тип мероприятия, текст. Данные сохраняются в `data/reviews.sqlite`.

## Команды

```bash
npm run dev
npm run build
npm run start
npm run lint
npm run sync:yandex:manifest
npm run sync:yandex:list
npm run sync:yandex:next
```

## Что не попадает в Git

- `.env.local` — секреты
- `node_modules`, `.next`
- `data/` — локальная база отзывов
- `public/cache/photos/*` — локальные копии фото (в Git хранится только `manifest.json`)
