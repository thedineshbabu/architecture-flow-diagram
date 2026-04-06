import { useState, useEffect, useCallback, useRef } from 'react';
import { z } from 'zod';
import type { Node, Edge } from '@xyflow/react';
import type { ArchitectureConfig, ArchitectureNode, ArchitectureEdge, ArchitectureNodeData } from '../types/architecture';
import { transformConfig } from '../utils/transformConfig';

const NodeSchema = z.object({
  id: z.string(),
  label: z.string(),
  type: z.enum(['ui', 'service', 'database', 'queue']),
  description: z.string().optional(),
  x: z.number().optional(),
  y: z.number().optional(),
});

const EdgeSchema = z.object({
  source: z.string(),
  target: z.string(),
  label: z.string().optional(),
  flowDirection: z.enum(['unidirectional', 'bidirectional']).optional(),
  sequence: z.number().optional(),
});

const ConfigSchema = z.object({
  title: z.string(),
  subtitle: z.string().optional(),
  nodes: z.array(NodeSchema),
  edges: z.array(EdgeSchema),
});

const MAX_HISTORY = 50;

export interface DiagramInfo {
  id: string;
  title: string;
  subtitle?: string;
  nodeCount: number;
  edgeCount: number;
}

export interface UseArchitectureDataResult {
  title: string;
  subtitle?: string;
  nodes: Node<ArchitectureNodeData>[];
  edges: Edge[];
  config: ArchitectureConfig | null;
  isLoading: boolean;
  error: string | null;
  saveError: string | null;
  canUndo: boolean;
  canRedo: boolean;
  autoSave: boolean;
  setAutoSave: (on: boolean) => void;
  lastSavedAt: Date | null;
  currentDiagramId: string;
  diagrams: DiagramInfo[];
  switchDiagram: (id: string) => void;
  createDiagram: (id: string, title: string) => void;
  duplicateDiagram: (fromId: string, newId: string, newTitle: string) => void;
  deleteDiagram: (id: string) => void;
  refetch: () => void;
  setTitle: (title: string) => void;
  setSubtitle: (subtitle: string) => void;
  addNode: (node: ArchitectureNode) => void;
  updateNode: (id: string, updates: Partial<ArchitectureNode>) => void;
  updateNodePosition: (id: string, x: number, y: number) => void;
  deleteNode: (id: string) => void;
  addEdge: (edge: ArchitectureEdge) => void;
  updateEdgeByIndex: (index: number, updates: Partial<ArchitectureEdge>) => void;
  deleteEdgeByIndex: (index: number) => void;
  deleteEdge: (source: string, target: string) => void;
  deleteEdgeById: (edgeId: string) => void;
  undo: () => void;
  redo: () => void;
  save: () => Promise<boolean>;
  downloadJson: () => void;
  importConfig: (raw: unknown) => boolean;
}

const API_BASE = '/api';

