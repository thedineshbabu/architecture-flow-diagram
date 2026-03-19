import { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { ArchitectureEdge, FlowDirection } from '../../types/architecture';

interface EditEdgeModalProps {
  isOpen: boolean;
  edge: (ArchitectureEdge & { index: number }) | null;
  onClose: () => void;
  onSave: (index: number, updates: Partial<ArchitectureEdge>) => void;
  onDelete: (index: number) => void;
  nodeOptions: { id: string; label: string }[];
}

export function EditEdgeModal({ isOpen, edge, onClose, onSave, onDelete, nodeOptions }: EditEdgeModalProps) {
  const [source, setSource] = useState('');
  const [target, setTarget] = useState('');
  const [label, setLabel] = useState('');
  const [flowDirection, setFlowDirection] = useState<FlowDirection>('bidirectional');
  const [sequence, setSequence] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (edge) {
      setSource(edge.source);
      setTarget(edge.target);
      setLabel(edge.label ?? '');
      setFlowDirection(edge.flowDirection ?? 'bidirectional');
      setSequence(edge.sequence != null ? String(edge.sequence) : '');
      setError(null);
    }
  }, [edge]);

  const handleClose = useCallback(() => {
    setError(null);
    onClose();
  }, [onClose]);

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      setError(null);
      if (!source || !target) {
        setError('Source and target are required');
        return;
      }
      if (source === target) {
        setError('Source and target must be different');
        return;
      }
      if (edge == null) return;
      const seqNum = sequence.trim() ? parseInt(sequence.trim(), 10) : undefined;
      onSave(edge.index, {
        source,
        target,
        label: label.trim() || undefined,
        flowDirection,
        sequence: seqNum && !isNaN(seqNum) ? seqNum : undefined,
      });
      handleClose();
    },
    [source, target, label, flowDirection, edge, onSave, handleClose]
  );

  const handleDelete = useCallback(() => {
    if (edge == null) return;
    onDelete(edge.index);
    handleClose();
  }, [edge, onDelete, handleClose]);

  const getNodeLabel = (id: string) => nodeOptions.find((n) => n.id === id)?.label ?? id;

  return (
    <AnimatePresence>
      {isOpen && edge && (
        <>
          <motion.div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
          />
          <motion.div
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-md"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2 }}
          >
            <div className="bg-slate-800 rounded-xl border border-slate-600 shadow-2xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-slate-100">Edit Connection</h3>
                <span className="text-xs text-slate-500">
                  {getNodeLabel(edge.source)} → {getNodeLabel(edge.target)}
                </span>
              </div>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Source</label>
                  <select
                    value={source}
                    onChange={(e) => setSource(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-600 text-slate-100 focus:outline-none focus:ring-2 focus:ring-accent-cyan/50"
                  >
                    {nodeOptions.map((n) => (
                      <option key={n.id} value={n.id}>{n.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Target</label>
                  <select
                    value={target}
                    onChange={(e) => setTarget(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-600 text-slate-100 focus:outline-none focus:ring-2 focus:ring-accent-cyan/50"
                  >
                    {nodeOptions.map((n) => (
                      <option key={n.id} value={n.id}>{n.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Label</label>
                  <input
                    type="text"
                    value={label}
                    onChange={(e) => setLabel(e.target.value)}
                    placeholder="e.g. JWT validation"
                    className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-600 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-accent-cyan/50"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Flow Direction</label>
                  <div className="flex gap-2">
                    {(['unidirectional', 'bidirectional'] as const).map((dir) => (
                      <button
                        key={dir}
                        type="button"
                        onClick={() => setFlowDirection(dir)}
                        className={`flex-1 px-3 py-2 rounded-lg border text-sm font-medium transition-colors ${
                          flowDirection === dir
                            ? 'bg-accent-cyan/20 border-accent-cyan/60 text-accent-cyan'
                            : 'bg-slate-900 border-slate-600 text-slate-400 hover:border-slate-500'
                        }`}
                      >
                        {dir === 'unidirectional' ? '→ One-way' : '↔ Two-way'}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Sequence Order</label>
                  <input
                    type="number"
                    min="1"
                    value={sequence}
                    onChange={(e) => setSequence(e.target.value)}
                    placeholder="e.g. 1, 2, 3 (leave empty for no sequence)"
                    className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-600 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-accent-cyan/50"
                  />
                  <p className="text-xs text-slate-500 mt-1">Defines the order in the flow when "Show Flow" is active</p>
                </div>
                {error && <p className="text-sm text-red-400">{error}</p>}
                <div className="flex gap-2 justify-between pt-2">
                  <button
                    type="button"
                    onClick={handleDelete}
                    className="px-4 py-2 rounded-lg bg-red-500/15 hover:bg-red-500/25 border border-red-500/40 text-red-400 text-sm font-medium transition-colors"
                  >
                    Delete
                  </button>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={handleClose}
                      className="px-4 py-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-200 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 rounded-lg bg-accent-cyan hover:bg-accent-cyan/90 text-slate-900 font-medium transition-colors"
                    >
                      Save
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
