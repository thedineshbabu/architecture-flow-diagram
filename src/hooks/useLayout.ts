import { useCallback } from 'react';
import dagre from 'dagre';
import type { Node, Edge } from '@xyflow/react';

export type LayoutDirection = 'TB' | 'LR' | 'BT' | 'RL';

export interface LayoutOptions {
  width?: number;
  height?: number;
  direction?: LayoutDirection;
}

const NODE_WIDTH = 140;
const NODE_HEIGHT = 90;

export function useLayout() {
  const getLayoutedElements = useCallback(
    <T extends Record<string, unknown>>(
      nodes: Node<T>[],
      edges: Edge[],
      options?: LayoutOptions
    ): { nodes: Node<T>[]; edges: Edge[] } => {
      if (nodes.length === 0) return { nodes, edges };

      const availW = options?.width ?? 1200;
      const availH = options?.height ?? 700;

      // Estimate grid dimensions to compute spacing
      // dagre ranks = depth of the DAG, roughly sqrt(n) for typical graphs
      const n = nodes.length;
      const estimatedRanks = Math.max(2, Math.ceil(Math.sqrt(n)));
      const estimatedPerRank = Math.max(2, Math.ceil(n / estimatedRanks));

      // Compute spacing to spread nodes across the available area
      const nodesep = Math.max(60, Math.floor((availW - estimatedPerRank * NODE_WIDTH) / Math.max(1, estimatedPerRank - 1)));
      const ranksep = Math.max(80, Math.floor((availH - estimatedRanks * NODE_HEIGHT) / Math.max(1, estimatedRanks)));

      const direction = options?.direction ?? 'TB';
      const isHorizontal = direction === 'LR' || direction === 'RL';

      const g = new dagre.graphlib.Graph().setDefaultEdgeLabel(() => ({}));
      g.setGraph({
        rankdir: direction,
        nodesep: Math.min(isHorizontal ? ranksep : nodesep, 200),
        ranksep: Math.min(isHorizontal ? nodesep : ranksep, 200),
        marginx: 40,
        marginy: 40,
      });

      nodes.forEach((node) => {
        g.setNode(node.id, { width: NODE_WIDTH, height: NODE_HEIGHT });
      });

      edges.forEach((edge) => {
        g.setEdge(edge.source, edge.target);
      });

      dagre.layout(g);

      // Get dagre bounding box
      let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
      nodes.forEach((node) => {
        const pos = g.node(node.id);
        if (!pos || pos.x == null) return;
        minX = Math.min(minX, pos.x - NODE_WIDTH / 2);
        minY = Math.min(minY, pos.y - NODE_HEIGHT / 2);
        maxX = Math.max(maxX, pos.x + NODE_WIDTH / 2);
        maxY = Math.max(maxY, pos.y + NODE_HEIGHT / 2);
      });

      const graphW = maxX - minX || 1;
      const graphH = maxY - minY || 1;

      // Scale to fit available space with padding
      const pad = 60;
      const scaleX = (availW - pad * 2) / graphW;
      const scaleY = (availH - pad * 2) / graphH;
      const scale = Math.min(scaleX, scaleY, 1.5); // don't scale up too much

      const layoutedNodes = nodes.map((node) => {
        const pos = g.node(node.id);
        if (!pos || pos.x == null || pos.y == null) return node;
        return {
          ...node,
          position: {
            x: (pos.x - NODE_WIDTH / 2 - minX) * scale + pad,
            y: (pos.y - NODE_HEIGHT / 2 - minY) * scale + pad,
          },
        };
      });

      return { nodes: layoutedNodes, edges };
    },
    []
  );

  return { getLayoutedElements };
}
