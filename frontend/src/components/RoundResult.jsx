export default function RoundResult({ resultData, roundData }) {
  const isTimeout = resultData.type === 'timeout';

  return (
    <div className="result-overlay">
      <div className="result-card">
        {isTimeout ? (
          <>
            <div className="result-card__crown">⏰</div>
            <div className="result-card__timeout">Time's Up!</div>
            <div style={{ marginTop: 12 }}>
              <span style={{ fontSize: '2.5rem' }}>{resultData.correctItem?.emoji}</span>
            </div>
            <div style={{ marginTop: 8, color: 'var(--muted)' }}>
              The answer was <strong style={{ color: 'var(--text)' }}>{resultData.correctItem?.name}</strong>
            </div>
          </>
        ) : (
          <>
            <div className="result-card__crown">👑</div>
            <div className="result-card__label">Winner!</div>
            <div className="result-card__winner">{resultData.winnerName}</div>
            <div className="result-card__item">{resultData.correctItem?.emoji}</div>
            <div style={{ color: 'var(--muted)' }}>
              Found <strong style={{ color: 'var(--text)' }}>{resultData.correctItem?.name}</strong>
            </div>
            <div className="result-card__time">
              ⚡ {(resultData.responseTime / 1000).toFixed(2)}s
            </div>
          </>
        )}

        <div className="result-card__scores" style={{ marginTop: 20, display: 'flex', gap: 16, justifyContent: 'center' }}>
          {(resultData.scores || []).map(p => (
            <div key={p.playerId} style={{
              background: 'var(--surface2)', borderRadius: 10,
              padding: '8px 20px', textAlign: 'center'
            }}>
              <div style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>{p.username}</div>
              <div style={{ fontSize: '1.6rem', fontWeight: 900 }}>{p.score}</div>
            </div>
          ))}
        </div>

        <div className="result-card__next">
          {roundData.roundNumber < roundData.totalRounds
            ? `⏭ Round ${roundData.roundNumber + 1} starting…`
            : '🏁 Final round — results coming up!'}
        </div>
      </div>
    </div>
  );
}
