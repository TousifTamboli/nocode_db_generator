import express from 'express';
import { authenticate } from '../middleware/auth.middleware';
import {
  getTableData,
  insertRow,
  updateRow,
  deleteRow,
  executeQuery,
  resetAutoIncrement,
} from '../controllers/data.controller';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Execute custom query
router.post('/:projectId/query', executeQuery);

// Get all data from a table
router.get('/:projectId/:tableName', getTableData);

// Insert a new row
router.post('/:projectId/:tableName', insertRow);

// Reset AUTO_INCREMENT for a specific table
router.post('/:projectId/:tableName/reset-auto-increment', resetAutoIncrement);

// Update a row
router.put('/:projectId/:tableName/:rowId', updateRow);

// Delete a row
router.delete('/:projectId/:tableName/:rowId', deleteRow);

export default router;
