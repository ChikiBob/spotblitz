import { useState } from 'react';
import socket from '../socket';

export default function JoinScreen({ urlRoom, onJoin }) {
  const [username, setUsername] = useState('');
  const [roomCode, setRoomCode] = useState(urlRoom);
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    const name = username.trim();
    const room = roomCode.trim().toUpperCase();

    if (!name)            return setError('Please enter your name');
    if (name.length > 20) return setError('Name must be 20 characters or less');
    if (!room)            return setError('Please enter the room code');
    if (room.length !== 6) return setError('Room code must be 6 characters');

    setLoading(true);
    setError('');

    const deviceId = localStorage.getItem('spotblitz_device') || (() => {
      const id = `dev_${Math.random().toString(36).substring(2)}`;
      localStorage.setItem('spotblitz_device', id);
      return id;
    })();

    socket.emit('joinRoom', { roomCode: room, username: name, deviceId }, (res) => {
      setLoading(false);
      if (res.success) {
        localStorage.setItem('spotblitz_player', JSON.stringify({ playerId: res.playerId, username: res.username }));
        onJoin(room, res.username, res.playerId);
      } else {
        setError(res.error || 'Could not join room');
      }
    });
  };

  return (
    <div className="join-screen">
      <div className="join-logo"><span>⚡</span> SpotBlitz</div>
      <p className="text-muted text-center" style={{ fontSize: '0.9rem', marginTop: '-12px' }}>
        Scan the QR code or enter room code to play
      </p>

      <form className="join-form" onSubmit={handleSubmit}>
        <div className="input-group">
          <label htmlFor="username">Your Name</label>
          <input
            id="username"
            className="m-input"
            type="text"
            placeholder="e.g. Player 1"
            value={username}
            onChange={e => setUsername(e.target.value)}
            maxLength={20}
            autoComplete="off"
            autoCapitalize="words"
          />
        </div>

        <div className="input-group">
          <label htmlFor="roomCode">Room Code</label>
          <input
            id="roomCode"
            className="m-input room-code-input"
            type="text"
            placeholder="XXXXXX"
            value={roomCode}
            onChange={e => setRoomCode(e.target.value.toUpperCase())}
            maxLength={6}
            autoComplete="off"
            autoCapitalize="characters"
          />
        </div>

        {error && <div className="error-msg">⚠️ {error}</div>}

        <button
          id="join-btn"
          type="submit"
          className="btn btn-primary"
          disabled={loading}
        >
          {loading ? <><span className="spinner" style={{ width: 20, height: 20, borderWidth: 3 }} /> Joining…</> : '🎮 Join Game'}
        </button>
      </form>

      <p className="text-muted text-center" style={{ fontSize: '0.78rem' }}>
        Make sure you're on the same WiFi as the host
      </p>
    </div>
  );
}
