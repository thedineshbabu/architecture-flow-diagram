import { motion } from 'framer-motion';
import { useState, useRef, useCallback } from 'react';

interface HeaderProps {
  title: string;
  subtitle?: string;
  onTitleChange?: (title: string) => void;
  onSubtitleChange?: (subtitle: string) => void;
}

function InlineEdit({
  value,
  placeholder,
  className,
  onCommit,
}: {
  value: string;
  placeholder: string;
  className: string;
  onCommit: (v: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);

  const start = useCallback(() => {
    setDraft(value);
    setEditing(true);
    setTimeout(() => inputRef.current?.select(), 0);
  }, [value]);

  const commit = useCallback(() => {
    const trimmed = draft.trim();
    if (trimmed) onCommit(trimmed);
    setEditing(false);
  }, [draft, onCommit]);

  const handleKey = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') commit();
      if (e.key === 'Escape') setEditing(false);
    },
    [commit]
  );

  if (editing) {
    return (
      <input
        ref={inputRef}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={handleKey}
        className={`${className} bg-transparent border-b border-slate-500 outline-none text-center w-full`}
        autoFocus
      />
    );
  }

  return (
    <span
      onClick={start}
      title="Click to edit"
      className={`${className} cursor-text hover:text-white transition-colors group relative`}
    >
      {value || placeholder}
      <span className="ml-1.5 opacity-0 group-hover:opacity-40 text-slate-400 text-xs align-middle transition-opacity">✎</span>
    </span>
  );
}

export function Header({ title, subtitle, onTitleChange, onSubtitleChange }: HeaderProps) {
  return (
    <motion.header
      className="px-6 py-4 text-center"
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
    >
      <h1 className="text-2xl md:text-3xl font-semibold text-slate-100 tracking-tight">
        {onTitleChange ? (
          <InlineEdit
            value={title}
            placeholder="Diagram title"
            className="text-2xl md:text-3xl font-semibold text-slate-100 tracking-tight"
            onCommit={onTitleChange}
          />
        ) : (
          title
        )}
      </h1>
      <p className="mt-1 text-sm text-slate-400 min-h-[1.25rem]">
        {onSubtitleChange ? (
          <InlineEdit
            value={subtitle ?? ''}
            placeholder="Add subtitle…"
            className="text-sm text-slate-400"
            onCommit={onSubtitleChange}
          />
        ) : (
          subtitle
        )}
      </p>
    </motion.header>
  );
}
