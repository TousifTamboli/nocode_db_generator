"use client";

import { useCallback, useMemo, useRef } from "react";
import {
  ReactFlow,
  Background,
  useNodesState,
  useEdgesState,
  Node,
  NodeTypes,
  OnNodesChange,
  BackgroundVariant,
  useReactFlow,
  ReactFlowInstance,
  Panel,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { useDroppable } from "@dnd-kit/core";
import { TableNode } from "./table-node";
import { useWorkspaceStore, Column } from "@/stores/workspace-store";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Focus, ZoomIn, ZoomOut, Maximize2 } from "lucide-react";

interface CanvasProps {
  onAddColumn: (tableId: string) => void;
  onEditColumn: (tableId: string, column: Column) => void;
}

function CanvasContent({ onAddColumn, onEditColumn }: CanvasProps) {
  const { tables, updateTablePosition } = useWorkspaceStore();
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

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

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

  // Handle node position changes
  const handleNodesChange: OnNodesChange = useCallback(
    (changes) => {
      onNodesChange(changes);
      
      // Update positions in store when drag ends
      changes.forEach((change) => {
        if (change.type === "position" && change.position && !change.dragging) {
          updateTablePosition(change.id, change.position);
        }
      });
    },
    [onNodesChange, updateTablePosition]
  );

  // Fit view to show all nodes
  const handleFitView = useCallback(() => {
    reactFlowInstance.fitView({ padding: 0.2, duration: 300 });
  }, [reactFlowInstance]);

  // Zoom controls
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
        nodeTypes={nodeTypes}
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

// Wrapper component that doesn't need ReactFlowProvider (it's in parent)
export function Canvas(props: CanvasProps) {
  return <CanvasContent {...props} />;
}
