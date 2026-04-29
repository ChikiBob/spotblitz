import { useState, useEffect, useRef } from 'react';
import socket from './socket';
import JoinScreen    from './components/JoinScreen';
import WaitingScreen from './components/WaitingScreen';
import AnswerGrid    from './components/AnswerGrid';
import ResultScreen  from './components/ResultScreen';

export default function App() {
  const [phase, setPhase]         = useState('join');   // join|waiting|playing|result
  const [myInfo, setMyInfo]       = useState(null);     // { playerId, username, roomCode }
  const [players, setPlayers]     = useState([]);
  const [roundData, setRoundData] = useState(null);
  const [resultData, setResultData] = useState(null);
  const [myScore, setMyScore]     = useState(0);
  const [feedback, setFeedback]   = useState(null);     // null | 'correct' | 'wrong' | 'timeout'
  const [cooldown, setCooldown]   = useState(false);
  const cooldownRef = useRef(null);

  // Auto-fill room code from URL ?room=XXXXX
  const urlRoom = new URLSearchParams(window.location.search).get('room') || '';

  // ── Socket events ──────────────────────────────────────────────────────────
  useEffect(() => {
    socket.on('playerJoined',       ({ players }) => setPlayers(players));
    socket.on('playerStatusUpdate', ({ players }) => setPlayers(players));

    socket.on('playerDisconnected', ({ username }) => {
      setPlayers(prev => prev.filter(p => p.username !== username));
    });

    socket.on('hostDisconnected', () => {
      alert('Host disconnected. The game has ended.');
      window.location.reload();
    });

    socket.on('roundStart', (data) => {
      setRoundData(data);
      setFeedback(null);
      setCooldown(false);
      // Update my score from scores list
      if (myInfo) {
        const me = data.scores?.find(s => s.playerId === myInfo.playerId);
        if (me) setMyScore(me.score);
      }
      setPhase('playing');
    });

    socket.on('roundResult', (data) => {
      const isWinner = data.winnerId === myInfo?.playerId;
      setFeedback(isWinner ? 'correct' : 'roundover');
      // Update my score
      const me = data.scores?.find(s => s.playerId === myInfo?.playerId);
      if (me) setMyScore(me.score);

      setTimeout(() => {
        setFeedback(null);
        setPhase('playing'); // will be replaced by next roundStart
      }, 3200);
    });

    socket.on('roundTimeout', (data) => {
      setFeedback('timeout');
      const me = data.scores?.find(s => s.playerId === myInfo?.playerId);
      if (me) setMyScore(me.score);

      setTimeout(() => {
        setFeedback(null);
        setPhase('playing');
      }, 3200);
    });

    socket.on('wrongAnswer', ({ playerId, cooldown: ms }) => {
      if (myInfo && playerId === myInfo.playerId) {
        setCooldown(true);
        if (cooldownRef.current) clearTimeout(cooldownRef.current);
        cooldownRef.current = setTimeout(() => setCooldown(false), ms);
      }
    });

    socket.on('gameEnd', (data) => {
      setResultData(data);
      setPhase('result');
    });

    socket.on('disconnect', () => {
      // Try to reconnect
      if (myInfo) {
        socket.once('connect', () => {
          socket.emit('reconnectPlayer', {
            playerId: myInfo.playerId,
            roomCode: myInfo.roomCode,
          }, (res) => {
            if (res?.success && res.syncData) {
              const { syncData } = res;
              if (syncData.status === 'playing' && syncData.currentRound) {
                setRoundData({
                  ...syncData.currentRound,
                  roundNumber: syncData.roundNumber,
                  totalRounds: 5,
                  timeLimit: Math.floor(syncData.currentRound.timeRemaining / 1000),
                  scores: syncData.scores,
                });
                setPhase('playing');
              }
            }
          });
        });
      }
    });

    return () => socket.removeAllListeners();
  }, [myInfo]);

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handleJoin = (roomCode, username, playerId) => {
    setMyInfo({ roomCode, username, playerId });
    setPhase('waiting');
  };

  const handleReady = () => {
    if (!myInfo) return;
    socket.emit('playerReady', { roomCode: myInfo.roomCode, playerId: myInfo.playerId });
  };

  const handleAnswer = (itemId) => {
    if (!myInfo || !roundData || cooldown) return;
    socket.emit('sendAnswer', {
      roomCode: myInfo.roomCode,
      playerId: myInfo.playerId,
      itemId,
    });
  };

  const handlePlayAgain = () => window.location.reload();

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="m-screen">
      {phase === 'join' && (
        <JoinScreen urlRoom={urlRoom} onJoin={handleJoin} />
      )}

      {phase === 'waiting' && myInfo && (
        <WaitingScreen
          myInfo={myInfo}
          players={players}
          onReady={handleReady}
        />
      )}

      {phase === 'playing' && roundData && (
        <AnswerGrid
          roundData={roundData}
          myInfo={myInfo}
          myScore={myScore}
          cooldown={cooldown}
          feedback={feedback}
          onAnswer={handleAnswer}
        />
      )}

      {phase === 'result' && resultData && myInfo && (
        <ResultScreen
          endData={resultData}
          myPlayerId={myInfo.playerId}
          onPlayAgain={handlePlayAgain}
        />
      )}
    </div>
  );
}
