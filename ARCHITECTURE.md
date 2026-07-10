# Canbanimizer — Architecture & Plan

Todo/канбан-приложение с проектами, ролями, секциями, досками и real-time синхронизацией.

---

## Стек

| Слой | Технологии |
|------|-----------|
| Фронт | Vite + React 19 + TypeScript (CSR, без SSR) |
| Бэк | Node + Express 5 + TypeScript |
| ORM / БД | Drizzle ORM + Neon Postgres (ветки: dev + test) |
| Транспорт | REST (сейчас); WebSocket для real-time досок (Фаза 7) |
| Auth | JWT (access + refresh), bcrypt, refresh-токены в БД |
| Тулинг | tsx (dev), vitest (тесты), oxlint (линт), tsc (typecheck) |

**Решение по рендерингу:** CSR, не SSR. Приложение приватное (за логином), SEO не нужен — главная выгода SSR не работает. Держать auth так, чтобы легко перевести на httpOnly-куки, если SSR понадобится точечно позже.

---

## Структура бэка (слоистая, по модулям)

```
backend/src/
  index.ts              # точка входа: app.listen + запуск cron
  app.ts                # сборка express: cors, json, роутеры, error-middleware
  config/
    env.ts              # zod-валидация env (.env / .env.test по NODE_ENV)
  db/
    index.ts            # drizzle-клиент (neon-http)
    schema/             # таблицы drizzle (users, projects, refreshTokens, projectMembers, ...)
  modules/              # фичи вертикально
    auth/               # auth.schema/service/controller/routes + token.service
    projects/           # projects.schema/service/controller/routes
  middleware/
    auth.middleware.ts       # requireAuth — проверка JWT, кладёт req.userId
    membership.middleware.ts # requireMembership — грузит роль в проекте, кладёт req.membership
    error.middleware.ts      # глобальный обработчик ошибок
  utils/
    jwt.ts              # sign/verify access & refresh
    hash.ts             # sha256 для refresh-токенов
    errors.ts           # AppError + наследники (400/401/403/404/409)
    permissions.ts      # can() — матрица прав (чистая функция)
  jobs/
    cleanup.ts          # cron: удаление протухших refresh-токенов
  types/
    express.d.ts        # augmentation Request: userId, membership
```

**Принцип модулей:** фичу видишь целиком в одной папке (`modules/auth`, `modules/projects`), а не размазанной по `controllers/`/`services/`. Масштабируется лучше при росте.

---

## Поток запроса

```
route → requireAuth → [requireMembership] → controller → service → db
                                                 ↓ (при ошибке)
                                          error-middleware → JSON + HTTP-код
```

**Ответственности слоёв:**
- **route** — путь + метод, навешивает middleware
- **middleware** — auth (кто ты), membership (какая роль в проекте)
- **controller** — zod-парсинг тела, читает `req.userId`/`req.params`/`req.membership`, зовёт service, формирует ответ. **Без try/catch** (Express 5 сам ловит async-ошибки → error-middleware)
- **service** — бизнес-логика + drizzle. Бросает типизированные ошибки (`AppError`). Не знает про `req`/`res`
- **error-middleware** — ловит `ZodError` (→400), `AppError` (→ его statusCode), прочее (→500 без деталей клиенту)

**Личность всегда из токена** (`req.userId`), никогда из тела запроса.

---

## Auth (готово)

- `POST /auth/register` — регистрация (+ автологин)
- `POST /auth/login` — логин
- `POST /auth/refresh` — обновление пары токенов (ротация)
- `POST /auth/logout` — выход (требует requireAuth)

**Токены:**
- access — 15m, летает в заголовке `Authorization: Bearer`, проверяется `requireAuth`
- refresh — 7d, хранится в БД как **sha256-хэш** (таблица `refresh_tokens`), поддерживает ревокацию
- **Ротация:** каждый `/refresh` выдаёт новую пару, старый refresh удаляется (детекция кражи)
- отдельные секреты для access/refresh
- cron чистит протухшие refresh-токены (`expires_at < now()`)

---

## Модель ролей и прав

### Роли проекта (`project_members.role`, enum)

| Роль | Права |
|------|-------|
| **owner** | полный контроль; изменение/удаление проекта; управление участниками и ролями; создание секций; передача владения (transfer). Один на проект, передаётся |
| **member** | создаёт доски (в доступных секциях), владеет своими досками; редактирует **контент** (карточки) в любой доступной доске. Секции НЕ создаёт |
| **viewer** | только чтение (в перспективе — + комментарии) |

Роль `admin` осознанно **не вводили** для v1: делегирование покрывается owner + owner-transfer, полные права на ресурс — авторством. Легко добавить позже (расширить enum).

### Авторство ресурса (второй слой, Фазы 4-5)

`createdBy` на секциях/досках: кто создал — владеет ресурсом + дочерними. Иерархия наследования:
```
project owner → всё ниже
section автор  → секция + её доски
board автор   → доска + её сущности
```

### Структура vs контент

- **Структура** (создать/изменить/удалить секции и доски) — по роли/авторству. member трогает только своё
- **Контент** (карточки, позиции внутри досок) — любой участник с доступом, даже в чужой доске

