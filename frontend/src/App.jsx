import { useState, useEffect } from 'react';
import socket, { BACKEND } from './socket';
import LobbyScreen  from './components/LobbyScreen';
import GameBoard    from './components/GameBoard';
import RoundResult  from './components/RoundResult';
import EndScreen    from './components/EndScreen';

export default function App() {
  const [phase, setPhase]         = useState('lobby');   // lobby | playing | result | end
  const [roomCode, setRoomCode]   = useState('');
  const [sessionId, setSessionId] = useState(null);
  const [players, setPlayers]     = useState([]);
  const [roundData, setRoundData] = useState(null);
  const [resultData, setResultData] = useState(null);
  const [endData, setEndData]     = useState(null);
  const [qrData, setQrData]       = useState({ qr: null, url: '' });
  const [connected, setConnected] = useState(socket.connected);

  // ── Socket lifecycle ──────────────────────────────────────────────────────
  useEffect(() => {
    socket.on('connect',    () => setConnected(true));
    socket.on('disconnect', () => setConnected(false));

    socket.on('playerJoined',      ({ players }) => setPlayers(players));
    socket.on('playerStatusUpdate', ({ players }) => setPlayers(players));
    socket.on('playerDisconnected', ({ username }) => {
      setPlayers(prev => prev.map(p =>
        p.username === username ? { ...p, isReady: false } : p
      ));
    });

    socket.on('roundStart', (data) => {
      setRoundData(data);
      setResultData(null);
      setPhase('playing');
    });

    socket.on('roundResult', (data) => {
      setResultData({ ...data, type: 'winner' });
      setPhase('result');
    });

    socket.on('roundTimeout', (data) => {
      setResultData({ ...data, type: 'timeout' });
      setPhase('result');
    });

    socket.on('gameEnd', (data) => {
      setEndData(data);
      setPhase('end');
    });

    return () => socket.removeAllListeners();
  }, []);

  // ── Create room on mount ──────────────────────────────────────────────────
  useEffect(() => {
    socket.emit('createRoom', { hostDevice: navigator.userAgent }, async (res) => {
      if (res.success) {
        setRoomCode(res.roomCode);
        setSessionId(res.sessionId);

        // Fetch QR code
        try {
          const r = await fetch(`${BACKEND}/api/qr/${res.roomCode}`);
          const d = await r.json();
          setQrData({ qr: d.qr, url: d.url });
        } catch (_) {}
      }
    });
  }, []);

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handleStartGame = () => {
    socket.emit('startGame', { roomCode }, (res) => {
      if (!res?.success) alert(res?.error || 'Could not start game');
    });
  };

  const handlePlayAgain = () => {
    // Re-create room
    window.location.reload();
  };

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <>
      {phase === 'lobby' && (
        <LobbyScreen
          roomCode={roomCode}
          qrData={qrData}
          players={players}
          connected={connected}
          onStart={handleStartGame}
        />
      )}

      {(phase === 'playing' || phase === 'result') && roundData && (
        <>
          <GameBoard
            roundData={roundData}
            players={players}
            resultData={phase === 'result' ? resultData : null}
          />
          {phase === 'result' && resultData && (
            <RoundResult
              resultData={resultData}
              roundData={roundData}
            />
          )}
        </>
      )}

      {phase === 'end' && endData && (
        <EndScreen endData={endData} onPlayAgain={handlePlayAgain} />
      )}
    </>
  );
}
