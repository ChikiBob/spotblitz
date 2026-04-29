export default function LobbyScreen({ roomCode, qrData, players, connected, onStart }) {
  const allReady = players.length === 2 && players.every(p => p.isReady);
  const canStart = players.length === 2;

  return (
    <div className="screen lobby">
      {/* Header */}
      <div className="lobby__logo">
        <span>⚡</span> SpotBlitz
      </div>
      <p style={{ color: 'var(--muted)', marginTop: '-20px', fontSize: '0.9rem' }}>
        Multiplayer Spotting Game
        <span
          title={connected ? 'Server connected' : 'Disconnected'}
          style={{ marginLeft: 12 }}
        >
          <span className={`conn-dot ${connected ? 'connected' : 'disconnected'}`} />
          {connected ? 'Live' : 'Offline'}
        </span>
      </p>

      <div className="lobby__body">
        {/* Left: Room Code + QR */}
        <div className="lobby__left">
          <div className="room-code-box">
            <div className="room-code-box__label">Room Code</div>
            <div className="room-code-box__code">{roomCode || '------'}</div>
          </div>

          {qrData.qr ? (
            <div className="qr-box">
              <img src={qrData.qr} alt="QR Code to join" />
            </div>
          ) : (
            <div className="card" style={{ width: '100%', textAlign: 'center', color: 'var(--muted)' }}>
              Generating QR…
            </div>
          )}

          {qrData.url && (
            <p className="lobby__hint">
              Scan QR or go to<br />
              <strong style={{ color: 'var(--accent2)', wordBreak: 'break-all' }}>{qrData.url}</strong>
            </p>
          )}
        </div>

        {/* Right: Players + Start */}
        <div className="lobby__right">
          <h3>Players ({players.length}/2)</h3>

          {[0, 1].map(i => {
            const p = players[i];
            return (
              <div
                key={i}
                className={`player-slot ${p ? 'connected' : ''} ${p?.isReady ? 'ready' : ''}`}
              >
                <span className="player-slot__num">{i === 0 ? '🎮' : '🕹️'}</span>
                {p ? (
                  <>
                    <span className="player-slot__name">{p.username}</span>
                    <span className={`player-slot__badge ${p.isReady ? 'badge-ready' : 'badge-waiting'}`}>
                      {p.isReady ? 'Ready' : 'Waiting…'}
                    </span>
                  </>
                ) : (
                  <span className="player-slot__empty">Waiting for player…</span>
                )}
              </div>
            );
          })}

          <div className="card" style={{ fontSize: '0.85rem', color: 'var(--muted)', lineHeight: 1.7 }}>
            <strong style={{ color: 'var(--text)', display: 'block', marginBottom: 8 }}>📖 How to Play</strong>
            • A target item will be shown at the top<br />
            • Find it on your phone as fast as possible<br />
            • First correct tap wins the round<br />
            • Wrong tap = 2 second cooldown<br />
            • 5 rounds — highest score wins!
          </div>

          <button
            className="btn btn-primary"
            onClick={onStart}
            disabled={!canStart}
            style={{ fontSize: '1.1rem', padding: '14px 0', width: '100%' }}
          >
            {!canStart
              ? `⏳ Waiting for ${2 - players.length} more player${players.length === 1 ? '' : 's'}`
              : allReady
              ? '🚀 Start Game!'
              : '▶ Start Game (players not ready)'}
          </button>
        </div>
      </div>
    </div>
  );
}
