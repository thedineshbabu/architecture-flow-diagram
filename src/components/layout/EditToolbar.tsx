import { motion } from 'framer-motion';
import { useRef } from 'react';
import type { LayoutDirection } from '../../hooks/useLayout';

interface EditToolbarProps {
  onAddNode: () => void;
  onAddEdge: () => void;
  onSave: () => void;
  onDownload: () => void;
  onImport?: (config: unknown) => void;
  onExportPng?: () => void;
  onUndo?: () => void;
  onRedo?: () => void;
  canUndo?: boolean;
  canRedo?: boolean;
  onToggleFullscreen?: () => void;
  onToggleFlow?: () => void;
  onToggleLabels?: () => void;
  layoutDirection?: LayoutDirection;
  onLayoutDirectionChange?: (dir: LayoutDirection) => void;
  isFullscreen?: boolean;
  isFlowActive?: boolean;
  showLabels?: boolean;
  isSaving?: boolean;
  saveError: string | null;
  autoSave?: boolean;
  onToggleAutoSave?: () => void;
  lastSavedAt?: Date | null;
}

export function EditToolbar({
  onAddNode,
  onAddEdge,
  onSave,
  onDownload,
  onImport,
  onExportPng,
  onUndo,
  onRedo,
  canUndo = false,
  canRedo = false,
  onToggleFullscreen,
  onToggleFlow,
  onToggleLabels,
  layoutDirection = 'TB',
  onLayoutDirectionChange,
  isFullscreen = false,
  isFlowActive = false,
  showLabels = false,
  isSaving = false,
  saveError,
  autoSave = false,
  onToggleAutoSave,
  lastSavedAt,
}: EditToolbarProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const btnClass = 'flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-800/90 backdrop-blur-md border border-slate-600 hover:border-slate-500 text-slate-200 text-sm font-medium transition-colors';
  const btnDisabled = 'flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-800/90 backdrop-blur-md border border-slate-700 text-slate-500 text-sm font-medium cursor-not-allowed';

  return (
    <motion.div
      className="absolute top-4 right-4 z-10 flex flex-wrap gap-2"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3, delay: 0.15 }}
    >
      {/* Undo/Redo */}
      {onUndo && (
        <button
          onClick={onUndo}
          disabled={!canUndo}
          className={canUndo ? btnClass : btnDisabled}
          title="Undo (Ctrl+Z)"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 15L3 9m0 0l6-6M3 9h12a6 6 0 010 12h-3" />
          </svg>
        </button>
      )}
      {onRedo && (
        <button
          onClick={onRedo}
          disabled={!canRedo}
          className={canRedo ? btnClass : btnDisabled}
          title="Redo (Ctrl+Shift+Z)"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 15l6-6m0 0l-6-6m6 6H9a6 6 0 000 12h3" />
          </svg>
        </button>
      )}

      {/* Divider */}
      {onUndo && <div className="w-px h-8 bg-slate-600/40 self-center" />}

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
            Save
          </>
        )}
      </button>
      {onToggleAutoSave && (
        <button
          onClick={onToggleAutoSave}
          className={`flex items-center gap-2 px-3 py-2 rounded-lg backdrop-blur-md border text-sm font-medium transition-colors ${
            autoSave
              ? 'bg-emerald-900/30 border-emerald-500/50 text-emerald-400'
              : 'bg-slate-800/90 border-slate-600 hover:border-slate-500 text-slate-400'
          }`}
          title={autoSave ? 'Auto-save on (click to disable)' : 'Auto-save off (click to enable)'}
        >
          <svg className={`w-4 h-4 ${autoSave ? 'animate-pulse' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {autoSave && lastSavedAt
            ? `Saved ${lastSavedAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
            : 'Auto'}
        </button>
      )}
      <button
        onClick={onDownload}
        className={btnClass}
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
        </svg>
        Download
      </button>
      {onImport && (
        <>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json,application/json"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              const reader = new FileReader();
              reader.onload = (ev) => {
                try {
                  const parsed = JSON.parse(ev.target?.result as string);
                  onImport(parsed);
                } catch {
                  alert('Invalid JSON file');
                }
              };
              reader.readAsText(file);
              // Reset so the same file can be re-imported
              e.target.value = '';
            }}
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className={btnClass}
            title="Import JSON"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
            </svg>
            Import
          </button>
        </>
      )}
      {onExportPng && (
        <button
          onClick={onExportPng}
          className={btnClass}
          title="Export as PNG"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0022.5 18.75V5.25A2.25 2.25 0 0020.25 3H3.75A2.25 2.25 0 001.5 5.25v13.5A2.25 2.25 0 003.75 21z" />
          </svg>
          PNG
        </button>
      )}

      {/* Divider */}
      <div className="w-px h-8 bg-slate-600/40 self-center" />

      {/* Show Labels toggle */}
      {onToggleLabels && (
        <button
          onClick={onToggleLabels}
          className={`flex items-center gap-2 px-3 py-2 rounded-lg backdrop-blur-md border text-sm font-medium transition-colors ${
            showLabels
              ? 'bg-accent-cyan/20 border-accent-cyan/60 text-accent-cyan'
              : 'bg-slate-800/90 border-slate-600 hover:border-slate-500 text-slate-200'
          }`}
          title={showLabels ? 'Hide edge labels' : 'Show all edge labels'}
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.568 3H5.25A2.25 2.25 0 003 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 005.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 009.568 3z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 6h.008v.008H6V6z" />
          </svg>
          Labels
        </button>
      )}

      {onLayoutDirectionChange && (
        <button
          onClick={() => {
            const dirs: LayoutDirection[] = ['TB', 'LR', 'BT', 'RL'];
            const next = dirs[(dirs.indexOf(layoutDirection) + 1) % dirs.length];
            onLayoutDirectionChange(next);
          }}
          className={btnClass}
          title={`Layout direction: ${layoutDirection} (click to cycle)`}
        >
          {layoutDirection === 'TB' || layoutDirection === 'BT' ? (
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 7h18M3 12h18M3 17h18" />
            </svg>
          ) : (
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M7 3v18M12 3v18M17 3v18" />
            </svg>
          )}
          {layoutDirection}
        </button>
      )}

      {onToggleFlow && (
        <button
          onClick={onToggleFlow}
          className={`flex items-center gap-2 px-3 py-2 rounded-lg backdrop-blur-md border text-sm font-medium transition-colors ${
            isFlowActive
              ? 'bg-accent-cyan/20 border-accent-cyan/60 text-accent-cyan'
              : 'bg-slate-800/90 border-slate-600 hover:border-accent-cyan/50 text-slate-200'
          }`}
          title={isFlowActive ? 'Hide data flow' : 'Show data flow'}
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" />
          </svg>
          Flow
        </button>
      )}
      {onToggleFullscreen && (
        <button
          onClick={onToggleFullscreen}
          className={btnClass}
          title={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
        >
          {isFullscreen ? (
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 9V4.5M9 9H4.5M9 9L3.75 3.75M9 15v4.5M9 15H4.5M9 15l-5.25 5.25M15 9h4.5M15 9V4.5M15 9l5.25-5.25M15 15h4.5M15 15v4.5m0-4.5l5.25 5.25" />
            </svg>
          ) : (
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15M20.25 3.75h-4.5m4.5 0v4.5m0-4.5L15 9m5.25 11.25h-4.5m4.5 0v-4.5m0 4.5L15 15" />
            </svg>
          )}
        </button>
      )}
      {saveError && (
        <p className="w-full text-xs text-red-400 mt-1">Save failed: {saveError}. Use Download to save locally.</p>
      )}
    </motion.div>
  );
}
