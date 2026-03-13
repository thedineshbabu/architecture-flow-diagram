import { useState, useCallback } from 'react';
import { useArchitectureData } from './hooks/useArchitectureData';
import { Header } from './components/layout/Header';
import { Legend } from './components/layout/Legend';
import { EditToolbar } from './components/layout/EditToolbar';
import { ArchitectureCanvas } from './components/graph/ArchitectureCanvas';
import { AddNodeModal } from './components/ui/AddNodeModal';
import { EditNodeModal } from './components/ui/EditNodeModal';
import { AddEdgeModal } from './components/ui/AddEdgeModal';
import { LoadingState } from './components/ui/LoadingState';
import type { ArchitectureNode } from './types/architecture';

function App() {
  const {
    title,
    subtitle,
    nodes,
    edges,
    config,
    isLoading,
    error,
    saveError,
    refetch,
    addNode,
    updateNode,
    deleteNode,
    addEdge,
    deleteEdgeById,
    save,
    downloadJson,
  } = useArchitectureData();

  const [isAddNodeOpen, setIsAddNodeOpen] = useState(false);
  const [isAddEdgeOpen, setIsAddEdgeOpen] = useState(false);
  const [editNode, setEditNode] = useState<ArchitectureNode | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = useCallback(async () => {
    setIsSaving(true);
    await save();
    setIsSaving(false);
  }, [save]);

  const handleNodeDoubleClick = useCallback((nodeId: string) => {
    const node = config?.nodes.find((n) => n.id === nodeId) ?? null;
    setEditNode(node);
  }, [config?.nodes]);

  const handleNodesDelete = useCallback(
    (nodeIds: string[]) => {
      nodeIds.forEach((id) => deleteNode(id));
    },
    [deleteNode]
  );

  const handleEdgesDelete = useCallback(
    (edgeIds: string[]) => {
      edgeIds.forEach((id) => deleteEdgeById(id));
    },
    [deleteEdgeById]
  );

  const nodeOptions = (config?.nodes ?? []).map((n) => ({ id: n.id, label: n.label }));
  const existingIds = (config?.nodes ?? []).map((n) => n.id);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex flex-col items-center justify-center">
        <Header title="Architecture Flow" subtitle="Loading..." />
        <main className="flex-1 w-full max-w-7xl px-4">
          <LoadingState />
        </main>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex flex-col items-center justify-center p-4">
        <Header title="Architecture Flow" subtitle="Error loading configuration" />
        <main className="flex-1 flex flex-col items-center justify-center gap-4">
          <p className="text-red-400 text-center max-w-md">{error}</p>
          <button
            onClick={refetch}
            className="px-4 py-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-200 transition-colors"
          >
            Retry
          </button>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex flex-col">
      <Header title={title} subtitle={subtitle} />
      <main className="flex-1 w-full max-w-[1920px] mx-auto px-4 pb-8 relative">
        <div className="relative w-full h-[calc(100vh-140px)] min-h-[500px] rounded-xl border border-slate-700/50 overflow-hidden shadow-2xl">
          <Legend />
          <EditToolbar
            onAddNode={() => setIsAddNodeOpen(true)}
            onAddEdge={() => setIsAddEdgeOpen(true)}
            onSave={handleSave}
            onDownload={downloadJson}
            isSaving={isSaving}
            saveError={saveError}
          />
          <ArchitectureCanvas
            nodes={nodes}
            edges={edges}
            onNodeDoubleClick={handleNodeDoubleClick}
            onNodesDelete={handleNodesDelete}
            onEdgesDelete={handleEdgesDelete}
          />
        </div>
      </main>

      <AddNodeModal
        isOpen={isAddNodeOpen}
        onClose={() => setIsAddNodeOpen(false)}
        onAdd={addNode}
        existingIds={existingIds}
      />
      <EditNodeModal
        isOpen={editNode !== null}
        node={editNode}
        onClose={() => setEditNode(null)}
        onSave={updateNode}
        onDelete={deleteNode}
        existingIds={existingIds}
      />
      <AddEdgeModal
        isOpen={isAddEdgeOpen}
        onClose={() => setIsAddEdgeOpen(false)}
        onAdd={addEdge}
        nodeOptions={nodeOptions}
      />
    </div>
  );
}

export default App;
