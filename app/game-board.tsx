"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

type Team = "attackers" | "defenders";
type Position = { row: number; col: number };
type Piece = Position & { id: string; team: Team };
type GameResult = { winner: Team; reason: string } | null;

const BOARD_SIZE = 7;
const INITIAL_PIECES: Piece[] = [
  { id: "guard-1", team: "defenders", row: 3, col: 1 },
  { id: "guard-2", team: "defenders", row: 3, col: 3 },
  { id: "guard-3", team: "defenders", row: 3, col: 5 },
  { id: "runner-1", team: "attackers", row: 6, col: 2 },
  { id: "runner-2", team: "attackers", row: 6, col: 4 },
];

const directions: Position[] = [
  { row: -1, col: 0 },
  { row: 1, col: 0 },
  { row: 0, col: -1 },
  { row: 0, col: 1 },
];

function getLegalMoves(piece: Piece, pieces: Piece[]) {
  return directions
    .map(({ row, col }) => ({ row: piece.row + row, col: piece.col + col }))
    .filter(
      ({ row, col }) =>
        row >= 0 &&
        row < BOARD_SIZE &&
        col >= 0 &&
        col < BOARD_SIZE &&
        !pieces.some(
          (other) =>
            other.row === row &&
            other.col === col &&
            (piece.team === "attackers" || other.team === "defenders"),
        ),
    );
}

function ArrowIcon({ direction }: { direction: "up" | "down" | "left" | "right" }) {
  const paths = {
    up: "M12 19V5m0 0-6 6m6-6 6 6",
    down: "M12 5v14m0 0 6-6m-6 6-6-6",
    left: "M19 12H5m0 0 6 6m-6-6 6-6",
    right: "M5 12h14m0 0-6-6m6 6-6 6",
  };

  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" fill="none">
      <path d={paths[direction]} />
    </svg>
  );
}

function TeamMark({ team, small = false }: { team: Team; small?: boolean }) {
  return (
    <span
      aria-hidden="true"
      className={`team-mark team-mark--${team}${small ? " team-mark--small" : ""}`}
    >
      {team === "attackers" ? "A" : "D"}
    </span>
  );
}

