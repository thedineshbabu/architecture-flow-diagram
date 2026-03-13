# Architecture Flow Diagram

An attractive, animated React application that visualizes architecture flows from a JSON configuration. Services, databases, and queues are rendered as nodes with animated particles flowing along edges to show request/response movement.

## Features

- **Add nodes** – Click "Add Node" to create services, databases, or queues
- **Edit nodes** – Double-click a node to edit its label, type, and description
- **Add connections** – Click "Add Connection" to link nodes
- **Delete** – Select a node or edge and press Delete (or Backspace)
- **Save to JSON** – Click "Save to JSON" to persist changes to `architecture.json`
- **Download** – Use "Download" to export the current config as a file
- **Interactive graph** – Zoom, pan, and explore your architecture
- **Animated flow** – Particles move along edges to visualize data flow
- **Custom node types** – Service, Database, and Queue with distinct styling
- **Dark theme** – Modern navy/slate aesthetic with glassmorphism
- **Responsive** – Works on desktop, tablet, and mobile
- **JSON-driven** – Edit `public/architecture.json` to define your architecture

## Quick Start

```bash
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

The dev server runs both the Vite dev server and the API server. The API server (port 3001) handles reading and writing `public/architecture.json` so edits persist.

## Configuration

Edit `public/architecture.json` to define your architecture:

```json
{
  "title": "My Platform Architecture",
  "subtitle": "Request flow across microservices",
  "nodes": [
    {
      "id": "api-gateway",
      "label": "API Gateway",
      "type": "service",
      "description": "Entry point for all requests"
    }
  ],
  "edges": [
    {
      "source": "api-gateway",
      "target": "auth-service",
      "label": "JWT validation",
      "flowDirection": "bidirectional"
    }
  ]
}
```

### Node Types

- `service` – Microservices (cyan accent)
- `database` – Databases (emerald accent)
- `queue` – Message queues / caches (amber accent)

### Edge Properties

- `source` / `target` – Node IDs
- `label` – Optional edge label
- `flowDirection` – `unidirectional` or `bidirectional`

## Tech Stack

- **React 19** + **TypeScript** + **Vite**
- **@xyflow/react** – Graph visualization
- **Framer Motion** – Animations
- **Tailwind CSS** – Styling
- **Dagre** – Automatic layout
- **Zod** – Schema validation

## Build

```bash
npm run build
npm run preview
```
