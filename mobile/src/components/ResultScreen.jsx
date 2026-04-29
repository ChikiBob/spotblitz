export default function ResultScreen({ endData, myPlayerId, onPlayAgain }) {
  const { players, winnerId, winnerName, isTie } = endData;
  const sorted   = [...players].sort((a, b) => b.score - a.score);
  const iAmWinner = winnerId === myPlayerId;

  return (
    <div className="result-screen">
      <div className="result-trophy">
        {isTie ? '🤝' : iAmWinner ? '🏆' : '🎮'}
      </div>

      <div className="result-title">
        {isTie ? "It's a Tie!" : iAmWinner ? 'You Win! 🎉' : 'Game Over'}
      </div>

      <div className={isTie ? 'result-tie' : 'result-winner'}>
        {isTie
          ? 'Both players scored equally — great match!'
          : iAmWinner
          ? 'Amazing spotting skills! 🌟'
          : `${winnerName} won this round. Better luck next time!`}
      </div>

      {/* Final scores */}
      <div className="result-scores">
        {sorted.map((p, i) => {
          const isMe     = p.playerId === myPlayerId;
          const isWinner = p.playerId === winnerId;
          return (
            <div
              key={p.playerId}
              className={`result-score-row ${isWinner ? 'is-winner' : ''} ${isMe ? 'is-me' : ''}`}
            >
              <span className="result-score-row__rank">
                {isWinner && !isTie ? '👑' : i === 0 && isTie ? '🤝' : i === 0 ? '🥇' : '🥈'}
              </span>
              <span className="result-score-row__name">
                {p.username} {isMe && <span style={{ color: 'var(--accent2)', fontSize: '0.8rem' }}>(you)</span>}
              </span>
              <span className="result-score-row__score">{p.score}</span>
            </div>
          );
        })}
      </div>

      <div style={{ width: '100%', marginTop: 8 }}>
        <button
          id="play-again-btn"
          className="btn btn-primary"
          onClick={onPlayAgain}
        >
          🔄 Play Again
        </button>
      </div>
    </div>
  );
}
