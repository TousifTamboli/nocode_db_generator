import mysql from 'mysql2/promise';

interface MySQLConfig {
  host: string;
  port: number;
  user: string;
  password: string;
}

interface Column {
  id: string;
  name: string;
  type: string;
  isPrimaryKey: boolean;
  isNullable: boolean;
  isUnique?: boolean;
  isAutoIncrement?: boolean;
  defaultValue?: string;
  checkConstraint?: string;
}

interface Table {
  id: string;
  name: string;
  position: { x: number; y: number };
  columns: Column[];
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

// Generate CREATE TABLE SQL from table definition
const generateCreateTableSQL = (table: Table): string => {
  const safeName = table.name.replace(/[^a-zA-Z0-9_]/g, '_');
  
  if (table.columns.length === 0) {
    // MySQL requires at least one column, so create with a placeholder
    return `CREATE TABLE IF NOT EXISTS \`${safeName}\` (
      \`_placeholder\` INT COMMENT 'Placeholder column - add columns to replace'
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`;
  }

  const columnDefs: string[] = [];
  const constraints: string[] = [];

  table.columns.forEach(col => {
    const colName = col.name.replace(/[^a-zA-Z0-9_]/g, '_');
    let def = `\`${colName}\` ${col.type}`;
    
    // NOT NULL constraint
    if (!col.isNullable) {
      def += ' NOT NULL';
    }
    
    // AUTO_INCREMENT (only for INT types)
    if (col.isAutoIncrement && col.type.toUpperCase().includes('INT')) {
      def += ' AUTO_INCREMENT';
    }
    
    // DEFAULT value
    if (col.defaultValue && !col.isAutoIncrement) {
      const upperDefault = col.defaultValue.toUpperCase().trim();
      if (upperDefault === 'NULL') {
        def += ' DEFAULT NULL';
      } else if (upperDefault === 'CURRENT_TIMESTAMP') {
        def += ' DEFAULT CURRENT_TIMESTAMP';
      } else if (upperDefault === 'CURRENT_DATE') {
        def += ' DEFAULT (CURRENT_DATE)';
      } else {
        def += ` DEFAULT '${col.defaultValue.replace(/'/g, "''")}'`;
      }
    }
    
    // UNIQUE constraint (inline for single column)
    if (col.isUnique && !col.isPrimaryKey) {
      def += ' UNIQUE';
    }
    
    columnDefs.push(def);
    
    // PRIMARY KEY constraint
    if (col.isPrimaryKey) {
      constraints.push(`PRIMARY KEY (\`${colName}\`)`);
    }
    
    // CHECK constraint (MySQL 8.0+)
    if (col.checkConstraint) {
      const constraintName = `chk_${safeName}_${colName}`;
      constraints.push(`CONSTRAINT \`${constraintName}\` CHECK (${col.checkConstraint})`);
    }
  });

  const allDefs = [...columnDefs, ...constraints].join(',\n  ');

  return `CREATE TABLE IF NOT EXISTS \`${safeName}\` (
  ${allDefs}
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`;
};

// Sync schema to MySQL - creates/updates tables
export const syncSchemaToMySQL = async (
  config: MySQLConfig,
  databaseName: string,
  tables: Table[]
): Promise<{ success: boolean; message: string; details?: string[] }> => {
  const details: string[] = [];
  
  try {
    const connection = await mysql.createConnection({
      host: config.host,
      port: config.port,
      user: config.user,
      password: config.password,
      database: databaseName,
    });

    // Get existing tables from MySQL
    const [existingTablesResult] = await connection.query('SHOW TABLES');
    const existingTables = (existingTablesResult as Array<Record<string, string>>).map(
      row => Object.values(row)[0]
    );

    // Get table names from schema
    const schemaTableNames = tables.map(t => t.name.replace(/[^a-zA-Z0-9_]/g, '_'));

    // Drop tables that no longer exist in schema
    for (const existingTable of existingTables) {
      if (!schemaTableNames.includes(existingTable)) {
        await connection.query(`DROP TABLE IF EXISTS \`${existingTable}\``);
        details.push(`Dropped table: ${existingTable}`);
      }
    }

    // Create or update tables
    for (const table of tables) {
      const safeName = table.name.replace(/[^a-zA-Z0-9_]/g, '_');
      
      if (existingTables.includes(safeName)) {
        // Table exists - recreate it (drop and create for simplicity)
        // In production, you'd want to use ALTER TABLE for better handling
        await connection.query(`DROP TABLE IF EXISTS \`${safeName}\``);
        details.push(`Recreating table: ${safeName}`);
      }
      
      // Create the table
      const createSQL = generateCreateTableSQL(table);
      await connection.query(createSQL);
      details.push(`Created table: ${safeName} with ${table.columns.length} columns`);
    }

    await connection.end();

    return {
      success: true,
      message: `Synced ${tables.length} tables to MySQL`,
      details,
    };
  } catch (error) {
    const err = error as Error;
    return {
      success: false,
      message: `MySQL sync failed: ${err.message}`,
      details,
    };
  }
};

