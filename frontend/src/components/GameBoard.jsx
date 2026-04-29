import { useEffect, useRef, useState } from 'react';

export default function GameBoard({ roundData, players, resultData }) {
  const { items, targetItem, timeLimit, roundNumber, totalRounds, scores } = roundData;
  const [timeLeft, setTimeLeft]   = useState(timeLimit);
  const [highlight, setHighlight] = useState(null); // itemId to highlight
  const timerRef = useRef(null);

  // Countdown timer
  useEffect(() => {
    setTimeLeft(timeLimit);
    if (timerRef.current) clearInterval(timerRef.current);

    timerRef.current = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) { clearInterval(timerRef.current); return 0; }
        return t - 1;
      });
    }, 1000);

    return () => clearInterval(timerRef.current);
  }, [roundData, timeLimit]);

  // Highlight correct item when result comes in
  useEffect(() => {
    if (resultData) {
      setHighlight(resultData.correctItemId);
      clearInterval(timerRef.current);
    }
  }, [resultData]);

  const urgent    = timeLeft <= 10;
  const pct       = (timeLeft / timeLimit) * 100;
  const circumf   = 2 * Math.PI * 36;
  const strokeDash = (pct / 100) * circumf;

  // Score lookup
  const scoreMap = {};
  (scores || []).forEach(s => { scoreMap[s.playerId] = s; });

  return (
    <div className="screen game">
      {/* Header */}
      <div className="game__header">
        {/* Scores */}
        <div className="game__scores">
          {(players || []).map((p, i) => {
            const s = (scores || []).find(sc => sc.username === p.username);
            return (
              <div key={p.playerId || i} className="score-chip">
                <span className="score-chip__name">{i === 0 ? '🎮' : '🕹️'} {p.username}</span>
                <span className="score-chip__score">{s?.score ?? 0}</span>
              </div>
            );
          })}
        </div>

        {/* Round info */}
        <div className="game__round-info">
          Round <strong>{roundNumber}</strong> / {totalRounds}
        </div>

        {/* Timer SVG ring */}
        <div className="timer-ring">
          <svg width="80" height="80" viewBox="0 0 80 80">
            <circle cx="40" cy="40" r="36" fill="none" stroke="var(--surface2)" strokeWidth="6" />
            <circle
              cx="40" cy="40" r="36" fill="none"
              stroke={urgent ? 'var(--red)' : 'var(--accent)'}
              strokeWidth="6"
              strokeDasharray={`${strokeDash} ${circumf}`}
              strokeLinecap="round"
              transform="rotate(-90 40 40)"
              style={{ transition: 'stroke-dasharray 1s linear' }}
            />
          </svg>
          <span className={`timer-ring__num ${urgent ? 'urgent' : ''}`}>{timeLeft}</span>
        </div>
      </div>

      {/* Target Banner */}
      <div className="target-banner">
        <span className="target-banner__label">Find →</span>
        <span className="target-banner__emoji">{targetItem?.emoji}</span>
        <span className="target-banner__item">{targetItem?.name}</span>
        <span style={{ fontSize: '0.8rem', color: 'var(--muted)', marginLeft: 8 }}>
          ({targetItem?.category})
        </span>
      </div>

      {/* Item Grid */}
      <div className="item-grid">
        {items.map((item, idx) => {
          const isCorrect = highlight === item.id;
          const isWrong   = resultData && resultData.correctItemId !== item.id && false; // host doesn't show wrong
          return (
            <div
              key={item.id}
              className={`item-card ${isCorrect ? 'item-card--correct' : ''} ${isWrong ? 'item-card--wrong' : ''}`}
              style={{ animationDelay: `${idx * 40}ms` }}
            >
              <span className="item-card__emoji">{item.emoji}</span>
              <span className="item-card__name">{item.name}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
