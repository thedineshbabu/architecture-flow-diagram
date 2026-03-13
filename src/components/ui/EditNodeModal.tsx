import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { ArchitectureNode, NodeType } from '../../types/architecture';

interface EditNodeModalProps {
  isOpen: boolean;
  node: ArchitectureNode | null;
  onClose: () => void;
  onSave: (id: string, updates: Partial<ArchitectureNode>) => void;
  onDelete?: (id: string) => void;
  existingIds: string[];
}

const NODE_TYPES: { value: NodeType; label: string }[] = [
  { value: 'service', label: 'Service' },
  { value: 'database', label: 'Database' },
  { value: 'queue', label: 'Queue / Cache' },
];

export function EditNodeModal({ isOpen, node, onClose, onSave, onDelete, existingIds }: EditNodeModalProps) {
  const [id, setId] = useState('');
  const [label, setLabel] = useState('');
  const [type, setType] = useState<NodeType>('service');
  const [description, setDescription] = useState('');
  const [error, setError] = useState<string | null>(null);

  const originalId = node?.id ?? '';

  useEffect(() => {
    if (node) {
      setId(node.id);
      setLabel(node.label);
      setType(node.type);
      setDescription(node.description ?? '');
      setError(null);
    }
  }, [node]);

  const handleClose = useCallback(() => {
    setError(null);
    onClose();
  }, [onClose]);

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      setError(null);
      const trimmedId = id.trim().toLowerCase().replace(/\s+/g, '-');
      if (!trimmedId) {
        setError('ID is required');
        return;
      }
      if (trimmedId !== originalId && existingIds.includes(trimmedId)) {
        setError(`Node with ID "${trimmedId}" already exists`);
        return;
      }
      if (!label.trim()) {
        setError('Label is required');
        return;
      }
      onSave(originalId, {
        id: trimmedId,
        label: label.trim(),
        type,
        description: description.trim() || undefined,
      });
      handleClose();
    },
    [id, label, type, description, originalId, existingIds, onSave, handleClose]
  );

  return (
    <AnimatePresence>
      {isOpen && node && (
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
              <h3 className="text-lg font-semibold text-slate-100 mb-4">Edit Node</h3>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Label</label>
                  <input
                    type="text"
                    value={label}
                    onChange={(e) => setLabel(e.target.value)}
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
                    placeholder="Brief description"
                    rows={2}
                    className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-600 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-accent-cyan/50 resize-none"
                  />
                </div>
                {error && (
                  <p className="text-sm text-red-400">{error}</p>
                )}
                <div className="flex justify-between pt-2">
                  <div>
                    {onDelete && (
                      <button
                        type="button"
                        onClick={() => {
                          onDelete(originalId);
                          handleClose();
                        }}
                        className="px-4 py-2 rounded-lg bg-red-500/20 hover:bg-red-500/30 border border-red-500/50 text-red-400 text-sm font-medium transition-colors"
                      >
                        Remove node
                      </button>
                    )}
                  </div>
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
