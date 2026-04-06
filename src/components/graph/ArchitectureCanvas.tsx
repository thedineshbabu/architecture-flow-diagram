import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ReactFlow,
  Background,
  BackgroundVariant,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  useReactFlow,
  ReactFlowProvider,
  type Node,
  type Edge,
  type NodeChange,
  type Connection,
} from '@xyflow/react';
import { toPng } from 'html-to-image';
import { DeleteSelectedPanel } from './DeleteSelectedPanel';
import '@xyflow/react/dist/style.css';
import { motion } from 'framer-motion';
import { nodeTypes } from './nodeTypes';
import { AnimatedFlowEdge } from './AnimatedFlowEdge';
import { useLayout, type LayoutDirection } from '../../hooks/useLayout';
import type { ArchitectureNodeData } from '../../utils/transformConfig';

const edgeTypes = {
  animatedFlow: AnimatedFlowEdge,
};

const minimapNodeColor = (node: Node): string => {
  const type = (node.data as ArchitectureNodeData)?.type;
  switch (type) {
    case 'ui': return '#f472b6';
    case 'service': return '#34d399';
    case 'database': return '#60a5fa';
    case 'queue': return '#fbbf24';
    default: return '#94a3b8';
  }
};

interface ArchitectureCanvasProps {
  nodes: Node<ArchitectureNodeData>[];
  edges: Edge[];
  showFlow?: boolean;
  showLabels?: boolean;
  focusNodeId?: string | null;
  onNodeDoubleClick?: (nodeId: string) => void;
  onEdgeDoubleClick?: (edgeId: string) => void;
  onNodesDelete?: (nodeIds: string[]) => void;
  onEdgesDelete?: (edgeIds: string[]) => void;
  onExportPng?: (fn: () => void) => void;
  onNodePositionChange?: (id: string, x: number, y: number) => void;
  onEdgeConnect?: (source: string, target: string) => void;
  layoutDirection?: LayoutDirection;
}

/** Get immediate neighbor node IDs for a given node */
function getNeighborIds(nodeId: string, edges: Edge[]): Set<string> {
  const s = new Set<string>([nodeId]);
  for (const e of edges) {
    if (e.source === nodeId) s.add(e.target);
    if (e.target === nodeId) s.add(e.source);
  }
  return s;
}

/**
 * BFS to find all nodes and edges on any shortest path between two nodes.
 * Returns { nodeIds, edgeIndices } on the path, or null if no path exists.
 */
function findPathBetween(
  startId: string,
  endId: string,
  edges: Edge[]
): { nodeIds: Set<string>; edgeKeys: Set<string> } | null {
  if (startId === endId) return { nodeIds: new Set([startId]), edgeKeys: new Set() };

  // BFS from start — record parent edges for each visited node
  const visited = new Map<string, { parent: string; edgeId: string }[]>();
  visited.set(startId, []);
  const queue: string[] = [startId];
  let foundDepth = -1;

  // Build adjacency
  const adj = new Map<string, { neighbor: string; edgeId: string }[]>();
  for (const e of edges) {
    if (!adj.has(e.source)) adj.set(e.source, []);
    if (!adj.has(e.target)) adj.set(e.target, []);
    adj.get(e.source)!.push({ neighbor: e.target, edgeId: e.id });
    adj.get(e.target)!.push({ neighbor: e.source, edgeId: e.id });
  }

  // BFS layer by layer
  let currentLayer = [startId];
  let depth = 0;

  while (currentLayer.length > 0 && (foundDepth === -1 || depth <= foundDepth)) {
    const nextLayer: string[] = [];
    for (const current of currentLayer) {
      for (const { neighbor, edgeId } of adj.get(current) ?? []) {
        if (neighbor === startId) continue; // don't go back to start
        if (!visited.has(neighbor)) {
          visited.set(neighbor, [{ parent: current, edgeId }]);
          nextLayer.push(neighbor);
          if (neighbor === endId) foundDepth = depth + 1;
        } else if (visited.get(neighbor)![0] && depth + 1 <= foundDepth) {
          // Same depth — add alternate parent for multiple shortest paths
          visited.get(neighbor)!.push({ parent: current, edgeId });
        }
      }
    }
    depth++;
    currentLayer = nextLayer;
  }

  if (!visited.has(endId)) return null;

  // Backtrack from end to collect all nodes and edges on shortest paths
  const pathNodes = new Set<string>();
  const pathEdges = new Set<string>();
  const backtrack = [endId];

  while (backtrack.length > 0) {
    const node = backtrack.pop()!;
    if (pathNodes.has(node)) continue;
    pathNodes.add(node);
    for (const { parent, edgeId } of visited.get(node) ?? []) {
      pathEdges.add(edgeId);
      if (!pathNodes.has(parent)) backtrack.push(parent);
    }
  }

  return { nodeIds: pathNodes, edgeKeys: pathEdges };
}

