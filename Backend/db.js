const mysql = require("mysql2/promise");

const db = mysql.createPool({
  host: process.env.DB_HOST || "db",
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "secret",
  database: process.env.DB_NAME || "Finanzas",
  waitForConnections: true,
  connectionLimit: 10,
});

module.exports = db;