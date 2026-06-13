# Canbanimizer

Realtime канбан-доска для командной работы. Изменения карточек и колонок видны всем участникам мгновенно.

## Стек

- **Next.js 16** (App Router) + React 19 + TypeScript
- **Prisma 7** + PostgreSQL (driver adapter `@prisma/adapter-pg`)
- **Realtime: Server-Sent Events** — без внешних зависимостей. In-memory pub/sub (`lib/events.ts`) рассылает мутации всем подписчикам доски. Для масштабирования на несколько процессов заменяется на Redis pub/sub.
- **Auth** — email + пароль, свои сессии в БД (httpOnly cookie), bcrypt. Без auth-библиотек.
- **UI** — ShadCN + Neubrutalism, нативный HTML5 drag-and-drop (без dnd-библиотек).
- **Порядок карточек/колонок** — fractional indexing (`lib/position.ts`), вставка между любыми двумя элементами без перенумерации.

## Архитектура realtime

```
User A → server action (мутация в БД) → publish(boardId, event)
                                              ↓ EventEmitter
User B ← SSE /api/board/[id]/stream ← subscribe(boardId)
```

Клиент применяет события через идемпотентный reducer (`components/board/state.ts`),
поэтому собственные оптимистичные изменения и эхо от сервера не дублируются.

## Запуск локально

Нужен PostgreSQL. Пример через Homebrew:

```bash
brew services start postgresql@16
createdb canbanimizer
```

```bash
cp .env.example .env          # пропишите DATABASE_URL
npm install
npx prisma migrate dev        # применить миграции
npm run dev                   # http://localhost:3000
```

`.env`:

```
DATABASE_URL="postgresql://USER@localhost:5432/canbanimizer?schema=public"
SESSION_TTL_DAYS=30
```

## Проверка realtime

Откройте одну доску в двух окнах браузера (разные сессии или одна) — создание,
перетаскивание, редактирование и удаление карточек применяется в обоих мгновенно.
Индикатор соединения в шапке доски показывает статус SSE.

## Деплой (Railway / Render)

SSE + SQLite/Postgres требуют **один постоянный Node-процесс** (не serverless/Vercel).

1. Managed PostgreSQL (Railway/Render предоставляют) → `DATABASE_URL`.
2. Build: `npm run build`. Start: `npm run start`.
3. Применить миграции на проде: `npx prisma migrate deploy`.
4. Переменные окружения: `DATABASE_URL`, `SESSION_TTL_DAYS`, `NODE_ENV=production`.

> Cookie сессии помечается `secure` в production — нужен HTTPS (Railway/Render дают из коробки).

## Масштабирование (потом)

- Несколько инстансов → заменить in-memory bus в `lib/events.ts` на Redis pub/sub.
- Гранулярный доступ к подпроектам (`SubprojectAccess`) в MVP не enforced — добавляется в `lib/access.ts`.
- Теги, вложения, аудит-лог — модели есть в схеме, UI добавляется по необходимости.
