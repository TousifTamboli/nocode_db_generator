"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { X, Plus, Trash2, Save, RefreshCw, Loader2, ChevronLeft, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table } from "@/stores/workspace-store";
import { toast } from "sonner";
import api from "@/lib/api";

interface DataEditorProps {
  table: Table;
  projectId: string;
  onClose: () => void;
}

interface RowData {
  [key: string]: unknown;
  _isNew?: boolean;
  _isModified?: boolean;
}

export function DataEditor({ table, projectId, onClose }: DataEditorProps) {
  const [rows, setRows] = useState<RowData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [editingCell, setEditingCell] = useState<{ rowIndex: number; column: string } | null>(null);
  const [editValue, setEditValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  // Get primary key column
  const primaryKeyColumn = table.columns.find(col => col.isPrimaryKey);
  const primaryKeyName = primaryKeyColumn?.name || table.columns[0]?.name || 'id';

  // Check if table has auto-increment column
  const hasAutoIncrement = table.columns.some(col => col.isAutoIncrement);

  // Fetch data from MySQL
  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await api.get(`/data/${projectId}/${table.name}`);
      if (response.data.success) {
        setRows(response.data.data.rows || []);
      } else {
        toast.error(response.data.message || "Failed to fetch data");
      }
    } catch (error: unknown) {
      console.error("Error fetching data:", error);
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || "Failed to fetch data");
    } finally {
      setIsLoading(false);
    }
  }, [projectId, table.name]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Focus input when editing
  useEffect(() => {
    if (editingCell && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editingCell]);

  // Reset AUTO_INCREMENT for this table
  const handleResetAutoIncrement = async () => {
    setIsResetting(true);
    try {
      const response = await api.post(`/data/${projectId}/${table.name}/reset-auto-increment`);
      if (response.data.success) {
        toast.success(`AUTO_INCREMENT reset to ${response.data.data.nextId}`);
      } else {
        toast.error(response.data.message || "Failed to reset");
      }
    } catch (error: unknown) {
      console.error("Error resetting auto-increment:", error);
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || "Failed to reset AUTO_INCREMENT");
    } finally {
      setIsResetting(false);
    }
  };

  // Start editing a cell
  const startEditing = (rowIndex: number, column: string, currentValue: unknown) => {
    setEditingCell({ rowIndex, column });
    setEditValue(currentValue === null || currentValue === undefined ? "" : String(currentValue));
  };

  // Save cell edit
  const saveEdit = async () => {
    if (!editingCell) return;

    const { rowIndex, column } = editingCell;
    const row = rows[rowIndex];
    const oldValue = row[column];

    // Update local state
    const updatedRows = [...rows];
    updatedRows[rowIndex] = {
      ...updatedRows[rowIndex],
      [column]: editValue === "" ? null : editValue,
      _isModified: !row._isNew,
    };
    setRows(updatedRows);
    setEditingCell(null);

    // Save to database if not a new row
    if (!row._isNew && oldValue !== editValue) {
      try {
        const rowId = row[primaryKeyName];
        await api.put(`/data/${projectId}/${table.name}/${rowId}`, {
          rowData: { [column]: editValue === "" ? null : editValue },
          primaryKeyColumn: primaryKeyName,
        });
        toast.success("Cell updated");
        // Clear modified flag
        updatedRows[rowIndex]._isModified = false;
        setRows([...updatedRows]);
      } catch (error: unknown) {
        console.error("Error updating cell:", error);
        const err = error as { response?: { data?: { message?: string } } };
        toast.error(err.response?.data?.message || "Failed to update cell");
        // Revert on error
        updatedRows[rowIndex][column] = oldValue;
        setRows([...updatedRows]);
      }
    }
  };

  // Cancel edit
  const cancelEdit = () => {
    setEditingCell(null);
    setEditValue("");
  };

  // Handle key press in edit mode
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      saveEdit();
    } else if (e.key === "Escape") {
      cancelEdit();
    } else if (e.key === "Tab") {
      e.preventDefault();
      saveEdit();
      // Move to next cell
      if (editingCell) {
        const currentColIndex = table.columns.findIndex(c => c.name === editingCell.column);
        const nextColIndex = (currentColIndex + 1) % table.columns.length;
        const nextRowIndex = nextColIndex === 0 ? editingCell.rowIndex + 1 : editingCell.rowIndex;
        if (nextRowIndex < rows.length) {
          const nextCol = table.columns[nextColIndex].name;
          setTimeout(() => startEditing(nextRowIndex, nextCol, rows[nextRowIndex][nextCol]), 0);
        }
      }
    }
  };

  // Add new row
  const addNewRow = () => {
    const newRow: RowData = { _isNew: true };
    table.columns.forEach(col => {
      if (col.isAutoIncrement) {
        newRow[col.name] = "(auto)";
      } else if (col.defaultValue) {
        newRow[col.name] = col.defaultValue;
      } else {
        newRow[col.name] = null;
      }
    });
    setRows([...rows, newRow]);
    
    // Start editing the first non-auto-increment column
    const firstEditableCol = table.columns.find(c => !c.isAutoIncrement);
    if (firstEditableCol) {
      setTimeout(() => startEditing(rows.length, firstEditableCol.name, newRow[firstEditableCol.name]), 100);
    }
  };

  // Save new row to database
  const saveNewRow = async (rowIndex: number) => {
    const row = rows[rowIndex];
    if (!row._isNew) return;

    setIsSaving(true);
    try {
      const rowData: Record<string, unknown> = {};
      
      // Collect all non-auto-increment columns
      table.columns.forEach(col => {
        if (!col.isAutoIncrement && row[col.name] !== "(auto)") {
          // Include the value even if it's null (MySQL will handle defaults)
          rowData[col.name] = row[col.name];
        }
      });

      // Check if we have any data to insert
      // If table has only auto-increment columns, we can still insert with empty columns
      const hasOnlyAutoIncrement = table.columns.every(col => col.isAutoIncrement);
      
      if (Object.keys(rowData).length === 0 && !hasOnlyAutoIncrement) {
        // Check if all columns have null values - that's okay, we'll send them
        const nonAIColumns = table.columns.filter(col => !col.isAutoIncrement);
        if (nonAIColumns.length > 0) {
          // Include null values explicitly
          nonAIColumns.forEach(col => {
            rowData[col.name] = row[col.name] ?? null;
          });
        }
      }

      await api.post(`/data/${projectId}/${table.name}`, { rowData, allowEmpty: hasOnlyAutoIncrement });
      toast.success("Row saved successfully");
      
      // Refresh to get the auto-generated ID
      await fetchData();
    } catch (error: unknown) {
      console.error("Error saving row:", error);
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || "Failed to save row");
    } finally {
      setIsSaving(false);
    }
  };

  // Delete row
  const deleteRow = async (rowIndex: number) => {
    const row = rows[rowIndex];
    
    if (row._isNew) {
      // Just remove from local state
      setRows(rows.filter((_, i) => i !== rowIndex));
      return;
    }

    if (!confirm("Are you sure you want to delete this row?")) return;

    try {
      const rowId = row[primaryKeyName];
      await api.delete(`/data/${projectId}/${table.name}/${rowId}`, {
        data: { primaryKeyColumn: primaryKeyName },
      });
      toast.success("Row deleted");
      setRows(rows.filter((_, i) => i !== rowIndex));
    } catch (error: unknown) {
      console.error("Error deleting row:", error);
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || "Failed to delete row");
    }
  };

  // Render cell value
  const renderCellValue = (value: unknown): string => {
    if (value === null || value === undefined) return "NULL";
    if (value === "(auto)") return "(auto)";
    if (typeof value === "object") return JSON.stringify(value);
    return String(value);
  };

  return (
    <div className="fixed inset-0 z-50 bg-zinc-950/95 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800 bg-zinc-900/50">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="text-zinc-400 hover:text-white hover:bg-zinc-800"
          >
            <ChevronLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-xl font-semibold text-white flex items-center gap-2">
              {table.name}
              <span className="text-sm font-normal text-zinc-500">
                ({rows.length} rows)
              </span>
            </h1>
            <p className="text-sm text-zinc-500">
              Click any cell to edit • Press Enter to save • Tab to move
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {/* Reset Auto-Increment Button */}
          {hasAutoIncrement && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleResetAutoIncrement}
              disabled={isResetting}
              className="bg-zinc-800 border-zinc-700 text-zinc-300 hover:bg-zinc-700 hover:text-white"
              title="Reset AUTO_INCREMENT to continue from the last existing ID"
            >
              {isResetting ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <RotateCcw className="w-4 h-4 mr-2" />
              )}
              Reset IDs
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={fetchData}
            disabled={isLoading}
            className="bg-zinc-800 border-zinc-700 text-zinc-300 hover:bg-zinc-700 hover:text-white"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <Button
            variant="default"
            size="sm"
            onClick={addNewRow}
            className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Row
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="text-zinc-400 hover:text-white hover:bg-zinc-800"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto p-6">
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="w-8 h-8 animate-spin text-zinc-500" />
          </div>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-zinc-800">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-zinc-900/80">
                  <th className="w-12 px-3 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider border-b border-zinc-800">
                    #
                  </th>
                  {table.columns.map((column) => (
                    <th
                      key={column.id}
                      className="px-4 py-3 text-left text-xs font-medium text-zinc-400 uppercase tracking-wider border-b border-zinc-800 min-w-[150px]"
                    >
                      <div className="flex items-center gap-2">
                        {column.isPrimaryKey && <span className="text-yellow-400">🔑</span>}
                        {column.name}
                        <span className="text-zinc-600 font-normal normal-case">
                          {column.type}
                        </span>
                        {column.isAutoIncrement && (
                          <span className="text-[9px] px-1 py-0.5 rounded bg-green-500/20 text-green-400">AI</span>
                        )}
                      </div>
                    </th>
                  ))}
                  <th className="w-24 px-3 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider border-b border-zinc-800">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {rows.length === 0 ? (
                  <tr>
                    <td
                      colSpan={table.columns.length + 2}
                      className="px-4 py-12 text-center text-zinc-500"
                    >
                      No data yet. Click "Add Row" to insert data.
                    </td>
                  </tr>
                ) : (
                  rows.map((row, rowIndex) => (
                    <tr
                      key={rowIndex}
                      className={`border-b border-zinc-800/50 hover:bg-zinc-800/30 transition-colors ${
                        row._isNew ? "bg-green-900/10" : ""
                      } ${row._isModified ? "bg-yellow-900/10" : ""}`}
                    >
                      <td className="px-3 py-2 text-xs text-zinc-600">
                        {rowIndex + 1}
                      </td>
                      {table.columns.map((column) => (
                        <td
                          key={column.id}
                          className="px-1 py-1 border-l border-zinc-800/30"
                        >
                          {editingCell?.rowIndex === rowIndex && editingCell?.column === column.name ? (
                            <Input
                              ref={inputRef}
                              value={editValue}
                              onChange={(e) => setEditValue(e.target.value)}
                              onBlur={saveEdit}
                              onKeyDown={handleKeyDown}
                              className="h-8 text-sm bg-zinc-800 border-cyan-500 text-white focus:ring-cyan-500"
                              disabled={column.isAutoIncrement && !row._isNew}
                            />
                          ) : (
                            <div
                              onClick={() => {
                                if (column.isAutoIncrement && !row._isNew) return;
                                startEditing(rowIndex, column.name, row[column.name]);
                              }}
                              className={`px-3 py-1.5 min-h-[32px] rounded cursor-pointer hover:bg-zinc-800 transition-colors ${
                                column.isAutoIncrement && !row._isNew
                                  ? "cursor-not-allowed text-zinc-600"
                                  : ""
                              } ${
                                row[column.name] === null || row[column.name] === undefined
                                  ? "text-zinc-600 italic"
                                  : "text-zinc-300"
                              }`}
                            >
                              {renderCellValue(row[column.name])}
                            </div>
                          )}
                        </td>
                      ))}
                      <td className="px-2 py-1">
                        <div className="flex items-center gap-1">
                          {row._isNew && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => saveNewRow(rowIndex)}
                              disabled={isSaving}
                              className="h-7 w-7 text-green-400 hover:text-green-300 hover:bg-green-500/20"
                              title="Save new row"
                            >
                              <Save className="w-3.5 h-3.5" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => deleteRow(rowIndex)}
                            className="h-7 w-7 text-zinc-500 hover:text-red-400 hover:bg-red-500/20"
                            title="Delete row"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-6 py-3 border-t border-zinc-800 bg-zinc-900/50 flex items-center justify-between">
        <p className="text-xs text-zinc-600">
          Primary Key: <span className="text-zinc-400">{primaryKeyName}</span>
        </p>
        <p className="text-xs text-zinc-600">
          {table.columns.length} columns • Data synced with MySQL
        </p>
      </div>
    </div>
  );
}
