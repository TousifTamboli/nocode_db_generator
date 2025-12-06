"use client";

import { useCallback, useMemo } from "react";
import {
  ReactFlow,
  Background,
  useNodesState,
  useEdgesState,
  Node,
  Edge,
  NodeTypes,
  OnNodesChange,
  OnConnect,
  Connection,
  BackgroundVariant,
  useReactFlow,
  Panel,
  MarkerType,
  EdgeTypes,
  getBezierPath,
  EdgeProps,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { useDroppable } from "@dnd-kit/core";
import { TableNode } from "./table-node";
import { useWorkspaceStore, Column, Relationship } from "@/stores/workspace-store";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ZoomIn, ZoomOut, Maximize2, X } from "lucide-react";
import { toast } from "sonner";

interface CanvasProps {
  onAddColumn: (tableId: string) => void;
  onEditColumn: (tableId: string, column: Column) => void;
}

// Custom edge component for foreign key relationships
function ForeignKeyEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
  markerEnd,
  data,
}: EdgeProps) {
  const { deleteRelationship } = useWorkspaceStore();
  
  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  const handleDelete = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    deleteRelationship(id);
    toast.success("Foreign key removed");
  }, [id, deleteRelationship]);

  return (
    <>
      <path
        id={id}
        style={style}
        className="react-flow__edge-path"
        d={edgePath}
        markerEnd={markerEnd}
      />
      {/* Clickable area for the edge */}
      <path
        d={edgePath}
        fill="none"
        strokeWidth={20}
        stroke="transparent"
        className="react-flow__edge-interaction"
      />
      {/* Delete button on hover */}
      <foreignObject
        width={20}
        height={20}
        x={labelX - 10}
        y={labelY - 10}
        className="overflow-visible"
        requiredExtensions="http://www.w3.org/1999/xhtml"
      >
        <div className="flex items-center justify-center w-5 h-5 rounded-full bg-red-500 hover:bg-red-600 cursor-pointer opacity-0 hover:opacity-100 transition-opacity group-hover:opacity-100">
          <button onClick={handleDelete} className="w-full h-full flex items-center justify-center">
            <X className="w-3 h-3 text-white" />
          </button>
        </div>
      </foreignObject>
      {/* Label showing FK */}
      <foreignObject
        width={40}
        height={20}
        x={labelX - 20}
        y={labelY - 25}
        className="overflow-visible pointer-events-none"
        requiredExtensions="http://www.w3.org/1999/xhtml"
      >
        <div className="flex items-center justify-center">
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-500/80 text-white font-medium">
            FK
          </span>
        </div>
      </foreignObject>
    </>
  );
}

