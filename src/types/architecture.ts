import type { Node } from '@xyflow/react';

export type NodeType = 'service' | 'database' | 'queue';

export type FlowDirection = 'unidirectional' | 'bidirectional';

export interface ArchitectureNode {
  id: string;
  label: string;
  type: NodeType;
  description?: string;
}

export interface ArchitectureEdge {
  source: string;
  target: string;
  label?: string;
  flowDirection?: FlowDirection;
}

export interface ArchitectureConfig {
  title: string;
  subtitle?: string;
  nodes: ArchitectureNode[];
  edges: ArchitectureEdge[];
}

export interface ArchitectureNodeData extends Record<string, unknown> {
  label: string;
  type: ArchitectureNode['type'];
  description?: string;
}

export type ServiceNodeType = Node<ArchitectureNodeData, 'service'>;
export type DatabaseNodeType = Node<ArchitectureNodeData, 'database'>;
export type QueueNodeType = Node<ArchitectureNodeData, 'queue'>;
