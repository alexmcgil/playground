# Playground

Локальное приложение на React + NestJS: карточки и генератор текста.
Нужны Node.js 24 и pnpm 12.

```sh
pnpm install
pnpm dev
```

- http://127.0.0.1:4310/cards — карточки.
- http://127.0.0.1:4310/runtime — генератор.
- API: `127.0.0.1:4311`, Node Inspector: `127.0.0.1:9230`.

Ctrl+C останавливает приложение. Изменения кода подхватываются автоматически.
Карточки хранятся в памяти API и сбрасываются при его перезапуске.
Генератор использует локальную заглушку; внешние сервисы и ключи не нужны.

Для отладки запустите `pnpm dev`, затем выберите в VS Code
**Playground: browser + server** и нажмите F5.

## Проверки

```sh
pnpm check
pnpm build
pnpm test
pnpm exec playwright install chromium
pnpm test:browser
```

Browser-тесты сами запускают приложение; перед ними остановите `pnpm dev`.
Для установленного Chromium:
`CHROMIUM_PATH=/path/to/chromium pnpm test:browser`.

Сборка создаётся в `dist/`; `pnpm build` не запускает сервер раздачи фронта.
