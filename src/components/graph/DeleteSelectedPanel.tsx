import { useCallback } from 'react';
import { Panel, useStore } from '@xyflow/react';
import { motion, AnimatePresence } from 'framer-motion';

interface DeleteSelectedPanelProps {
  onDeleteNodes: (ids: string[]) => void;
  onDeleteEdges: (ids: string[]) => void;
}

export function DeleteSelectedPanel({ onDeleteNodes, onDeleteEdges }: DeleteSelectedPanelProps) {
  const selectedNodeIds = useStore(
    useCallback(
      (state) => state.nodes.filter((n) => n.selected).map((n) => n.id),
      []
    )
  );
  const selectedEdgeIds = useStore(
    useCallback(
      (state) => state.edges.filter((e) => e.selected).map((e) => e.id),
      []
    )
  );

  const hasSelection = selectedNodeIds.length > 0 || selectedEdgeIds.length > 0;

  const handleDelete = useCallback(() => {
    if (selectedNodeIds.length > 0) {
      onDeleteNodes(selectedNodeIds);
    }
    if (selectedEdgeIds.length > 0) {
      onDeleteEdges(selectedEdgeIds);
    }
  }, [selectedNodeIds, selectedEdgeIds, onDeleteNodes, onDeleteEdges]);

  return (
    <Panel position="bottom-center" className="!m-4">
      <AnimatePresence>
        {hasSelection && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="flex items-center gap-3 px-4 py-2 rounded-lg bg-slate-800/95 backdrop-blur-md border border-slate-600 shadow-lg"
          >
            <span className="text-sm text-slate-300">
              {selectedNodeIds.length > 0 && selectedEdgeIds.length > 0
                ? `${selectedNodeIds.length} node(s), ${selectedEdgeIds.length} connection(s) selected`
                : selectedNodeIds.length > 0
                  ? `${selectedNodeIds.length} node(s) selected`
                  : `${selectedEdgeIds.length} connection(s) selected`}
            </span>
            <button
              onClick={handleDelete}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-red-500/20 hover:bg-red-500/30 border border-red-500/50 text-red-400 text-sm font-medium transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              Remove selected
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </Panel>
  );
}
