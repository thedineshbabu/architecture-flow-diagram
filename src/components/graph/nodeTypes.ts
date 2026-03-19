import type { NodeTypes } from '@xyflow/react';
import { DatadogNode } from './DatadogNode';

export const nodeTypes = {
  ui: DatadogNode,
  service: DatadogNode,
  database: DatadogNode,
  queue: DatadogNode,
} as NodeTypes;
