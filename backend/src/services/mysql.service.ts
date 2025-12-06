import mysql from 'mysql2/promise';

interface MySQLConfig {
  host: string;
  port: number;
  user: string;
  password: string;
}

// Test MySQL connection
export const testMySQLConnection = async (config: MySQLConfig): Promise<{ success: boolean; message: string }> => {
  try {
    const connection = await mysql.createConnection({
      host: config.host,
      port: config.port,
      user: config.user,
      password: config.password,
    });
    
    await connection.ping();
    await connection.end();
    
    return { success: true, message: 'Connection successful' };
  } catch (error) {
    const err = error as Error;
    return { success: false, message: err.message };
  }
};

// Create a new database in MySQL
export const createMySQLDatabase = async (
  config: MySQLConfig,
  databaseName: string
): Promise<{ success: boolean; message: string }> => {
  try {
    const connection = await mysql.createConnection({
      host: config.host,
      port: config.port,
      user: config.user,
      password: config.password,
    });
    
    // Sanitize database name to prevent SQL injection
    const safeName = databaseName.replace(/[^a-zA-Z0-9_]/g, '_');
    
    // Check if database already exists
    const [rows] = await connection.query(
      `SELECT SCHEMA_NAME FROM INFORMATION_SCHEMA.SCHEMATA WHERE SCHEMA_NAME = ?`,
      [safeName]
    );
    
    if (Array.isArray(rows) && rows.length > 0) {
      await connection.end();
      return { success: false, message: `Database '${safeName}' already exists` };
    }
    
    // Create the database
    await connection.query(`CREATE DATABASE \`${safeName}\``);
    await connection.end();
    
    return { success: true, message: `Database '${safeName}' created successfully` };
  } catch (error) {
    const err = error as Error;
    return { success: false, message: err.message };
  }
};

// Get list of databases
export const listMySQLDatabases = async (config: MySQLConfig): Promise<{ success: boolean; databases?: string[]; message?: string }> => {
  try {
    const connection = await mysql.createConnection({
      host: config.host,
      port: config.port,
      user: config.user,
      password: config.password,
    });
    
    const [rows] = await connection.query('SHOW DATABASES');
    await connection.end();
    
    const databases = (rows as Array<{ Database: string }>).map(row => row.Database);
    
    return { success: true, databases };
  } catch (error) {
    const err = error as Error;
    return { success: false, message: err.message };
  }
};

// Execute SQL query on a specific database
export const executeMySQLQuery = async (
  config: MySQLConfig,
  databaseName: string,
  query: string
): Promise<{ success: boolean; result?: unknown; message?: string }> => {
  try {
    const connection = await mysql.createConnection({
      host: config.host,
      port: config.port,
      user: config.user,
      password: config.password,
      database: databaseName,
    });
    
    const [result] = await connection.query(query);
    await connection.end();
    
    return { success: true, result };
  } catch (error) {
    const err = error as Error;
    return { success: false, message: err.message };
  }
};
