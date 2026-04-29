const db = require('../config/db');
const gameState = require('../state/gameState');

/** Generate a 6-char uppercase room code */
function generateRoomCode() {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

/** Create a new game session in DB and in-memory */
async function createRoom(hostDevice, hostSocketId) {
  const roomCode = generateRoomCode();
  const [result] = await db.execute(
    'INSERT INTO game_sessions (room_code, host_device, status) VALUES (?, ?, ?)',
    [roomCode, hostDevice || 'unknown', 'waiting']
  );
  const sessionId = result.insertId;
  gameState.createRoom(roomCode, hostSocketId, sessionId);
  await logEvent(sessionId, 'room_created', `Room ${roomCode} created`);
  return { roomCode, sessionId };
}

/** Register a player in DB and in-memory */
async function addPlayerToRoom(roomCode, username, deviceId, socketId) {
  const room = gameState.getRoom(roomCode);
  if (!room) throw new Error('Room not found');

  // Upsert player
  let playerId;
  if (deviceId) {
    const [existing] = await db.execute(
      'SELECT id FROM players WHERE device_id = ?', [deviceId]
    );
    if (existing.length > 0) {
      playerId = existing[0].id;
      await db.execute('UPDATE players SET username = ? WHERE id = ?', [username, playerId]);
    }
  }
  if (!playerId) {
    const [ins] = await db.execute(
      'INSERT INTO players (username, device_id) VALUES (?, ?)',
      [username, deviceId || null]
    );
    playerId = ins.insertId;
  }

  // Add to session_players
  const [sp] = await db.execute(
    'INSERT INTO session_players (session_id, player_id, score, is_ready) VALUES (?, ?, 0, 0)',
    [room.sessionId, playerId]
  );
  const sessionPlayerId = sp.insertId;

  gameState.addPlayer(roomCode, { socketId, playerId, username, sessionPlayerId });
  await logEvent(room.sessionId, 'player_joined', `${username} joined room ${roomCode}`);
  return { playerId, sessionPlayerId };
}

/** Update session status in DB */
async function updateSessionStatus(sessionId, status) {
  await db.execute('UPDATE game_sessions SET status = ? WHERE id = ?', [status, sessionId]);
}

/** Fetch items for a round and save the round to DB */
async function startRound(sessionId, roundNumber, difficulty) {
  const gridSize = 12;

  // Pull items weighted toward the given difficulty (±1 level)
  const [allItems] = await db.execute(
    'SELECT * FROM items WHERE difficulty_level <= ? ORDER BY RAND() LIMIT ?',
    [Math.min(difficulty + 1, 3), gridSize]
  );

  // Fallback: just grab any items if not enough
  let items = allItems;
  if (items.length < gridSize) {
    const [extra] = await db.execute(
      'SELECT * FROM items ORDER BY RAND() LIMIT ?', [gridSize]
    );
    items = extra;
  }

  // Shuffle and pick target
  items = items.sort(() => Math.random() - 0.5).slice(0, gridSize);
  const targetItem = items[Math.floor(Math.random() * items.length)];

  // Save round to DB
  const [result] = await db.execute(
    'INSERT INTO game_rounds (session_id, round_number, target_item_id, start_time) VALUES (?, ?, ?, NOW())',
    [sessionId, roundNumber, targetItem.id]
  );
  const roundId = result.insertId;

  return { items, targetItem, roundId };
}

/** Finalize round in DB */
async function finalizeRound(roundId, winnerId, endTime) {
  await db.execute(
    'UPDATE game_rounds SET winner_player_id = ?, end_time = ? WHERE id = ?',
    [winnerId || null, endTime, roundId]
  );
}

/** Save a player answer to DB */
async function saveAnswer(roundId, playerId, selectedItemId, isCorrect, responseTime) {
  await db.execute(
    'INSERT INTO player_answers (round_id, player_id, selected_item_id, is_correct, response_time) VALUES (?, ?, ?, ?, ?)',
    [roundId, playerId, selectedItemId, isCorrect, responseTime]
  );
}

/** Update score in session_players */
async function updateScore(sessionId, playerId, score) {
  await db.execute(
    'UPDATE session_players SET score = ? WHERE session_id = ? AND player_id = ?',
    [score, sessionId, playerId]
  );
}

/** Write to game_logs */
async function logEvent(sessionId, eventType, description) {
  try {
    await db.execute(
      'INSERT INTO game_logs (session_id, event_type, description) VALUES (?, ?, ?)',
      [sessionId, eventType, description]
    );
  } catch (_) { /* non-critical */ }
}

module.exports = {
  createRoom,
  addPlayerToRoom,
  updateSessionStatus,
  startRound,
  finalizeRound,
  saveAnswer,
  updateScore,
  logEvent,
};
