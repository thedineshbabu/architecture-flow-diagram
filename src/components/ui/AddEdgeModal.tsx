import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { ArchitectureEdge } from '../../types/architecture';

interface AddEdgeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (edge: ArchitectureEdge) => void;
  nodeOptions: { id: string; label: string }[];
}

export function AddEdgeModal({ isOpen, onClose, onAdd, nodeOptions }: AddEdgeModalProps) {
  const [source, setSource] = useState('');
  const [target, setTarget] = useState('');
  const [label, setLabel] = useState('');
  const [flowDirection, setFlowDirection] = useState<'unidirectional' | 'bidirectional'>('bidirectional');
  const [error, setError] = useState<string | null>(null);

  const handleClose = useCallback(() => {
    setSource('');
    setTarget('');
    setLabel('');
    setFlowDirection('bidirectional');
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
      onAdd({
        source,
        target,
        label: label.trim() || undefined,
        flowDirection,
      });
      handleClose();
    },
    [source, target, label, flowDirection, onAdd, handleClose]
  );

  return (
    <AnimatePresence>
      {isOpen && (
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
              <h3 className="text-lg font-semibold text-slate-100 mb-4">Add Connection</h3>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Source</label>
                  <select
                    value={source}
                    onChange={(e) => setSource(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-600 text-slate-100 focus:outline-none focus:ring-2 focus:ring-accent-cyan/50"
                  >
                    <option value="">Select source node</option>
                    {nodeOptions.map((n) => (
                      <option key={n.id} value={n.id}>
                        {n.label}
                      </option>
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
                    <option value="">Select target node</option>
                    {nodeOptions.map((n) => (
                      <option key={n.id} value={n.id}>
                        {n.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Label (optional)</label>
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
                  <select
                    value={flowDirection}
                    onChange={(e) => setFlowDirection(e.target.value as 'unidirectional' | 'bidirectional')}
                    className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-600 text-slate-100 focus:outline-none focus:ring-2 focus:ring-accent-cyan/50"
                  >
                    <option value="bidirectional">Bidirectional</option>
                    <option value="unidirectional">Unidirectional</option>
                  </select>
                </div>
                {error && (
                  <p className="text-sm text-red-400">{error}</p>
                )}
                <div className="flex gap-2 justify-end pt-2">
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
                    Add Connection
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
