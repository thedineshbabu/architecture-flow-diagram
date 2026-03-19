import { useState, useRef, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface SearchBarProps {
  nodeOptions: { id: string; label: string }[];
  onSelectNode: (nodeId: string) => void;
}

export function SearchBar({ nodeOptions, onSelectNode }: SearchBarProps) {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const filtered = useMemo(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase();
    return nodeOptions.filter((n) =>
      n.label.toLowerCase().includes(q) || n.id.toLowerCase().includes(q)
    );
  }, [query, nodeOptions]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as HTMLElement)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleSelect = (id: string) => {
    onSelectNode(id);
    setQuery('');
    setIsOpen(false);
  };

  return (
    <div ref={containerRef} className="relative z-20 w-64">
      <div className="relative">
        <svg
          className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none"
          fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => { setQuery(e.target.value); setIsOpen(true); }}
          onFocus={() => setIsOpen(true)}
          placeholder="Search nodes..."
          className="w-full pl-9 pr-3 py-2 rounded-lg bg-slate-800/90 backdrop-blur-md border border-slate-600/60 text-slate-200 text-sm placeholder-slate-500 focus:outline-none focus:border-accent-cyan/50 transition-colors"
        />
      </div>
      <AnimatePresence>
        {isOpen && filtered.length > 0 && (
          <motion.ul
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.15 }}
            className="absolute top-full mt-1 w-full bg-slate-800/95 backdrop-blur-md border border-slate-600/60 rounded-lg shadow-xl overflow-hidden max-h-60 overflow-y-auto"
          >
            {filtered.map((node) => (
              <li
                key={node.id}
                onClick={() => handleSelect(node.id)}
                className="px-3 py-2 text-sm text-slate-200 hover:bg-slate-700/80 cursor-pointer transition-colors"
              >
                <span className="font-medium">{node.label}</span>
                <span className="ml-2 text-slate-500 text-xs">{node.id}</span>
              </li>
            ))}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  );
}
