"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { DndContext, DragEndEvent, DragStartEvent, DragOverlay, useSensor, useSensors, PointerSensor } from "@dnd-kit/core";
import { toast } from "sonner";
import { Table2, Loader2 } from "lucide-react";
import { ReactFlowProvider } from "@xyflow/react";

import { useAuthStore } from "@/stores/auth-store";
import { useWorkspaceStore, Column, Table } from "@/stores/workspace-store";
import { Sidebar } from "@/components/workspace/sidebar";
import { Canvas } from "@/components/workspace/canvas";
import { CreateTableDialog } from "@/components/workspace/create-table-dialog";
import { AddColumnDialog } from "@/components/workspace/add-column-dialog";
import { EditColumnDialog } from "@/components/workspace/edit-column-dialog";
import { DataPanel } from "@/components/workspace/data-panel";
import { DataEditor } from "@/components/workspace/data-editor";
import api from "@/lib/api";

interface ProjectData {
  id: string;
  name: string;
  databaseName: string;
  databaseType: string;
  schemaData?: {
    tables: Array<{
      id: string;
      name: string;
      position: { x: number; y: number };
      columns: Array<{
        id: string;
        name: string;
        type: string;
        isPrimaryKey: boolean;
        isNullable: boolean;
        isUnique: boolean;
        isAutoIncrement: boolean;
        defaultValue?: string;
        checkConstraint?: string;
      }>;
    }>;
    relationships?: Array<{
      id: string;
      sourceTableId: string;
      sourceColumnId: string;
      targetTableId: string;
      targetColumnId: string;
      onDelete?: string;
      onUpdate?: string;
    }>;
  };
}

