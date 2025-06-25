import mysql from "mysql2/promise";

export const db = mysql.createPool({
  host: process.env.DB_HOST || "aiot-mysqldb",
  user: process.env.DB_USER || "admin",
  password: process.env.DB_PASSWORD || "admin",
  database: process.env.DB_NAME || "main_db",
  port: parseInt(process.env.DB_PORT || "3306"),
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});
