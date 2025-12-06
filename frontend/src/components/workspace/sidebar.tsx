"use client";

import { Database, Table2, ArrowLeft, Loader2, Check } from "lucide-react";
import { useDraggable } from "@dnd-kit/core";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useWorkspaceStore } from "@/stores/workspace-store";

interface DraggableItemProps {
  id: string;
  children: React.ReactNode;
}

function DraggableItem({ id, children }: DraggableItemProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id,
  });

  const style = transform
    ? {
        transform: `translate(${transform.x}px, ${transform.y}px)`,
        zIndex: isDragging ? 1000 : undefined,
        opacity: isDragging ? 0.8 : 1,
      }
    : undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className="touch-none"
    >
      {children}
    </div>
  );
}

interface SidebarProps {
  projectName: string;
  databaseName: string;
}

export function Sidebar({ projectName, databaseName }: SidebarProps) {
  const { isSaving } = useWorkspaceStore();

  return (
    <div className="w-64 h-full bg-zinc-900 border-r border-zinc-800 flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-zinc-800">
        <Link href="/dashboard">
          <Button
            variant="ghost"
            size="sm"
            className="mb-3 text-zinc-400 hover:text-white hover:bg-zinc-800 -ml-2"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
        </Link>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center">
            <Database className="w-4 h-4 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-sm font-semibold text-white truncate">{projectName}</h2>
            <p className="text-xs text-zinc-500 truncate">{databaseName}</p>
          </div>
        </div>
        
        {/* Save indicator */}
        <div className="mt-3 flex items-center gap-2 text-xs">
          {isSaving ? (
            <>
              <Loader2 className="w-3 h-3 animate-spin text-blue-400" />
              <span className="text-zinc-400">Saving...</span>
            </>
          ) : (
            <>
              <Check className="w-3 h-3 text-green-400" />
              <span className="text-zinc-500">All changes saved</span>
            </>
          )}
        </div>
      </div>

      {/* Elements Panel */}
      <div className="flex-1 p-4 overflow-y-auto">
        <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-3">
          Elements
        </h3>
        
        <div className="space-y-2">
          {/* Draggable Table Element */}
          <DraggableItem id="new-table">
            <div className="flex items-center gap-3 p-3 rounded-xl bg-zinc-800/50 border border-zinc-700 cursor-grab active:cursor-grabbing hover:bg-zinc-800 hover:border-zinc-600 transition-all group">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center shadow-lg group-hover:shadow-blue-500/20">
                <Table2 className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-sm font-medium text-white">Table</p>
                <p className="text-xs text-zinc-500">Drag to workspace</p>
              </div>
            </div>
          </DraggableItem>
        </div>

        {/* Instructions */}
        <div className="mt-6 p-3 rounded-lg bg-zinc-800/30 border border-zinc-800">
          <h4 className="text-xs font-medium text-zinc-400 mb-2">Quick Tips</h4>
          <ul className="text-xs text-zinc-500 space-y-1">
            <li>• Drag table to workspace</li>
            <li>• Double-click to rename</li>
            <li>• Click + to add columns</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

