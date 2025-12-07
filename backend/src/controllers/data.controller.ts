import { Request, Response } from 'express';
import Project from '../models/Project.model';
import { executeMySQLQuery } from '../services/mysql.service';

interface AuthRequest extends Request {
  userId?: string;
}

// Helper to escape SQL values
const escapeValue = (value: unknown): string => {
  if (value === null || value === undefined) {
    return 'NULL';
  }
  if (typeof value === 'number') {
    return String(value);
  }
  if (typeof value === 'boolean') {
    return value ? '1' : '0';
  }
  // For strings, escape single quotes
  const str = String(value);
  return `'${str.replace(/'/g, "''")}'`;
};

// Helper to get MySQL config from project
const getProjectMySQLConfig = async (projectId: string, userId: string) => {
  const project = await Project.findOne({ _id: projectId, userId });
  if (!project || !project.mysqlConfig) {
    return null;
  }
  return {
    config: {
      host: project.mysqlConfig.host,
      port: project.mysqlConfig.port,
      user: project.mysqlConfig.user,
      password: project.mysqlConfig.password,
    },
    databaseName: project.databaseName,
  };
};

// @desc    Get all rows from a table
// @route   GET /api/data/:projectId/:tableName
// @access  Private
export const getTableData = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { projectId, tableName } = req.params;
    const userId = req.userId;

    if (!userId) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }

    const mysqlInfo = await getProjectMySQLConfig(projectId, userId);
    if (!mysqlInfo) {
      res.status(404).json({ success: false, message: 'Project or MySQL config not found' });
      return;
    }

    const safeTableName = tableName.replace(/[^a-zA-Z0-9_]/g, '_');
    const query = `SELECT * FROM \`${safeTableName}\` LIMIT 1000`;
    
    const result = await executeMySQLQuery(mysqlInfo.config, mysqlInfo.databaseName, query);
    
    if (!result.success) {
      res.status(400).json({ success: false, message: result.message });
      return;
    }

    res.status(200).json({
      success: true,
      data: {
        rows: result.result as unknown[],
        tableName: safeTableName,
      },
    });
  } catch (error) {
    console.error('Get table data error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Insert a new row into a table
// @route   POST /api/data/:projectId/:tableName
// @access  Private
export const insertRow = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { projectId, tableName } = req.params;
    const { rowData } = req.body;
    const userId = req.userId;

    if (!userId) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }

    if (!rowData || Object.keys(rowData).length === 0) {
      res.status(400).json({ success: false, message: 'No data provided' });
      return;
    }

    const mysqlInfo = await getProjectMySQLConfig(projectId, userId);
    if (!mysqlInfo) {
      res.status(404).json({ success: false, message: 'Project or MySQL config not found' });
      return;
    }

    const safeTableName = tableName.replace(/[^a-zA-Z0-9_]/g, '_');
    
    // Build INSERT query with escaped values
    const columns = Object.keys(rowData).map(col => `\`${col.replace(/[^a-zA-Z0-9_]/g, '_')}\``);
    const values = Object.values(rowData).map(val => escapeValue(val));

    const query = `INSERT INTO \`${safeTableName}\` (${columns.join(', ')}) VALUES (${values.join(', ')})`;
    
    console.log('📝 Insert query:', query);

    const result = await executeMySQLQuery(mysqlInfo.config, mysqlInfo.databaseName, query);
    
    if (!result.success) {
      res.status(400).json({ success: false, message: result.message });
      return;
    }

    res.status(201).json({
      success: true,
      message: 'Row inserted successfully',
      data: result.result,
    });
  } catch (error) {
    console.error('Insert row error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Update a row in a table
// @route   PUT /api/data/:projectId/:tableName/:rowId
// @access  Private
export const updateRow = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { projectId, tableName, rowId } = req.params;
    const { rowData, primaryKeyColumn } = req.body;
    const userId = req.userId;

    if (!userId) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }

    const mysqlInfo = await getProjectMySQLConfig(projectId, userId);
    if (!mysqlInfo) {
      res.status(404).json({ success: false, message: 'Project or MySQL config not found' });
      return;
    }

    const safeTableName = tableName.replace(/[^a-zA-Z0-9_]/g, '_');
    const safePrimaryKey = primaryKeyColumn.replace(/[^a-zA-Z0-9_]/g, '_');
    
    // Build UPDATE query with escaped values
    const setClause = Object.entries(rowData)
      .map(([col, val]) => `\`${col.replace(/[^a-zA-Z0-9_]/g, '_')}\` = ${escapeValue(val)}`)
      .join(', ');

    const query = `UPDATE \`${safeTableName}\` SET ${setClause} WHERE \`${safePrimaryKey}\` = ${escapeValue(rowId)}`;
    
    console.log('📝 Update query:', query);

    const result = await executeMySQLQuery(mysqlInfo.config, mysqlInfo.databaseName, query);
    
    if (!result.success) {
      res.status(400).json({ success: false, message: result.message });
      return;
    }

    res.status(200).json({
      success: true,
      message: 'Row updated successfully',
      data: result.result,
    });
  } catch (error) {
    console.error('Update row error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Delete a row from a table
// @route   DELETE /api/data/:projectId/:tableName/:rowId
// @access  Private
export const deleteRow = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { projectId, tableName, rowId } = req.params;
    const { primaryKeyColumn } = req.body;
    const userId = req.userId;

    if (!userId) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }

    const mysqlInfo = await getProjectMySQLConfig(projectId, userId);
    if (!mysqlInfo) {
      res.status(404).json({ success: false, message: 'Project or MySQL config not found' });
      return;
    }

    const safeTableName = tableName.replace(/[^a-zA-Z0-9_]/g, '_');
    const safePrimaryKey = primaryKeyColumn.replace(/[^a-zA-Z0-9_]/g, '_');
    
    const query = `DELETE FROM \`${safeTableName}\` WHERE \`${safePrimaryKey}\` = ${escapeValue(rowId)}`;
    
    console.log('📝 Delete query:', query);

    const result = await executeMySQLQuery(mysqlInfo.config, mysqlInfo.databaseName, query);
    
    if (!result.success) {
      res.status(400).json({ success: false, message: result.message });
      return;
    }

    res.status(200).json({
      success: true,
      message: 'Row deleted successfully',
    });
  } catch (error) {
    console.error('Delete row error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Execute raw SQL query
// @route   POST /api/data/:projectId/query
// @access  Private
export const executeQuery = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { projectId } = req.params;
    const { query } = req.body;
    const userId = req.userId;

    if (!userId) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }

    const mysqlInfo = await getProjectMySQLConfig(projectId, userId);
    if (!mysqlInfo) {
      res.status(404).json({ success: false, message: 'Project or MySQL config not found' });
      return;
    }

    console.log('📝 Executing query:', query);

    const result = await executeMySQLQuery(mysqlInfo.config, mysqlInfo.databaseName, query);
    
    if (!result.success) {
      res.status(400).json({ success: false, message: result.message });
      return;
    }

    res.status(200).json({
      success: true,
      data: result.result,
    });
  } catch (error) {
    console.error('Execute query error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Reset AUTO_INCREMENT for a specific table
// @route   POST /api/data/:projectId/:tableName/reset-auto-increment
// @access  Private
export const resetAutoIncrement = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { projectId, tableName } = req.params;
    const userId = req.userId;

    if (!userId) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }

    const mysqlInfo = await getProjectMySQLConfig(projectId, userId);
    if (!mysqlInfo) {
      res.status(404).json({ success: false, message: 'Project or MySQL config not found' });
      return;
    }

    const safeTableName = tableName.replace(/[^a-zA-Z0-9_]/g, '_');

    // Get all columns to find the auto-increment one
    const columnsResult = await executeMySQLQuery(
      mysqlInfo.config,
      mysqlInfo.databaseName,
      `SHOW COLUMNS FROM \`${safeTableName}\``
    );

    if (!columnsResult.success || !columnsResult.result) {
      res.status(400).json({ success: false, message: 'Failed to get table columns' });
      return;
    }

    // Find the auto-increment column
    const columns = columnsResult.result as Array<{ Field: string; Extra: string }>;
    const autoIncColumn = columns.find(col => col.Extra.includes('auto_increment'));

    if (!autoIncColumn) {
      res.status(400).json({ success: false, message: 'No AUTO_INCREMENT column found in this table' });
      return;
    }

    const autoIncColumnName = autoIncColumn.Field;

    // Get the maximum ID currently in the table
    const maxIdResult = await executeMySQLQuery(
      mysqlInfo.config,
      mysqlInfo.databaseName,
      `SELECT MAX(\`${autoIncColumnName}\`) as max_id FROM \`${safeTableName}\``
    );

    let nextId = 1;
    if (maxIdResult.success && maxIdResult.result) {
      const rows = maxIdResult.result as Array<{ max_id: number | null }>;
      if (rows[0]?.max_id) {
        nextId = rows[0].max_id + 1;
      }
    }

    // Reset AUTO_INCREMENT
    await executeMySQLQuery(
      mysqlInfo.config,
      mysqlInfo.databaseName,
      `ALTER TABLE \`${safeTableName}\` AUTO_INCREMENT = ${nextId}`
    );

    console.log(`🔄 Reset AUTO_INCREMENT for ${safeTableName} to ${nextId}`);

    res.status(200).json({
      success: true,
      message: `AUTO_INCREMENT reset to ${nextId}`,
      data: { tableName: safeTableName, nextId },
    });
  } catch (error) {
    console.error('Reset auto-increment error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};
