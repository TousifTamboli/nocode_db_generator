"use client";

import { memo, useState, useCallback } from "react";
import { Handle, Position } from "@xyflow/react";
import { Plus, GripVertical, Trash2, Pencil, X, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useWorkspaceStore, Column } from "@/stores/workspace-store";

interface TableNodeData {
  label: string;
  tableId: string;
  columns: Column[];
  onAddColumn: (tableId: string) => void;
  onEditColumn: (tableId: string, column: Column) => void;
}

interface TableNodeProps {
  data: TableNodeData;
  selected?: boolean;
}

// Column Row Component (simplified - no dots inside)
function ColumnRow({ 
  column, 
  tableId,
  onEdit 
}: { 
  column: Column; 
  tableId: string;
  onEdit: (column: Column) => void;
}) {
  const [isEditingName, setIsEditingName] = useState(false);
  const [editedName, setEditedName] = useState(column.name);
  const { updateColumn, deleteColumn } = useWorkspaceStore();

  const handleDoubleClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setEditedName(column.name);
    setIsEditingName(true);
  }, [column.name]);

  const handleNameSubmit = useCallback(() => {
    if (editedName.trim() && editedName !== column.name) {
      updateColumn(tableId, column.id, { name: editedName.trim() });
    }
    setIsEditingName(false);
  }, [editedName, column.name, column.id, tableId, updateColumn]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    e.stopPropagation();
    if (e.key === "Enter") {
      handleNameSubmit();
    } else if (e.key === "Escape") {
      setIsEditingName(false);
    }
  }, [handleNameSubmit]);

  const handleDelete = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    deleteColumn(tableId, column.id);
  }, [tableId, column.id, deleteColumn]);

  const handleEditClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onEdit(column);
  }, [column, onEdit]);

  return (
    <div className="flex items-center gap-2 px-3 py-1.5 hover:bg-zinc-800/50 transition-colors group">
      {isEditingName ? (
        <div className="flex-1 flex items-center gap-1">
          <Input
            value={editedName}
            onChange={(e) => setEditedName(e.target.value)}
            onBlur={handleNameSubmit}
            onKeyDown={handleKeyDown}
            onClick={(e) => e.stopPropagation()}
            className="h-5 text-xs bg-zinc-700 border-zinc-600 text-white px-1.5 flex-1"
            autoFocus
          />
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              handleNameSubmit();
            }}
            className="h-5 w-5 p-0 text-green-400 hover:text-green-300 hover:bg-green-500/20"
          >
            <Check className="w-3 h-3" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              setIsEditingName(false);
            }}
            className="h-5 w-5 p-0 text-zinc-400 hover:text-zinc-300 hover:bg-zinc-600"
          >
            <X className="w-3 h-3" />
          </Button>
        </div>
      ) : (
        <>
          <div 
            className="flex-1 flex items-center gap-2 cursor-pointer min-w-0"
            onDoubleClick={handleDoubleClick}
            title="Double-click to rename"
          >
            <span className={`text-xs font-medium truncate ${column.isPrimaryKey ? "text-yellow-400" : "text-zinc-300"}`}>
              {column.isPrimaryKey && "🔑 "}
              {column.name}
            </span>
            <span className="text-xs text-zinc-500 shrink-0">{column.type}</span>
          </div>
          
          {/* Constraint badges */}
          <div className="flex items-center gap-1 shrink-0">
            {column.isUnique && !column.isPrimaryKey && (
              <span className="text-[9px] px-1 py-0.5 rounded bg-blue-500/20 text-blue-400">UQ</span>
            )}
            {column.isAutoIncrement && (
              <span className="text-[9px] px-1 py-0.5 rounded bg-green-500/20 text-green-400">AI</span>
            )}
            {!column.isNullable && (
              <span className="text-[9px] px-1 py-0.5 rounded bg-red-500/20 text-red-400">NN</span>
            )}
          </div>
          
          {/* Edit button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={handleEditClick}
            className="h-5 w-5 p-0 opacity-0 group-hover:opacity-100 text-zinc-500 hover:text-blue-400 hover:bg-blue-500/20 transition-all shrink-0"
            title="Edit column"
          >
            <Pencil className="w-3 h-3" />
          </Button>
          
          {/* Delete button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDelete}
            className="h-5 w-5 p-0 opacity-0 group-hover:opacity-100 text-zinc-500 hover:text-red-400 hover:bg-red-500/20 transition-all shrink-0"
            title="Delete column"
          >
            <Trash2 className="w-3 h-3" />
          </Button>
        </>
      )}
    </div>
  );
}

function TableNodeComponent({ data, selected }: TableNodeProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(data.label);
  const { updateTableName, deleteTable } = useWorkspaceStore();

  const handleDoubleClick = useCallback(() => {
    setEditName(data.label);
    setIsEditing(true);
  }, [data.label]);

  const handleNameSubmit = useCallback(() => {
    if (editName.trim()) {
      updateTableName(data.tableId, editName.trim());
    }
    setIsEditing(false);
  }, [editName, data.tableId, updateTableName]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter") {
        handleNameSubmit();
      } else if (e.key === "Escape") {
        setIsEditing(false);
      }
    },
    [handleNameSubmit]
  );

  const handleDelete = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      if (confirm(`Delete table "${data.label}"?`)) {
        deleteTable(data.tableId);
      }
    },
    [data.label, data.tableId, deleteTable]
  );

  const handleEditColumn = useCallback((column: Column) => {
    data.onEditColumn(data.tableId, column);
  }, [data]);

  // Calculate handle positions for each column
  const headerHeight = 44;
  const columnHeight = 32;

  return (
    <div
      className={`min-w-[280px] max-w-[350px] rounded-xl bg-zinc-900 border-2 transition-all duration-200 shadow-xl ${
        selected ? "border-purple-500 shadow-purple-500/20" : "border-zinc-700"
      }`}
    >
      {/* Connection handles for each column - large, visible, easy to drag */}
      {data.columns.map((column, index) => (
        <div key={column.id}>
          {/* Left handle (target - reference target) */}
          <Handle
            type="target"
            position={Position.Left}
            id={`${data.tableId}-${column.id}-target`}
            className="!w-4 !h-4 !bg-purple-500 !border-2 !border-purple-300 hover:!scale-125 !transition-transform"
            style={{ 
              top: headerHeight + (index * columnHeight) + (columnHeight / 2),
              left: -8,
            }}
            title={`Connect TO ${column.name}`}
          />
          {/* Right handle (source - FK column) */}
          <Handle
            type="source"
            position={Position.Right}
            id={`${data.tableId}-${column.id}-source`}
            className="!w-4 !h-4 !bg-cyan-500 !border-2 !border-cyan-300 hover:!scale-125 !transition-transform"
            style={{ 
              top: headerHeight + (index * columnHeight) + (columnHeight / 2),
              right: -8,
            }}
            title={`Drag FROM ${column.name} to create FK`}
          />
        </div>
      ))}

      {/* Header */}
      <div className="flex items-center gap-2 px-3 py-2.5 bg-gradient-to-r from-blue-600 to-cyan-600 rounded-t-[10px]">
        <GripVertical className="w-4 h-4 text-white/70 cursor-grab" />
        
        {isEditing ? (
          <Input
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            onBlur={handleNameSubmit}
            onKeyDown={handleKeyDown}
            className="h-6 text-sm font-semibold bg-white/20 border-white/30 text-white placeholder:text-white/50 px-2"
            autoFocus
          />
        ) : (
          <span
            className="flex-1 text-sm font-semibold text-white cursor-pointer hover:text-white/90"
            onDoubleClick={handleDoubleClick}
            title="Double-click to rename"
          >
            {data.label}
          </span>
        )}
        
        <Button
          variant="ghost"
          size="sm"
          onClick={handleDelete}
          className="h-6 w-6 p-0 text-white/70 hover:text-red-300 hover:bg-red-500/20"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </Button>
      </div>

      {/* Columns */}
      <div className="min-h-[40px] max-h-[300px] overflow-y-auto">
        {data.columns.length === 0 ? (
          <div className="text-xs text-zinc-500 text-center py-4 px-2">
            No columns yet
          </div>
        ) : (
          data.columns.map((column) => (
            <ColumnRow 
              key={column.id}
              column={column}
              tableId={data.tableId}
              onEdit={handleEditColumn}
            />
          ))
        )}
      </div>

      {/* Add Column Button */}
      <div className="p-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => data.onAddColumn(data.tableId)}
          className="w-full h-8 text-xs text-zinc-400 hover:text-white hover:bg-zinc-800 border border-dashed border-zinc-700 hover:border-zinc-600"
        >
          <Plus className="w-3.5 h-3.5 mr-1.5" />
          Add Column
        </Button>
      </div>

      {/* Helper text */}
      {data.columns.length > 0 && (
        <div className="px-2 pb-2 text-center">
          <span className="text-[10px] text-zinc-600">
            🔵 → 🟣 Drag cyan to purple for FK
          </span>
        </div>
      )}
    </div>
  );
}

export const TableNode = memo(TableNodeComponent);
