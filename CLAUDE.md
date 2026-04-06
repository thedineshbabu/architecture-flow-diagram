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
- `src/hooks/useArchitectureData.ts` — central state hook: fetches config, manages CRUD for nodes/edges/diagrams, undo/redo (50-step history), saves via API, validates with Zod
- `src/utils/transformConfig.ts` — converts `ArchitectureConfig` into `@xyflow/react` `Node[]`/`Edge[]`
- `src/components/graph/` — custom xyflow node types (`ServiceNode`, `DatabaseNode`, `QueueNode`, `DatadogNode`), `AnimatedFlowEdge`, `DeleteSelectedPanel`, registered in `nodeTypes.ts`
- `src/components/ui/` — modals for add/edit/delete operations on nodes and edges
- `src/components/layout/` — Header, Legend, EditToolbar, `DiagramSwitcher` (create/duplicate/delete diagrams), `SearchBar`
- `src/types/architecture.ts` — core types (`ArchitectureNode`, `ArchitectureEdge`, `ArchitectureConfig`) and xyflow node data types; `NodeType` includes `'ui' | 'service' | 'database' | 'queue'`

**Backend (`server.mjs` — Express, port 3001):**
- `GET /api/diagrams` — lists all diagrams; `GET /api/diagrams/:id` — reads `public/diagrams/{id}.json`
- `PUT /api/diagrams/:id` — writes diagram; `DELETE /api/diagrams/:id` — deletes diagram
- Legacy `GET|PUT /api/architecture` endpoints redirect to `diagrams/default.json`; `public/architecture.json` is auto-migrated to `public/diagrams/default.json` on first start
- In production build, also serves `dist/` as static files

**Data flow:** `public/diagrams/{id}.json` → Zod validation → `useArchitectureData` state → `transformConfig` → xyflow nodes/edges → `ArchitectureCanvas`. Edits modify hook state; "Save to JSON" PUTs back to API; "Download" exports client-side.

## Key Patterns

- Layout is computed by dagre (`src/hooks/useLayout.ts`) — nodes get `position: {x:0, y:0}` from transform, then dagre assigns real positions
- Edge IDs follow `edge-{index}` convention (index into config.edges array) — both `deleteEdgeById` and `deleteEdgeByIndex` depend on this mapping
- Undo/redo history is capped at 50 steps; every `setConfig` call that changes state pushes to `undoStack` and clears `redoStack`
- The frontend tries fetching `/architecture.json` (Vite static) first, falls back to `/api/architecture`
- Tailwind CSS with a dark slate/navy theme throughout