export default function GameBoard() {
  const [pieces, setPieces] = useState<Piece[]>(INITIAL_PIECES);
  const [turn, setTurn] = useState<Team>("attackers");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [moveCount, setMoveCount] = useState(0);
  const [result, setResult] = useState<GameResult>(null);
  const [notice, setNotice] = useState("");

  const selectedPiece = pieces.find((piece) => piece.id === selectedId) ?? null;
  const legalMoves = useMemo(
    () => (selectedPiece ? getLegalMoves(selectedPiece, pieces) : []),
    [pieces, selectedPiece],
  );
  const legalKeySet = useMemo(
    () => new Set(legalMoves.map(({ row, col }) => `${row}-${col}`)),
    [legalMoves],
  );
  const attackersLeft = pieces.filter((piece) => piece.team === "attackers").length;
  const defendersLeft = pieces.filter((piece) => piece.team === "defenders").length;

  const resetGame = useCallback(() => {
    setPieces(INITIAL_PIECES.map((piece) => ({ ...piece })));
    setTurn("attackers");
    setSelectedId(null);
    setMoveCount(0);
    setResult(null);
    setNotice("A fresh round is ready. Attackers move first.");
  }, []);

  const moveSelectedPiece = useCallback(
    (destination: Position) => {
      if (!selectedPiece || result || !legalKeySet.has(`${destination.row}-${destination.col}`)) {
        return;
      }

      const captured = pieces.find(
        (piece) =>
          piece.team === "attackers" &&
          piece.row === destination.row &&
          piece.col === destination.col,
      );
      const movedPieces = pieces
        .filter((piece) => piece.id !== captured?.id)
        .map((piece) =>
          piece.id === selectedPiece.id
            ? { ...piece, row: destination.row, col: destination.col }
            : piece,
        );
      const nextTurn = turn === "attackers" ? "defenders" : "attackers";
      const escaped = selectedPiece.team === "attackers" && destination.row === 0;
      const allCaptured = !movedPieces.some((piece) => piece.team === "attackers");

      setPieces(movedPieces);
      setMoveCount((count) => count + 1);
      setSelectedId(null);

      if (escaped) {
        setResult({ winner: "attackers", reason: "A runner reached the far bank." });
        setNotice("Attackers win! A runner made it across the board.");
      } else if (allCaptured) {
        setResult({ winner: "defenders", reason: "Every runner has been tagged." });
        setNotice("Defenders win! Every runner has been tagged.");
      } else {
        setTurn(nextTurn);
        setNotice(
          captured
            ? `${selectedPiece.team === "defenders" ? "Defenders tagged a runner." : "A runner was tagged."} ${nextTurn === "attackers" ? "Attackers" : "Defenders"} to move.`
            : `${nextTurn === "attackers" ? "Attackers" : "Defenders"} to move.`,
        );
      }
    },
    [legalKeySet, pieces, result, selectedPiece, turn],
  );

  const moveInDirection = useCallback(
    (direction: Position) => {
      if (!selectedPiece || result) {
        if (!result) setNotice("Choose one of your pieces first.");
        return;
      }
      moveSelectedPiece({
        row: selectedPiece.row + direction.row,
        col: selectedPiece.col + direction.col,
      });
    },
    [moveSelectedPiece, result, selectedPiece],
  );

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      const directionByKey: Record<string, Position> = {
        ArrowUp: { row: -1, col: 0 },
        ArrowDown: { row: 1, col: 0 },
        ArrowLeft: { row: 0, col: -1 },
        ArrowRight: { row: 0, col: 1 },
      };
      const direction = directionByKey[event.key];
      if (!direction) return;

      const target = event.target;
      if (
        target instanceof HTMLElement &&
        (target.closest("input, textarea, select, [contenteditable='true']") ||
          target.closest("button[aria-label='Copy practice room code DARIYA-24']"))
      ) {
        return;
      }
      event.preventDefault();
      moveInDirection(direction);
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [moveInDirection]);

  const copyRoomCode = async () => {
    try {
      await navigator.clipboard.writeText("DARIYA-24");
      setNotice("Practice room code copied.");
    } catch (error) {
      console.error("Could not copy the practice room code.", error);
      setNotice("Could not copy the room code. Select DARIYA-24 to copy it manually.");
    }
  };

  function handleCellClick(row: number, col: number) {
    const piece = pieces.find((item) => item.row === row && item.col === col);
    if (piece?.team === turn && !result) {
      setSelectedId(piece.id);
      setNotice(`${piece.team === "attackers" ? "Attacker" : "Defender"} selected. Choose a highlighted point.`);
      return;
    }
    if (legalKeySet.has(`${row}-${col}`)) {
      moveSelectedPiece({ row, col });
      return;
    }
    if (piece && piece.team !== turn) {
      setNotice("That piece belongs to the other side.");
    } else if (!result) {
      setSelectedId(null);
      setNotice("Choose one of your pieces to see its legal moves.");
    }
  }

  return (
    <main className="app-shell">
      <header className="topbar">
        <a className="brand" href="#" aria-label="Dariyabandha home">
          <span className="brand-mark">D</span>
          <span className="brand-name">dariya<span>bandha</span></span>
        </a>
        <nav className="topnav" aria-label="Main navigation">
          <a className="topnav-link topnav-link--active" href="#game">Play</a>
          <a className="topnav-link" href="#how-to-play">How to play</a>
          <button className="room-pill" onClick={copyRoomCode} type="button" aria-label="Copy practice room code DARIYA-24">
            <span className="room-dot" />
            <span>ROOM</span>
            <strong>DARIYA-24</strong>
            <svg aria-hidden="true" viewBox="0 0 20 20" fill="none">
              <rect x="7" y="7" width="9" height="10" rx="1.5" />
              <path d="M13 7V5.5A1.5 1.5 0 0 0 11.5 4h-6A1.5 1.5 0 0 0 4 5.5v7A1.5 1.5 0 0 0 5.5 14H7" />
            </svg>
          </button>
        </nav>
        <button className="profile-button" type="button" aria-label="Your profile">R</button>
      </header>

      <section className="intro" id="game">
        <div className="intro-copy">
          <div className="eyebrow"><span /> THE CLASSIC COURTYARD GAME</div>
          <h1>Outthink.<br /><span>Outrun.</span> Outplay.</h1>
          <p>One board. Two sides. A little salt, a lot of strategy.</p>
        </div>
        <div className="round-card">
          <span className="round-label">PRACTICE ROUND</span>
          <div className="round-details">
            <div className="round-avatars"><TeamMark team="attackers" small /><TeamMark team="defenders" small /></div>
            <div><strong>{result ? "Round complete" : "Local match"}</strong><span>Just you, testing your tactics</span></div>
          </div>
          <span className="round-number">01</span>
        </div>
      </section>

      <section className="game-layout" aria-label="Practice game">
        <div className="board-panel">
          <div className="board-topline">
            <div className="turn-indicator">
              <span className={`turn-dot turn-dot--${result ? result.winner : turn}`} />
              <div>
                <span className="turn-label">{result ? "ROUND FINISHED" : "NOW PLAYING"}</span>
                <strong>{result ? `${result.winner === "attackers" ? "Attackers" : "Defenders"} win` : `${turn === "attackers" ? "Attackers" : "Defenders"}’ turn`}</strong>
              </div>
            </div>
            <div className="moves-count"><span>PLAYS</span><strong>{String(moveCount).padStart(2, "0")}</strong></div>
          </div>

          <div className={`board-wrap${result ? " board-wrap--finished" : ""}`}>
            <div className="bank-label bank-label--top"><span>SAFE BANK</span><span className="bank-arrow">↑</span></div>
            <div
              className="game-grid"
              role="grid"
              aria-label="Seven by seven Dariyabandha board. Attackers escape at the safe bank."
            >
              {Array.from({ length: BOARD_SIZE }, (_, row) =>
                Array.from({ length: BOARD_SIZE }, (_, col) => {
                  const piece = pieces.find((item) => item.row === row && item.col === col);
                  const key = `${row}-${col}`;
                  const isLegal = legalKeySet.has(key);
                  const isSelected = piece?.id === selectedId;
                  return (
                    <button
                      key={key}
                      type="button"
                      role="gridcell"
                      className={`board-cell${piece ? ` board-cell--${piece.team}` : ""}${isLegal ? " board-cell--legal" : ""}${isSelected ? " board-cell--selected" : ""}`}
                      onClick={() => handleCellClick(row, col)}
                      aria-label={`${String.fromCharCode(65 + col)}${BOARD_SIZE - row}${piece ? `, ${piece.team === "attackers" ? "attacker" : "defender"}` : ""}${isLegal ? ", legal move" : ""}${isSelected ? ", selected" : ""}`}
                      aria-selected={isSelected}
                      aria-disabled={Boolean(result) || (!piece && !isLegal)}
                      tabIndex={piece?.team === turn || isLegal ? 0 : -1}
                    >
                      {piece ? <span className={`piece piece--${piece.team}`}><span>{piece.team === "attackers" ? "A" : "D"}</span></span> : <span className="board-node" />}
                      {isLegal && <span className="legal-dot" />}
                    </button>
                  );
                }),
              )}
            </div>
            <div className="bank-label bank-label--bottom"><span>STARTING BANK</span></div>
          </div>

          <div className="board-footer">
            <div className="legend">
              <span><TeamMark team="attackers" small /> Attackers <b>{attackersLeft}</b></span>
              <span><TeamMark team="defenders" small /> Defenders <b>{defendersLeft}</b></span>
            </div>
            <span className="turn-hint">{result ? result.reason : selectedPiece ? "Choose a highlighted point" : "Select a piece to move"}</span>
          </div>
        </div>

        <aside className="side-panel">
          <section className="side-card turn-card">
            <div className="card-kicker"><span className={`turn-dot turn-dot--${result ? result.winner : turn}`} /> {result ? "ROUND OVER" : "YOUR MOVE"}</div>
            <h2>{result ? "Well played." : turn === "attackers" ? "Make a run." : "Hold the line."}</h2>
            <p>{result ? result.reason : selectedPiece ? "Move to a highlighted point on the board." : turn === "attackers" ? "Get a runner to the safe bank at the top." : "Block the routes and tag the runners."}</p>
            <div className="side-divider" />
            <div className="control-title"><span>MOVE WITH</span><kbd>↑</kbd><kbd>←</kbd><kbd>↓</kbd><kbd>→</kbd></div>
            <div className="dpad" aria-label="Touch movement controls">
              <span className="dpad-spacer" />
              <button type="button" onClick={() => moveInDirection({ row: -1, col: 0 })} aria-label="Move up"><ArrowIcon direction="up" /></button>
              <span className="dpad-spacer" />
              <button type="button" onClick={() => moveInDirection({ row: 0, col: -1 })} aria-label="Move left"><ArrowIcon direction="left" /></button>
              <span className="dpad-center" aria-hidden="true" />
              <button type="button" onClick={() => moveInDirection({ row: 0, col: 1 })} aria-label="Move right"><ArrowIcon direction="right" /></button>
              <span className="dpad-spacer" />
              <button type="button" onClick={() => moveInDirection({ row: 1, col: 0 })} aria-label="Move down"><ArrowIcon direction="down" /></button>
              <span className="dpad-spacer" />
            </div>
            <div className="keyboard-note">Select a piece, then use the arrows or direction pad.</div>
            <button type="button" className="new-game-button" onClick={resetGame}>
              <svg aria-hidden="true" viewBox="0 0 20 20" fill="none"><path d="M16.5 8A6.5 6.5 0 1 0 17 11m-.5-7v4h-4" /></svg>
              New game
              <span>↗</span>
            </button>
          </section>

          <section className="side-card rules-card" id="how-to-play">
            <div className="rules-heading"><span className="rules-icon">i</span><h2>Quick rules</h2></div>
            <ol>
              <li><span>01</span><p><strong>Take turns</strong> Move one piece at a time, one point along a line.</p></li>
              <li><span>02</span><p><strong>Run or defend</strong> Attackers head north; defenders block the way.</p></li>
              <li><span>03</span><p><strong>Tag to win</strong> Defenders capture by moving onto an attacker. Reach the top to escape.</p></li>
            </ol>
          </section>
        </aside>
      </section>

      <footer className="page-footer">
        <span><span className="footer-mark">D</span> A little tradition, a lot of tactics.</span>
        <span>Made for the next generation of players.</span>
      </footer>

      <div className="sr-only" role="status" aria-live="polite">{notice}</div>
    </main>
  );
}