export function useArchitectureData(): UseArchitectureDataResult {
  const [config, setConfig] = useState<ArchitectureConfig | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [currentDiagramId, setCurrentDiagramId] = useState('default');
  const [diagrams, setDiagrams] = useState<DiagramInfo[]>([]);
  const [autoSave, setAutoSave] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
  const autoSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Undo/redo history
  const undoStack = useRef<ArchitectureConfig[]>([]);
  const redoStack = useRef<ArchitectureConfig[]>([]);
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);

  const pushHistory = useCallback((prev: ArchitectureConfig | null) => {
    if (!prev) return;
    undoStack.current = [...undoStack.current.slice(-MAX_HISTORY + 1), prev];
    redoStack.current = [];
    setCanUndo(true);
    setCanRedo(false);
  }, []);

  // Wrap setConfig to track history
  const setConfigWithHistory = useCallback((updater: (c: ArchitectureConfig | null) => ArchitectureConfig | null) => {
    setConfig((prev) => {
      const next = updater(prev);
      if (next && prev && JSON.stringify(next) !== JSON.stringify(prev)) {
        pushHistory(prev);
      }
      return next;
    });
  }, [pushHistory]);

  const undo = useCallback(() => {
    if (undoStack.current.length === 0) return;
    const prev = undoStack.current.pop()!;
    setConfig((current) => {
      if (current) redoStack.current.push(current);
      setCanUndo(undoStack.current.length > 0);
      setCanRedo(true);
      return prev;
    });
  }, []);

  const redo = useCallback(() => {
    if (redoStack.current.length === 0) return;
    const next = redoStack.current.pop()!;
    setConfig((current) => {
      if (current) undoStack.current.push(current);
      setCanUndo(true);
      setCanRedo(redoStack.current.length > 0);
      return next;
    });
  }, []);

  // Auto-save: debounce 2s after any config change when autoSave is enabled
  const currentDiagramIdRef = useRef(currentDiagramId);
  currentDiagramIdRef.current = currentDiagramId;
  const configRef = useRef(config);
  configRef.current = config;

  useEffect(() => {
    if (!autoSave || !config || isLoading) return;
    if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
    autoSaveTimer.current = setTimeout(async () => {
      const c = configRef.current;
      if (!c) return;
      try {
        const res = await fetch(`${API_BASE}/diagrams/${currentDiagramIdRef.current}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(c),
        });
        if (res.ok) setLastSavedAt(new Date());
      } catch {
        // Silently ignore auto-save failures
      }
    }, 2000);
    return () => {
      if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
    };
  }, [config, autoSave, isLoading]);

  const fetchDiagrams = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/diagrams`);
      if (res.ok) {
        const list = await res.json();
        setDiagrams(list);
        return list as DiagramInfo[];
      }
    } catch {
      // API not available — use legacy single-file mode
    }
    return [];
  }, []);

  const fetchConfig = useCallback(async (diagramId?: string) => {
    const id = diagramId ?? currentDiagramId;
    setIsLoading(true);
    setError(null);
    try {
      const tryFetch = async (url: string): Promise<unknown> => {
        const res = await fetch(url);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const text = await res.text();
        if (text.trim().startsWith('<')) throw new Error('Received HTML instead of JSON');
        return JSON.parse(text) as unknown;
      };

      let raw: unknown;
      try {
        raw = await tryFetch(`${API_BASE}/diagrams/${id}`);
      } catch {
        try {
          raw = await tryFetch('/architecture.json');
        } catch {
          try {
            raw = await tryFetch(`${API_BASE}/architecture`);
          } catch (apiErr) {
            throw apiErr;
          }
        }
      }
      const parsed = ConfigSchema.parse(raw);
      setConfig(parsed);
      undoStack.current = [];
      redoStack.current = [];
      setCanUndo(false);
      setCanRedo(false);
    } catch (e) {
      const msg = e instanceof z.ZodError
        ? `Invalid config: ${e.errors.map((err) => err.message).join(', ')}`
        : e instanceof Error
          ? e.message
          : 'Failed to load architecture';
      setError(msg);
      setConfig(null);
    } finally {
      setIsLoading(false);
    }
  }, [currentDiagramId]);

  useEffect(() => {
    void fetchDiagrams();
    void fetchConfig();
  }, [fetchConfig, fetchDiagrams]);

  const switchDiagram = useCallback((id: string) => {
    setCurrentDiagramId(id);
    void fetchConfig(id);
  }, [fetchConfig]);

  const createDiagram = useCallback(async (id: string, title: string) => {
    const newConfig: ArchitectureConfig = { title, nodes: [], edges: [] };
    try {
      await fetch(`${API_BASE}/diagrams/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newConfig),
      });
      await fetchDiagrams();
      switchDiagram(id);
    } catch {
      // Silently fail — user can retry
    }
  }, [fetchDiagrams, switchDiagram]);

  const duplicateDiagram = useCallback(async (fromId: string, newId: string, newTitle: string) => {
    try {
      const res = await fetch(`${API_BASE}/diagrams/${fromId}`);
      if (!res.ok) return;
      const data = await res.json();
      data.title = newTitle;
      await fetch(`${API_BASE}/diagrams/${newId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      await fetchDiagrams();
      switchDiagram(newId);
    } catch {
      // Silently fail
    }
  }, [fetchDiagrams, switchDiagram]);

  const deleteDiagram = useCallback(async (id: string) => {
    try {
      await fetch(`${API_BASE}/diagrams/${id}`, { method: 'DELETE' });
      const remaining = await fetchDiagrams();
      if (id === currentDiagramId && remaining.length > 0) {
        switchDiagram(remaining[0].id);
      }
    } catch {
      // Silently fail
    }
  }, [currentDiagramId, fetchDiagrams, switchDiagram]);

  const setTitle = useCallback((title: string) => {
    setConfigWithHistory((c) => (c ? { ...c, title } : null));
  }, [setConfigWithHistory]);

  const setSubtitle = useCallback((subtitle: string) => {
    setConfigWithHistory((c) => (c ? { ...c, subtitle } : null));
  }, [setConfigWithHistory]);

  const addNode = useCallback((node: ArchitectureNode) => {
    setConfigWithHistory((c) => {
      if (!c) return c;
      if (c.nodes.some((n) => n.id === node.id)) return c;
      return { ...c, nodes: [...c.nodes, node] };
    });
  }, [setConfigWithHistory]);

  const updateNode = useCallback((oldId: string, updates: Partial<ArchitectureNode>) => {
    setConfigWithHistory((c) => {
      if (!c) return c;
      const newId = updates.id ?? oldId;
      const nodes = c.nodes.map((n) =>
        n.id === oldId ? { ...n, ...updates } : n
      );
      const edges = c.edges.map((e) => ({
        ...e,
        source: e.source === oldId ? newId : e.source,
        target: e.target === oldId ? newId : e.target,
      }));
      return { ...c, nodes, edges };
    });
  }, [setConfigWithHistory]);

  const deleteNode = useCallback((id: string) => {
    setConfigWithHistory((c) => {
      if (!c) return c;
      return {
        ...c,
        nodes: c.nodes.filter((n) => n.id !== id),
        edges: c.edges.filter((e) => e.source !== id && e.target !== id),
      };
    });
  }, [setConfigWithHistory]);

  // updateNodePosition deliberately skips undo history — position drags are
  // frequent and low-stakes; they'd flood the undo stack.
  const updateNodePosition = useCallback((id: string, x: number, y: number) => {
    setConfig((c) => {
      if (!c) return c;
      return {
        ...c,
        nodes: c.nodes.map((n) => (n.id === id ? { ...n, x, y } : n)),
      };
    });
  }, []);

  const addEdge = useCallback((edge: ArchitectureEdge) => {
    setConfigWithHistory((c) => {
      if (!c) return c;
      const exists = c.edges.some(
        (e) => e.source === edge.source && e.target === edge.target
      );
      if (exists) return c;
      return { ...c, edges: [...c.edges, edge] };
    });
  }, [setConfigWithHistory]);

  const updateEdgeByIndex = useCallback((index: number, updates: Partial<ArchitectureEdge>) => {
    setConfigWithHistory((c) => {
      if (!c || index < 0 || index >= c.edges.length) return c;
      const edges = c.edges.map((e, i) => (i === index ? { ...e, ...updates } : e));
      return { ...c, edges };
    });
  }, [setConfigWithHistory]);

  const deleteEdgeByIndex = useCallback((index: number) => {
    setConfigWithHistory((c) => {
      if (!c || index < 0 || index >= c.edges.length) return c;
      return { ...c, edges: c.edges.filter((_, i) => i !== index) };
    });
  }, [setConfigWithHistory]);

  const deleteEdge = useCallback((source: string, target: string) => {
    setConfigWithHistory((c) => {
      if (!c) return c;
      const idx = c.edges.findIndex((e) => e.source === source && e.target === target);
      if (idx < 0) return c;
      const edges = c.edges.filter((_, i) => i !== idx);
      return { ...c, edges };
    });
  }, [setConfigWithHistory]);

  const deleteEdgeById = useCallback((edgeId: string) => {
    const match = edgeId.match(/^edge-(\d+)$/);
    if (!match) return;
    const idx = parseInt(match[1] ?? '-1', 10);
    setConfigWithHistory((c) => {
      if (!c || idx < 0 || idx >= c.edges.length) return c;
      const edges = c.edges.filter((_, i) => i !== idx);
      return { ...c, edges };
    });
  }, [setConfigWithHistory]);

  const save = useCallback(async (): Promise<boolean> => {
    if (!config) return false;
    setSaveError(null);
    try {
      const res = await fetch(`${API_BASE}/diagrams/${currentDiagramId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        const statusMsg = err.error ?? `HTTP ${res.status}`;
        if (res.status === 404) {
          throw new Error(
            'API server not running. Run `npm run dev` or `npm run preview`. Use Download to save locally.'
          );
        }
        throw new Error(statusMsg);
      }
      setLastSavedAt(new Date());
      void fetchDiagrams();
      return true;
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Failed to save';
      const isNetworkOr404 =
        msg.includes('404') ||
        msg.includes('Failed to fetch') ||
        msg.includes('NetworkError') ||
        msg.includes('API server not running');
      const finalMsg = isNetworkOr404
        ? 'API server not running. Run `npm run dev` or `npm run preview`. Use Download to save locally.'
        : msg;
      setSaveError(finalMsg);
      return false;
    }
  }, [config, currentDiagramId, fetchDiagrams]);

  const importConfig = useCallback((raw: unknown): boolean => {
    const result = ConfigSchema.safeParse(raw);
    if (!result.success) return false;
    setConfigWithHistory(() => result.data);
    return true;
  }, [setConfigWithHistory]);

  const downloadJson = useCallback(() => {
    if (!config) return;
    const blob = new Blob([JSON.stringify(config, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'architecture.json';
    a.click();
    URL.revokeObjectURL(url);
  }, [config]);

  const { nodes, edges: xyEdges } = config ? transformConfig(config) : { nodes: [] as Node<ArchitectureNodeData>[], edges: [] as Edge[] };

  return {
    title: config?.title ?? '',
    subtitle: config?.subtitle,
    nodes,
    edges: xyEdges,
    config,
    isLoading,
    error,
    saveError,
    canUndo,
    canRedo,
    currentDiagramId,
    diagrams,
    switchDiagram,
    createDiagram,
    duplicateDiagram,
    deleteDiagram,
    refetch: fetchConfig,
    setTitle,
    setSubtitle,
    addNode,
    updateNode,
    updateNodePosition,
    deleteNode,
    addEdge,
    updateEdgeByIndex,
    deleteEdgeByIndex,
    deleteEdge,
    deleteEdgeById,
    undo,
    redo,
    autoSave,
    setAutoSave,
    lastSavedAt,
    save,
    downloadJson,
    importConfig,
  };
}
