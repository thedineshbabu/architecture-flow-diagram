# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What This Is

An interactive React app that visualizes architecture flows from a JSON config. Nodes (services, databases, queues) are rendered as a graph with animated particle edges showing data flow.

## Commands

- `npm run dev` — runs Vite dev server (port 5173) + Express API server (port 3001) concurrently
- `npm run build` — TypeScript check + Vite production build
- `npm run lint` — ESLint
- `npm run preview` — build then serve from Express (port 3001)
- `npm run dev:api` — API server only

No test framework is configured.

## Architecture

**Frontend (React 19 + TypeScript + Vite):**
- `src/App.tsx` — top-level component, wires together modals and canvas
- `src/hooks/useArchitectureData.ts` — central state hook: fetches config, manages CRUD for nodes/edges, saves via API, validates with Zod
- `src/utils/transformConfig.ts` — converts `ArchitectureConfig` into `@xyflow/react` `Node[]`/`Edge[]`
- `src/components/graph/` — custom xyflow node types (`ServiceNode`, `DatabaseNode`, `QueueNode`) and `AnimatedFlowEdge`, registered in `nodeTypes.ts`
- `src/components/ui/` — modals for add/edit/delete operations
- `src/components/layout/` — Header, Legend, EditToolbar
- `src/types/architecture.ts` — core types (`ArchitectureNode`, `ArchitectureEdge`, `ArchitectureConfig`) and xyflow node data types

**Backend (`server.mjs` — Express, port 3001):**
- `GET /api/architecture` — reads `public/architecture.json`
- `PUT /api/architecture` — writes `public/architecture.json`
- In production build, also serves `dist/` as static files

**Data flow:** `public/architecture.json` → Zod validation → `useArchitectureData` state → `transformConfig` → xyflow nodes/edges → `ArchitectureCanvas`. Edits modify hook state; "Save to JSON" PUTs back to API; "Download" exports client-side.

## Key Patterns

- Layout is computed by dagre (`src/hooks/useLayout.ts`) — nodes get `position: {x:0, y:0}` from transform, then dagre assigns real positions
- Edge IDs follow `edge-{index}` convention (index into config.edges array) — `deleteEdgeById` depends on this
- The frontend tries fetching `/architecture.json` (Vite static) first, falls back to `/api/architecture`
- Tailwind CSS with a dark slate/navy theme throughout
