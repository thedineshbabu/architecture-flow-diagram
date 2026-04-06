import type { Node, Edge } from '@xyflow/react';
import type { ArchitectureConfig, ArchitectureNodeData } from '../types/architecture';

export type { ArchitectureNodeData } from '../types/architecture';

export function transformConfig(config: ArchitectureConfig): {
  nodes: Node<ArchitectureNodeData>[];
  edges: Edge[];
} {
  const nodes: Node<ArchitectureNodeData>[] = config.nodes.map((n) => ({
    id: n.id,
    type: n.type,
    // Use saved position if available; dagre will override only if position is absent (x/y undefined)
    position: n.x != null && n.y != null ? { x: n.x, y: n.y } : { x: 0, y: 0 },
    data: {
      label: n.label,
      type: n.type,
      description: n.description,
      hasSavedPosition: n.x != null && n.y != null,
    },
  }));

  const edges: Edge[] = config.edges.map((e, i) => ({
    id: `edge-${i}`,
    source: e.source,
    target: e.target,
    type: 'animatedFlow',
    data: {
      label: e.label,
      flowDirection: e.flowDirection ?? 'unidirectional',
      sequence: e.sequence,
    },
  }));

  return { nodes, edges };
}