export default function WorkspacePage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.projectId as string;

  const [isLoading, setIsLoading] = useState(true);
  const [isDragging, setIsDragging] = useState(false);
  const [showCreateTableDialog, setShowCreateTableDialog] = useState(false);
  const [pendingDropPosition, setPendingDropPosition] = useState<{ x: number; y: number } | null>(null);
  const [showAddColumnDialog, setShowAddColumnDialog] = useState(false);
  const [selectedTableForColumn, setSelectedTableForColumn] = useState<string | null>(null);
  
  // Edit column state
  const [showEditColumnDialog, setShowEditColumnDialog] = useState(false);
  const [editingColumn, setEditingColumn] = useState<Column | null>(null);
  const [editingTableId, setEditingTableId] = useState<string | null>(null);
  
  // Data panel state
  const [selectedDataTable, setSelectedDataTable] = useState<Table | null>(null);
  
  const canvasRef = useRef<HTMLDivElement>(null);

  const { isAuthenticated, checkAuth } = useAuthStore();
  const { 
    projectName, 
    databaseName, 
    tables,
    setProject, 
    addTable, 
    addColumn,
    updateColumn,
    setTables,
    setRelationships
  } = useWorkspaceStore();

  // Configure drag sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  // Check auth
  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/auth/login");
    }
  }, [isAuthenticated, router]);

  // Fetch project data
  useEffect(() => {
    const fetchProject = async () => {
      try {
        const response = await api.get<{ success: boolean; data: { project: ProjectData } }>(
          `/projects/${projectId}`
        );
        
        if (response.data.success) {
          const project = response.data.data.project;
          setProject(project.id, project.name, project.databaseName);
          
          // Load existing tables if any
          if (project.schemaData?.tables) {
            setTables(project.schemaData.tables);
          }
          // Load existing relationships if any
          if (project.schemaData?.relationships) {
            setRelationships(project.schemaData.relationships as any);
          }
        } else {
          toast.error("Failed to load project");
          router.push("/dashboard");
        }
      } catch (error) {
        console.error("Failed to fetch project:", error);
        toast.error("Failed to load project");
        router.push("/dashboard");
      } finally {
        setIsLoading(false);
      }
    };

    if (isAuthenticated && projectId) {
      fetchProject();
    }
  }, [isAuthenticated, projectId, router, setProject, setTables]);

  // Get table name for column dialog
  const getTableName = useCallback((tableId: string) => {
    const table = tables.find(t => t.id === tableId);
    return table?.name || "Table";
  }, [tables]);

  // Handle add column button click
  const handleAddColumn = useCallback((tableId: string) => {
    setSelectedTableForColumn(tableId);
    setShowAddColumnDialog(true);
  }, []);

  // Handle edit column button click
  const handleEditColumn = useCallback((tableId: string, column: Column) => {
    setEditingTableId(tableId);
    setEditingColumn(column);
    setShowEditColumnDialog(true);
  }, []);

  // Handle column creation
  const handleColumnConfirm = useCallback((column: {
    name: string;
    type: string;
    isPrimaryKey: boolean;
    isNullable: boolean;
    isUnique: boolean;
    isAutoIncrement: boolean;
    defaultValue?: string;
    checkConstraint?: string;
  }) => {
    if (selectedTableForColumn) {
      addColumn(selectedTableForColumn, column);
      toast.success(`Column "${column.name}" added`);
    }
    setShowAddColumnDialog(false);
    setSelectedTableForColumn(null);
  }, [selectedTableForColumn, addColumn]);

  // Handle column edit confirm
  const handleEditColumnConfirm = useCallback((updates: Partial<Column>) => {
    if (editingTableId && editingColumn) {
      updateColumn(editingTableId, editingColumn.id, updates);
      toast.success(`Column "${updates.name || editingColumn.name}" updated`);
    }
    setShowEditColumnDialog(false);
    setEditingColumn(null);
    setEditingTableId(null);
  }, [editingTableId, editingColumn, updateColumn]);

  // Handle drag start
  const handleDragStart = useCallback((event: DragStartEvent) => {
    if (event.active.id === "new-table") {
      setIsDragging(true);
    }
  }, []);

  // Handle drag end
  const handleDragEnd = useCallback((event: DragEndEvent) => {
    setIsDragging(false);
    
    const { active, over } = event;
    
    if (active.id === "new-table" && over?.id === "canvas-drop-zone") {
      // Calculate drop position relative to canvas
      const canvasElement = canvasRef.current;
      if (canvasElement) {
        const rect = canvasElement.getBoundingClientRect();
        const x = (event.delta.x || 0) + 100;
        const y = (event.delta.y || 0) + 100;
        
        setPendingDropPosition({ x, y });
        setShowCreateTableDialog(true);
      }
    }
  }, []);

  // Handle table creation
  const handleTableCreate = useCallback((name: string) => {
    if (pendingDropPosition) {
      addTable(name, pendingDropPosition);
      toast.success(`Table "${name}" created`);
    }
    setShowCreateTableDialog(false);
    setPendingDropPosition(null);
  }, [pendingDropPosition, addTable]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 text-purple-500 animate-spin" />
          <p className="text-zinc-400">Loading workspace...</p>
        </div>
      </div>
    );
  }

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="h-screen w-screen flex overflow-hidden bg-zinc-950">
        {/* Sidebar */}
        <Sidebar projectName={projectName} databaseName={databaseName} />

        {/* Canvas */}
        <div ref={canvasRef} className="flex-1 relative">
          <ReactFlowProvider>
            <Canvas onAddColumn={handleAddColumn} onEditColumn={handleEditColumn} />
          </ReactFlowProvider>
        </div>

        {/* Data Panel (Right sidebar) */}
        <DataPanel onTableSelect={(table) => {
          setSelectedDataTable(table);
        }} />
      </div>

      {/* Data Editor (Full screen overlay) */}
      {selectedDataTable && (
        <DataEditor
          table={selectedDataTable}
          projectId={projectId}
          onClose={() => setSelectedDataTable(null)}
        />
      )}

      {/* Drag overlay */}
      <DragOverlay>
        {isDragging && (
          <div className="flex items-center gap-3 p-3 rounded-xl bg-zinc-800 border border-zinc-600 shadow-2xl opacity-90">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center">
              <Table2 className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-sm font-medium text-white">Table</p>
              <p className="text-xs text-zinc-400">Drop to create</p>
            </div>
          </div>
        )}
      </DragOverlay>

      {/* Create Table Dialog */}
      <CreateTableDialog
        isOpen={showCreateTableDialog}
        onClose={() => {
          setShowCreateTableDialog(false);
          setPendingDropPosition(null);
        }}
        onConfirm={handleTableCreate}
      />

      {/* Add Column Dialog */}
      <AddColumnDialog
        isOpen={showAddColumnDialog}
        onClose={() => {
          setShowAddColumnDialog(false);
          setSelectedTableForColumn(null);
        }}
        onConfirm={handleColumnConfirm}
        tableName={selectedTableForColumn ? getTableName(selectedTableForColumn) : ""}
      />

      {/* Edit Column Dialog */}
      <EditColumnDialog
        isOpen={showEditColumnDialog}
        onClose={() => {
          setShowEditColumnDialog(false);
          setEditingColumn(null);
          setEditingTableId(null);
        }}
        onConfirm={handleEditColumnConfirm}
        column={editingColumn}
        tableName={editingTableId ? getTableName(editingTableId) : ""}
      />
    </DndContext>
  );
}
