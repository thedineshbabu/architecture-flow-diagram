import { motion } from 'framer-motion';

interface EditToolbarProps {
  onAddNode: () => void;
  onAddEdge: () => void;
  onSave: () => void;
  onDownload: () => void;
  isSaving?: boolean;
  saveError: string | null;
}

export function EditToolbar({
  onAddNode,
  onAddEdge,
  onSave,
  onDownload,
  isSaving = false,
  saveError,
}: EditToolbarProps) {
  return (
    <motion.div
      className="absolute top-4 right-4 z-10 flex flex-wrap gap-2"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3, delay: 0.15 }}
    >
      <button
        onClick={onAddNode}
        className="flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-800/90 backdrop-blur-md border border-slate-600 hover:border-accent-cyan/50 text-slate-200 text-sm font-medium transition-colors"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
        </svg>
        Add Node
      </button>
      <button
        onClick={onAddEdge}
        className="flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-800/90 backdrop-blur-md border border-slate-600 hover:border-accent-cyan/50 text-slate-200 text-sm font-medium transition-colors"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
        </svg>
        Add Connection
      </button>
      <button
        onClick={onSave}
        disabled={isSaving}
        className="flex items-center gap-2 px-3 py-2 rounded-lg bg-accent-cyan/20 border border-accent-cyan/50 hover:bg-accent-cyan/30 text-accent-cyan text-sm font-medium transition-colors disabled:opacity-50"
      >
        {isSaving ? (
          <>
            <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Saving...
          </>
        ) : (
          <>
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
            </svg>
            Save to JSON
          </>
        )}
      </button>
      <button
        onClick={onDownload}
        className="flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-800/90 backdrop-blur-md border border-slate-600 hover:border-slate-500 text-slate-200 text-sm font-medium transition-colors"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
        </svg>
        Download
      </button>
      {saveError && (
        <p className="w-full text-xs text-red-400 mt-1">Save failed: {saveError}. Use Download to save locally.</p>
      )}
    </motion.div>
  );
}