function CanvasContent({ onAddColumn, onEditColumn }: CanvasProps) {
  const { tables, relationships, updateTablePosition, addRelationship } = useWorkspaceStore();
  const reactFlowInstance = useReactFlow();
  
  const { setNodeRef, isOver } = useDroppable({
    id: "canvas-drop-zone",
  });

  // Define custom node types
  const nodeTypes = useMemo(
    () => ({
      tableNode: TableNode,
    }),
    []
  ) as NodeTypes;

  // Define custom edge types
  const edgeTypes = useMemo(
    () => ({
      foreignKey: ForeignKeyEdge,
    }),
    []
  ) as EdgeTypes;

  // Convert tables to React Flow nodes
  const initialNodes: Node[] = useMemo(
    () =>
      tables.map((table) => ({
        id: table.id,
        type: "tableNode",
        position: table.position,
        data: {
          label: table.name,
          tableId: table.id,
          columns: table.columns,
          onAddColumn,
          onEditColumn,
        },
      })),
    [tables, onAddColumn, onEditColumn]
  );

  // Convert relationships to React Flow edges
  const initialEdges = useMemo(
    () =>
      relationships.map((rel) => ({
        id: rel.id,
        source: rel.sourceTableId,
        target: rel.targetTableId,
        sourceHandle: `${rel.sourceTableId}-${rel.sourceColumnId}-source`,
        targetHandle: `${rel.targetTableId}-${rel.targetColumnId}-target`,
        type: 'foreignKey' as const,
        animated: true,
        style: { stroke: '#a855f7', strokeWidth: 2 },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: '#a855f7',
        },
        data: { ...rel },
      })),
    [relationships]
  );

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  // Sync nodes when tables change
  useEffect(() => {
    setNodes(
      tables.map((table) => ({
        id: table.id,
        type: "tableNode",
        position: table.position,
        data: {
          label: table.name,
          tableId: table.id,
          columns: table.columns,
          onAddColumn,
          onEditColumn,
        },
      }))
    );
  }, [tables, setNodes, onAddColumn, onEditColumn]);

  // Sync edges when relationships change
  useEffect(() => {
    setEdges(
      relationships.map((rel) => ({
        id: rel.id,
        source: rel.sourceTableId,
        target: rel.targetTableId,
        sourceHandle: `${rel.sourceTableId}-${rel.sourceColumnId}-source`,
        targetHandle: `${rel.targetTableId}-${rel.targetColumnId}-target`,
        type: 'foreignKey' as const,
        animated: true,
        style: { stroke: '#a855f7', strokeWidth: 2 },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: '#a855f7',
        },
        data: { ...rel },
      }))
    );
  }, [relationships, setEdges]);

  // Handle node position changes
  const handleNodesChange: OnNodesChange = useCallback(
    (changes) => {
      onNodesChange(changes);
      
      changes.forEach((change) => {
        if (change.type === "position" && change.position && !change.dragging) {
          updateTablePosition(change.id, change.position);
        }
      });
    },
    [onNodesChange, updateTablePosition]
  );

  // Handle new connection (foreign key creation)
  const handleConnect: OnConnect = useCallback(
    (connection: Connection) => {
      console.log('🔗 Connection attempt:', connection);
      
      if (!connection.source || !connection.target || !connection.sourceHandle || !connection.targetHandle) {
        console.log('❌ Missing connection data');
        return;
      }

      // Parse handle IDs to get column IDs
      // Format: tableId-columnId-source or tableId-columnId-target
      // UUIDs contain hyphens, so we need to parse carefully
      // The format is: {tableUUID}-{columnUUID}-{type}
      // We need to extract the columnUUID which is the second UUID
      
      const sourceHandle = connection.sourceHandle;
      const targetHandle = connection.targetHandle;
      
      // Extract column ID by removing the table ID prefix and the suffix
      // tableId is connection.source, so remove that plus a hyphen from the start
      // and remove -source or -target from the end
      const sourceColumnId = sourceHandle
        .replace(`${connection.source}-`, '')
        .replace('-source', '');
      
      const targetColumnId = targetHandle
        .replace(`${connection.target}-`, '')
        .replace('-target', '');
      
      console.log('📊 Source column ID:', sourceColumnId);
      console.log('📊 Target column ID:', targetColumnId);

      // Find the source and target columns
      const sourceTable = tables.find(t => t.id === connection.source);
      const targetTable = tables.find(t => t.id === connection.target);
      
      console.log('📊 Source table:', sourceTable?.name);
      console.log('📊 Target table:', targetTable?.name);
      
      if (!sourceTable || !targetTable) {
        console.log('❌ Table not found');
        return;
      }

      const sourceColumn = sourceTable.columns.find(c => c.id === sourceColumnId);
      const targetColumn = targetTable.columns.find(c => c.id === targetColumnId);
      
      console.log('📊 Source column:', sourceColumn?.name);
      console.log('📊 Target column:', targetColumn?.name);

      if (!sourceColumn || !targetColumn) {
        console.log('❌ Column not found');
        console.log('Available source columns:', sourceTable.columns.map(c => ({ id: c.id, name: c.name })));
        console.log('Available target columns:', targetTable.columns.map(c => ({ id: c.id, name: c.name })));
        return;
      }

      // Validate: target should ideally be a primary key or unique
      if (!targetColumn.isPrimaryKey && !targetColumn.isUnique) {
        toast.warning(`Hint: "${targetColumn.name}" should be PRIMARY KEY or UNIQUE for foreign key reference`);
      }

      // Create the relationship
      addRelationship({
        sourceTableId: connection.source,
        sourceColumnId: sourceColumnId,
        targetTableId: connection.target,
        targetColumnId: targetColumnId,
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      });

      toast.success(
        `Foreign key created: ${sourceTable.name}.${sourceColumn.name} → ${targetTable.name}.${targetColumn.name}`
      );
    },
    [tables, addRelationship]
  );

  // Fit view to show all nodes
  const handleFitView = useCallback(() => {
    reactFlowInstance.fitView({ padding: 0.2, duration: 300 });
  }, [reactFlowInstance]);

  const handleZoomIn = useCallback(() => {
    reactFlowInstance.zoomIn({ duration: 200 });
  }, [reactFlowInstance]);

  const handleZoomOut = useCallback(() => {
    reactFlowInstance.zoomOut({ duration: 200 });
  }, [reactFlowInstance]);

  return (
    <div
      ref={setNodeRef}
      className={`flex-1 h-full transition-colors ${
        isOver ? "bg-purple-900/10" : ""
      }`}
    >
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={handleNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={handleConnect}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        fitView
        snapToGrid
        snapGrid={[20, 20]}
        minZoom={0.1}
        maxZoom={2}
        defaultViewport={{ x: 100, y: 100, zoom: 1 }}
        proOptions={{ hideAttribution: true }}
        className="bg-zinc-950"
        panOnScroll
        panOnDrag
        zoomOnScroll
        zoomOnPinch
        selectionOnDrag={false}
        connectionLineStyle={{ stroke: '#a855f7', strokeWidth: 2 }}
        defaultEdgeOptions={{
          type: 'foreignKey',
          animated: true,
        }}
      >
        <Background
          variant={BackgroundVariant.Dots}
          gap={20}
          size={1}
          color="#27272a"
        />
        
        {/* Custom Controls Panel */}
        <Panel position="bottom-right" className="flex gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={handleZoomOut}
            className="h-9 w-9 bg-zinc-900 border-zinc-700 text-zinc-400 hover:text-white hover:bg-zinc-800"
            title="Zoom out"
          >
            <ZoomOut className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={handleZoomIn}
            className="h-9 w-9 bg-zinc-900 border-zinc-700 text-zinc-400 hover:text-white hover:bg-zinc-800"
            title="Zoom in"
          >
            <ZoomIn className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={handleFitView}
            className="h-9 w-9 bg-zinc-900 border-zinc-700 text-zinc-400 hover:text-white hover:bg-zinc-800"
            title="Fit all tables in view"
          >
            <Maximize2 className="h-4 w-4" />
          </Button>
        </Panel>
      </ReactFlow>

      {/* Drop zone indicator */}
      {isOver && (
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
          <div className="px-6 py-3 rounded-xl bg-purple-500/20 border-2 border-dashed border-purple-500 text-purple-300 font-medium">
            Drop table here
          </div>
        </div>
      )}
    </div>
  );
}

export function Canvas(props: CanvasProps) {
  return <CanvasContent {...props} />;
}
