const mysql2 = require('mysql2/promise');
require('dotenv').config();

const pool = mysql2.createPool(process.env.DATABASE_URL ? {
  uri: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
} : {
  host:     process.env.DB_HOST     || 'localhost',
  port:     parseInt(process.env.DB_PORT) || 3306,
  user:     process.env.DB_USER     || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME     || 'spotblitz',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

pool.getConnection()
  .then(conn => {
    console.log('✅ MySQL connected');
    conn.release();
  })
  .catch(err => {
    console.error('❌ MySQL connection failed:', err.message);
  });

module.exports = pool;
