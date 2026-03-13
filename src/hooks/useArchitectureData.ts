import { useState, useEffect, useCallback } from 'react';
import { z } from 'zod';
import type { ArchitectureConfig, ArchitectureNode, ArchitectureEdge } from '../types/architecture';
import { transformConfig } from '../utils/transformConfig';
import type { Node, Edge } from '@xyflow/react';
import type { ArchitectureNodeData } from '../utils/transformConfig';

const NodeSchema = z.object({
  id: z.string(),
  label: z.string(),
  type: z.enum(['service', 'database', 'queue']),
  description: z.string().optional(),
});

const EdgeSchema = z.object({
  source: z.string(),
  target: z.string(),
  label: z.string().optional(),
  flowDirection: z.enum(['unidirectional', 'bidirectional']).optional(),
});

const ConfigSchema = z.object({
  title: z.string(),
  subtitle: z.string().optional(),
  nodes: z.array(NodeSchema),
  edges: z.array(EdgeSchema),
});

export interface UseArchitectureDataResult {
  title: string;
  subtitle?: string;
  nodes: Node<ArchitectureNodeData>[];
  edges: Edge[];
  config: ArchitectureConfig | null;
  isLoading: boolean;
  error: string | null;
  saveError: string | null;
  refetch: () => void;
  setTitle: (title: string) => void;
  setSubtitle: (subtitle: string) => void;
  addNode: (node: ArchitectureNode) => void;
  updateNode: (id: string, updates: Partial<ArchitectureNode>) => void;
  deleteNode: (id: string) => void;
  addEdge: (edge: ArchitectureEdge) => void;
  deleteEdge: (source: string, target: string) => void;
  deleteEdgeById: (edgeId: string) => void;
  save: () => Promise<boolean>;
  downloadJson: () => void;
}

const API_BASE = '/api';

export function useArchitectureData(): UseArchitectureDataResult {
  const [config, setConfig] = useState<ArchitectureConfig | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  const fetchConfig = useCallback(async () => {
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
        raw = await tryFetch('/architecture.json');
      } catch {
        try {
          raw = await tryFetch(`${API_BASE}/architecture`);
        } catch (apiErr) {
          throw apiErr;
        }
      }
      const parsed = ConfigSchema.parse(raw);
      setConfig(parsed);
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
  }, []);

  useEffect(() => {
    void fetchConfig();
  }, [fetchConfig]);

  const setTitle = useCallback((title: string) => {
    setConfig((c) => (c ? { ...c, title } : null));
  }, []);

  const setSubtitle = useCallback((subtitle: string) => {
    setConfig((c) => (c ? { ...c, subtitle } : null));
  }, []);

  const addNode = useCallback((node: ArchitectureNode) => {
    setConfig((c) => {
      if (!c) return c;
      if (c.nodes.some((n) => n.id === node.id)) return c;
      return { ...c, nodes: [...c.nodes, node] };
    });
  }, []);

  const updateNode = useCallback((oldId: string, updates: Partial<ArchitectureNode>) => {
    setConfig((c) => {
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
  }, []);

  const deleteNode = useCallback((id: string) => {
    setConfig((c) => {
      if (!c) return c;
      return {
        ...c,
        nodes: c.nodes.filter((n) => n.id !== id),
        edges: c.edges.filter((e) => e.source !== id && e.target !== id),
      };
    });
  }, []);

  const addEdge = useCallback((edge: ArchitectureEdge) => {
    setConfig((c) => {
      if (!c) return c;
      const exists = c.edges.some(
        (e) => e.source === edge.source && e.target === edge.target
      );
      if (exists) return c;
      return { ...c, edges: [...c.edges, edge] };
    });
  }, []);

  const deleteEdge = useCallback((source: string, target: string) => {
    setConfig((c) => {
      if (!c) return c;
      const idx = c.edges.findIndex((e) => e.source === source && e.target === target);
      if (idx < 0) return c;
      const edges = c.edges.filter((_, i) => i !== idx);
      return { ...c, edges };
    });
  }, []);

  const deleteEdgeById = useCallback((edgeId: string) => {
    const match = edgeId.match(/^edge-(\d+)$/);
    if (!match) return;
    const idx = parseInt(match[1] ?? '-1', 10);
    setConfig((c) => {
      if (!c || idx < 0 || idx >= c.edges.length) return c;
      const edges = c.edges.filter((_, i) => i !== idx);
      return { ...c, edges };
    });
  }, []);

  const save = useCallback(async (): Promise<boolean> => {
    if (!config) return false;
    setSaveError(null);
    try {
      const res = await fetch(`${API_BASE}/architecture`, {
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
  }, [config]);

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

  const { nodes, edges } = config ? transformConfig(config) : { nodes: [], edges: [] };

  return {
    title: config?.title ?? '',
    subtitle: config?.subtitle,
    nodes,
    edges,
    config,
    isLoading,
    error,
    saveError,
    refetch: fetchConfig,
    setTitle,
    setSubtitle,
    addNode,
    updateNode,
    deleteNode,
  addEdge,
  deleteEdge,
  deleteEdgeById,
  save,
    downloadJson,
  };
}
