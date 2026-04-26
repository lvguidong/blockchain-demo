# Blockchain Visualization Demo

> An interactive, visual introduction to blockchain concepts built with React, Canvas, and Vite.

[中文文档](README.zh-CN.md)

[![Vite](https://img.shields.io/badge/Vite-5.0+-646CFF?logo=vite)](https://vitejs.dev/)
[![React](https://img.shields.io/badge/React-18+-61DAFB?logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-3178C6?logo=typescript)](https://www.typescriptlang.org/)

## Problem

Core blockchain concepts — hash functions, proof of work, chain structure, distributed consensus — are highly abstract. Existing tools either present static text or passive diagrams. This project solves:

| Pain point in the original demo | How this project improves |
|---|---|
| Outdated jQuery + Bootstrap 3 stack | React + TypeScript + Vite |
| No visual link between blocks; chain structure inferred from raw hex values | Canvas-drawn arrows connect each block's hash to the next block's prev-hash |
| Mining completes instantly; user sees nothing | Canvas particle animation + slot-machine nonce rolling simulate the mining process |
| Distributed network is a flat side-by-side list; no topology sense | Node topology with broadcast flight animations + fork-and-resolve simulation |
| No i18n | English / 中文 toggle in navbar |
| Dark theme only | Light / Dark one-click toggle, persisted to localStorage |

## Features

### 1. Hash — SHA256 Hash Function
- Real-time hash computation as you type
- Leading zeros highlighted in gold, character flip animation on change
- Avalanche effect comparison (two nearly-identical inputs, wildly different outputs)
- Particle flow animation from input to output

### 2. Block — Single Block Mining
- Interactive block card: Number, Nonce, Data, PrevHash, Hash
- Adjustable difficulty slider (number of leading zeros)
- Mining: nonce rolls rapidly (slot machine effect) + particle surge
- Success: fireworks + green flash

### 3. Blockchain — Chain Structure
- Multiple blocks laid out horizontally with Canvas arrows between them
- Tamper any block's data — the entire downstream chain turns red with a "BROKEN CHAIN" label
- One-click "Fix Chain" re-mines from the tampered block, demonstrating the cost of tampering
- Dynamic "Add Block" button

### 4. Distributed — Network Consensus
- 3-peer triangular topology diagram
- Connection lines colored by sync status (green / yellow / red)
- Mine on any peer → broadcast flight animation to all others
- Simulate fork → resolve consensus → longest chain wins

### 5. Tokens — Token Transfer
- Account avatars with animated balances
- Select sender / receiver / amount to transfer
- Token flight animation from sender to receiver
- Recent transaction history

### 6. Coinbase — Mining Rewards & Halving
- Spinning gear animation as the mining rig
- Coin drop animation + balance increase on successful mine
- Halving progress bar: reward halves periodically (50 → 25 → 12.5 → ... BTC)

## Tech Stack

| Layer | Technology | Purpose |
|---|---|---|
| Build | Vite | Dev server, HMR, production bundling |
| Framework | React 18 + TypeScript | Components, type safety |
| Routing | React Router v6 | Client-side navigation |
| State | Zustand | Lightweight global state |
| i18n | i18next + react-i18next | English / Chinese translations |
| Crypto | Web Crypto API | Native browser SHA256 |
| Animation | Canvas 2D + requestAnimationFrame | Particles, flights, connections |
| Styling | CSS Modules | Component-scoped styles |

## Quick Start

### Prerequisites

- Node.js >= 18
- npm >= 9

### Install

```bash
npm install
```

### Development

```bash
npm run dev
```

Open `http://localhost:5173/` in your browser. Supports hot module replacement.

### Build

```bash
npm run build
```

Output goes to `dist/` — optimized static files ready for deployment.

### Preview Production

```bash
npm run preview
```

## Architecture

### Canvas Rendering Layers

```
┌─────────────────────────────────────┐
│  Canvas Animation Layer (z:2)       │
│  particles, fireworks, flights      │  ← redrawn every rAF, pointer-events: none
├─────────────────────────────────────┤
│  React DOM Components (z:1)         │
│  BlockCard, inputs, buttons         │  ← user interaction layer
├─────────────────────────────────────┤
│  Canvas Static Layer (z:0)          │
│  arrows, connections, topology      │  ← only redrawn when data changes
└─────────────────────────────────────┘
```

### State Flow

```
User Action (React DOM)
    │
    ▼
Zustand Store Update
    │
    ├──► Component Re-render (DOM updates)
    │
    └──► CanvasLayer.onStaticDraw triggers
            │
            ▼
         Canvas 2D redraw (arrows / connections / nodes)
            │
            ▼
         ParticleSystem continuous animation (requestAnimationFrame)
```

### Theme Toggle

CSS variables are defined in `globals.css` under two selectors:

```css
:root, [data-theme='dark'] { /* dark palette */ }
[data-theme='light'] { /* light palette */ }
```

The Zustand `useThemeStore` calls `document.documentElement.setAttribute('data-theme', theme)`. Every component using CSS variables adapts automatically. The choice is persisted to `localStorage`.

### i18n

- `i18next` detects the browser language on first load, falls back to English
- Every page uses the `useTranslation()` hook via the `t()` function
- Translation files live in `src/i18n/locales/`
- Language selection is persisted to `localStorage`

## Extending

### Add a new language

1. Create a new directory under `src/i18n/locales/` (e.g. `ja/`) with a `translation.json`
2. Register it in `src/i18n/index.ts` under `resources`
3. Add an entry to the `LANGUAGES` array in `src/components/Navbar/index.tsx`

### Add a new page

1. Create a folder under `src/pages/` with `index.tsx` + `*.module.css`
2. Add a route in `src/App.tsx`
3. Add a nav item in `src/components/Navbar/index.tsx`
4. Add translation keys in both `en` and `zh` locale files

### Add a new Canvas effect

1. Add a new `emit*` method in `src/components/ParticleSystem/index.ts`
2. Add color constants in `src/config/canvas.ts`
3. Call the new emit method from a page's `onAnimDraw` callback

## License

MIT
