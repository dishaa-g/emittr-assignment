# Workflow Builder UI

A single-page workflow builder that supports **Action**, **Branch**, and **End** nodes, plus a non-deletable **Start** root.

## Features
- Tree layout with visual connectors (no diagramming libraries)
- Add nodes via a context menu on connection points
- Delete any node except the Start node
  - Deleting an Action connects its parent to the Action's next node
  - Deleting a Branch reconnects the parent to:
    - the only non-empty child (if exactly one path is populated), or
    - a replacement Branch node that preserves multiple paths
- Inline editing of node labels
- Save: logs the full workflow JSON to the browser console
- Undo/Redo (Ctrl/Cmd+Z, Ctrl/Cmd+Y or Ctrl/Cmd+Shift+Z)

## Tech
- React (functional components + hooks)
- TypeScript
- CSS only (no UI libraries, no animation libraries)

## Run locally
```bash
npm install
npm run dev
```

## Build
```bash
npm run build
npm run preview
```

## Data model
The workflow is stored as a normalized graph:
- `rootId`: id of the Start node
- `nodes`: `Record<id, node>`

Nodes:
- `start` / `action`: `{ next: string | null }`
- `branch`: `{ branches: Array<{ id, label, childId }> }`
- `end`: no outgoing edges
