// In-memory game state — all active rooms stored here for real-time speed
const rooms = new Map();

function createRoom(roomCode, hostSocketId, sessionId) {
  rooms.set(roomCode, {
    roomCode,
    hostSocketId,
    sessionId,
    status: 'waiting',      // waiting | playing | finished
    players: [],            // max 2 players
    currentRound: null,
    roundNumber: 0,
    totalRounds: 5,
    timeLimit: 30,          // seconds per round
  });
  return rooms.get(roomCode);
}

function getRoom(roomCode) {
  return rooms.get(roomCode);
}

function deleteRoom(roomCode) {
  const room = rooms.get(roomCode);
  if (room?.currentRound?.timer) clearTimeout(room.currentRound.timer);
  rooms.delete(roomCode);
}

function addPlayer(roomCode, playerData) {
  const room = rooms.get(roomCode);
  if (!room) return null;
  room.players.push({
    socketId:        playerData.socketId,
    playerId:        playerData.playerId,
    username:        playerData.username,
    score:           0,
    isReady:         false,
    cooldownUntil:   0,
    sessionPlayerId: playerData.sessionPlayerId,
    disconnectedAt:  null,
  });
  return room;
}

function removePlayer(socketId) {
  for (const [roomCode, room] of rooms.entries()) {
    const idx = room.players.findIndex(p => p.socketId === socketId);
    if (idx !== -1) {
      room.players[idx].socketId = null;
      room.players[idx].disconnectedAt = Date.now();
      return { roomCode, room, player: room.players[idx] };
    }
  }
  return null;
}

function reconnectPlayer(playerId, newSocketId) {
  for (const [roomCode, room] of rooms.entries()) {
    const player = room.players.find(p => p.playerId === playerId);
    if (player) {
      player.socketId = newSocketId;
      player.disconnectedAt = null;
      return { roomCode, room, player };
    }
  }
  return null;
}

function findRoomBySocket(socketId) {
  for (const [roomCode, room] of rooms.entries()) {
    if (room.hostSocketId === socketId) return { roomCode, room, isHost: true };
    const player = room.players.find(p => p.socketId === socketId);
    if (player) return { roomCode, room, isHost: false, player };
  }
  return null;
}

module.exports = {
  rooms,
  createRoom,
  getRoom,
  deleteRoom,
  addPlayer,
  removePlayer,
  reconnectPlayer,
  findRoomBySocket,
};
