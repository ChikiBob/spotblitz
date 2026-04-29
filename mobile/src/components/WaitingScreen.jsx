import { useState } from 'react';

export default function WaitingScreen({ myInfo, players, onReady }) {
  const [isReady, setIsReady] = useState(false);

  const handleReady = () => {
    if (isReady) return;
    setIsReady(true);
    onReady();
    // Haptic feedback
    if (navigator.vibrate) navigator.vibrate(80);
  };

  const allReady = players.length === 2 && players.every(p => p.isReady);

  return (
    <div className="waiting-screen">
      <div className="waiting-avatar">🎮</div>
      <div className="waiting-name">{myInfo.username}</div>
      <div className="waiting-room">
        Room: <strong style={{ color: 'var(--accent2)', letterSpacing: 4 }}>{myInfo.roomCode}</strong>
      </div>

      {/* Player list */}
      <div className="player-list">
        {[0, 1].map(i => {
          const p = players[i];
          const isMe = p?.username === myInfo.username;
          return (
            <div
              key={i}
              className={`waiting-player ${isMe ? 'is-me' : ''} ${p?.isReady ? 'is-ready' : ''}`}
            >
              <span className="waiting-player__icon">{i === 0 ? '🎮' : '🕹️'}</span>
              {p ? (
                <>
                  <span className="waiting-player__name">
                    {p.username} {isMe && <span style={{ color: 'var(--accent2)', fontSize: '0.8rem' }}>(you)</span>}
                  </span>
                  <span className={`waiting-player__badge ${p.isReady ? 'badge-ready' : 'badge-waiting'}`}>
                    {p.isReady ? '✓ Ready' : 'Waiting'}
                  </span>
                </>
              ) : (
                <span style={{ color: 'var(--muted)', fontStyle: 'italic' }}>Waiting for player…</span>
              )}
            </div>
          );
        })}
      </div>

      {/* Status message */}
      <div className="waiting-status">
        {allReady
          ? '✅ All ready! Waiting for host to start…'
          : isReady
          ? '✅ You\'re ready! Waiting for other player…'
          : `${2 - players.length > 0 ? `Waiting for ${2 - players.length} more player(s)…` : 'Press Ready when you\'re set!'}`}
      </div>

      {/* Ready button */}
      <div style={{ width: '100%' }}>
        <button
          id="ready-btn"
          className="btn btn-primary"
          onClick={handleReady}
          disabled={isReady}
          style={{ opacity: isReady ? 0.6 : 1 }}
        >
          {isReady ? '✅ Ready!' : '🟢 I\'m Ready'}
        </button>
      </div>

      <p className="text-muted text-center" style={{ fontSize: '0.8rem' }}>
        The host will start the game once all players are ready
      </p>
    </div>
  );
}
