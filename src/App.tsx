import { useState, useCallback, useRef, useEffect } from 'react';
import { useArchitectureData } from './hooks/useArchitectureData';
import type { LayoutDirection } from './hooks/useLayout';
import { SearchBar } from './components/layout/SearchBar';
import { Header } from './components/layout/Header';
import { Legend } from './components/layout/Legend';
import { EditToolbar } from './components/layout/EditToolbar';
import { ArchitectureCanvas } from './components/graph/ArchitectureCanvas';
import { AddNodeModal } from './components/ui/AddNodeModal';
import { EditNodeModal } from './components/ui/EditNodeModal';
import { AddEdgeModal } from './components/ui/AddEdgeModal';
import { EditEdgeModal } from './components/ui/EditEdgeModal';
import { LoadingState } from './components/ui/LoadingState';
import { DiagramSwitcher } from './components/layout/DiagramSwitcher';
import type { ArchitectureNode, ArchitectureEdge } from './types/architecture';

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
    updateNodePosition,
    deleteNode,
    addEdge,
    updateEdgeByIndex,
    deleteEdgeByIndex,
    deleteEdgeById,
    undo,
    redo,
    canUndo,
    canRedo,
    currentDiagramId,
    diagrams,
    switchDiagram,
    createDiagram,
    duplicateDiagram,
    deleteDiagram,
    setTitle,
    setSubtitle,
    autoSave,
    setAutoSave,
    lastSavedAt,
    save,
    downloadJson,
    importConfig,
  } = useArchitectureData();

  const [isAddNodeOpen, setIsAddNodeOpen] = useState(false);
  const [isAddEdgeOpen, setIsAddEdgeOpen] = useState(false);
  const [editNode, setEditNode] = useState<ArchitectureNode | null>(null);
  const [editEdge, setEditEdge] = useState<(ArchitectureEdge & { index: number }) | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isFlowActive, setIsFlowActive] = useState(false);
  const [layoutDirection, setLayoutDirection] = useState<LayoutDirection>('TB');
  const [showLabels, setShowLabels] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [focusNodeId, setFocusNodeId] = useState<string | null>(null);
  const exportPngRef = useRef<(() => void) | null>(null);
  const graphContainerRef = useRef<HTMLDivElement>(null);

  const handleToggleFullscreen = useCallback(() => {
    const el = graphContainerRef.current;
    if (!el) return;

    if (!document.fullscreenElement) {
      el.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  }, []);

  // Sync state with browser fullscreen events (e.g. user presses Esc)
  useEffect(() => {
    const handler = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', handler);
    return () => document.removeEventListener('fullscreenchange', handler);
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      // Ignore when typing in inputs
      if (document.activeElement?.tagName === 'INPUT' || document.activeElement?.tagName === 'TEXTAREA') return;

      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        undo();
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && e.shiftKey) {
        e.preventDefault();
        redo();
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'y') {
        e.preventDefault();
        redo();
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        save();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [undo, redo, save]);

  const handleSave = useCallback(async () => {
    setIsSaving(true);
    await save();
    setIsSaving(false);
  }, [save]);

  const handleNodeDoubleClick = useCallback((nodeId: string) => {
    const node = config?.nodes.find((n) => n.id === nodeId) ?? null;
    setEditNode(node);
  }, [config?.nodes]);

  const handleEdgeDoubleClick = useCallback((edgeId: string) => {
    // edgeId follows "edge-{index}" convention
    const match = edgeId.match(/^edge-(\d+)$/);
    if (!match || !config) return;
    const idx = parseInt(match[1], 10);
    const edge = config.edges[idx];
    if (edge) {
      setEditEdge({ ...edge, index: idx });
    }
  }, [config]);

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

  const handleEdgeConnect = useCallback(
    (source: string, target: string) => {
      addEdge({ source, target, flowDirection: 'unidirectional' });
    },
    [addEdge]
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
      <div className="flex items-center justify-between px-4">
        <Header title={title} subtitle={subtitle} onTitleChange={setTitle} onSubtitleChange={setSubtitle} />
        <DiagramSwitcher
          diagrams={diagrams}
          currentId={currentDiagramId}
          onSwitch={switchDiagram}
          onCreate={createDiagram}
          onDuplicate={duplicateDiagram}
          onDelete={deleteDiagram}
        />
      </div>
      <main className="flex-1 w-full max-w-[1920px] mx-auto px-4 pb-8 relative">
        <div className="flex justify-center mb-3">
          <SearchBar
            nodeOptions={nodeOptions}
            onSelectNode={(id) => setFocusNodeId(id)}
          />
        </div>
        <div
          ref={graphContainerRef}
          className="relative w-full h-[calc(100vh-140px)] min-h-[500px] rounded-xl border border-slate-700/50 overflow-hidden shadow-2xl bg-[#0d0d1a]"
        >
          {!isFullscreen && <Legend />}
          {!isFullscreen ? (
            <EditToolbar
              onAddNode={() => setIsAddNodeOpen(true)}
              onAddEdge={() => setIsAddEdgeOpen(true)}
              onSave={handleSave}
              onDownload={downloadJson}
              onImport={(raw) => { if (!importConfig(raw)) alert('Invalid architecture JSON — must have title, nodes[], and edges[].'); }}
              onExportPng={() => exportPngRef.current?.()}
              onUndo={undo}
              onRedo={redo}
              canUndo={canUndo}
              canRedo={canRedo}
              onToggleLabels={() => setShowLabels((v) => !v)}
              showLabels={showLabels}
              layoutDirection={layoutDirection}
              onLayoutDirectionChange={setLayoutDirection}
              autoSave={autoSave}
              onToggleAutoSave={() => setAutoSave(!autoSave)}
              lastSavedAt={lastSavedAt}
              onToggleFlow={() => setIsFlowActive((v) => !v)}
              isFlowActive={isFlowActive}
              onToggleFullscreen={handleToggleFullscreen}
              isFullscreen={isFullscreen}
              isSaving={isSaving}
              saveError={saveError}
            />
          ) : (
            <div className="absolute top-4 right-4 z-10 flex gap-2">
              <button
                onClick={() => setIsFlowActive((v) => !v)}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg backdrop-blur-md border text-sm font-medium transition-colors ${
                  isFlowActive
                    ? 'bg-accent-cyan/20 border-accent-cyan/60 text-accent-cyan'
                    : 'bg-slate-800/70 border-slate-600/40 text-slate-300 hover:border-slate-500'
                }`}
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" />
                </svg>
              </button>
              <button
                onClick={handleToggleFullscreen}
                className="flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-800/70 backdrop-blur-md border border-slate-600/40 text-slate-300 hover:border-slate-500 text-sm font-medium transition-colors"
                title="Exit fullscreen"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 9V4.5M9 9H4.5M9 9L3.75 3.75M9 15v4.5M9 15H4.5M9 15l-5.25 5.25M15 9h4.5M15 9V4.5M15 9l5.25-5.25M15 15h4.5M15 15v4.5m0-4.5l5.25 5.25" />
                </svg>
              </button>
            </div>
          )}
          <ArchitectureCanvas
            nodes={nodes}
            edges={edges}
            showFlow={isFlowActive}
            showLabels={showLabels}
            focusNodeId={focusNodeId}
            onNodeDoubleClick={handleNodeDoubleClick}
            onEdgeDoubleClick={handleEdgeDoubleClick}
            onNodesDelete={handleNodesDelete}
            onEdgesDelete={handleEdgesDelete}
            onExportPng={(fn) => { exportPngRef.current = fn; }}
            onNodePositionChange={updateNodePosition}
            onEdgeConnect={handleEdgeConnect}
            layoutDirection={layoutDirection}
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
      <EditEdgeModal
        isOpen={editEdge !== null}
        edge={editEdge}
        onClose={() => setEditEdge(null)}
        onSave={updateEdgeByIndex}
        onDelete={deleteEdgeByIndex}
        nodeOptions={nodeOptions}
      />
    </div>
  );
}

export default App;
