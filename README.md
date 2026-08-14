# Sign2Graph

Sign2Graph is a web-based AI and computer-vision learning tool that turns an
air-written mathematical or scientific expression into either an interactive
graph or a structured formula lesson.

## Start locally

### Requirements

- Node.js with npm
- A modern browser with webcam permission and MediaPipe WebAssembly support
- A webcam for air-writing; a mouse can still operate the rest of the interface
- `GEMINI_API_KEY` for AI recognition and generated explanations

Install dependencies and start the development server:

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). To run the production
build locally:

```bash
npm run build
npm run start
```

Create `.env.local` in the repository root when using Gemini:

```text
GEMINI_API_KEY=your-key-here
```

Without the key, the local geometric recognizer remains available, but the
Gemini recognition and general AI explanation paths report that the key is
missing. Known local formula fallbacks and deterministic graph explanations can
still be used where supported.

## What is included

- Next.js 15.3.2, React 19, TypeScript, and client-side state management
- MediaPipe Tasks Vision hand landmarks for webcam tracking
- ONNX Runtime Web and the bundled `public/models/math-symbols.onnx` symbol model
- A geometric stroke recognizer with correction and handwriting-profile learning
- Gemini 3.1 Flash-Lite through server routes for multimodal recognition and
  structured explanation plans
- `mathjs` expression evaluation and sampling for explicit and implicit graphs
- SVG graph rendering, KaTeX equation rendering, browser speech synthesis, and
  local browser storage for sessions and preferences
- Automated tests for gesture stabilization, expression normalization, graph
  sampling, and explanation fallbacks

## Motivation

Many graphing tools show a result without showing how the result was built.
Sign2Graph explores a more spatial, step-by-step way to learn: a student can
write an expression in the air, see it interpreted, and follow the relationship
through visual changes, readable equations, and optional narration. Feedback
from interviews with neurodivergent learners and learners with different
attention, processing, and hearing needs, together with consultation with
specialists, influenced the focus on short steps, visible text, replayable
controls, and multiple representations. The project is educational software,
not a medical product.

## Repository description tags

`AI` `computer-vision` `hand-tracking` `mathematics` `STEM` `EdTech`
`accessibility` `Next.js` `Gemini` `graphing`

## Useful commands

```bash
npm test
npm run format:check
npm run build
```

`npm run lint` is retained in the package scripts, but current Next.js tooling
may treat `next lint` as deprecated or interactive. The checks above are the
repeatable local verification path.
