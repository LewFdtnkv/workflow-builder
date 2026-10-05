# Flowcraft Frontend

React-приложение для проектирования и запуска workflow. Собрано на Vite, TypeScript, SCSS, Redux Toolkit и TanStack Query; структура следует FSD.

![Интерфейс Flowcraft](docs/images/frontend-editor.svg)

## Возможности

- визуальный редактор узлов Start, HTTP, Condition и Result;
- drag-and-drop, соединения, масштабирование, undo/redo;
- шаблоны, импорт и экспорт JSON;
- валидация, запуск и история выполнения;
- регистрация, вход и работа с защищённым API;
- кэширование статических ассетов через nginx в production-сборке.

## Архитектура

В браузере работает React-клиент, который обращается к API по REST. В Docker Compose
nginx отдаёт production-сборку frontend и проксирует `/api` в Spring Boot backend.
Backend хранит пользователей и workflow в PostgreSQL, проверяет граф перед запуском и
выполняет HTTP-узлы только для публичных `http`/`https` адресов.

```text
Браузер → React / Vite → nginx → Spring Boot API → PostgreSQL
                                    │
                                    └→ публичные HTTP API
```

## Пример workflow

Можно собрать сценарий проверки доступности внешнего сервиса:

```text
Start → HTTP (GET https://example.com) → Condition (статус 200) → Result
```

Создайте узлы на рабочем поле, соедините их в указанном порядке, в HTTP-узле
задайте публичный URL и метод `GET`, а в Condition укажите ожидаемый статус `200`.
После сохранения нажмите **Run**: результат запуска и возможная ошибка появятся в
истории выполнения workflow.

## Локальная разработка

Требуется Node.js 22+.

```bash
npm ci
npm run dev
```

Vite запустит приложение на `http://localhost:5173`. Чтобы обращаться к backend напрямую, создайте `.env` из `.env.example` и задайте:

```env
VITE_API_URL=http://localhost:8081
```

Без `VITE_API_URL` frontend обращается к `/api`, что подходит для nginx в Docker Compose.

## Команды

```bash
npm run lint
npm run lint:fix
npm run format
npm run format:check
npm run build
npm run preview
npm run test:e2e
```

E2E-тесты запускаются в Chromium через Playwright. Перед первым локальным запуском установите браузер: `npx playwright install chromium`.

## Pre-commit

Husky запускает `lint-staged` перед каждым коммитом: изменённые TypeScript/JavaScript-файлы проходят ESLint и Prettier, а SCSS, JSON, Markdown и YAML — Prettier. После первого `git init` выполните `npm install`, чтобы активировать hook.

## Production-запуск

Для запуска frontend вместе с API и PostgreSQL используйте Docker Compose из корня проекта:

```bash
docker compose up --build
```

Приложение будет доступно на `http://localhost:8080`. Nginx проксирует `/api` в backend. Документация API находится в [backend/README.md](backend/README.md).

## Документация кода

Документация серверного API генерируется Doxygen из JavaDoc-совместимых комментариев.
При установленном Doxygen выполните из корня репозитория:

```bash
cd docs/doxygen
doxygen Doxyfile
```

HTML и RTF-результаты появятся в `docs/doxygen/output/`.

## Структура

```text
src/
  app/          # providers, Redux store
  pages/        # страницы
  widgets/      # композиционные блоки интерфейса
  features/     # сценарии редактора и авторизация
  entities/     # модель и API workflow
  shared/       # HTTP-клиент, стили, утилиты
```
