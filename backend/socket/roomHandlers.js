const gameState = require('../state/gameState');
const gameController = require('../controllers/gameController');

module.exports = function (io) {
  io.on('connection', (socket) => {
    console.log(`🔌 Connected: ${socket.id}`);

    // ─── HOST: Create Room ────────────────────────────────────────────────
    socket.on('createRoom', async (data, cb) => {
      try {
        const result = await gameController.createRoom(data?.hostDevice, socket.id);
        socket.join(result.roomCode);
        cb({ success: true, ...result });
      } catch (err) {
        cb({ success: false, error: err.message });
      }
    });

    // ─── PLAYER: Join Room ────────────────────────────────────────────────
    socket.on('joinRoom', async (data, cb) => {
      try {
        const { roomCode, username, deviceId } = data;
        const room = gameState.getRoom(roomCode);

        if (!room)                                return cb({ success: false, error: 'Room not found' });
        if (room.status !== 'waiting')            return cb({ success: false, error: 'Game already started' });
        if (room.players.filter(p => p.socketId).length >= 2)
                                                  return cb({ success: false, error: 'Room is full' });

        const result = await gameController.addPlayerToRoom(roomCode, username, deviceId, socket.id);
        socket.join(roomCode);

        io.to(roomCode).emit('playerJoined', {
          players: room.players.map(p => ({ username: p.username, isReady: p.isReady, playerId: p.playerId })),
        });

        cb({ success: true, playerId: result.playerId, username });
      } catch (err) {
        cb({ success: false, error: err.message });
      }
    });

    // ─── PLAYER: Ready Up ─────────────────────────────────────────────────
    socket.on('playerReady', async (data, cb) => {
      try {
        const { roomCode, playerId } = data;
        const room = gameState.getRoom(roomCode);
        if (!room) return cb?.({ success: false, error: 'Room not found' });

        const player = room.players.find(p => p.playerId === playerId);
        if (player) player.isReady = true;

        // Update DB
        await require('../config/db').execute(
          'UPDATE session_players SET is_ready = 1 WHERE session_id = ? AND player_id = ?',
          [room.sessionId, playerId]
        );

        const allReady = room.players.length === 2 && room.players.every(p => p.isReady);

        io.to(roomCode).emit('playerStatusUpdate', {
          players: room.players.map(p => ({ username: p.username, isReady: p.isReady, playerId: p.playerId })),
          allReady,
        });
        cb?.({ success: true, allReady });
      } catch (err) {
        cb?.({ success: false, error: err.message });
      }
    });

    // ─── HOST: Start Game ─────────────────────────────────────────────────
    socket.on('startGame', async (data, cb) => {
      try {
        const { roomCode } = data;
        const room = gameState.getRoom(roomCode);
        if (!room)                      return cb?.({ success: false, error: 'Room not found' });
        if (room.players.length < 2)    return cb?.({ success: false, error: 'Need 2 players' });

        room.status = 'playing';
        await gameController.updateSessionStatus(room.sessionId, 'ongoing');
        await gameController.logEvent(room.sessionId, 'game_start', 'Game started');

        await startNextRound(io, roomCode);
        cb?.({ success: true });
      } catch (err) {
        cb?.({ success: false, error: err.message });
      }
    });

    // ─── PLAYER: Send Answer ──────────────────────────────────────────────
    socket.on('sendAnswer', async (data) => {
      try {
        const { roomCode, playerId, itemId } = data;
        const room = gameState.getRoom(roomCode);
        if (!room || room.status !== 'playing')      return;
        if (!room.currentRound || room.currentRound.answered) return;

        const player = room.players.find(p => p.playerId === playerId);
        if (!player) return;

        // Cooldown guard (debounce wrong-answer spam)
        if (Date.now() < player.cooldownUntil) return;

        const responseTime = Date.now() - room.currentRound.startTime;
        const isCorrect = itemId === room.currentRound.targetItem.id;

        // Save to DB (async, non-blocking)
        gameController.saveAnswer(
          room.currentRound.roundId, playerId, itemId, isCorrect, responseTime
        ).catch(console.error);

        if (isCorrect) {
          room.currentRound.answered = true;
          clearTimeout(room.currentRound.timer);

          player.score += 100;
          gameController.updateScore(room.sessionId, playerId, player.score).catch(console.error);
          gameController.finalizeRound(room.currentRound.roundId, playerId, new Date()).catch(console.error);
          gameController.logEvent(
            room.sessionId, 'round_won',
            `Round ${room.roundNumber} won by ${player.username} in ${responseTime}ms`
          ).catch(console.error);

          io.to(roomCode).emit('roundResult', {
            winnerId:      playerId,
            winnerName:    player.username,
            correctItemId: room.currentRound.targetItem.id,
            correctItem:   room.currentRound.targetItem,
            responseTime,
            scores: room.players.map(p => ({ playerId: p.playerId, username: p.username, score: p.score })),
            roundNumber:   room.roundNumber,
          });

          // Auto-advance
          setTimeout(async () => {
            if (room.roundNumber >= room.totalRounds) await endGame(io, roomCode);
            else await startNextRound(io, roomCode);
          }, 3500);

        } else {
          // Wrong answer — 2-second cooldown
          player.cooldownUntil = Date.now() + 2000;
          socket.emit('wrongAnswer', { playerId, cooldown: 2000, selectedItemId: itemId });
        }
      } catch (err) {
        console.error('sendAnswer error:', err);
      }
    });

    // ─── PLAYER: Reconnect ────────────────────────────────────────────────
    socket.on('reconnectPlayer', async (data, cb) => {
      try {
        const { playerId, roomCode } = data;
        const result = gameState.reconnectPlayer(parseInt(playerId), socket.id);
        if (!result) return cb?.({ success: false, error: 'Session expired' });

        socket.join(roomCode);
        const { room } = result;

        cb?.({
          success: true,
          syncData: {
            status:      room.status,
            roundNumber: room.roundNumber,
            scores:      room.players.map(p => ({ playerId: p.playerId, username: p.username, score: p.score })),
            currentRound: room.currentRound ? {
              items:         room.currentRound.items,
              targetItem:    room.currentRound.targetItem,
              timeRemaining: Math.max(0, room.timeLimit * 1000 - (Date.now() - room.currentRound.startTime)),
            } : null,
          },
        });

        io.to(roomCode).emit('playerReconnected', { username: result.player.username });
      } catch (err) {
        cb?.({ success: false, error: err.message });
      }
    });

    // ─── Disconnect ───────────────────────────────────────────────────────
    socket.on('disconnect', () => {
      console.log(`🔌 Disconnected: ${socket.id}`);
      const found = gameState.findRoomBySocket(socket.id);
      if (!found) return;

      const { roomCode, room, isHost, player } = found;

      if (isHost) {
        io.to(roomCode).emit('hostDisconnected');
      } else if (player) {
        gameState.removePlayer(socket.id);
        io.to(roomCode).emit('playerDisconnected', { username: player.username });

        // Pause timer if not enough active players
        const active = room.players.filter(p => p.socketId);
        if (active.length < 2 && room.status === 'playing' && room.currentRound?.timer) {
          clearTimeout(room.currentRound.timer);
        }
      }
    });
  });
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function startNextRound(io, roomCode) {
  const room = gameState.getRoom(roomCode);
  if (!room) return;

  room.roundNumber += 1;
  const difficulty = Math.min(Math.ceil(room.roundNumber / 2), 3);

  const { items, targetItem, roundId } = await gameController.startRound(
    room.sessionId, room.roundNumber, difficulty
  );

  room.currentRound = {
    roundId,
    items,
    targetItem,
    startTime: Date.now(),
    answered: false,
    timer: null,
  };

  io.to(roomCode).emit('roundStart', {
    roundNumber:  room.roundNumber,
    totalRounds:  room.totalRounds,
    items,
    targetItem,
    timeLimit:    room.timeLimit,
    scores:       room.players.map(p => ({ playerId: p.playerId, username: p.username, score: p.score })),
  });

  // Timeout for unanswered rounds
  room.currentRound.timer = setTimeout(async () => {
    if (!room.currentRound || room.currentRound.answered) return;
    room.currentRound.answered = true;

    gameController.finalizeRound(room.currentRound.roundId, null, new Date()).catch(console.error);
    gameController.logEvent(room.sessionId, 'round_timeout', `Round ${room.roundNumber} timed out`).catch(console.error);

    io.to(roomCode).emit('roundTimeout', {
      correctItemId: room.currentRound.targetItem.id,
      correctItem:   room.currentRound.targetItem,
      scores:        room.players.map(p => ({ playerId: p.playerId, username: p.username, score: p.score })),
      roundNumber:   room.roundNumber,
    });

    setTimeout(async () => {
      if (room.roundNumber >= room.totalRounds) await endGame(io, roomCode);
      else await startNextRound(io, roomCode);
    }, 3500);

  }, room.timeLimit * 1000);
}

async function endGame(io, roomCode) {
  const room = gameState.getRoom(roomCode);
  if (!room) return;

  room.status = 'finished';
  await gameController.updateSessionStatus(room.sessionId, 'finished');
  await gameController.logEvent(room.sessionId, 'game_end', 'Game finished');

  const sorted = [...room.players].sort((a, b) => b.score - a.score);
  const isTie  = sorted.length === 2 && sorted[0].score === sorted[1].score;

  io.to(roomCode).emit('gameEnd', {
    players:    sorted.map(p => ({ playerId: p.playerId, username: p.username, score: p.score })),
    winnerId:   isTie ? null : sorted[0]?.playerId,
    winnerName: isTie ? null : sorted[0]?.username,
    isTie,
  });
}
