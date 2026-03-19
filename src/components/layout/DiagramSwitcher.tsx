import { useState, useCallback, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export interface DiagramInfo {
  id: string;
  title: string;
  subtitle?: string;
  nodeCount: number;
  edgeCount: number;
}

interface DiagramSwitcherProps {
  diagrams: DiagramInfo[];
  currentId: string;
  onSwitch: (id: string) => void;
  onCreate: (id: string, title: string) => void;
  onDuplicate: (fromId: string, newId: string, newTitle: string) => void;
  onDelete: (id: string) => void;
}

export function DiagramSwitcher({
  diagrams,
  currentId,
  onSwitch,
  onCreate,
  onDuplicate,
  onDelete,
}: DiagramSwitcherProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close on click outside
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setIsCreating(false);
        setDeleteConfirm(null);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [isOpen]);

  const handleCreate = useCallback(() => {
    const title = newTitle.trim();
    if (!title) return;
    const id = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    if (!id || diagrams.some((d) => d.id === id)) return;
    onCreate(id, title);
    setNewTitle('');
    setIsCreating(false);
    setIsOpen(false);
  }, [newTitle, diagrams, onCreate]);

  const handleDuplicate = useCallback((fromId: string) => {
    const from = diagrams.find((d) => d.id === fromId);
    const newId = `${fromId}-copy`;
    const newTitle = `${from?.title ?? fromId} (Copy)`;
    onDuplicate(fromId, newId, newTitle);
    setIsOpen(false);
  }, [diagrams, onDuplicate]);

  const handleDelete = useCallback((id: string) => {
    if (deleteConfirm === id) {
      onDelete(id);
      setDeleteConfirm(null);
      setIsOpen(false);
    } else {
      setDeleteConfirm(id);
    }
  }, [deleteConfirm, onDelete]);

  const current = diagrams.find((d) => d.id === currentId);

  return (
    <div ref={dropdownRef} className="relative">
      <button
        onClick={() => setIsOpen((v) => !v)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800/60 border border-slate-600/40 hover:border-slate-500 text-slate-200 text-sm transition-colors"
      >
        <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
        </svg>
        <span className="max-w-[180px] truncate">{current?.title ?? currentId}</span>
        <svg className={`w-3 h-3 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
        </svg>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="absolute top-full mt-2 left-0 w-72 rounded-xl bg-slate-800/95 backdrop-blur-md border border-slate-600/60 shadow-2xl overflow-hidden z-50"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.15 }}
          >
            <div className="px-3 py-2 border-b border-slate-700/50">
              <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Diagrams</span>
            </div>

            <div className="max-h-[300px] overflow-y-auto">
              {diagrams.map((d) => (
                <div
                  key={d.id}
                  className={`flex items-center gap-2 px-3 py-2.5 cursor-pointer transition-colors ${
                    d.id === currentId
                      ? 'bg-accent-cyan/10 border-l-2 border-accent-cyan'
                      : 'hover:bg-slate-700/50 border-l-2 border-transparent'
                  }`}
                >
                  <div
                    className="flex-1 min-w-0"
                    onClick={() => { onSwitch(d.id); setIsOpen(false); }}
                  >
                    <div className="text-sm text-slate-200 truncate">{d.title}</div>
                    <div className="text-xs text-slate-500">{d.nodeCount} nodes, {d.edgeCount} edges</div>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button
                      onClick={(e) => { e.stopPropagation(); handleDuplicate(d.id); }}
                      className="p-1 rounded hover:bg-slate-600/50 text-slate-400 hover:text-slate-200 transition-colors"
                      title="Duplicate"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 01-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0 011.5.124m7.5 10.376h3.375c.621 0 1.125-.504 1.125-1.125V11.25c0-4.46-3.243-8.161-7.5-8.876a9.06 9.06 0 00-1.5-.124H9.375c-.621 0-1.125.504-1.125 1.125v3.5m7.5 10.375H9.375a1.125 1.125 0 01-1.125-1.125v-9.25m12 6.625v-1.875a3.375 3.375 0 00-3.375-3.375h-1.5a1.125 1.125 0 01-1.125-1.125v-1.5a3.375 3.375 0 00-3.375-3.375H9.75" />
                      </svg>
                    </button>
                    {diagrams.length > 1 && (
                      <button
                        onClick={(e) => { e.stopPropagation(); handleDelete(d.id); }}
                        className={`p-1 rounded transition-colors ${
                          deleteConfirm === d.id
                            ? 'bg-red-500/20 text-red-400'
                            : 'hover:bg-slate-600/50 text-slate-400 hover:text-slate-200'
                        }`}
                        title={deleteConfirm === d.id ? 'Click again to confirm' : 'Delete'}
                      >
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                        </svg>
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="border-t border-slate-700/50 p-2">
              {isCreating ? (
                <form
                  onSubmit={(e) => { e.preventDefault(); handleCreate(); }}
                  className="flex gap-2"
                >
                  <input
                    type="text"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    placeholder="Diagram name..."
                    autoFocus
                    className="flex-1 px-2 py-1.5 rounded-lg bg-slate-900 border border-slate-600 text-slate-100 text-sm placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-accent-cyan/50"
                  />
                  <button
                    type="submit"
                    disabled={!newTitle.trim()}
                    className="px-3 py-1.5 rounded-lg bg-accent-cyan/20 border border-accent-cyan/50 text-accent-cyan text-sm font-medium disabled:opacity-40"
                  >
                    Create
                  </button>
                </form>
              ) : (
                <button
                  onClick={() => setIsCreating(true)}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-slate-700/50 text-slate-300 text-sm transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                  </svg>
                  New Diagram
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
