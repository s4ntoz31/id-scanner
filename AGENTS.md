# ID Scanner App

React + TypeScript + Vite ID document scanner with 4-point perspective cropping and A4 export.

## Build Commands

```bash
npm run dev      # Start dev server (http://localhost:5173)
npm run build    # TypeScript + Vite build  
npm run lint     # ESLint
npm run preview  # Preview production build
```

## Workflow (4 Steps)

1. **Front Work** - Upload → Crop → Rotate (↺/↻) → Done/Retake → auto-advance
2. **Back Work** - Upload → Crop → Rotate (↺/↻) → Done/Retake → auto-advance
3. **Signature Work** - Upload → Crop → Rotate (↺/↻) → BG Remove → Done/Retake/Skip → auto-advance
4. **Preview** - A4 canvas + draggable signature → Export PNG/PDF

## Architecture

- **Entry**: `src/main.tsx` → `src/app/App.tsx`
- **State**: 4-step workflow (`front-work` → `back-work` → `signature-work` → `preview`)
- **Perspective Transform**: Web Worker (`src/app/workers/perspective.worker.ts`)
- **Signature BG Removal**: `@imgly/background-removal` (lazy loaded, ~24MB WASM)
- **PDF Export**: `jspdf` renders canvas directly to A4

## Key Files

- `src/app/types/index.ts` - Step definitions (STEP_ORDER, STEP_LABELS)
- `src/app/App.tsx` - Main app with 4-step workflow, processPerspective callback
- `src/app/components/WorkScreen.tsx` - Unified upload → crop → rotate → done/retake/skip
- `src/app/components/CropScreen.tsx` - 4-point corner drag with live preview
- `src/app/components/PreviewScreen.tsx` - A4 canvas + draggable signature overlay
- `src/app/workers/perspective.worker.ts` - Perspective transform via Web Worker

## UI/UX

- **ALWAYS use UI/UX Pro Max skill** for design/UI changes: `skill ui-ux-pro-max`
- Theme: Dark mode with gold accent (#CA8A04), Playfair Display + Inter fonts
- Back button: positioned absolute left in header
- Step indicator: centered above title

## Gotchas

- `@imgly/background-removal` is heavy (~24MB) - lazy loaded via dynamic import in signature-work
- Rotation happens in WorkScreen using canvas (not corner rotation) - handles 0/90/180/270°
- Draggable signature: Uses pointer events, position stored in state, redraws on export
- Signature step has optional skip - passes null to PreviewScreen which handles gracefully
- Worker message handlers must be removed after each transform to avoid memory leaks

## Lint/Type Rules

- ESLint uses flat config (`eslint.config.js`)
- TypeScript must pass (`tsc -b`) before build
- Check with: `npx tsc -b --noEmit`

## Common Tasks

- Add new step: Update `STEP_ORDER` and `STEP_LABELS` in `types/index.ts`
- Adjust corner handle style: Edit `drawOnCanvas()` in `CropScreen.tsx`
- Move signature position: Edit `sigPos` state in `PreviewScreen.tsx`
- Change output dimensions: Edit A4_WIDTH/A4_HEIGHT constants in `PreviewScreen.tsx`