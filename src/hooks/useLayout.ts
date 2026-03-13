import { useCallback } from 'react';
import dagre from 'dagre';
import type { Node, Edge } from '@xyflow/react';

const LAYOUT_OPTIONS = {
  rankdir: 'TB' as const,
  nodesep: 80,
  ranksep: 100,
};

export function useLayout() {
  const getLayoutedElements = useCallback(
    <T extends Record<string, unknown>>(
      nodes: Node<T>[],
      edges: Edge[]
    ): { nodes: Node<T>[]; edges: Edge[] } => {
      const g = new dagre.graphlib.Graph().setDefaultEdgeLabel(() => ({}));
      g.setGraph(LAYOUT_OPTIONS);

      nodes.forEach((node) => {
        g.setNode(node.id, { width: 180, height: 60 });
      });

      edges.forEach((edge) => {
        g.setEdge(edge.source, edge.target);
      });

      dagre.layout(g);

      const layoutedNodes = nodes.map((node) => {
        const nodeWithPosition = g.node(node.id);
        if (!nodeWithPosition || nodeWithPosition.x == null || nodeWithPosition.y == null) return node;
        return {
          ...node,
          position: {
            x: nodeWithPosition.x - 90,
            y: nodeWithPosition.y - 30,
          },
        };
      });

      return { nodes: layoutedNodes, edges };
    },
    []
  );

  return { getLayoutedElements };
}
