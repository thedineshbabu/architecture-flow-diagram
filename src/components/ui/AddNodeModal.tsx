import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { ArchitectureNode, NodeType } from '../../types/architecture';

interface AddNodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (node: ArchitectureNode) => void;
  existingIds: string[];
}

const NODE_TYPES: { value: NodeType; label: string }[] = [
  { value: 'service', label: 'Service' },
  { value: 'database', label: 'Database' },
  { value: 'queue', label: 'Queue / Cache' },
];

export function AddNodeModal({ isOpen, onClose, onAdd, existingIds }: AddNodeModalProps) {
  const [id, setId] = useState('');
  const [label, setLabel] = useState('');
  const [type, setType] = useState<NodeType>('service');
  const [description, setDescription] = useState('');
  const [error, setError] = useState<string | null>(null);

  const reset = useCallback(() => {
    setId('');
    setLabel('');
    setType('service');
    setDescription('');
    setError(null);
  }, []);

  const handleClose = useCallback(() => {
    reset();
    onClose();
  }, [reset, onClose]);

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      setError(null);
      const trimmedId = id.trim().toLowerCase().replace(/\s+/g, '-');
      if (!trimmedId) {
        setError('ID is required');
        return;
      }
      if (existingIds.includes(trimmedId)) {
        setError(`Node with ID "${trimmedId}" already exists`);
        return;
      }
      if (!label.trim()) {
        setError('Label is required');
        return;
      }
      onAdd({
        id: trimmedId,
        label: label.trim(),
        type,
        description: description.trim() || undefined,
      });
      handleClose();
    },
    [id, label, type, description, existingIds, onAdd, handleClose]
  );

  const suggestId = useCallback(() => {
    if (label.trim()) {
      setId(label.trim().toLowerCase().replace(/\s+/g, '-'));
    }
  }, [label]);

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
              <h3 className="text-lg font-semibold text-slate-100 mb-4">Add Node</h3>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Label</label>
                  <input
                    type="text"
                    value={label}
                    onChange={(e) => setLabel(e.target.value)}
                    onBlur={suggestId}
                    placeholder="e.g. API Gateway"
                    className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-600 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-accent-cyan/50"
                    autoFocus
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">ID</label>
                  <input
                    type="text"
                    value={id}
                    onChange={(e) => setId(e.target.value)}
                    placeholder="e.g. api-gateway"
                    className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-600 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-accent-cyan/50"
                  />
                  <p className="mt-1 text-xs text-slate-500">Unique identifier (auto-filled from label)</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Type</label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value as NodeType)}
                    className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-600 text-slate-100 focus:outline-none focus:ring-2 focus:ring-accent-cyan/50"
                  >
                    {NODE_TYPES.map((t) => (
                      <option key={t.value} value={t.value}>
                        {t.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Description (optional)</label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Brief description of this component"
                    rows={2}
                    className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-600 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-accent-cyan/50 resize-none"
                  />
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
                    Add Node
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
