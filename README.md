# Dariyabandha

A responsive, browser-playable practice board for **Dariyabandha** (also known as the salt-smuggling grid game): attackers try to cross the court while defenders guard the lines and tag them.

The current app is a local, turn-based practice game. It focuses on the board, clear rules, and touch-friendly controls; it does not yet include online multiplayer, accounts, or saved matches.

## Features

- Seven-by-seven intersection board with alternating attacker and defender turns.
- Legal one-point orthogonal moves, highlighted after selecting a piece.
- Defenders capture an attacker by moving onto its point.
- Attackers win by reaching the safe bank; defenders win by tagging every attacker.
- Arrow-key and on-screen direction-pad controls, plus direct board selection.
- New-game reset, live turn and piece counts, and a copyable practice-room code.
- Responsive layout, keyboard focus states, and a live announcement for game updates.
- A cool mist, deep teal, and coral palette with layouts that adapt from desktop to narrow mobile screens.

## Getting started

### Requirements

- Node.js compatible with the installed Next.js version.
- npm (the repository includes `package-lock.json`).

### Install and run

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to play. To verify a production build:

```bash
npm run lint
npm run build
npm run start
```

## How to play

1. Attackers take the first turn. Select one of your pieces on the board.
2. Select one of the highlighted neighboring intersections, or use an arrow key / direction control.
3. Turns alternate between sides. Pieces move one intersection at a time along the grid lines.
4. Attackers cannot move onto an occupied point. Defenders may move onto an attacker to tag it.
5. An attacker reaching the top safe bank wins. Defenders win when every attacker has been tagged.
6. Choose **New game** to restore the opening positions.

These are the rules implemented by this practice-board prototype; local Dariyabandha rulesets may vary.

## Project structure

```text
app/
  game-board.tsx  Interactive client-side game state, rules, and board controls
  globals.css     Palette, board styling, and responsive layouts
  layout.tsx      Root document and page metadata
  page.tsx        Home route
```

## Technology

- Next.js App Router
- React
- TypeScript
- Tailwind CSS 4 (loaded in `app/globals.css`, with focused custom CSS for the game board)

The home route stays a small server component and renders the interactive game as a client component. Game rules and UI state currently live in that client component, with no external state or service dependency.

## Multiplayer roadmap

The displayed `DARIYA-24` code is a copyable practice-room label only; it does not create or join a network room. A production multiplayer version would need a server-authoritative game model, validated move handling, room membership and authorization, and a real-time transport such as WebSockets or a managed realtime service. Persisted matches would additionally need a database and an explicit match-history policy.

## Accessibility and responsive behavior

Board points are buttons with descriptive labels, legal moves are announced visually and through assistive technology, and the game status is exposed as a live region. The desktop direction pad becomes unnecessary on small touch screens, where pieces can be moved by tapping the board. Reduced-motion preferences are respected.
