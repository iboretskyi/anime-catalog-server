import sql from "mssql";
import config from "../config";

const dbSettings = {
  user: config.dbUser,
  password: config.dbPassword,
  server: config.dbServer,
  database: config.dbDatabase,
  options: {
    encrypt: true,
    trustServerCertificate: true,
  },
};

export async function getConnection() {
  try {
    const pool = await sql.connect(dbSettings);
    console.log("Successfully connected to the database.");
    return pool;
  } catch (error) {
    console.error("Failed to connect to the database.", error);
    throw error;
  }
}

export { sql };