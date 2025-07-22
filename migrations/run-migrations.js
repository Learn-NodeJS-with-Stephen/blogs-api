import mysql from "mysql2";
import { promises as fs } from "fs";
import { fileURLToPath } from "url";
import { dirname } from "path";
import * as path from "path";
import dotenv from "dotenv";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config();

async function runMigration() {
  console.log("Starting database migration...");

  const requiredEnvVars = ["DB_HOST", "DB_USER", "DB_NAME"];
  const missingVars = requiredEnvVars.filter(
    (varName) => !process.env[varName]
  );

  if (missingVars.length > 0) {
    console.error(
      "Missing required environment variables:",
      missingVars.join(", ")
    );
    console.error("Please check your .env file");
    process.exit(1);
  }

  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    multipleStatements: true, 
  });

  try {
    console.log("Connected to database successfully");

    const migrationPath = path.join(
      __dirname,
      "12072025-initial_migration_schema.sql"
    );
    const migrationSQL = await fs.readFile(migrationPath, "utf8");

    console.log("Executing migration: 12072025-initial_migration_schema.sql");

    await connection.execute(migrationSQL);

    console.log("✅ Migration completed successfully!");
  } catch (error) {
    console.error("❌ Migration failed:", error.message);

    if (error.code === "ER_ACCESS_DENIED_ERROR") {
      console.error("Database access denied. Please check your credentials.");
    } else if (error.code === "ECONNREFUSED") {
      console.error(
        "Could not connect to database. Please check your connection settings."
      );
    } else if (error.code === "ER_BAD_DB_ERROR") {
      console.error(
        "Database does not exist. Please create the database first."
      );
    }

    process.exit(1);
  } finally {
    await connection.end();
    console.log("Database connection closed");
  }
}

runMigration();

export { runMigration };
