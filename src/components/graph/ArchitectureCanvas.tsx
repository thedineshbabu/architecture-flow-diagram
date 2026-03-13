import { useCallback, useEffect } from 'react';
import {
  ReactFlow,
  Background,
  BackgroundVariant,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  type Node,
  type Edge,
} from '@xyflow/react';
import { DeleteSelectedPanel } from './DeleteSelectedPanel';
import '@xyflow/react/dist/style.css';
import { motion } from 'framer-motion';
import { nodeTypes } from './nodeTypes';
import { AnimatedFlowEdge } from './AnimatedFlowEdge';
import { useLayout } from '../../hooks/useLayout';
import type { ArchitectureNodeData } from '../../utils/transformConfig';

const edgeTypes = {
  animatedFlow: AnimatedFlowEdge,
};

interface ArchitectureCanvasProps {
  nodes: Node<ArchitectureNodeData>[];
  edges: Edge[];
  onNodeDoubleClick?: (nodeId: string) => void;
  onNodesDelete?: (nodeIds: string[]) => void;
  onEdgesDelete?: (edgeIds: string[]) => void;
}

export function ArchitectureCanvas({
  nodes: initialNodes,
  edges: initialEdges,
  onNodeDoubleClick,
  onNodesDelete,
  onEdgesDelete,
}: ArchitectureCanvasProps) {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const { getLayoutedElements } = useLayout();

  useEffect(() => {
    const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(
      initialNodes,
      initialEdges
    );
    setNodes(layoutedNodes);
    setEdges(layoutedEdges);
  }, [initialNodes, initialEdges, getLayoutedElements, setNodes, setEdges]);

  const onInit = useCallback((reactFlowInstance: { fitView: (opts?: { padding?: number; duration?: number }) => void }) => {
    setTimeout(() => {
      reactFlowInstance.fitView({ padding: 0.2, duration: 400 });
    }, 100);
  }, []);

  const handleNodesChange = useCallback(
    (changes: Parameters<typeof onNodesChange>[0]) => {
      const removes = changes.filter((c) => c.type === 'remove');
      if (removes.length > 0 && onNodesDelete) {
        const ids = removes.map((c) => (c as { id: string }).id).filter(Boolean);
        onNodesDelete(ids);
        const other = changes.filter((c) => c.type !== 'remove');
        if (other.length > 0) onNodesChange(other);
        return;
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
      className="w-full h-full min-h-[500px] rounded-xl overflow-hidden"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4, delay: 0.2 }}
    >
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesDelete ? handleNodesChange : onNodesChange}
        onEdgesChange={onEdgesDelete ? handleEdgesChange : onEdgesChange}
        onNodeDoubleClick={onNodeDoubleClick ? (_, node) => onNodeDoubleClick(node.id) : undefined}
        nodesConnectable
        elementsSelectable
        nodesDraggable
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        colorMode="dark"
        onInit={onInit}
        fitView
        minZoom={0.2}
        maxZoom={1.5}
        defaultEdgeOptions={{
          type: 'animatedFlow',
        }}
        proOptions={{ hideAttribution: true }}
        className="bg-slate-950"
      >
        <Background
          variant={BackgroundVariant.Dots}
          gap={20}
          size={1}
          color="rgba(148, 163, 184, 0.15)"
          className="animate-pulse-subtle"
        />
        <Controls
          className="!bg-slate-800/80 !border-slate-600 !rounded-lg !shadow-lg"
          showInteractive={false}
        />
        <MiniMap
          className="!bg-slate-800/80 !border-slate-600 !rounded-lg"
          nodeColor="#38bdf8"
          maskColor="rgba(15, 23, 42, 0.8)"
        />
        {onNodesDelete && onEdgesDelete && (
          <DeleteSelectedPanel
            onDeleteNodes={onNodesDelete}
            onDeleteEdges={onEdgesDelete}
          />
        )}
      </ReactFlow>
    </motion.div>
  );
}