### Механизм проверки (централизованный)

- **`requireMembership` middleware** — грузит роль юзера в проекте **один раз** за запрос → `req.membership.role`. Не участник → 403
- **`can(role, action, ctx?)`** — чистая функция, вся матрица прав в одном месте, без БД. `default: false` (fail-closed)
- Авторство проверяется на уже загруженном ресурсе (0 доп. запросов)

Модель = проверенный Trello/Asana-подход (owner ≈ admin, member ≈ normal, viewer ≈ observer + авторство ≈ board-admin + section.visibility ≈ board privacy).

---

## Модель данных

```
users
projects (ownerId)
  ├ project_members (role: owner/member/viewer)      # Фаза 2
  └ sections (createdBy, visibility: public/private)  # Фаза 4
      ├ section_access (кто видит private-секцию)     # Фаза 4
      └ boards (createdBy)                             # Фаза 5
          └ columns                                    # Фаза 6
              └ cards
refresh_tokens (userId, tokenHash, expiresAt)         # готово
invitations (email / ссылка)                          # Фаза 3
notifications                                          # Фаза 8
```

**Правило связей:** one-to-many → FK на стороне «многих» (`sections.projectId`, `boards.sectionId`, ...). Junction-таблица только для many-to-many (`project_members`, `section_access`).

**Секции — видимость:** автор при создании выбирает `public` (видна всем участникам) или `private` (только автор + приглашённые через `section_access`). owner видит все секции всегда.

**Транзакции:** neon-http драйвер **не поддерживает интерактивные транзакции** — используем `db.batch([...])` с пред-сгенеренным uuid (`crypto.randomUUID()`) для атомарных мультивставок. Для настоящих транзакций позже — сменить на neon-serverless Pool (WebSocket).

---

## Roadmap (фазы)

| Фаза | Что | Статус |
|------|-----|--------|
| **0** | Инфра (env, drizzle, neon, vitest, oxlint) + Auth + error-handling + cron | ✅ готово |
| **0** | Logger (pino) | ⏳ начато, не докончено |
| **1** | Проекты CRUD (IDOR закрыт) | ✅ готово |
| **2** | `project_members` + роли + `requireMembership`/`can()` + управление участниками + owner-transfer | ⏳ в процессе |
| **3** | Приглашения (email + ссылка: одноразовая/безлимитная) | ⬜ |
| **4** | Секции проекта (+ visibility, section_access) | ⬜ |
| **5** | Доски (в секциях, createdBy) | ⬜ |
| **6** | Канбан: колонки + карточки (drag-drop, позиции) | ⬜ |
| **7** | Real-time (WebSocket, комнаты по доске) | ⬜ |
| **8** | Уведомления (своя система) | ⬜ |

**Порядок фронт/бэк:** добить бэк до Фазы 5-6, потом фронт параллельно. Real-time (Фаза 7) требует оба стека одновременно.

### Фаза 2 — детализация (текущая)

- [x] схема `project_members` (enum owner/member/viewer, unique (projectId, userId))
- [x] `createProject` вставляет owner-membership (db.batch, атомарно)
- [x] `requireMembership` middleware
- [ ] `can()` — матрица прав (в процессе)
- [ ] навесить `requireMembership` + `can()` на роуты проектов
- [ ] перевести проверки getById/update/delete со скоупа `ownerId` на роль/membership
- [ ] эндпоинты: добавить/удалить участника, сменить роль, список участников
- [ ] `transferOwnership`

---

## Конвенции

- **Ошибки:** сервисы бросают `AppError`-наследников (`ConflictError`, `NotFoundError`, `ForbiddenError`, ...), не голый `Error`. Контроллеры без try/catch — ловит error-middleware
- **Валидация:** zod-схема на вход каждого эндпоинта. Схема = только тело клиента (личность/id — из токена/params, не из body)
- **Типы:** input-типы из zod (`z.infer`), типы сущностей БД из drizzle (`$inferSelect`/`$inferInsert`). Не смешивать
- **Именование:** колонки БД snake_case, поля кода camelCase (drizzle маппит); таблицы — множественное число; переменные функций — camelCase
- **env:** только через `config/env.ts` (zod-валидация на старте), не `process.env` напрямую. `.env` / `.env.test` по `NODE_ENV`
- **Тесты:** vitest, отдельная Neon test-ветка (`.env.test`), `import * as` для namespace-импортов
- **Линт/типы:** `npm run lint` + `npm run typecheck` перед завершением задачи

---

## Открытые задачи / хвосты

- ⚠️ **Security:** утечка git-истории (`node_modules` в истории) + ротация секретов — не закрыто (тяжёлая операция, репо публичный, отложено)
- Logger (pino) — начат, не докончен
- `.env.test` — креды test-ветки Neon протухли (password auth failed), нужен свежий connection string
- Централизованный helper для `req.userId` guard (дублируется в контроллерах)
- Тесты на сервисы с правами (Фаза 2 критична для покрытия)
- Очистка: `type Project` мёртвые экспорты, консистентность имён переменных (`projectMemberTable` vs таблица `project_members`)
