const mysql = require('mysql2/promise');

const db = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: 'Rozerov3679',
  database: 'finanzas'
});

module.exports = db;
