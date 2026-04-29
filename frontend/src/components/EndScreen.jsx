export default function EndScreen({ endData, onPlayAgain }) {
  const { players, winnerId, winnerName, isTie } = endData;
  const sorted = [...players].sort((a, b) => b.score - a.score);

  return (
    <div className="screen end-screen">
      <div className="end-screen__trophy">{isTie ? '🤝' : '🏆'}</div>

      <div className="end-screen__title">Game Over!</div>

      {isTie ? (
        <div className="end-screen__tie">It's a Tie! 🎉 Both players scored equally!</div>
      ) : (
        <div className="end-screen__winner">
          🥇 {winnerName} wins the match!
        </div>
      )}

      <div className="final-scores">
        {sorted.map((p, i) => (
          <div
            key={p.playerId}
            className={`final-score-card ${p.playerId === winnerId ? 'is-winner' : ''}`}
          >
            <div className="final-score-card__crown">
              {p.playerId === winnerId ? '👑' : i === 0 && isTie ? '🤝' : '🎮'}
            </div>
            <div className="final-score-card__name">{p.username}</div>
            <div className="final-score-card__score">{p.score}</div>
            <div className="final-score-card__label">points</div>
          </div>
        ))}
      </div>

      <button
        className="btn btn-primary"
        onClick={onPlayAgain}
        style={{ fontSize: '1.1rem', padding: '14px 40px' }}
      >
        🔄 Play Again
      </button>
    </div>
  );
}