/**
 * Compute edge curvature so parallel/overlapping edges fan out.
 * Edges between the same pair of nodes get alternating positive/negative curvature.
 */
function applyEdgeCurvature(edges: Edge[]): Edge[] {
  // Group edges by undirected pair key
  const pairMap = new Map<string, Edge[]>();
  for (const e of edges) {
    const key = [e.source, e.target].sort().join('::');
    if (!pairMap.has(key)) pairMap.set(key, []);
    pairMap.get(key)!.push(e);
  }

  const result: Edge[] = [];
  for (const group of pairMap.values()) {
    if (group.length === 1) {
      // Single edge — no curvature needed
      result.push(group[0]);
    } else {
      // Multiple edges between same pair — fan them out
      group.forEach((e, i) => {
        const sign = i % 2 === 0 ? 1 : -1;
        const magnitude = 0.15 + Math.floor(i / 2) * 0.1;
        result.push({
          ...e,
          style: { ...e.style },
          data: { ...e.data, curvature: sign * magnitude },
        });
      });
    }
  }
  return result;
}

function ArchitectureCanvasInner({
  nodes: initialNodes,
  edges: initialEdges,
  showFlow = false,
  showLabels = false,
  focusNodeId,
  onNodeDoubleClick,
  onEdgeDoubleClick,
  onNodesDelete,
  onEdgesDelete,
  onExportPng,
  onNodePositionChange,
  onEdgeConnect,
  layoutDirection = 'TB',
}: ArchitectureCanvasProps) {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [focusedNodeIds, setFocusedNodeIds] = useState<string[]>([]);
  const { getLayoutedElements } = useLayout();
  const { fitView } = useReactFlow();
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerSize, setContainerSize] = useState({ width: 1200, height: 700 });

  // Zoom to focused node from search
  useEffect(() => {
    if (focusNodeId) {
      setTimeout(() => {
        fitView({ nodes: [{ id: focusNodeId }], duration: 500, padding: 0.5 });
      }, 100);
    }
  }, [focusNodeId, fitView]);

  // Expose export PNG function
  const handleExportPng = useCallback(() => {
    const el = document.querySelector('.react-flow') as HTMLElement;
    if (!el) return;
    toPng(el, { backgroundColor: '#0d0d1a' }).then((dataUrl) => {
      const a = document.createElement('a');
      a.href = dataUrl;
      a.download = 'architecture-diagram.png';
      a.click();
    });
  }, []);

  useEffect(() => {
    onExportPng?.(handleExportPng);
  }, [onExportPng, handleExportPng]);

  // Track container size
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const update = () => setContainerSize({ width: el.clientWidth, height: el.clientHeight });
    update();
    const obs = new ResizeObserver(update);
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  // Track manually dragged node positions so dagre doesn't override them
  const draggedPositions = useRef<Map<string, { x: number; y: number }>>(new Map());

  // Layout on data change — spread nodes across available space, preserve dragged/saved positions
  useEffect(() => {
    // Nodes with saved positions skip dagre entirely; only layout the rest
    const savedIds = new Set(
      initialNodes
        .filter((n) => (n.data as ArchitectureNodeData & { hasSavedPosition?: boolean }).hasSavedPosition)
        .map((n) => n.id)
    );

    const nodesForLayout = savedIds.size > 0
      ? initialNodes.filter((n) => !savedIds.has(n.id))
      : initialNodes;

    const { nodes: ln, edges: le } = getLayoutedElements(nodesForLayout, initialEdges, {
      width: containerSize.width,
      height: containerSize.height,
      direction: layoutDirection,
    });

    const curvedEdges = applyEdgeCurvature(le);

    // Merge: dagre-positioned nodes + saved-position nodes
    const layoutMap = new Map(ln.map((n) => [n.id, n]));
    const mergedNodes = initialNodes.map((n) => {
      // Dragged this session (highest priority)
      const dragged = draggedPositions.current.get(n.id);
      if (dragged) return { ...n, position: dragged };
      // Saved position from JSON
      if (savedIds.has(n.id)) return n;
      // Dagre layout
      return layoutMap.get(n.id) ?? n;
    });

    setNodes(mergedNodes);
    setEdges(curvedEdges);

    // Auto fit after layout settles
    requestAnimationFrame(() => {
      setTimeout(() => fitView({ padding: 0.12, duration: 300 }), 50);
    });
  }, [initialNodes, initialEdges, containerSize, layoutDirection, getLayoutedElements, setNodes, setEdges, fitView]);

  // Compute highlight sets — use initialEdges (topology) to avoid infinite loop
  const highlightResult = useMemo(() => {
    if (focusedNodeIds.length === 0) return null;

    if (focusedNodeIds.length === 1) {
      // Single node — show immediate neighbors
      const nodeIds = getNeighborIds(focusedNodeIds[0], initialEdges);
      // Edges directly connected to the focused node
      const edgeKeys = new Set<string>();
      for (const e of initialEdges) {
        if (e.source === focusedNodeIds[0] || e.target === focusedNodeIds[0]) {
          edgeKeys.add(e.id);
        }
      }
      return { nodeIds, edgeKeys };
    }

    // Multi-select — find path between first and last selected nodes
    // and union paths between all consecutive pairs
    const allNodeIds = new Set<string>();
    const allEdgeKeys = new Set<string>();

    for (let i = 0; i < focusedNodeIds.length - 1; i++) {
      const path = findPathBetween(focusedNodeIds[i], focusedNodeIds[i + 1], initialEdges);
      if (path) {
        path.nodeIds.forEach((id) => allNodeIds.add(id));
        path.edgeKeys.forEach((id) => allEdgeKeys.add(id));
      }
    }

    // If no path found between any pair, just show neighbors of all selected
    if (allNodeIds.size === 0) {
      for (const nid of focusedNodeIds) {
        getNeighborIds(nid, initialEdges).forEach((id) => allNodeIds.add(id));
        for (const e of initialEdges) {
          if (e.source === nid || e.target === nid) allEdgeKeys.add(e.id);
        }
      }
    }

    return { nodeIds: allNodeIds, edgeKeys: allEdgeKeys };
  }, [focusedNodeIds, initialEdges]);

  // Apply dimming to nodes
  useEffect(() => {
    if (!highlightResult) {
      setNodes((nds) =>
        nds.map((n) => ({
          ...n,
          className: '',
          style: { opacity: 1, transition: 'opacity 0.3s ease' },
        }))
      );
      return;
    }

    setNodes((nds) =>
      nds.map((n) => {
        const active = highlightResult.nodeIds.has(n.id);
        return {
          ...n,
          className: active ? '' : 'dimmed-node',
          style: {
            opacity: active ? 1 : 0.15,
            transition: 'opacity 0.3s ease',
            filter: active ? 'none' : 'grayscale(1)',
          },
        };
      })
    );
  }, [highlightResult, setNodes]);

  // Apply highlight/dim/labels to edges
  useEffect(() => {
    if (showFlow) {
      setEdges((eds) =>
        eds.map((e) => ({
          ...e,
          data: { ...e.data, highlighted: true, dimmed: false, showLabels },
        }))
      );
      return;
    }

    if (!highlightResult) {
      setEdges((eds) =>
        eds.map((e) => ({
          ...e,
          data: { ...e.data, highlighted: false, dimmed: false, showLabels },
        }))
      );
      return;
    }

    setEdges((eds) =>
      eds.map((e) => {
        const connected = highlightResult.edgeKeys.has(e.id);
        return {
          ...e,
          data: {
            ...e.data,
            highlighted: connected,
            dimmed: !connected,
            showLabels,
          },
        };
      })
    );
  }, [highlightResult, showFlow, showLabels, setEdges]);

  const handleConnect = useCallback(
    (connection: Connection) => {
      if (connection.source && connection.target) {
        onEdgeConnect?.(connection.source, connection.target);
      }
    },
    [onEdgeConnect]
  );

  const onInit = useCallback(
    (instance: { fitView: (opts?: { padding?: number; duration?: number }) => void }) => {
      setTimeout(() => instance.fitView({ padding: 0.2, duration: 400 }), 100);
    },
    []
  );

  // Node click — Ctrl+click for multi-select, regular click for single select
  const handleNodeClick = useCallback(
    (event: React.MouseEvent, node: Node) => {
      if (event.ctrlKey || event.metaKey) {
        // Ctrl+click: add/remove from selection
        setFocusedNodeIds((prev) => {
          if (prev.includes(node.id)) {
            return prev.filter((id) => id !== node.id);
          }
          return [...prev, node.id];
        });
      } else {
        // Regular click: toggle single selection
        setFocusedNodeIds((prev) =>
          prev.length === 1 && prev[0] === node.id ? [] : [node.id]
        );
      }
    },
    []
  );

  // Background click — clear focus
  const handlePaneClick = useCallback(() => {
    setFocusedNodeIds([]);
  }, []);

  // Handle node changes — intercept drag end to persist positions
  const handleNodesChange = useCallback(
    (changes: NodeChange[]) => {
      const removes = changes.filter((c) => c.type === 'remove');
      if (removes.length > 0 && onNodesDelete) {
        const ids = removes.map((c) => (c as { id: string }).id).filter(Boolean);
        onNodesDelete(ids);
          // Clean up dragged positions for removed nodes
        ids.forEach((id) => draggedPositions.current.delete(id));
        const other = changes.filter((c) => c.type !== 'remove');
        if (other.length > 0) onNodesChange(other);
        return;
      }

      // Persist position on drag end
      for (const change of changes) {
        if (change.type === 'position' && change.position && change.dragging === false) {
          draggedPositions.current.set(change.id, { ...change.position });
          onNodePositionChange?.(change.id, change.position.x, change.position.y);
        }
      }

      onNodesChange(changes);
    },
    [onNodesChange, onNodesDelete]
  );

  const handleEdgesChange = useCallback(
    (changes: Parameters<typeof onEdgesChange>[0]) => {
      const removes = changes.filter((c) => c.type === 'remove');
      if (removes.length > 0 && onEdgesDelete) {
        const ids = removes.map((c) => (c as { id: string }).id).filter(Boolean);
        onEdgesDelete(ids);
        const other = changes.filter((c) => c.type !== 'remove');
        if (other.length > 0) onEdgesChange(other);
        return;
      }
      onEdgesChange(changes);
    },
    [onEdgesChange, onEdgesDelete]
  );

  return (
    <motion.div
      ref={containerRef}
      className="w-full h-full rounded-xl overflow-hidden"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={handleNodesChange}
        onEdgesChange={handleEdgesChange}
        onNodeClick={handleNodeClick}
        onNodeDoubleClick={(_e, node) => onNodeDoubleClick?.(node.id)}
        onEdgeDoubleClick={(_e, edge) => onEdgeDoubleClick?.(edge.id)}
        onPaneClick={handlePaneClick}
        onConnect={handleConnect}
        onInit={onInit}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        nodesDraggable
        fitView
        fitViewOptions={{ padding: 0.12 }}
        minZoom={0.2}
        maxZoom={2}
        proOptions={{ hideAttribution: true }}
        defaultEdgeOptions={{ animated: false }}
        style={{ background: '#0d0d1a' }}
      >
        <Background
          variant={BackgroundVariant.Dots}
          gap={24}
          size={1}
          color="rgba(100,116,139,0.08)"
        />
        <Controls
          className="!bg-slate-800/80 !border-slate-600/60 !rounded-lg !shadow-lg [&>button]:!bg-slate-700 [&>button]:!border-slate-600 [&>button]:!text-slate-300 [&>button:hover]:!bg-slate-600"
          showInteractive={false}
        />
        <MiniMap
          nodeColor={minimapNodeColor}
          maskColor="rgba(0, 0, 0, 0.7)"
          style={{ backgroundColor: '#1e293b' }}
          className="!border-slate-600/60 !rounded-lg !shadow-lg"
          position="bottom-right"
        />
        <DeleteSelectedPanel
          onDeleteNodes={onNodesDelete ?? (() => {})}
          onDeleteEdges={onEdgesDelete ?? (() => {})}
        />
      </ReactFlow>
    </motion.div>
  );
}

// Wrap with ReactFlowProvider so useReactFlow() works
export function ArchitectureCanvas(props: ArchitectureCanvasProps) {
  return (
    <ReactFlowProvider>
      <ArchitectureCanvasInner {...props} />
    </ReactFlowProvider>
  );
}
