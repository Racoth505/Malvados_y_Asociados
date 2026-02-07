const mysql = require('mysql2/promise');

const db = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: 'armando2508',
  database: 'finanzas'
});

module.exports = db;
