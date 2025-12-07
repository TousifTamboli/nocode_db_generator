"use client";

import { useState } from "react";
import { Database, Table2, ChevronRight, X, Rows3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useWorkspaceStore, Table } from "@/stores/workspace-store";
import { ScrollArea } from "@/components/ui/scroll-area";

interface DataPanelProps {
  onTableSelect: (table: Table) => void;
}

export function DataPanel({ onTableSelect }: DataPanelProps) {
  const { tables, databaseName } = useWorkspaceStore();
  const [isCollapsed, setIsCollapsed] = useState(false);

  if (isCollapsed) {
    return (
      <div className="w-12 bg-zinc-900 border-l border-zinc-800 flex flex-col items-center py-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsCollapsed(false)}
          className="text-zinc-400 hover:text-white hover:bg-zinc-800"
          title="Expand Data Panel"
        >
          <Database className="w-5 h-5" />
        </Button>
      </div>
    );
  }

  return (
    <div className="w-72 bg-zinc-900 border-l border-zinc-800 flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-zinc-800">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Database className="w-5 h-5 text-cyan-400" />
            <h2 className="font-semibold text-white">Data Explorer</h2>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsCollapsed(true)}
            className="h-7 w-7 text-zinc-400 hover:text-white hover:bg-zinc-800"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
        <p className="text-xs text-zinc-500 mt-1">{databaseName}</p>
      </div>

      {/* Tables List */}
      <ScrollArea className="flex-1">
        <div className="p-3">
          <p className="text-xs font-medium text-zinc-500 uppercase tracking-wide mb-3">
            Tables ({tables.length})
          </p>
          
          {tables.length === 0 ? (
            <div className="text-center py-8">
              <Table2 className="w-10 h-10 text-zinc-700 mx-auto mb-3" />
              <p className="text-sm text-zinc-500">No tables yet</p>
              <p className="text-xs text-zinc-600 mt-1">
                Drag a table from the left sidebar
              </p>
            </div>
          ) : (
            <div className="space-y-1">
              {tables.map((table) => (
                <button
                  key={table.id}
                  onClick={() => onTableSelect(table)}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg bg-zinc-800/50 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-700 transition-all group"
                >
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center shrink-0">
                    <Table2 className="w-4 h-4 text-white" />
                  </div>
                  <div className="flex-1 text-left min-w-0">
                    <p className="text-sm font-medium text-white truncate">
                      {table.name}
                    </p>
                    <p className="text-xs text-zinc-500">
                      {table.columns.length} column{table.columns.length !== 1 ? 's' : ''}
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="px-2 py-0.5 rounded bg-zinc-700 text-[10px] text-zinc-400 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Rows3 className="w-3 h-3 inline mr-1" />
                      View Data
                    </div>
                    <ChevronRight className="w-4 h-4 text-zinc-600 group-hover:text-zinc-400 transition-colors" />
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Footer hint */}
      <div className="p-3 border-t border-zinc-800">
        <p className="text-[10px] text-zinc-600 text-center">
          Click a table to view and manage its data
        </p>
      </div>
    </div>
  );
}
