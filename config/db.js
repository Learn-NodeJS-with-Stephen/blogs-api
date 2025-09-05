import mysql from "mysql2";
import dotenv from "dotenv";
import fs from "fs";
import path, { dirname } from "path";
import { fileURLToPath } from "url";

dotenv.config();
// Define the path to the Aiven CA certificate
const caCertPath = path.join(dirname(fileURLToPath(import.meta.url)), "ca.pem");

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  ssl: {
    // Provide the Certificate Authority certificate to verify the server's identity.
    // This prevents Man-in-the-Middle attacks.
    ca: fs.readFileSync(caCertPath),
  },
});

export default pool.promise();
