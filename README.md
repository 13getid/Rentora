# Rentora

Multi-tenant rental management for residential buildings (Kenya). Final-year project.

## Run it

```bash
npm install          # installs every workspace at once
npm run dev          # style guide at http://localhost:5173
npm run typecheck
npm run build
```

## Layout

```
apps/web          React + Vite + TypeScript + Tailwind v4
packages/shared   enums/types used by web and (from Phase 3) the API
```

## Phase 2 rules

- Colours, fonts and shadows come from tokens in `apps/web/src/index.css`. No raw hex in components.
- Intensity ladder: tables/forms flat, cards 1px, key blocks 2px border + hard shadow, one cut-corner panel per page.
- Mock data lives only in `apps/web/src/mocks/` and is replaced by the real API later.
