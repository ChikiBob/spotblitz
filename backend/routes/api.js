const express = require('express');
const router  = express.Router();
const db      = require('../config/db');
const QRCode  = require('qrcode');
const os      = require('os');

// GET /api/health
router.get('/health', (req, res) => res.json({ status: 'ok', time: new Date() }));

// GET /api/local-ip  — returns server's LAN IP for QR generation
router.get('/local-ip', (req, res) => {
  const nets = os.networkInterfaces();
  let ip = 'localhost';
  for (const name of Object.keys(nets)) {
    for (const net of nets[name]) {
      if (net.family === 'IPv4' && !net.internal) { ip = net.address; break; }
    }
  }
  res.json({ ip });
});

// GET /api/qr/:roomCode  — returns QR code PNG as base64 data-URL
router.get('/qr/:roomCode', async (req, res) => {
  try {
    const nets = os.networkInterfaces();
    let ip = 'localhost';
    for (const name of Object.keys(nets)) {
      for (const net of nets[name]) {
        if (net.family === 'IPv4' && !net.internal) { ip = net.address; break; }
      }
    }
    const mobilePort = process.env.MOBILE_PORT || 5174;
    const url = `http://${ip}:${mobilePort}?room=${req.params.roomCode}`;
    const dataUrl = await QRCode.toDataURL(url, { width: 300, margin: 2 });
    res.json({ qr: dataUrl, url });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/items
router.get('/items', async (req, res) => {
  try {
    const { category, difficulty } = req.query;
    let sql = 'SELECT * FROM items WHERE 1=1';
    const params = [];
    if (category)   { sql += ' AND category = ?';         params.push(category); }
    if (difficulty) { sql += ' AND difficulty_level <= ?'; params.push(difficulty); }
    const [rows] = await db.execute(sql, params);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/sessions/:id
router.get('/sessions/:id', async (req, res) => {
  try {
    const [session] = await db.execute('SELECT * FROM game_sessions WHERE id = ?', [req.params.id]);
    if (!session.length) return res.status(404).json({ error: 'Not found' });

    const [players]  = await db.execute(
      `SELECT sp.*, p.username FROM session_players sp
       JOIN players p ON p.id = sp.player_id
       WHERE sp.session_id = ?`, [req.params.id]
    );
    const [rounds]   = await db.execute(
      'SELECT * FROM game_rounds WHERE session_id = ? ORDER BY round_number',
      [req.params.id]
    );
    res.json({ session: session[0], players, rounds });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/leaderboard  — top players by cumulative score
router.get('/leaderboard', async (req, res) => {
  try {
    const [rows] = await db.execute(
      `SELECT p.username, SUM(sp.score) AS total_score, COUNT(sp.id) AS games_played
       FROM session_players sp
       JOIN players p ON p.id = sp.player_id
       GROUP BY p.id ORDER BY total_score DESC LIMIT 20`
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
